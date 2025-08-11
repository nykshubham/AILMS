"use client";
import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/80 to-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Bubble loader */}
      <div className="relative z-10 flex items-center justify-center h-screen">
        <div className="relative">
          {/* Soft fade so unmount feels like a burst fade-out */}
          <div className="relative w-44 h-44 animate-bubble-float">
            {/* Bubble body */}
            <div className="bubble absolute inset-0 rounded-full" />

            {/* Specular highlight */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="highlight absolute -inset-10" />
            </div>

            {/* Iridescent shimmer */}
            <div className="iridescence absolute inset-0 rounded-full pointer-events-none" />

            {/* Soft grain */}
            <div className="grain absolute inset-0 rounded-full pointer-events-none" />

            {/* Subtle rim */}
            <div className="absolute inset-0 rounded-full ring-1 ring-white/15" />

            {/* Wobble scaling */}
            <div className="absolute inset-0 rounded-full animate-bubble-wobble" />

            {/* Particles bursting outward (looped and staggered) */}
            <div className="pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className={`particle`}
                  style={{ ["--i" as unknown as string]: i } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm tracking-wide">Preparing your lesson...</p>
          </div>
        </div>
      </div>

      {/* Local CSS for bubble/particles */}
      <style jsx>{`
        .bubble {
          background: radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 18%, rgba(255,255,255,0.06) 32%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.01) 80%, rgba(255,255,255,0.0) 100%),
                      radial-gradient(120% 120% at 70% 70%, rgba(147,51,234,0.55) 0%, rgba(59,130,246,0.45) 35%, rgba(16,185,129,0.25) 65%, rgba(59,130,246,0) 100%);
          filter: saturate(1.2) blur(0.2px);
          animation: bubble-breathe 2.4s ease-in-out infinite;
          box-shadow: inset 0 0 40px rgba(255,255,255,0.08), 0 10px 40px rgba(147,51,234,0.25), 0 0 120px rgba(59,130,246,0.15);
        }

        .highlight {
          background: conic-gradient(from 0deg, rgba(255,255,255,0.0) 0deg, rgba(255,255,255,0.25) 90deg, rgba(255,255,255,0.0) 180deg, rgba(255,255,255,0.25) 270deg, rgba(255,255,255,0.0) 360deg);
          animation: rotate 7.5s linear infinite;
          mix-blend-mode: screen;
          opacity: 0.5;
        }

        .iridescence {
          background: conic-gradient(from 180deg at 50% 50%, rgba(168,85,247,0.18), rgba(59,130,246,0.12), rgba(16,185,129,0.10), rgba(168,85,247,0.18));
          mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.65), rgba(0,0,0,0) 70%);
          mix-blend-mode: screen;
          filter: blur(1px) saturate(1.1);
          opacity: 0.7;
          animation: rotate 12s linear infinite;
        }

        .grain {
          background: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 3px 3px;
          mix-blend-mode: soft-light;
          opacity: 0.5;
          border-radius: 9999px;
          filter: saturate(1.1);
          animation: grainFade 4s ease-in-out infinite;
        }

        .animate-bubble-wobble {
          animation: wobble 3.5s ease-in-out infinite;
          background: transparent;
        }

        .particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, #fff, rgba(255,255,255,0.2));
          transform: translate(-50%, -50%);
          opacity: 0;
          animation: burst 1.2s ease-out calc((var(--i) * 0.12s)) infinite;
          box-shadow: 0 0 12px rgba(255,255,255,0.4);
        }

        .particle::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0));
          filter: blur(6px);
          opacity: 0;
          animation: trail 1.2s ease-out calc((var(--i) * 0.12s)) infinite;
          pointer-events: none;
        }

        @keyframes bubble-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        @keyframes wobble {
          0%, 100% { transform: translate3d(0,0,0); filter: drop-shadow(0 10px 30px rgba(147,51,234,0.35)); }
          25% { transform: translate3d(1px, -2px, 0); }
          50% { transform: translate3d(-1px, 1px, 0); }
          75% { transform: translate3d(2px, 0px, 0); }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes grainFade {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.6; }
        }

        /* Radiating particles in a subtle loop */
        @keyframes burst {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          15% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate(
              calc(-50% + (cos(calc(var(--i) * 45deg)) * 80px)),
              calc(-50% + (sin(calc(var(--i) * 45deg)) * 80px))
            ) scale(0.9);
          }
        }

        @keyframes trail {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          20% { opacity: 0.6; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
        }

        .animate-bubble-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
