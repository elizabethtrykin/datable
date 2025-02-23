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
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-3-small",
  });
  return response.data[0].embedding;
}

interface SocialData {
  text?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ProfileUpdates {
  processing_status: "completed" | "failed";
  twitter_data?: SocialData;
  linkedin_data?: SocialData;
  website_data?: SocialData;
  other_links_data?: SocialData[];
  embedding?: number[];
  stringified_data?: string;
  error_message?: string;
}

interface AllData {
  twitter?: SocialData;
  linkedin?: SocialData;
  website?: SocialData;
  other_links?: SocialData[];
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
        const exa = new Exa(process.env.EXA_API_KEY as string);
        const updates: ProfileUpdates = { processing_status: "completed" };
        const allData: AllData = {};
        const errors: string[] = [];

        const fetchPromises = [];

        if (twitter_handle) {
          fetchPromises.push(
            fetchTwitterData(twitter_handle, exa)
              .then((data) => {
                if (data) {
                  updates.twitter_data = data;
                  allData.twitter = data;
                }
              })
              .catch((error) => {
                errors.push(`Twitter data fetch failed: ${error.message}`);
              })
          );
        }

        if (linkedin_url) {
          fetchPromises.push(
            fetchLinkedInData(linkedin_url, exa)
              .then((data) => {
                if (data) {
                  updates.linkedin_data = data;
                  allData.linkedin = data;
                }
              })
              .catch((error) => {
                errors.push(`LinkedIn data fetch failed: ${error.message}`);
              })
          );
        }

        if (personal_website) {
          fetchPromises.push(
            fetchWebsiteData(personal_website, exa)
              .then((data) => {
                if (data) {
                  updates.website_data = data;
                  allData.website = data;
                }
              })
              .catch((error) => {
                errors.push(`Website data fetch failed: ${error.message}`);
              })
          );
        }

        if (other_links?.length) {
          fetchPromises.push(
            Promise.all(
              other_links.map((url: string) =>
                fetchOtherLinkData(url, exa)
                  .then((data) => data)
                  .catch((error) => {
                    errors.push(
                      `Other link fetch failed for ${url}: ${error.message}`
                    );
                    return null;
                  })
              )
            ).then((dataArray) => {
              const validData = dataArray.filter((data) => data !== null);
              if (validData.length > 0) {
                updates.other_links_data = validData.map((data) => ({
                  text: data,
                  metadata: {},
                }));
                allData.other_links = validData.map((data) => ({
                  text: data,
                  metadata: {},
                }));
              }
            })
          );
        }

        await Promise.all(fetchPromises);

        if (Object.keys(allData).length > 0) {
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

          updates.embedding = await generateEmbedding(formattedData);
          console.log("Embedding generated:", updates.embedding.length);
          updates.stringified_data = formattedData;

          if (errors.length > 0) {
            updates.error_message = `Partial success. Some data fetches failed: ${errors.join(
              "; "
            )}`;
          }
        } else {
          updates.processing_status = "failed";
          updates.error_message =
            "No social data could be fetched. All attempts failed.";
        }

        await supabase.from("profiles").update(updates).eq("id", profile.id);
      } catch (error) {
        await supabase
          .from("profiles")
          .update({
            processing_status: "failed",
            error_message:
              error instanceof Error
                ? error.message
                : "Failed to process profile data",
          })
          .eq("id", profile.id);
        throw error;
      }
    })();

    return response;
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
