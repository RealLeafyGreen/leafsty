"use client";

import React, { useState } from "react";
import { Sparkles, Users, Check, X } from "lucide-react";

export default function InviteJoinModal({
  serverName,
  userId,
  onJoined,
  onDismiss,
}: {
  serverName: string;
  userId: string;
  onJoined: (channelId?: string) => void;
  onDismiss: () => void;
}) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    try {
      setJoining(true);
      setError("");
      const res = await fetch("/api/servers/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverName, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join server");
      onJoined(data.channelId);
    } catch (err: any) {
      setError(err.message || "Failed to join server");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md rounded-3xl bg-[#0b1914] border border-emerald-500/35 text-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" /> Server Invite
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center py-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-lg mb-3">
            {serverName.charAt(0).toUpperCase()}
          </div>
          <p className="text-xs text-zinc-400">You&apos;ve been invited to join</p>
          <h2 className="text-xl font-black mt-0.5">{serverName}</h2>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Users className="w-3.5 h-3.5" /> End-to-End Encrypted Leafsty Server
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold transition cursor-pointer"
          >
            No Thanks
          </button>
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{joining ? "Joining..." : "Accept Invite"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
