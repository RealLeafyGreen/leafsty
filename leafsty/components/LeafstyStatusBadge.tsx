"use client";

import React, { useEffect, useState } from "react";

export type LeafstyPresence = "online" | "idle" | "dnd" | "offline";

export const STATUS_STORAGE_KEY = "leafsty_presence_status";

export const PRESENCE_META: Record<
  LeafstyPresence,
  {
    label: string;
    sub: string;
  }
> = {
  online: {
    label: "Online",
    sub: "Active & ready to chat",
  },
  idle: {
    label: "Idle",
    sub: "Away from keyboard",
  },
  dnd: {
    label: "Do Not Disturb",
    sub: "Mute desktop notifications",
  },
  offline: {
    label: "Invisible",
    sub: "Appear offline to others",
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

export function setStoredPresence(status: LeafstyPresence) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATUS_STORAGE_KEY, status);
  window.dispatchEvent(
    new CustomEvent("leafsty:status-changed", { detail: status })
  );
}

/** Discord-style SVG status indicator dot */
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

  const px = size === "xs" ? 10 : size === "md" ? 14 : 11;

  return (
    <span
      style={{
        width: px,
        height: px,
        backgroundColor: ringColor,
      }}
      className="inline-flex items-center justify-center rounded-full p-[1.5px] shrink-0"
    >
      {s === "online" && (
        <span className="w-full h-full rounded-full bg-emerald-400 block" />
      )}
      {s === "idle" && (
        <svg viewBox="0 0 16 16" className="w-full h-full">
          <path
            d="M11.5 11.2A5.5 5.5 0 0 1 6.3 2.5a5.5 5.5 0 1 0 7.2 7.2 5.4 5.4 0 0 1-2 1.5z"
            fill="#fbbf24"
          />
        </svg>
      )}
      {s === "dnd" && (
        <span className="w-full h-full rounded-full bg-rose-500 flex items-center justify-center">
          <span className="w-[62%] h-[22%] rounded-full bg-[#04120e] block" />
        </span>
      )}
      {s === "offline" && (
        <span className="w-full h-full rounded-full border-[2px] border-zinc-400 bg-[#04120e] block" />
      )}
    </span>
  );
}

/** Discord-style interactive status switcher popover */
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
      className="w-60 rounded-2xl bg-[#061410] border border-emerald-500/30 shadow-2xl p-1.5 text-emerald-50 space-y-0.5 select-none"
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
              className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                active
                  ? "bg-emerald-500/20 text-white"
                  : "text-emerald-100/85 hover:bg-emerald-500/15 hover:text-white"
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
