import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseConfig";

// Cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profile_id");
    const limit = parseInt(searchParams.get("limit") || "5", 10); // Default to top 5 matches

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID required" },
        { status: 400 }
      );
    }

    // Get the female profile's embedding
    const { data: femaleProfile, error: femaleError } = await supabase
      .from("profiles")
      .select("embedding, stringified_data")
      .eq("id", profileId)
      .single();

    if (femaleError || !femaleProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!femaleProfile.embedding) {
      return NextResponse.json(
        { error: "Profile has no embedding" },
        { status: 400 }
      );
    }

    // Get all male profiles with embeddings
    const { data: maleProfiles, error: maleError } = await supabase
      .from("profiles")
      .select("id, twitter_handle, embedding, stringified_data")
      .eq("gender", "male")
      .not("embedding", "is", null);

    if (maleError) {
      throw maleError;
    }

    // Calculate similarity scores
    const matches = maleProfiles
      .map((profile) => ({
        profile_id: profile.id,
        similarity: cosineSimilarity(
          femaleProfile.embedding,
          profile.embedding
        ),
        stringified_data: profile.stringified_data,
      }))
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
      .slice(0, 3); // Get top 3 matches

    // Check if we have any matches
    if (matches.length === 0) {
      return NextResponse.json({
        matches: [],
        message: "No male profiles found for matching",
      });
    }

    // Separate the full data for the top match from the other match IDs
    const [topMatch, ...otherMatches] = matches;

    return NextResponse.json({
      matches: matches.map((m) => m.profile_id),
      topMatchData: {
        profile_id: topMatch.profile_id,
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
