"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import HeaderBar from "@/components/HeaderBar";

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isSearching, startSearchTransition] = useTransition();

  const placeholders = [
    "Search for a course",
    "Learn Python",
    "How to be better at conversations?",
    "Master JavaScript",
    "Learn to cook",
    "Public speaking tips",
    "Data science basics",
    "Photography skills"
  ];

  // Dynamic placeholder rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && topic.trim()) {
        startSearchTransition(() => {
          router.push(`/learn/${encodeURIComponent(topic.trim())}`);
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, topic, startSearchTransition]);

  const onSearch = () => {
    if (!topic.trim()) return;
    startSearchTransition(() => {
      router.push(`/learn/${encodeURIComponent(topic.trim())}`);
    });
  };

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

  const suggestedVideos = [
    { 
      id: "rfscVS0vtbw",
      title: "Learn Python - Full Course for Beginners", 
      topic: "Python",
      channel: "freeCodeCamp.org",
      views: "45M views",
      thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/maxresdefault.jpg"
    },
    { 
      id: "bMknfKXIFA8",
      title: "React JS - Full Course for Beginners", 
      topic: "React JS",
      channel: "freeCodeCamp.org",
      views: "9M views",
      thumbnail: "https://i.ytimg.com/vi/bMknfKXIFA8/maxresdefault.jpg"
    },
    { 
      id: "ua-CiDNNj30",
      title: "Data Science Full Course - Learn Data Science in 10 Hours", 
      topic: "Data Science",
      channel: "edureka!",
      views: "3.2M views",
      thumbnail: "https://i.ytimg.com/vi/ua-CiDNNj30/maxresdefault.jpg"
    },
    { 
      id: "1Rs2ND1ryYc",
      title: "CS50's Introduction to Computer Science", 
      topic: "Computer Science",
      channel: "CS50",
      views: "12M views",
      thumbnail: "https://i.ytimg.com/vi/1Rs2ND1ryYc/maxresdefault.jpg"
    },
    { 
      id: "PkZNo7MFNFg",
      title: "Learn JavaScript - Full Course for Beginners", 
      topic: "JavaScript",
      channel: "freeCodeCamp.org",
      views: "12M views",
      thumbnail: "https://i.ytimg.com/vi/PkZNo7MFNFg/maxresdefault.jpg"
    },
    { 
      id: "r-uOLxNrNk8",
      title: "Data Analysis with Python - Full Course for Beginners", 
      topic: "Data Analytics",
      channel: "freeCodeCamp.org",
      views: "4.2M views",
      thumbnail: "https://i.ytimg.com/vi/r-uOLxNrNk8/maxresdefault.jpg"
    }
  ];

  const handleVideoClick = (topic: string, id?: string) => {
    const url = id
      ? `/learn/${encodeURIComponent(topic)}?v=${encodeURIComponent(id)}`
      : `/learn/${encodeURIComponent(topic)}`;
    router.push(url);
  };

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

      {/* Top Navigation Bar */}
      <HeaderBar />

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex flex-col gap-16 px-6 py-16">
        {/* Hero (centered search) */}
        <section className="min-h-[70vh] flex items-center justify-center">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-extrabold text-white leading-tight">
              Let AI Generate Your
              <br />
              Lessons
            </h1>
            {/* Subheading */}
            <p className="max-w-2xl mx-auto text-white/80 text-base md:text-lg font-normal">
              Type a topic, and get a handpicked AI-generated lesson from the best online courses. Perfect for quick learning without endless searching.
            </p>

            {/* Search Section */}
            <div className="space-y-6">
              <div className="relative mx-auto w-full">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-6 py-5 pr-14 text-white placeholder-white/70 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/40 transition-all duration-300 text-lg shadow-[0_10px_30px_rgba(0,0,0,.25)]"
                />
                <button
                  onClick={onSearch}
                  disabled={isSearching}
                  aria-busy={isSearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 bg-white/15 hover:bg-white/25 disabled:opacity-60 text-white border border-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="sr-only">{isSearching ? "Searching" : "Search"}</span>
                </button>
              </div>

              {/* Learn Random Button */}
              <div className="text-center">
                <button
                  onClick={onRandom}
                  disabled={loadingRandom}
                  className="rounded-xl px-8 py-3 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-all duration-300 text-lg font-medium shadow-[0_10px_30px_rgba(168,85,247,.35)]"
                >
                  {loadingRandom ? "Picking..." : "Learn Random"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="max-w-5xl mx-auto w-full">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">How it Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[{
              title: "Enter a topic",
              icon: (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l9-5-9-5-9 5 9 5z" />
                </svg>
              )
            },{
              title: "AI finds the best match",
              icon: (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 3a1 1 0 011-1h0a1 1 0 011 1v3a1 1 0 01-1 1h0a1 1 0 01-1-1V3zM4.22 10.22a1 1 0 011.42 0l2.12 2.12a1 1 0 010 1.42l-2.12 2.12a1 1 0 01-1.42-1.42L5.34 13l-1.12-1.12a1 1 0 010-1.66zM18.66 13l1.12 1.12a1 1 0 11-1.42 1.42l-2.12-2.12a1 1 0 010-1.42l2.12-2.12a1 1 0 111.42 1.42L18.66 11l1.12 1.12z" />
                </svg>
              )
            },{
              title: "Start learning instantly",
              icon: (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
              )
            }].map((item, i) => (
              <div key={i} className="rounded-xl border border-white/20 bg-white/5 p-4 text-center text-white/90 hover:bg-white/[0.08] transition-colors">
                <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/90">
                  {item.icon}
                </div>
                <div className="font-medium">{item.title}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Videos */}
        <section className="max-w-5xl mx-auto w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Suggested videos</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedVideos.map((v, idx) => (
              <button
                key={idx}
                onClick={() => handleVideoClick(v.topic, v.id)}
                className="group text-left w-full"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/20 bg-white/5">
                  <Image
                    src={v.thumbnail}
                    alt={v.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute right-3 bottom-3 px-2 py-1 rounded bg-black/60 text-white text-xs border border-white/20">
                    {v.views}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-white font-medium line-clamp-2">{v.title}</p>
                  <p className="text-white/60 text-sm mt-1">{v.channel}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Hook section */}
        <section className="max-w-5xl mx-auto w-full mt-16">
          <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-white/[0.06] to-white/[0.03] p-6 text-center">
            <p className="text-white/80 mb-4 text-base md:text-lg">
              If you’re looking for someone who can ideate, design, and launch projects like this, let’s connect.
            </p>
            <a
              href="https://shubhamnayak.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-[0_8px_24px_rgba(168,85,247,.35)]"
            >
              Contact Me
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/20 mt-12 p-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="text-sm text-white/80">
              Built by Shubham Nayak —
              {" "}
              <a href="https://shubhamnayak.com" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">shubhamnayak.com</a>
            </div>
            <div className="mt-1 text-xs text-white/60">Made as a Product Management Demo Project</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
