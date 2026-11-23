"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Phone, Video, PhoneOff } from "lucide-react";

export interface IncomingCallAlert {
  channelId: string;
  channelType?: string;
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
  const { client } = useChatContext() as any;
  const [incoming, setIncoming] = useState<IncomingCallAlert | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());

  const playRingChime = () => {
    if (typeof window === "undefined") return;
    try {
      const prefs = JSON.parse(
        localStorage.getItem("leafsty_app_prefs") || "{}"
      );
      if (prefs.soundEffects === false) return;

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
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
    const triggerAlert = (payload: any) => {
      if (!payload?.channelId || !payload?.callerId) return;
      if (String(payload.callerId) === String(currentUserId)) return;
      if (
        activeCallChannelId &&
        String(payload.channelId) === String(activeCallChannelId)
      ) {
        return;
      }

      setIncoming({
        channelId: String(payload.channelId),
        channelType: String(payload.channelType || "messaging"),
        callerId: String(payload.callerId),
        callerName: String(payload.callerName || payload.callerId),
        roomLabel: String(payload.roomLabel || "Encrypted Call"),
        withVideo: Boolean(payload.withVideo),
      });
    };

    const handleStreamEvent = (event: any) => {
      if (
        event?.type !== "message.new" &&
        event?.type !== "notification.message_new"
      ) {
        return;
      }

      const msg = event?.message;
      if (!msg?.id) return;
      if (seenMsgIdsRef.current.has(String(msg.id))) return;
      seenMsgIdsRef.current.add(String(msg.id));

      const callAtt = Array.isArray(msg.attachments)
        ? msg.attachments.find((a: any) => a?.type === "leafsty_call")
        : null;

      if (!callAtt) return;

      const cidParts = String(event?.cid || msg?.cid || "").split(":");
      const channelType =
        event?.channel_type || cidParts.at(0) || "messaging";
      const channelId =
        event?.channel_id || cidParts.at(1) || "";

      triggerAlert({
        channelId,
        channelType,
        callerId: callAtt.callerId || msg?.user?.id,
        callerName:
          callAtt.callerName || msg?.user?.name || msg?.user?.id || "User",
        roomLabel: callAtt.roomLabel || "Encrypted Call",
        withVideo: Boolean(callAtt.withVideo),
      });
    };

    const sub = client?.on?.(handleStreamEvent);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("leafsty-global-calls");
      bc.onmessage = (msg) => {
        if (msg?.data?.type === "ring") triggerAlert(msg.data);
        if (msg?.data?.type === "end") setIncoming(null);
      };
    } catch {}

    return () => {
      sub?.unsubscribe?.();
      bc?.close();
    };
  }, [client, currentUserId, activeCallChannelId]);

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
    <div className="fixed bottom-5 right-5 z-[9999] w-80 rounded-3xl bg-[#0b1914] border border-emerald-500/40 text-white p-4 shadow-2xl">
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 animate-pulse">
          {incoming.callerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-emerald-50 truncate">
            {incoming.callerName}
          </div>
          <div className="text-xs text-emerald-300/80 truncate">
            Incoming {incoming.withVideo ? "Video" : "Voice"} Call •{" "}
            {incoming.roomLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const accepted = incoming;
            setIncoming(null);
            onAccept(accepted);
          }}
          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          {incoming.withVideo ? (
            <Video className="w-4 h-4" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
          <span>Answer</span>
        </button>

        <button
          type="button"
          onClick={() => setIncoming(null)}
          className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-200 text-xs font-extrabold flex items-center justify-center gap-1 transition cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Decline</span>
        </button>
      </div>
    </div>
  );
}
