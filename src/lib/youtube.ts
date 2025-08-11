import type { YouTubePlaylist, YouTubeVideo } from "@/lib/types";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

const YT_API_KEY = process.env.YT_API_KEY;

if (!YT_API_KEY) {
  // Non-throwing: allow local dev without keys until runtime call
  console.warn("Missing YT_API_KEY. YouTube API calls will fail until set.");
}

// Keywords that indicate educational/study content
const EDUCATIONAL_KEYWORDS = [
  "tutorial", "learn", "course", "lesson", "guide", "how to", "basics", "fundamentals",
  "introduction", "overview", "explained", "step by step", "tips", "tricks", "best practices",
  "complete guide", "full course", "crash course", "beginners", "advanced", "intermediate",
  "masterclass", "workshop", "training", "education", "academic", "lecture", "seminar"
];

// Keywords that indicate non-educational content (to filter out)
const NON_EDUCATIONAL_KEYWORDS = [
  "vlog", "daily", "lifestyle", "funny", "comedy", "entertainment", "gaming", "music video",
  "song", "cover", "reaction", "challenge", "prank", "unboxing", "haul", "review", "unbox",
  "asmr", "satisfying", "relaxing", "sleep", "meditation", "workout", "fitness", "dance"
];

function isEducationalContent(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  
  // Check for educational keywords
  const hasEducationalKeyword = EDUCATIONAL_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // Check for non-educational keywords (higher weight)
  const hasNonEducationalKeyword = NON_EDUCATIONAL_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // Additional checks
  const isShortVideo = title.includes("short") || title.includes("quick");
  const isVeryLongVideo = title.includes("10 hour") || title.includes("24 hour");
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(title);
  
  // Return true if educational and not non-educational
  return hasEducationalKeyword && !hasNonEducationalKeyword && !isShortVideo && !isVeryLongVideo && !hasEmojis;
}

