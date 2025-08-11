import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LearningModule, LearningPlan, LearningTips, YouTubeVideo } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("Missing GEMINI_API_KEY. Gemini calls will fail until set.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : undefined;

type CurateArgs = {
  topic: string;
  videos: YouTubeVideo[];
};

export async function generateCuratedPlan({ topic, videos }: CurateArgs): Promise<Omit<LearningPlan, "mode">> {
  if (!genAI) {
    console.warn("Gemini not configured, using fallback plan");
    // Return a simple fallback plan
    return {
      topic,
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

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const system = `You are an expert learning designer. Given a topic and a list of YouTube videos (title, desc, durationSeconds), create a concise learning plan suitable for an MVP app. Keep to <= 10 items total across modules. Prefer videos with clear titles and reasonable lengths. Output strict JSON with the following TypeScript type shape:
{
  "topic": string,
  "modules": Array<{ "title": string, "estimatedTimeMinutes"?: number, "items": Array<{"videoId": string, "title": string, "url": string, "durationMinutes"?: number}> }>,
  "totalEstimatedTimeMinutes"?: number,
  "tips": { "milestones": string[], "exercises"?: string[], "cheatSheet"?: string }
}
No markdown. No commentary.`;

  const input = {
    topic,
    videos: videos.slice(0, 20).map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description?.slice(0, 500),
      durationSeconds: v.durationSeconds,
      channelTitle: v.channelTitle,
    })),
  };

  try {
    const prompt = `${system}\nINPUT:\n${JSON.stringify(input)}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let parsed: {
      topic: string;
      modules: LearningModule[];
      totalEstimatedTimeMinutes?: number;
      tips?: LearningTips;
    };
    try {
      parsed = JSON.parse(text);
    } catch (_error) {
      console.error("Gemini returned non-JSON content:", text);
      throw new Error("Gemini returned non-JSON content");
    }

    return {
      topic: parsed.topic || topic,
      modules: parsed.modules || [],
      totalEstimatedTimeMinutes: parsed.totalEstimatedTimeMinutes,
      tips: parsed.tips,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Return fallback plan
    return {
      topic,
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
}

export async function generateLearningTips(topic: string): Promise<LearningTips> {
  if (!genAI) {
    console.warn("Gemini not configured, using fallback tips");
    return { milestones: ["Start with fundamentals", "Practice with small projects", "Review and iterate"] };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const system = `Generate concise learning tips for a topic. Output strict JSON with keys: milestones (3-5 bullets), exercises (optional, array), cheatSheet (optional, short string). No markdown.`;
  
  try {
    const result = await model.generateContent(`${system}\nTOPIC: ${topic}`);
    const text = result.response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Gemini returned non-JSON tips:", text);
      return { milestones: ["Start with fundamentals", "Practice with small projects", "Review and iterate"] };
    }
  } catch (error) {
    console.error("Error calling Gemini API for tips:", error);
    return { milestones: ["Start with fundamentals", "Practice with small projects", "Review and iterate"] };
  }
}


