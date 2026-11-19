"use client";

import React from "react";
import { Lock } from "lucide-react";

export default function LeafstyLoader({
  label = "Connecting to Leafsty E2EE...",
}: {
  label?: string;
}) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#071410] text-emerald-50 select-none">
      <div className="relative flex items-center justify-center mb-5">
        <span className="absolute w-20 h-20 rounded-3xl border-2 border-emerald-400/30 animate-ping" />
        <div className="relative w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xl shadow-emerald-950/80 animate-pulse">
          L
        </div>
      </div>

      <div className="text-sm font-extrabold tracking-wide text-emerald-50">
        {label}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400/80">
        <Lock className="w-3.5 h-3.5" />
        <span>End-to-End Encrypted</span>
      </div>
    </div>
  );
}
