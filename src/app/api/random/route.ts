import { NextResponse } from "next/server";

const RANDOM_TOPICS = [
  "Python programming",
  "Introduction to machine learning",
  "Basic guitar chords",
  "Cooking Italian pasta",
  "Digital marketing fundamentals",
  "Public speaking tips",
  "Photography basics",
  "Web accessibility",
  "React hooks overview",
  "Data visualization"
];

export const dynamic = "force-dynamic";

export async function GET() {
  const topic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
  return NextResponse.json({ topic });
}



