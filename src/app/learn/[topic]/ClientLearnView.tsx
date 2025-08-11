"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type RelatedItem = {
  videoId: string;
  title: string;
  url: string;
  durationMinutes?: number;
  channelTitle?: string;
};

type Props = {
  mode: "playlist" | "curated";
  playlistId?: string;
  playlistTitle?: string;
  playlistChannelTitle?: string;
  initialVideo?: RelatedItem | null;
  related: RelatedItem[];
  tips?: {
    cheatSheet?: string;
    milestones?: string[];
    exercises?: string[];
  } | null;
  topic?: string;
};

function YouTubeEmbed({ videoId }: { videoId: string }) {
  const url = `https://www.youtube.com/embed/${videoId}`;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/20 bg-black/30">
      <iframe
        className="h-full w-full"
        src={url}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default function ClientLearnView({ mode, playlistId, playlistTitle, playlistChannelTitle, initialVideo, related, tips, topic }: Props) {
  const [current, setCurrent] = useState<RelatedItem | null>(initialVideo ?? null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [showEntryFX, setShowEntryFX] = useState(true);
  // Notes state (persisted per topic)
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Play a one-time entry flash/burst once the page is mounted
  useEffect(() => {
    const t = setTimeout(() => setShowEntryFX(false), 520); // ~0.5s burst
    return () => clearTimeout(t);
  }, []);

  // Chat state
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [current?.videoId]);

  const askGemini = async () => {
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setAsking(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, topic, videoId: current?.videoId }),
      });
      const json = await res.json();
      const a = (json?.answer ?? "").toString();
      setMessages((m) => [...m, { role: "assistant", content: a || "I couldn't get an answer right now." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I ran into an issue answering that." }]);
    } finally {
      setAsking(false);
    }
  };

  // Load saved notes for this topic on mount/topic change
  useEffect(() => {
    if (!topic) return;
    try {
      const key = `learnflow:notes:${topic}`;
      const v = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (v !== null) {
        setSavedNotes(v);
        setNotes("");
      } else {
        setSavedNotes("");
        setNotes("");
      }
    } catch { /* ignore */ }
  }, [topic]);

  const saveNotes = () => {
    if (!topic) return;
    try {
      setSaving(true);
      const key = `learnflow:notes:${topic}`;
      const toAdd = notes.trim();
      if (!toAdd) return;
      if (typeof window !== "undefined") {
        const combined = savedNotes ? `${savedNotes}\n\n${toAdd}` : toAdd;
        localStorage.setItem(key, combined);
        setSavedNotes(combined);
        setNotes("");
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 relative">
      {/* One-time entry flash/burst overlay */}
      {showEntryFX && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          {/* Flash */}
          <div className="entry-flash absolute inset-0" />
          {/* Shockwave ring */}
          <div className="entry-shockwave absolute w-40 h-40 rounded-full border-2 border-white/60" />
        </div>
      )}
      {/* Main: Video + Ask AI */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {mode === "playlist" ? (
            current && (
              <div ref={playerRef} key={current.videoId} className="rounded-xl overflow-hidden border border-white/20 bg-black/30">
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${current.videoId}?list=${playlistId}`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )
          ) : (
            current && (
              <div ref={playerRef} key={current.videoId}>
                <YouTubeEmbed videoId={current.videoId} />
              </div>
            )
          )}

          {/* Title + meta + actions */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              {mode === "playlist" ? (playlistTitle ?? "Playlist") : (current?.title ?? "Lesson")}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              {mode === "playlist" ? (
                <span>{playlistChannelTitle}</span>
              ) : (
                <>
                  {current?.durationMinutes ? <span>{current.durationMinutes} min</span> : null}
                  {current?.url ? (
                    <a
                      href={current.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white/80 hover:text-white underline-offset-4 hover:underline"
                    >
                      Open on YouTube
                    </a>
                  ) : null}
                </>
              )}
              <span className="flex-1" />
              {/* Social share */}
              {current ? (
                <div className="flex items-center gap-2">
                  {/* X/Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(current.url ?? shareUrl)}&text=${encodeURIComponent((current.title ?? "") + " — via Learnflow")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-md border border-white/15 text-white/80 hover:bg-white/10"
                    aria-label="Share on X"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18 2h3l-7 9 8 11h-6l-5-7-6 7H2l8-9-8-11h6l5 7 5-7z"/></svg>
                  </a>
                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(current.url ?? shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-md border border-white/15 text-white/80 hover:bg-white/10"
                    aria-label="Share on LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0H12v2.2h.06c.63-1.2 2.17-2.46 4.47-2.46 4.78 0 5.66 3.15 5.66 7.25V24h-5v-7.5c0-1.79-.03-4.09-2.5-4.09-2.5 0-2.88 1.95-2.88 3.96V24h-5V8z"/></svg>
                  </a>
                  {/* Copy link */}
                  <button
                    type="button"
                    onClick={() => {
                      const link = current.url ?? shareUrl;
                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(link);
                      }
                    }}
                    className="p-2 rounded-md border border-white/15 text-white/80 hover:bg-white/10"
                    aria-label="Copy link"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  </button>
                </div>
              ) : null}
            </div>
            <div className="h-px bg-white/10 mt-2" />
          </div>
        </div>

        {/* Ask the AI Sidebar (sticky, larger chat) */}
        <aside className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-4 lg:sticky lg:top-24 h-[520px]">
          <h2 className="text-white font-medium">Ask the AI</h2>
          <div className="flex-1 overflow-y-auto rounded-lg border border-white/15 bg-black/30 p-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-white/60">Ask anything about this video. I'll use the transcript/context to help.</p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-white" : "text-white/80"}>
                  <span className="text-xs uppercase tracking-wide text-white/50">{m.role}</span>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="min-h-[44px] max-h-28 flex-1 resize-y rounded-lg border border-white/20 bg-black/30 p-2 text-sm text-white placeholder-white/50"
            />
            <button
              onClick={askGemini}
              disabled={asking}
              className="rounded-lg px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors border border-white/20 disabled:opacity-60"
            >
              {asking ? "Asking..." : "Ask"}
            </button>
          </div>
        </aside>
      </div>

      {/* Notes + Related */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes pad */}
        <section className="lg:col-span-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-medium text-white">Notes</h3>
            <div className="flex items-center gap-3">
              {savedAt ? (
                <span className="text-xs text-white/60 hidden sm:inline">Saved {new Date(savedAt).toLocaleTimeString()}</span>
              ) : null}
              <button
                type="button"
                onClick={saveNotes}
                disabled={saving}
                className="rounded-md px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 border border-white/20"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {/* Saved note preview */}
          {savedNotes ? (
            <div className="rounded-lg border border-white/15 bg-black/20 p-3 text-white/90 whitespace-pre-wrap">
              {savedNotes}
            </div>
          ) : null}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={topic ? `Notes for ${topic}` : "Write your notes here..."}
            className="w-full min-h-48 md:min-h-64 rounded-lg border border-white/15 bg-black/20 text-white placeholder-white/50 p-3 resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-400/40"
          />

          {tips?.exercises?.length ? (
            <details className="rounded-lg border border-white/15 bg-black/20 open:bg-black/30">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm text-white/90">Exercises</summary>
              <ul className="list-disc pl-8 pr-4 pb-3 text-sm text-white/80">
                {tips.exercises.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        {/* Related videos */}
        <aside className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-white font-medium mb-3">Related Videos</h3>
          <div className="space-y-3">
            {related.slice(0, 4).map((item) => {
              const isActive = current?.videoId === item.videoId;
              return (
                <button
                  type="button"
                  key={item.videoId}
                  onClick={() => {
                    setCurrent(item);
                    // Smooth scroll to player for good UX
                    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                  }}
                  className={`w-full text-left flex gap-3 rounded-lg border p-2 transition-all ${
                    isActive ? "border-purple-400/50 bg-purple-500/10" : "border-white/15 bg-black/30 hover:border-white/30"
                  }`}
                >
                  <div className="w-24 aspect-video overflow-hidden rounded bg-white/10">
                    <img
                      src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white line-clamp-2">{item.title}</p>
                    {item.durationMinutes ? (
                      <p className="text-xs text-white/60 mt-1">{item.durationMinutes} min</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
            {mode === "playlist" ? (
              <p className="text-sm text-white/70">Browse the playlist to see related videos.</p>
            ) : null}
          </div>
        </aside>
      </div>
      {/* Entry FX styles (scoped) */}
      <style jsx>{`
        .entry-flash {
          background: radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0.0));
          animation: entry-flash 520ms ease-out forwards;
          filter: blur(6px);
          opacity: 0;
        }
        .entry-shockwave {
          animation: entry-shock 520ms ease-out forwards;
          box-shadow: 0 0 60px rgba(255,255,255,0.45);
        }
        @keyframes entry-flash {
          0% { opacity: 0; transform: scale(0.9); }
          35% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.25); }
        }
        @keyframes entry-shock {
          0% { opacity: 0; transform: scale(0.7); }
          35% { opacity: 1; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(2.0); }
        }
      `}</style>
    </div>
  );
}
