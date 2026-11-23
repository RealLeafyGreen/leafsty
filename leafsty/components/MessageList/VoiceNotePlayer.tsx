"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";

const DEFAULT_BARS = [
  28, 45, 72, 54, 88, 64, 40, 82, 95, 60, 48, 76, 85, 52, 36, 68, 90, 74, 50,
  62, 80, 44, 58, 70, 42, 30,
];

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function VoiceNotePlayer({
  src,
  duration = 0,
  waveform,
}: {
  src: string;
  duration?: number;
  waveform?: number[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const bars =
    Array.isArray(waveform) && waveform.length > 0 ? waveform : DEFAULT_BARS;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = speed;
      await audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const next: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleScrub = (idx: number) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const ratio = idx / bars.length;
    audio.currentTime = ratio * totalDuration;
    setCurrentTime(audio.currentTime);
  };

  const progressRatio =
    totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  return (
    <div className="inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#0d261e] border border-emerald-500/30 max-w-xs sm:max-w-sm shadow-md">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        title={isPlaying ? "Pause Voice Note" : "Play Voice Note"}
        className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 transition cursor-pointer"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[3px] h-7">
          {bars.map((heightPct, idx) => {
            const barRatio = idx / bars.length;
            const active = barRatio <= progressRatio;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleScrub(idx)}
                style={{ height: `${Math.max(18, Math.min(100, heightPct))}%` }}
                className={`w-1 rounded-full transition-all cursor-pointer ${
                  active
                    ? "bg-emerald-400"
                    : "bg-emerald-500/25 hover:bg-emerald-400/50"
                }`}
              />
            );
          })}
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-emerald-300/75">
          <span className="inline-flex items-center gap-1">
            <Mic className="w-2.5 h-2.5 text-emerald-400" />
            {isPlaying
              ? formatDuration(currentTime)
              : formatDuration(totalDuration)}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            title="Playback Speed"
            className="px-1.5 py-0.2 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 font-bold cursor-pointer"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
}
