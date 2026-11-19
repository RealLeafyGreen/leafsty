"use client";

import React, { useEffect, useState } from "react";
import { Lock, RefreshCw, LogOut } from "lucide-react";

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
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStalled(true), 6000);
    return () => clearTimeout(timer);
  }, []);

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

      {stalled && (
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("leafsty_user");
              window.location.reload();
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
