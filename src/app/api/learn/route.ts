import { NextRequest, NextResponse } from "next/server";
import { searchPlaylists, searchVideos } from "@/lib/youtube";
import { generateCuratedPlan, generateLearningTips } from "@/lib/gemini";
import type { LearningPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { topic } = (await req.json()) as { topic?: string };
    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: "Missing or invalid topic" }, { status: 400 });
    }

    // Check if YouTube API key is available
    if (!process.env.YT_API_KEY) {
      console.error("YT_API_KEY is not set");
      return NextResponse.json({ 
        error: "YouTube API key not configured. Please set YT_API_KEY in your environment variables." 
      }, { status: 500 });
    }

    // 1) Try to find a good existing playlist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let playlists: any[] = [];
    try {
      playlists = await searchPlaylists(topic);
    } catch (error) {
      console.error("Error searching playlists:", error);
      // Continue to fallback
    }

    const firstPlaylist = playlists[0];

    if (firstPlaylist) {
      let tips;
      try {
        tips = await generateLearningTips(topic);
      } catch (error) {
        console.error("Error generating tips:", error);
        tips = { milestones: ["Start with fundamentals", "Practice regularly", "Review and iterate"] };
      }

      const plan: LearningPlan = {
        topic,
        mode: "playlist",
        playlistId: firstPlaylist.id,
        playlistTitle: firstPlaylist.title,
        playlistChannelTitle: firstPlaylist.channelTitle,
        tips,
      };
      return NextResponse.json(plan);
    }

    // 2) Fallback: curate from top videos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let videos: any[] = [];
    try {
      videos = await searchVideos(topic);
    } catch (error) {
      console.error("Error searching videos:", error);
      return NextResponse.json({ 
        error: "Failed to fetch videos. Please check your YouTube API key and try again." 
      }, { status: 500 });
    }

    if (videos.length === 0) {
      return NextResponse.json({ 
        error: "No relevant videos found for this topic. Please try a different search term." 
      }, { status: 404 });
    }

    let curated;
    try {
      curated = await generateCuratedPlan({ topic, videos });
    } catch (error) {
      console.error("Error generating curated plan:", error);
      // Create a simple fallback plan
      curated = {
        modules: [{
          title: "Getting Started",
          estimatedTimeMinutes: 30,
          items: videos.slice(0, 3).map(v => ({
            videoId: v.id,
            title: v.title,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            durationMinutes: v.durationSeconds ? Math.round(v.durationSeconds / 60) : undefined
          }))
        }],
        totalEstimatedTimeMinutes: 30,
        tips: { milestones: ["Start with fundamentals", "Practice regularly", "Review and iterate"] }
      };
    }

    const plan: LearningPlan = {
      topic,
      mode: "curated",
      modules: curated.modules?.slice(0, 3), // keep concise
      totalEstimatedTimeMinutes: curated.totalEstimatedTimeMinutes,
      tips: curated.tips,
    };
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Unexpected error in /api/learn:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


