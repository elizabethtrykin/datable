import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseConfig";

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  console.log("Calculating similarity between vectors:", {
    vecALength: vecA?.length,
    vecBLength: vecB?.length,
  });

  if (!vecA || !vecB) {
    console.log("Received null vector", { vecA, vecB });
    return 0;
  }
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));

  const similarity = dotProduct / (magnitudeA * magnitudeB);
  console.log("Similarity calculation results:", {
    dotProduct,
    magnitudeA,
    magnitudeB,
    similarity,
  });

  return similarity;
}

export async function GET(req: NextRequest) {
  try {
    console.log("Starting match request");
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profile_id");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    console.log("Match request parameters:", { profileId, limit });

    if (!profileId) {
      console.log("No profile ID provided");
      return NextResponse.json(
        { error: "Profile ID required" },
        { status: 400 }
      );
    }

    console.log("Fetching female profile with ID:", profileId);
    const { data: femaleProfile, error: femaleError } = await supabase
      .from("profiles")
      .select("embedding, stringified_data")
      .eq("id", profileId)
      .single();

    console.log("Female profile fetch result:", {
      hasEmbedding: !!femaleProfile?.embedding,
      hasStringifiedData: !!femaleProfile?.stringified_data,
      error: femaleError,
    });

    if (femaleError || !femaleProfile) {
      console.log("Female profile not found:", femaleError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!femaleProfile.embedding) {
      console.log("Female profile has no embedding");
      return NextResponse.json(
        { error: "Profile has no embedding" },
        { status: 400 }
      );
    }

    console.log("Fetching male profiles");
    const { data: maleProfiles, error: maleError } = await supabase
      .from("profiles")
      .select("id, twitter_handle, embedding, stringified_data")
      .eq("gender", "male")
      .not("embedding", "is", null);

    if (maleError) {
      console.log("Error fetching male profiles:", maleError);
      throw maleError;
    }

    console.log(
      `Found ${maleProfiles?.length || 0} male profiles with embeddings`
    );

    console.log("Calculating similarity scores");
    const matches = maleProfiles
      .filter((profile) => {
        const hasEmbedding = !!profile.embedding && !!femaleProfile.embedding;
        if (!hasEmbedding) {
          console.log(`Profile ${profile.id} missing embedding`);
        }
        return hasEmbedding;
      })
      .map((profile) => {
        console.log(`Processing male profile ${profile.id}`);
        const similarity = cosineSimilarity(
          JSON.parse(femaleProfile.embedding),
          JSON.parse(profile.embedding)
        );
        console.log(
          `Similarity score for profile ${profile.id}: ${similarity}`
        );
        return {
          profile_id: profile.id,
          twitter_handle: profile.twitter_handle,
          similarity,
          stringified_data: profile.stringified_data,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    console.log(
      "Top 3 matches:",
      matches.map((m) => ({ id: m.profile_id, score: m.similarity }))
    );

    // Check if we have any matches
    if (matches.length === 0) {
      console.log("No valid matches found");
      return NextResponse.json({
        matches: [],
        message: "No male profiles found for matching",
      });
    }

    // Separate the full data for the top match from the other match IDs
    const [topMatch, ...otherMatches] = matches;

    console.log("topMatch", topMatch);

    console.log("Preparing response with top match:", {
      topMatchId: topMatch.profile_id,
      topMatchScore: topMatch.similarity,
      otherMatchIds: otherMatches.map((m) => m.profile_id),
    });

    return NextResponse.json({
      matches: matches.map((m) => m.profile_id),
      topMatchData: {
        profile_id: topMatch.profile_id,
        twitter_handle: topMatch?.twitter_handle,
        stringified_data: topMatch.stringified_data,
      },
      profileData: {
        profile_id: profileId,
        stringified_data: femaleProfile.stringified_data,
      },
    });
  } catch (error) {
    console.error("Match error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
