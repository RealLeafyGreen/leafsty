"use client";

import React, { useEffect } from "react";

export type LeafstyPresence = "online" | "idle" | "dnd" | "offline";

export const STATUS_STORAGE_KEY = "leafsty_presence_status";

export const PRESENCE_META: Record<
  LeafstyPresence,
  {
    label: string;
    sub: string;
    glow: string;
  }
> = {
  online: {
    label: "Online",
    sub: "Active & ready to chat",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.75)]",
  },
  idle: {
    label: "Idle",
    sub: "Away from keyboard",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  },
  dnd: {
    label: "Do Not Disturb",
    sub: "Mute desktop notifications",
    glow: "shadow-[0_0_8px_rgba(244,63,94,0.75)]",
  },
  offline: {
    label: "Invisible",
    sub: "Appear offline to others",
    glow: "shadow-none",
  },
};

export function getStoredPresence(): LeafstyPresence {
  if (typeof window === "undefined") return "online";
  const raw = localStorage.getItem(STATUS_STORAGE_KEY);
  if (raw === "idle" || raw === "dnd" || raw === "offline" || raw === "online") {
    return raw;
  }
  return "online";
}

export async function setStoredPresence(
  status: LeafstyPresence,
  userId?: string
) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STATUS_STORAGE_KEY, status);
    window.dispatchEvent(
      new CustomEvent("leafsty:status-changed", { detail: status })
    );
  }
  if (userId) {
    await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    }).catch(() => {});
  }
}

/** Discord-style animated SVG status indicator dot */
export function LeafstyStatusDot({
  status = "online",
  size = "sm",
  ringColor = "#04120e",
}: {
  status?: LeafstyPresence | string;
  size?: "xs" | "sm" | "md";
  ringColor?: string;
}) {
  const s: LeafstyPresence =
    status === "idle" || status === "dnd" || status === "offline"
      ? status
      : "online";

  const px = size === "xs" ? 11 : size === "md" ? 15 : 12;

  return (
    <span
      key={s}
      style={{
        width: px,
        height: px,
        backgroundColor: ringColor,
      }}
      className={`inline-flex items-center justify-center rounded-full p-[1.5px] shrink-0 transition-all duration-300 ease-out animate-[statusPop_260ms_cubic-bezier(0.34,1.56,0.64,1)] ${PRESENCE_META[s].glow}`}
    >
      {s === "online" && (
        <span className="relative w-full h-full flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
          <span className="relative w-full h-full rounded-full bg-emerald-400 block transition-transform duration-300 scale-100" />
        </span>
      )}
      {s === "idle" && (
        <svg
          viewBox="0 0 16 16"
          className="w-full h-full transition-transform duration-300 rotate-0"
        >
          <path
            d="M11.5 11.2A5.5 5.5 0 0 1 6.3 2.5a5.5 5.5 0 1 0 7.2 7.2 5.4 5.4 0 0 1-2 1.5z"
            fill="#fbbf24"
          />
        </svg>
      )}
      {s === "dnd" && (
        <span className="w-full h-full rounded-full bg-rose-500 flex items-center justify-center transition-all duration-300">
          <span className="w-[62%] h-[22%] rounded-full bg-[#04120e] block transition-all duration-300" />
        </span>
      )}
      {s === "offline" && (
        <span className="w-full h-full rounded-full border-[2px] border-zinc-400 bg-[#04120e] block transition-all duration-300" />
      )}
    </span>
  );
}

/** Discord-style animated status switcher popover */
export function LeafstyStatusPicker({
  current,
  onSelect,
  onClose,
}: {
  current: LeafstyPresence;
  onSelect: (next: LeafstyPresence) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-60 rounded-2xl bg-[#061410]/95 backdrop-blur-md border border-emerald-500/35 shadow-2xl p-1.5 text-emerald-50 space-y-0.5 select-none transition-all duration-200 origin-bottom-left animate-[statusPop_200ms_ease-out]"
    >
      <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/75">
        Set Online Status
      </div>

      {(["online", "idle", "dnd", "offline"] as LeafstyPresence[]).map(
        (key) => {
          const meta = PRESENCE_META[key];
          const active = current === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSelect(key);
                onClose();
              }}
              className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                active
                  ? "bg-emerald-500/20 text-white"
                  : "text-emerald-100/85 hover:bg-emerald-500/15 hover:text-white hover:translate-x-0.5"
              }`}
            >
              <div className="mt-0.5">
                <LeafstyStatusDot status={key} size="sm" ringColor="#061410" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold leading-tight">
                  {meta.label}
                </div>
                <div className="text-[10px] text-emerald-300/65 leading-tight mt-0.5">
                  {meta.sub}
                </div>
              </div>
            </button>
          );
        }
      )}
    </div>
  );
}
