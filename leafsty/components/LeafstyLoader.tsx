"use client";

import React, { useEffect, useRef, useState } from "react";

export default function LeafstyLoader({
  src = "/loadingLeafsty.mp4",
  label = "Connecting to Leafsty...",
  loop = true,
}: {
  src?: string;
  label?: string;
  loop?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animEnabled, setAnimEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefs = JSON.parse(localStorage.getItem("leafsty_app_prefs") || "{}");
      if (prefs.loadingAnimation === false) {
        setAnimEnabled(false);
        return;
      }
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    video.play().catch(() => {});

    let W = 0;
    let H = 0;
    let visited: Uint8Array;
    let queue: Int32Array;
    let animId: number;
    let lastVideoTime = -1;

    const renderCleanLeaf = () => {
      animId = requestAnimationFrame(renderCleanLeaf);

      if (video.readyState < 2 || video.videoWidth === 0) return;
      // Skip processing if the video hasn't decoded a new frame yet
      if (video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;

      if (W === 0) {
        W = 150;
        H = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * W));
        canvas.width = W;
        canvas.height = H;
        visited = new Uint8Array(W * H);
        queue = new Int32Array(W * H);
      }

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(video, 0, 0, W, H);

      const frame = ctx.getImageData(0, 0, W, H);
      const data = frame.data;

      visited.fill(0);
      let head = 0;
      let tail = 0;

      const enqueueIfBg = (x: number, y: number) => {
        const pos = y * W + x;
        if (visited[pos]) return;
        const idx = pos * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const greenness = g - Math.max(r, b);
        if ((r > 170 && g > 170 && b > 170 && greenness < 26) || (r < 55 && g < 55 && b < 55 && greenness < 18)) {
          visited[pos] = 1;
          queue[tail++] = pos;
        }
      };

      for (let x = 0; x < W; x++) {
        for (const edgeY of [0, 1, H - 2, H - 1]) {
          const p = edgeY * W + x;
          visited[p] = 1;
          data[p * 4 + 3] = 0;
        }
        enqueueIfBg(x, 2);
        enqueueIfBg(x, H - 3);
      }
      for (let y = 2; y < H - 2; y++) {
        enqueueIfBg(0, y);
        enqueueIfBg(2, y);
        enqueueIfBg(W - 1, y);
        enqueueIfBg(W - 3, y);
      }

      while (head < tail) {
        const pos = queue[head++];
        data[pos * 4 + 3] = 0;

        const x = pos % W;
        const y = (pos - x) / W;
        if (x > 0) enqueueIfBg(x - 1, y);
        if (x < W - 1) enqueueIfBg(x + 1, y);
        if (y > 2) enqueueIfBg(x, y - 1);
        if (y < H - 3) enqueueIfBg(x, y + 1);
      }

      // Fast 1px edge feathering
      for (let y = 3; y < H - 3; y++) {
        for (let x = 2; x < W - 2; x++) {
          const pos = y * W + x;
          if (visited[pos]) continue;

          if (
            visited[pos - 1] ||
            visited[pos + 1] ||
            visited[pos - W] ||
            visited[pos + W]
          ) {
            const idx = pos * 4;
            const greenness = data[idx + 1] - Math.max(data[idx], data[idx + 2]);
            if (greenness < 30) {
              data[idx + 3] = 0;
            } else {
              const alphaRatio = Math.min(1, (greenness - 30) / 40);
              data[idx + 3] = Math.round(alphaRatio * 255);
            }
          }
        }
      }

      ctx.putImageData(frame, 0, 0);
    };

    animId = requestAnimationFrame(renderCleanLeaf);
    return () => cancelAnimationFrame(animId);
  }, [src]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f3f8f5] text-zinc-900 select-none">
      {animEnabled ? (
        <>
          <video
            ref={videoRef}
            src={src}
            autoPlay
            loop={loop}
            muted
            playsInline
            preload="auto"
            className="pointer-events-none opacity-0 absolute w-px h-px"
          />

          <div className="relative w-48 h-48 flex items-center justify-center mb-5">
            <div className="absolute inset-4 rounded-full bg-emerald-500/15 blur-xl animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/35 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-3 rounded-full border border-emerald-500/20 bg-emerald-500/5" />

            <canvas
              ref={canvasRef}
              className="relative z-10 w-40 h-40 object-contain drop-shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
            />
          </div>
        </>
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25 mb-5">
          L
        </div>
      )}

      <h2 className="text-base font-extrabold tracking-tight text-zinc-900">
        {label}
      </h2>
      <p className="text-xs text-emerald-700 font-medium mt-1">
        Establishing 256-Bit AES-GCM Session
      </p>
    </div>
  );
}
