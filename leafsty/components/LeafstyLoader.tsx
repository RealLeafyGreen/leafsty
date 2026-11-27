"use client";

import React, { useEffect, useRef, useState } from "react";
import { Lock, RefreshCw, LogOut } from "lucide-react";

interface LeafstyLoaderProps {
  label?: string;
  sublabel?: string;
  username?: string;
  error?: string | null;
  onRetry?: () => void;
  onLogout?: () => void;
}

export default function LeafstyLoader({
  label,
  sublabel = "End-to-End Encrypted Workspace",
  username,
  error,
  onRetry,
  onLogout,
}: LeafstyLoaderProps) {
  const [stalled, setStalled] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
 const [mediaSrc, setMediaSrc] = useState<string>("/loadingLeafsty.mp4");
  const [progress, setProgress] = useState(14);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setStalled(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Smooth progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        const step = prev < 55 ? 7 : prev < 80 ? 3 : 1;
        return Math.min(94, prev + step);
      });
    }, 260);
    return () => clearInterval(interval);
  }, []);

  // Edge-connected background removal so outer off-white turns transparent while inner white eyes stay intact
  useEffect(() => {
    if (useFallback) return;
    let rafId = 0;
    let cancelled = false;

        const removeOuterWhite = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number
    ) => {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      const isBgColor = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        // Catch off-white background + MP4 compression halo around the outer leaf
        return max > 195 && max - min < 48;
      };

      const push = (x: number, y: number) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const p = y * w + x;
        if (visited[p]) return;
        const idx = p * 4;
        if (!isBgColor(idx)) return;
        visited[p] = 1;
        queue[tail++] = p;
      };

      for (let x = 0; x < w; x++) {
        push(x, 0);
        push(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        push(0, y);
        push(w - 1, y);
      }

      while (head < tail) {
        const p = queue[head++];
        const idx = p * 4;
        data[idx + 3] = 0;
        const x = p % w;
        const y = (p - x) / w;
        push(x + 1, y);
        push(x - 1, y);
        push(x, y + 1);
        push(x, y - 1);
      }

      // 1-pixel outer fringe cleanup for anti-aliased light halo pixels
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const p = y * w + x;
          if (visited[p]) continue;
          const idx = p * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // Check if adjacent to cleared background
          const touchesBg =
            visited[p - 1] ||
            visited[p + 1] ||
            visited[p - w] ||
            visited[p + w];
          if (touchesBg && r > 150 && b > 140) {
            data[idx + 3] = 0;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
    
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      const isBgColor = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Outer off-white background (bright + low saturation)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max > 215 && max - min < 32;
      };

      const push = (x: number, y: number) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const p = y * w + x;
        if (visited[p]) return;
        const idx = p * 4;
        if (!isBgColor(idx)) return;
        visited[p] = 1;
        queue[tail++] = p;
      };

      // Seed flood-fill from all 4 borders so enclosed white eyes inside the leaf are untouched
      for (let x = 0; x < w; x++) {
        push(x, 0);
        push(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        push(0, y);
        push(w - 1, y);
      }

      while (head < tail) {
        const p = queue[head++];
        const idx = p * 4;
        data[idx + 3] = 0; // Transparent background
        const x = p % w;
        const y = (p - x) / w;
        push(x + 1, y);
        push(x - 1, y);
        push(x, y + 1);
        push(x, y - 1);
      }

      ctx.putImageData(imgData, 0, 0);
    };

    const drawLoop = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          // Crop centered square around the leaf so side black letterbox bars are excluded
          const vw = video.videoWidth || w;
          const vh = video.videoHeight || h;
          const side = Math.min(vw, vh);
          const sx = Math.floor((vw - side) / 2);
          const sy = Math.floor((vh - side) / 2);
          ctx.drawImage(video, sx, sy, side, side, 0, 0, w, h);
          removeOuterWhite(ctx, w, h);
        }
      }
      rafId = requestAnimationFrame(drawLoop);
    };

    rafId = requestAnimationFrame(drawLoop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [useFallback, mediaSrc]);

  const heading =
    label ||
    (username
      ? `Waking up Leafsty for ${username}...`
      : "Waking up Leafsty...");

  const handleMediaError = () => {
  setUseFallback(true);
};


  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#071410] text-emerald-50 select-none px-4">
            {!useFallback ? (
        <>
          <video
            ref={videoRef}
            src="/loadingLeafsty.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={() => videoRef.current?.play().catch(() => {})}
            onError={() => setUseFallback(true)}
            className="opacity-0 pointer-events-none fixed -top-10 -left-10 w-px h-px"
          />

          <div className="relative flex items-center justify-center w-32 h-32 mb-6 mx-auto">
            {/* Outer glowing circle rings */}
            <span className="absolute inset-0 rounded-full border-2 border-emerald-400/25 animate-ping pointer-events-none" />
            <span className="absolute inset-1 rounded-full border-2 border-emerald-400/50 shadow-[0_0_25px_rgba(52,211,153,0.25)] pointer-events-none" />
            <div className="relative w-28 h-28 rounded-full bg-[#0b211a]/90 border border-emerald-400/35 flex items-center justify-center overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                width={140}
                height={140}
                className="w-24 h-24 block mx-auto object-contain"
              />
            </div>
          </div>
        </>
      ) : (

        /* Fallback Loader */
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <span className="absolute inset-0 rounded-full border-2 border-emerald-400/25 animate-ping" />
          <span className="absolute inset-1 rounded-full border border-emerald-400/40 animate-spin [animation-duration:6s]" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-extrabold text-3xl flex items-center justify-center shadow-2xl shadow-emerald-950/90 animate-pulse">
            L
          </div>
        </div>
      )}

      <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-emerald-50 text-center">
        {heading}
      </h1>

      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400/85">
        <Lock className="w-3.5 h-3.5" />
        <span>{sublabel}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-5 w-56 sm:w-64 h-2 rounded-full bg-[#0d261e] border border-emerald-500/25 overflow-hidden shadow-inner">
        <div
          style={{ width: `${progress}%` }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 transition-all duration-300 ease-out"
        />
      </div>

      {error && (
        <div className="mt-4 max-w-sm px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 text-center">
          {error}
        </div>
      )}

      {(stalled || error) && (
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                localStorage.removeItem("leafsty_user");
                window.location.reload();
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#0d261e] hover:bg-red-500/20 border border-emerald-500/25 text-emerald-200 hover:text-red-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