export async function searchPlaylists(topic: string): Promise<YouTubePlaylist[]> {
  if (!YT_API_KEY) {
    throw new Error("YouTube API key not configured");
  }

  // Enhance search query with educational keywords
  const educationalQuery = `${topic} tutorial learn course guide playlist`;
  
  const url = new URL(`${YT_API_BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", educationalQuery);
  url.searchParams.set("type", "playlist");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("key", YT_API_KEY);

  console.log(`Searching playlists for: ${educationalQuery}`);
  
  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`YouTube search playlists failed: ${res.status} - ${errorText}`);
    throw new Error(`YouTube search playlists failed: ${res.status} - ${errorText}`);
  }
  
  type SearchPlaylistItem = {
    id?: { playlistId?: string };
    snippet?: { title?: string; description?: string; channelTitle?: string };
  };
  const data: { items?: SearchPlaylistItem[] } = await res.json();

  const items: YouTubePlaylist[] = (data.items ?? []).map((i) => ({
    id: i.id?.playlistId ?? "",
    title: i.snippet?.title ?? "",
    description: i.snippet?.description ?? "",
    channelTitle: i.snippet?.channelTitle ?? "",
  }));
  return items.filter((p) => Boolean(p.id));
}

export async function searchVideos(topic: string): Promise<YouTubeVideo[]> {
  if (!YT_API_KEY) {
    throw new Error("YouTube API key not configured");
  }

  // First try with educational keywords
  const educationalQuery = `${topic} tutorial learn course guide how to basics fundamentals`;
  
  const url = new URL(`${YT_API_BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", educationalQuery);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "15");
  url.searchParams.set("key", YT_API_KEY);

  console.log(`Searching videos for: ${educationalQuery}`);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`YouTube search videos failed: ${res.status} - ${errorText}`);
    throw new Error(`YouTube search videos failed: ${res.status} - ${errorText}`);
  }
  
  type SearchVideoItem = {
    id?: { videoId?: string };
    snippet?: { title?: string; description?: string; channelTitle?: string };
  };
  const data: { items?: SearchVideoItem[] } = await res.json();
  const videosBasic = (data.items ?? []).map((i) => ({
    id: i.id?.videoId ?? "",
    title: i.snippet?.title ?? "",
    description: i.snippet?.description ?? "",
    channelTitle: i.snippet?.channelTitle ?? "",
  }));
  const ids = videosBasic.map((v) => v.id).filter(Boolean) as string[];
  if (ids.length === 0) return [];

  const detailsUrl = new URL(`${YT_API_BASE}/videos`);
  detailsUrl.searchParams.set("part", "contentDetails,snippet");
  detailsUrl.searchParams.set("id", ids.join(","));
  detailsUrl.searchParams.set("key", YT_API_KEY);

  const detailsRes = await fetch(detailsUrl.toString());
  if (!detailsRes.ok) {
    const errorText = await detailsRes.text();
    console.error(`YouTube videos details failed: ${detailsRes.status} - ${errorText}`);
    throw new Error(`YouTube videos details failed: ${detailsRes.status} - ${errorText}`);
  }
  
  type DetailsItem = {
    id: string;
    contentDetails?: { duration?: string };
    snippet?: { publishedAt?: string };
  };
  const detailsData: { items?: DetailsItem[] } = await detailsRes.json();

  const durationIsoToSeconds = (iso: string | undefined): number | undefined => {
    if (!iso) return undefined;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;
    const hours = parseInt(match[1] ?? "0", 10);
    const minutes = parseInt(match[2] ?? "0", 10);
    const seconds = parseInt(match[3] ?? "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const mapById = new Map<string, DetailsItem>();
  for (const item of detailsData.items ?? []) {
    mapById.set(item.id, item);
  }

  const videos: YouTubeVideo[] = videosBasic.map((v) => {
    const detail = mapById.get(v.id);
    const durationSeconds = durationIsoToSeconds(detail?.contentDetails?.duration);
    const publishedAt = detail?.snippet?.publishedAt;
    return { ...v, durationSeconds, publishedAt } as YouTubeVideo;
  });

  // Filter for educational content only
  const educationalVideos = videos.filter(video => 
    isEducationalContent(video.title, video.description)
  );
  
  // If no educational videos found, try with original topic but still filter
  if (educationalVideos.length === 0) {
    console.log("No educational videos found, trying fallback search");
    const fallbackUrl = new URL(`${YT_API_BASE}/search`);
    fallbackUrl.searchParams.set("part", "snippet");
    fallbackUrl.searchParams.set("q", topic);
    fallbackUrl.searchParams.set("type", "video");
    fallbackUrl.searchParams.set("maxResults", "20"); // Get more to filter from
    fallbackUrl.searchParams.set("key", YT_API_KEY);

    const fallbackRes = await fetch(fallbackUrl.toString());
    if (!fallbackRes.ok) {
      const errorText = await fallbackRes.text();
      console.error(`YouTube fallback search failed: ${fallbackRes.status} - ${errorText}`);
      return educationalVideos; // Return empty if fallback fails
    }
    
    const fallbackData: { items?: SearchVideoItem[] } = await fallbackRes.json();
    const fallbackVideosBasic = (fallbackData.items ?? []).map((i) => ({
      id: i.id?.videoId ?? "",
      title: i.snippet?.title ?? "",
      description: i.snippet?.description ?? "",
      channelTitle: i.snippet?.channelTitle ?? "",
    }));
    const fallbackIds = fallbackVideosBasic.map((v) => v.id).filter(Boolean) as string[];
    
    if (fallbackIds.length > 0) {
      const fallbackDetailsUrl = new URL(`${YT_API_BASE}/videos`);
      fallbackDetailsUrl.searchParams.set("part", "contentDetails,snippet");
      fallbackDetailsUrl.searchParams.set("id", fallbackIds.join(","));
      fallbackDetailsUrl.searchParams.set("key", YT_API_KEY);

      const fallbackDetailsRes = await fetch(fallbackDetailsUrl.toString());
      if (fallbackDetailsRes.ok) {
        const fallbackDetailsData: { items?: DetailsItem[] } = await fallbackDetailsRes.json();
        const fallbackMapById = new Map<string, DetailsItem>();
        for (const item of fallbackDetailsData.items ?? []) {
          fallbackMapById.set(item.id, item);
        }

        const fallbackVideos: YouTubeVideo[] = fallbackVideosBasic.map((v) => {
          const detail = fallbackMapById.get(v.id);
          const durationSeconds = durationIsoToSeconds(detail?.contentDetails?.duration);
          const publishedAt = detail?.snippet?.publishedAt;
          return { ...v, durationSeconds, publishedAt } as YouTubeVideo;
        });

        // Apply less strict filtering for fallback
        const fallbackEducationalVideos = fallbackVideos.filter(video => {
          const text = `${video.title} ${video.description}`.toLowerCase();
          const hasNonEducationalKeyword = NON_EDUCATIONAL_KEYWORDS.some(keyword => 
            text.includes(keyword.toLowerCase())
          );
          const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(video.title);
          
          return !hasNonEducationalKeyword && !hasEmojis;
        });
        
        return fallbackEducationalVideos.slice(0, 10); // Limit to 10 for performance
      }
    }
  }
  
  return educationalVideos;
}


// Get items from a playlist (video IDs and basic details), then enrich with durations
export async function getPlaylistItems(playlistId: string): Promise<{
  id: string;
  title: string;
  channelTitle: string;
  description?: string;
  durationSeconds?: number;
  publishedAt?: string;
}[]> {
  if (!YT_API_KEY) {
    throw new Error("YouTube API key not configured");
  }

  // Fetch up to 50 items for now (first page)
  const itemsUrl = new URL(`${YT_API_BASE}/playlistItems`);
  itemsUrl.searchParams.set("part", "snippet");
  itemsUrl.searchParams.set("playlistId", playlistId);
  itemsUrl.searchParams.set("maxResults", "50");
  itemsUrl.searchParams.set("key", YT_API_KEY);

  const itemsRes = await fetch(itemsUrl.toString());
  if (!itemsRes.ok) {
    const errorText = await itemsRes.text();
    console.error(`YouTube playlistItems failed: ${itemsRes.status} - ${errorText}`);
    throw new Error(`YouTube playlistItems failed: ${itemsRes.status}`);
  }

  type PI = {
    snippet?: {
      resourceId?: { videoId?: string };
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
    };
  };
  const itemsData: { items?: PI[] } = await itemsRes.json();
  const basics = (itemsData.items ?? [])
    .map((i) => ({
      id: i.snippet?.resourceId?.videoId ?? "",
      title: i.snippet?.title ?? "",
      description: i.snippet?.description ?? "",
      channelTitle: i.snippet?.channelTitle ?? "",
      publishedAt: i.snippet?.publishedAt,
    }))
    .filter((v) => v.id);

  const ids = basics.map((b) => b.id);
  if (ids.length === 0) return [];

  // Enrich with durations
  const detailsUrl = new URL(`${YT_API_BASE}/videos`);
  detailsUrl.searchParams.set("part", "contentDetails,snippet");
  detailsUrl.searchParams.set("id", ids.join(","));
  detailsUrl.searchParams.set("key", YT_API_KEY);

  const detailsRes = await fetch(detailsUrl.toString());
  if (!detailsRes.ok) {
    const errorText = await detailsRes.text();
    console.error(`YouTube videos details failed: ${detailsRes.status} - ${errorText}`);
    return basics; // return basics if enrichment fails
  }

  type DItem = { id: string; contentDetails?: { duration?: string }; snippet?: { publishedAt?: string } };
  const detailsData: { items?: DItem[] } = await detailsRes.json();
  const mapById = new Map<string, DItem>();
  for (const d of detailsData.items ?? []) mapById.set(d.id, d);

  const durationIsoToSeconds = (iso: string | undefined): number | undefined => {
    if (!iso) return undefined;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;
    const hours = parseInt(match[1] ?? "0", 10);
    const minutes = parseInt(match[2] ?? "0", 10);
    const seconds = parseInt(match[3] ?? "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  return basics.map((b) => {
    const d = mapById.get(b.id);
    return {
      ...b,
      durationSeconds: durationIsoToSeconds(d?.contentDetails?.duration),
      publishedAt: d?.snippet?.publishedAt ?? b.publishedAt,
    };
  });
}

