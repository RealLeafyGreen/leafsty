"use client";

import React from "react";
import { Lock } from "lucide-react";

interface LeafstyLoaderProps {
  label?: string;
  sublabel?: string;
  username?: string;
}

export default function LeafstyLoader({
  label,
  sublabel = "End-to-End Encrypted Workspace",
  username,
}: LeafstyLoaderProps) {
  const heading =
    label ||
    (username
      ? `Waking up Leafsty for ${username}...`
      : "Waking up Leafsty...");

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#071410] text-emerald-50 select-none px-4">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        <span className="absolute inset-0 rounded-3xl border-2 border-emerald-400/25 animate-ping" />
        <span className="absolute inset-1 rounded-3xl border border-emerald-400/40 animate-spin [animation-duration:6s]" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-extrabold text-3xl flex items-center justify-center shadow-2xl shadow-emerald-950/90 animate-pulse">
          L
        </div>
      </div>

      <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-emerald-50 text-center">
        {heading}
      </h1>

      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400/85">
        <Lock className="w-3.5 h-3.5" />
        <span>{sublabel}</span>
      </div>
    </div>
  );
}
