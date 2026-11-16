"use client";

import React, { useEffect, useRef, useState } from "react";
import { Phone, Video, PhoneOff } from "lucide-react";

export interface IncomingCallAlert {
  channelId: string;
  callerId: string;
  callerName: string;
  roomLabel: string;
  withVideo: boolean;
}

export default function IncomingCallBanner({
  currentUserId,
  activeCallChannelId,
  onAccept,
}: {
  currentUserId: string;
  activeCallChannelId?: string | null;
  onAccept: (alert: IncomingCallAlert) => void;
}) {
  const [incoming, setIncoming] = useState<IncomingCallAlert | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playRingChime = () => {
    if (typeof window === "undefined") return;
    const prefs = JSON.parse(localStorage.getItem("leafsty_app_prefs") || "{}");
    if (prefs.soundEffects === false) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.18);
        gain.gain.setValueAtTime(0.001, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.48);
      });
    } catch {}
  };

  useEffect(() => {
    const bc = new BroadcastChannel("leafsty-global-calls");
    bc.onmessage = (msg) => {
      const data = msg.data;
      if (!data || data.callerId === currentUserId) return;

      if (data.type === "incoming-call") {
        if (activeCallChannelId === data.channelId) return;
        setIncoming(data);
      } else if (data.type === "call-ended") {
        setIncoming((prev) => (prev?.channelId === data.channelId ? null : prev));
      }
    };
    return () => bc.close();
  }, [currentUserId, activeCallChannelId]);
  useEffect(() => {
    if (!incoming) {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      return;
    }

    playRingChime();
    ringIntervalRef.current = setInterval(playRingChime, 2600);
    const autoDismiss = setTimeout(() => setIncoming(null), 30000);

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      clearTimeout(autoDismiss);
    };
  }, [incoming]);

  if (!incoming) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 rounded-3xl bg-[#0b1914] border border-emerald-500/40 text-white p-4 shadow-2xl shadow-emerald-950/60 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 animate-pulse">
          {incoming.callerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
            Incoming {incoming.withVideo ? "Video" : "Voice"} Call
          </div>
          <div className="text-sm font-extrabold truncate">
            {incoming.callerName}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            {incoming.roomLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIncoming(null)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 py-2 text-xs font-extrabold text-white transition cursor-pointer"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Decline</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const accepted = incoming;
            setIncoming(null);
            onAccept(accepted);
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-extrabold text-white shadow-sm transition cursor-pointer"
        >
          {incoming.withVideo ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <Phone className="w-3.5 h-3.5" />
          )}
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
}
