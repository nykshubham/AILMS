"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeaderBar() {
  const router = useRouter();
  const [loadingRandom, setLoadingRandom] = useState(false);

  const goHome = () => router.push("/");

  const onRandom = async () => {
    try {
      setLoadingRandom(true);
      const res = await fetch("/api/random", { cache: "no-store" });
      const json = await res.json();
      const t = json.topic as string;
      router.push(`/learn/${encodeURIComponent(t)}`);
    } finally {
      setLoadingRandom(false);
    }
  };

  return (
    <header className="relative z-10 border-b border-white/20 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goHome}
          className="text-white font-bold text-lg sm:text-xl tracking-wide hover:opacity-90"
          aria-label="Learnflow Home"
        >
          Learnflow
        </button>
        <nav className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={goHome}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-white/20 text-white/90 text-sm sm:text-base hover:bg-white/10"
          >
            Home
          </button>
          <button
            type="button"
            onClick={onRandom}
            disabled={loadingRandom}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-white/20 text-white/90 text-sm sm:text-base hover:bg-white/10 disabled:opacity-50"
          >
            {loadingRandom ? "Picking..." : "Random"}
          </button>
          <a
            href="https://shubhamnayak.com/about/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-purple-600 text-white text-sm sm:text-base hover:bg-purple-700 shadow-[0_8px_24px_rgba(168,85,247,.45)]"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
