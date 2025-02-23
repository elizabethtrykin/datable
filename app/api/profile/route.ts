import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseConfig";
import Exa from "exa-js";
import OpenAI from "openai";
import {
  fetchTwitterData,
  fetchLinkedInData,
  fetchWebsiteData,
  fetchOtherLinkData,
  isValidTwitterHandle,
  isValidUrl,
  formatProfileData,
} from "@/lib/utils";

const exa = new Exa(process.env.EXA_API_KEY as string);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      input: text,
      model: "text-embedding-3-small",
    });
    return response.data[0].embedding;
  } catch (error: any) {
    if (error?.message?.includes('maximum context length')) {
      console.log('Text too long, truncating...');
      const maxChars = Math.floor(8192 * 3.5);
      const truncatedText = text.slice(0, maxChars);
      
      const truncatedResponse = await openai.embeddings.create({
        input: truncatedText,
        model: "text-embedding-3-small",
      });
      return truncatedResponse.data[0].embedding;
    }
    throw error;
  }
}

async function findMatch(profileId: string) {
  // Get potential matches
  const { data: maleProfiles } = await supabase
    .from("profiles")
    .select("id, twitter_handle, embedding, stringified_data")
    .eq("gender", "male")
    .not("embedding", "is", null);

  if (!maleProfiles?.length) return null;

  // Get random male profile for now (we'll implement proper matching later)
  const randomMatch = maleProfiles[Math.floor(Math.random() * maleProfiles.length)];
  
  return {
    profile_id: randomMatch.id,
    stringified_data: randomMatch.stringified_data
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      twitter_handle,
      linkedin_url,
      personal_website,
      other_links,
      gender,
    } = body;

    if (twitter_handle && !isValidTwitterHandle(twitter_handle)) {
      return NextResponse.json(
        { error: "Invalid Twitter handle" },
        { status: 400 }
      );
    }

    if (linkedin_url && !isValidUrl(linkedin_url)) {
      return NextResponse.json(
        { error: "Invalid LinkedIn URL" },
        { status: 400 }
      );
    }

    if (!gender || !["male", "female"].includes(gender)) {
      return NextResponse.json(
        { error: "Valid gender is required" },
        { status: 400 }
      );
    }

    // Check if profile exists
    let existingProfile = null;
    if (twitter_handle) {
      const { data: existing } = await supabase
        .from("profiles")
        .select()
        .eq("twitter_handle", twitter_handle)
        .single();

      if (existing) {
        existingProfile = existing;
      }
    }

    let profile;
    if (existingProfile) {
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          gender,
          twitter_handle: twitter_handle || null,
          linkedin_url: linkedin_url || null,
          personal_website: personal_website || null,
          other_links: other_links || null,
          twitter_data: null,
          linkedin_data: null,
          website_data: null,
          other_links_data: null,
          embedding: null,
          stringified_data: null,
          processing_status: "processing",
          error_message: null,
        })
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      profile = data;
    } else {
      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          gender,
          twitter_handle: twitter_handle || null,
          linkedin_url: linkedin_url || null,
          personal_website: personal_website || null,
          other_links: other_links || null,
          processing_status: "processing",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      profile = data;
    }

    // Start processing data immediately
    const processPromise = (async () => {
      try {
        const updates: any = { processing_status: "completed" };
        const allData: any = {};

        // Fetch all data in parallel
        const [twitterData, linkedinData, websiteData, otherLinksData] = await Promise.all([
          twitter_handle ? fetchTwitterData(twitter_handle, exa) : null,
          linkedin_url ? fetchLinkedInData(linkedin_url, exa) : null,
          personal_website ? fetchWebsiteData(personal_website, exa) : null,
          other_links?.length ? Promise.all(other_links.map((url: string) => fetchOtherLinkData(url, exa))) : null
        ]);

        // Update data if available
        if (twitterData) {
          updates.twitter_data = twitterData;
          allData.twitter = twitterData;
        }
        if (linkedinData) {
          updates.linkedin_data = linkedinData;
          allData.linkedin = linkedinData;
        }
        if (websiteData) {
          updates.website_data = websiteData;
          allData.website = websiteData;
        }
        if (otherLinksData?.length) {
          const validData = otherLinksData.filter(data => data !== null);
          if (validData.length > 0) {
            updates.other_links_data = validData;
            allData.other_links = validData;
          }
        }

        // Create formatted data and embedding if we have any data
        if (Object.keys(allData).length > 0) {
          console.log('Creating formatted data with:', { allData });
          const formattedData = formatProfileData({
            gender,
            twitter_handle,
            linkedin_url,
            personal_website,
            other_links,
            twitter_data: allData.twitter,
            linkedin_data: allData.linkedin,
            website_data: allData.website,
            other_links_data: allData.other_links,
          });
          
          console.log('Formatted data:', formattedData);
          console.log('Generating embedding...');
          updates.embedding = await generateEmbedding(formattedData);
          console.log('Embedding generated:', updates.embedding.length);
          updates.stringified_data = formattedData;
        } else {
          console.log('No data available to generate embedding');
        }

        // Update profile with all the data
        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", profile.id);

        // If this is a female profile, find a match
        if (gender === "female") {
          const match = await findMatch(profile.id);
          if (match) {
            return {
              profile,
              match,
              stringified_data: updates.stringified_data
            };
          }
        }

        return { profile, stringified_data: updates.stringified_data };
      } catch (error) {
        await supabase
          .from("profiles")
          .update({
            processing_status: "failed",
            error_message: error instanceof Error ? error.message : "Failed to process profile data",
          })
          .eq("id", profile.id);
        throw error;
      }
    })();

    // Return initial response with profile ID and processing promise
    return NextResponse.json({
      message: existingProfile ? "Profile updated" : "Profile created",
      profile_id: profile.id,
      // Stream updates using Server-Sent Events
      updates_url: `/api/profile/updates?id=${profile.id}`,
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const handle = searchParams.get("twitter_handle");

    if (!id && !handle) {
      return NextResponse.json(
        { error: "ID or handle required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .select()
      .eq(id ? "id" : "twitter_handle", id || handle)
      .single();

    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.log("error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const handle = new URL(req.url).searchParams.get("twitter_handle");
  if (!handle)
    return NextResponse.json({ error: "Handle required" }, { status: 400 });

  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("twitter_handle", handle);
    if (error) throw error;
    return NextResponse.json({ message: "Profile deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
