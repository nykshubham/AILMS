import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { question, topic } = (await req.json()) as {
      question?: string;
      topic?: string;
    };

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ answer: "Please provide a question." });
    }

    // Use Gemini, basing answers solely on the provided topic
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const system = `You are a concise, helpful tutor. Answer strictly based on the given topic. If something falls outside the topic, say you don't know. Provide clear, step-by-step guidance when appropriate.`;
        const prompt = `${system}\n\nTOPIC: ${topic ?? "(unspecified)"}\nQUESTION: ${question}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) return NextResponse.json({ answer: text });
      } catch (err) {
        // fall through to simple fallback
      }
    }

    // Simple fallback based on topic only
    return NextResponse.json({
      answer: `I can't reach the AI right now. Based on the topic ${topic ? `"${topic}"` : "(unspecified)"}, try asking a more specific question or a step-by-step task to get a practical answer.`,
    });
  } catch (e) {
    return NextResponse.json({ answer: "Sorry, I ran into an issue answering that question." }, { status: 200 });
  }
}
