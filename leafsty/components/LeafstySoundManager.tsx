"use client";

import React, { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Volume2, Bell, X, Check } from "lucide-react";
import { getStoredPresence } from "./LeafstyStatusBadge";

export type TextToneId =
  | "leafsty_smart"
  | "tab_only"
  | "offtab_only"
  | "discord_ping"
  | "mute";

const SOUND_PREFS_KEY = "leafsty_sound_prefs_v3";

interface SoundPrefs {
  textTone: TextToneId;
  volume: number;
}

const DEFAULT_PREFS: SoundPrefs = {
  textTone: "leafsty_smart",
  volume: 0.8,
};

export function loadSoundPrefs(): SoundPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    return {
      ...DEFAULT_PREFS,
      ...JSON.parse(localStorage.getItem(SOUND_PREFS_KEY) || "{}"),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function playAudioFile(src: string, volume: number) {
  try {
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
  } catch {}
}

export function playTextTone(
  tone: TextToneId,
  volume = 0.8,
  forcePreview = false
) {
  if (typeof window === "undefined" || tone === "mute") return;
  if (!forcePreview && getStoredPresence() === "dnd") return;

  if (tone === "leafsty_smart") {
    const isOffTab = document.hidden || document.visibilityState !== "visible";
    playAudioFile(
      isOffTab ? "/sounds/offTabTone.wav" : "/sounds/tabTone.mp3",
      volume
    );
    return;
  }

  if (tone === "tab_only") {
    playAudioFile("/sounds/tabTone.mp3", volume);
    return;
  }

  if (tone === "offtab_only") {
    playAudioFile("/sounds/offTabTone.wav", volume);
    return;
  }

  if (tone === "discord_ping") {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(Math.max(0.01, volume * 0.25), now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };
    beep(784, 0, 0.09);
    beep(1046.5, 0.08, 0.18);
    setTimeout(() => ctx.close().catch(() => {}), 500);
  }
}

export default function LeafstySoundManager() {
  const { client } = useChatContext() as any;
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<SoundPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(loadSoundPrefs());
    const onOpen = () => setOpen(true);
    window.addEventListener("leafsty:open-sounds", onOpen);
    return () => window.removeEventListener("leafsty:open-sounds", onOpen);
  }, []);

  useEffect(() => {
    if (!client) return;
    const myId = String(client.userID || client.user?.id || "");
    const seenMsgIds = new Set<string>();

    const onNewMsg = (ev: any) => {
      const msgId = String(ev?.message?.id || "");
      if (msgId) {
        if (seenMsgIds.has(msgId)) return;
        seenMsgIds.add(msgId);
        if (seenMsgIds.size > 100) {
          const first = seenMsgIds.values().next().value;
          if (first) seenMsgIds.delete(first);
        }
      }

      const senderId = String(ev?.message?.user?.id || ev?.user?.id || "");
      if (!senderId || senderId === myId) return;

      const latest = loadSoundPrefs();
      playTextTone(latest.textTone, latest.volume, false);
    };

    client.on?.("message.new", onNewMsg);
    client.on?.("notification.message_new", onNewMsg);

    return () => {
      client.off?.("message.new", onNewMsg);
      client.off?.("notification.message_new", onNewMsg);
    };
  }, [client]);

  const updatePrefs = (patch: Partial<SoundPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(SOUND_PREFS_KEY, JSON.stringify(next));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#081914] border border-emerald-500/30 p-5 text-emerald-50 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold">Leafsty Text Tones</h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-emerald-300/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300/80 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span>Message Notification Tone</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: "leafsty_smart", label: "Smart (Tab / Off-Tab)" },
                { id: "tab_only", label: "Tab Tone" },
                { id: "offtab_only", label: "Off-Tab Tone" },
                { id: "discord_ping", label: "Discord Ping" },
                { id: "mute", label: "Muted" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  updatePrefs({ textTone: t.id });
                  playTextTone(t.id, prefs.volume, true);
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  prefs.textTone === t.id
                    ? "bg-emerald-500/25 border-emerald-400 text-white"
                    : "bg-[#0d261e] border-emerald-500/20 text-emerald-200 hover:bg-emerald-500/15"
                }`}
              >
                <span className="truncate">{t.label}</span>
                {prefs.textTone === t.id && (
                  <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-emerald-300/80">
            <span>Notification Volume</span>
            <span>{Math.round(prefs.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={prefs.volume}
            onChange={(e) => updatePrefs({ volume: Number(e.target.value) })}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <p className="text-[10px] text-emerald-400/70">
            Smart mode plays <strong>tabTone.mp3</strong> on-tab and{" "}
            <strong>offTabTone.wav</strong> off-tab. Muted on Do Not Disturb.
          </p>
        </div>
      </div>
    </div>
  );
}
