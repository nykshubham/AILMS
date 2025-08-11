import type { LearningPlan } from "@/lib/types";
import { getPlaylistItems } from "@/lib/youtube";
import ClientLearnView from "./ClientLearnView";
import HeaderBar from "@/components/HeaderBar";

// Rely on Next.js generated types for page props; use any with ESLint disable to avoid mismatch

async function fetchPlan(topic: string): Promise<LearningPlan> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/learn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: decodeURIComponent(topic) }),
    // Avoid edge caching while prototyping
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to generate learning plan");
  return res.json();
}

// Removed unused YouTubeEmbed component

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function LearnPage({ params, searchParams }: any) {
  const { topic } = params;
  const vParam = searchParams?.v;
  const forcedVideoId = Array.isArray(vParam) ? vParam[0] : vParam;
  const plan = await fetchPlan(topic);
  const title = decodeURIComponent(topic);

  // Prepare initial/related items for both modes
  type ClientItem = { videoId: string; title: string; url: string; durationMinutes?: number; channelTitle?: string };
  let initialVideo: ClientItem | null = null;
  let related: ClientItem[] = [];

  if (plan.mode === "playlist" && plan.playlistId) {
    try {
      const items = await getPlaylistItems(plan.playlistId);
      type PlaylistApiItem = { id: string; title: string; durationSeconds?: number; channelTitle?: string };
      const toClient = (it: PlaylistApiItem): ClientItem => ({
        videoId: it.id,
        title: it.title,
        url: `https://www.youtube.com/watch?v=${it.id}&list=${plan.playlistId}`,
        durationMinutes: it.durationSeconds ? Math.round(it.durationSeconds / 60) : undefined,
        channelTitle: it.channelTitle,
      });
      related = items.map(toClient);
      initialVideo = related[0] ?? null;
    } catch {
      // fallback: keep nulls
    }
  } else {
    const items = (plan.modules ?? []).flatMap((m) => m.items);
    type ModuleItem = { videoId: string; title: string; url?: string; durationMinutes?: number; channelTitle?: string };
    const toClient = (it: ModuleItem): ClientItem => ({
      videoId: it.videoId,
      title: it.title,
      url: it.url ?? `https://www.youtube.com/watch?v=${it.videoId}`,
      durationMinutes: it.durationMinutes,
      channelTitle: it.channelTitle,
    });
    related = items.map(toClient);
    initialVideo = items[0] ? toClient(items[0]) : null;
  }

  // If a specific video ID is provided via ?v=, prefer it
  if (forcedVideoId) {
    const found = related.find((r) => r.videoId === forcedVideoId) ?? null;
    if (found) {
      initialVideo = found;
    } else {
      initialVideo = {
        videoId: forcedVideoId,
        title,
        url: plan.mode === "playlist" && plan.playlistId
          ? `https://www.youtube.com/watch?v=${forcedVideoId}&list=${plan.playlistId}`
          : `https://www.youtube.com/watch?v=${forcedVideoId}`,
      };
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/80 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 p-6">
        {/* Top Navigation Bar */}
        <div className="-mx-6 mb-6">
          <HeaderBar />
        </div>
        <div className="mx-auto max-w-6xl space-y-8">
          <ClientLearnView
            mode={plan.mode}
            playlistId={plan.playlistId}
            playlistTitle={plan.playlistTitle}
            playlistChannelTitle={plan.playlistChannelTitle}
            initialVideo={initialVideo}
            related={related}
            tips={plan.tips ?? null}
            topic={title}
          />
        </div>
      </div>
    </div>
  );
}


