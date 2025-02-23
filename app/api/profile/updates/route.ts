import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseConfig";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Profile ID required", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let profile = null;
        while (!profile?.processing_status || profile.processing_status === "processing") {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();

          profile = data;

          if (profile) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                status: profile.processing_status,
                data: profile
              })}\n\n`)
            );

            if (profile.processing_status === "completed" || profile.processing_status === "failed") {
              break;
            }
          }

          // Wait before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
} 