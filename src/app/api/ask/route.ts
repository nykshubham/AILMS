import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchVideos } from "@/lib/youtube";
import { YoutubeTranscript } from "youtube-transcript";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function normalize(text: string): string {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

const STOPWORDS = new Set([
  "the","a","an","and","or","of","to","for","in","on","with","by","from","is","are","was","were","be","been","being","this","that","these","those","it","as","at","your","my","our","their","how","what","why","when","where","which"
]);

function keywords(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t) && t.length >= 3)
    .slice(0, 12);
}

function topRelevantSentences(text: string | undefined, q: string, max = 5): string[] {
  if (!text) return [];
  const ks = keywords(q);
  const sentences = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 400);
  const scored = sentences
    .map((s) => ({ s, score: ks.reduce((acc, k) => acc + (normalize(s).includes(k) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.s);
  return scored;
}

async function fetchTranscriptAny(videoId?: string): Promise<string> {
  if (!videoId) return "";
  const langs = ["en", "en-US", "en-GB", "en-IN", "auto"];
  for (const lang of langs) {
    try {
      const tr = await YoutubeTranscript.fetchTranscript(videoId, { lang } as any);
      if (tr?.length) return tr.map((t: any) => t.text).join(" ");
    } catch {}
  }
  try {
    const tr = await YoutubeTranscript.fetchTranscript(videoId);
    if (tr?.length) return tr.map((t: any) => t.text).join(" ");
  } catch {}
  return "";
}

function isSummaryIntent(q: string): boolean {
  const s = q.toLowerCase();
  return ["what is this video about", "summary", "summarize", "outline", "overview"].some((k) =>
    s.includes(k)
  );
}

export async function POST(req: NextRequest) {
  try {
    const { question, topic, videoId } = (await req.json()) as {
      question?: string;
      topic?: string;
      videoId?: string;
    };

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ answer: "Please provide a question." });
    }

    // Try to get transcript text (multi-language attempts)
    const transcriptText = await fetchTranscriptAny(videoId);

    const contextBlocks: string[] = [];
    if (topic) contextBlocks.push(`Topic: ${topic}`);
    if (transcriptText) {
      contextBlocks.push(`Transcript: ${transcriptText.slice(0, 8000)}`);
    }

    // Use Gemini if available with transcript context
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const system = `You are a helpful tutor. Use the provided transcript/context of a YouTube learning video to answer the user's question precisely, step-by-step when helpful. Cite concepts explicitly; if not in context, say so briefly.`;
        const prompt = `${system}\n\nCONTEXT:\n${contextBlocks.join("\n")}\n\nQUESTION: ${question}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) return NextResponse.json({ answer: text });
      } catch (err) {
        // fall through to heuristic answer
      }
    }

    // Heuristic fallback: prefer transcript; else description; else suggestions
    const source = transcriptText || "";

    // If user asked for summary, generate one even without transcript
    if (isSummaryIntent(question)) {
      const summaryParts: string[] = [];
      const top = topRelevantSentences(source, `${topic ?? ""} introduction overview basics`, 4);
      if (top.length) {
        return NextResponse.json({ answer: `Summary:\n- ${top.join("\n- ")}` });
      }
      return NextResponse.json({
        answer: `This video covers key concepts about ${topic ?? "the topic"}.`,
      });
    }

    const bullets = topRelevantSentences(source, question, 5);
    let answer: string;
    if (bullets.length) {
      answer = `From the current video context:${bullets.map((b) => `\n- ${b}`).join("")}`;
    } else {
      // Try suggesting 2 better videos for the specific question
      let suggestions: string[] = [];
      try {
        const list = await searchVideos(`${topic ?? ""} ${question}`.trim());
        suggestions = list.slice(0, 2).map((v) => `${v.title} — ${v.channelTitle}`);
      } catch {}
      if (suggestions.length) {
        answer = `I couldn't find that in the current video's context. Consider:` + suggestions.map((s) => `\n- ${s}`).join("");
      } else {
        answer = `I couldn't find that detail in the current video's context. Try asking about a specific step or concept related to ${topic ?? "this topic"}.`;
      }
    }

    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ answer: "Sorry, I ran into an issue answering that question." }, { status: 200 });
  }
}
