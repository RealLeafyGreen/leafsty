"use client";

import React, { useEffect, useState } from "react";
import { Moon, Clock, Sparkles } from "lucide-react";

export interface SleepCurfewConfig {
  enabled: boolean;
  startHour: number; // default 22 (10:00 PM)
  endHour: number;   // default 4  (4:00 AM)
}

export const SLEEP_CURFEW_KEY = "leafsty_sleep_curfew";

export function getSleepCurfewConfig(): SleepCurfewConfig {
  if (typeof window === "undefined") {
    return { enabled: true, startHour: 22, endHour: 4 };
  }
  try {
    const raw = JSON.parse(localStorage.getItem(SLEEP_CURFEW_KEY) || "null");
    if (raw && typeof raw.enabled === "boolean") {
      return {
        enabled: raw.enabled,
        startHour: Number.isFinite(raw.startHour) ? Number(raw.startHour) : 22,
        endHour: Number.isFinite(raw.endHour) ? Number(raw.endHour) : 4,
      };
    }
  } catch {}
  return { enabled: true, startHour: 22, endHour: 4 };
}

export function getLocalUtcLabel(): string {
  const now = new Date();
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const hrs = Math.floor(absMin / 60);
  const mins = absMin % 60;
  const utcOffset =
    mins === 0
      ? `UTC${sign}${hrs}`
      : `UTC${sign}${hrs}:${mins < 10 ? "0" : ""}${mins}`;
  const tzName =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time";
  return `${tzName} (${utcOffset})`;
}

function isWithinCurfew(now: Date, startHour: number, endHour: number): boolean {
  const h = now.getHours();
  if (startHour === endHour) return false;
  if (startHour > endHour) {
    // Overnight window (e.g. 22:00 -> 04:00)
    return h >= startHour || h < endHour;
  }
  return h >= startHour && h < endHour;
}

function formatHourLabel(hour24: number): string {
  const h = ((hour24 % 24) + 24) % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${suffix}`;
}

export default function SleepCurfewOverlay() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [config, setConfig] = useState<SleepCurfewConfig>(() =>
    getSleepCurfewConfig()
  );
  const [snoozeUntil, setSnoozeUntil] = useState<number>(0);

  useEffect(() => {
    const syncConfig = () => setConfig(getSleepCurfewConfig());
    syncConfig();

    const interval = setInterval(() => {
      setNow(new Date());
      syncConfig();
    }, 5000);

    window.addEventListener("storage", syncConfig);
    window.addEventListener("leafsty:curfew-updated", syncConfig);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", syncConfig);
      window.removeEventListener("leafsty:curfew-updated", syncConfig);
    };
  }, []);

  if (!config.enabled) return null;
  if (Date.now() < snoozeUntil) return null;
  if (!isWithinCurfew(now, config.startHour, config.endHour)) return null;

  // Calculate remaining time until endHour
  const unlockTarget = new Date(now);
  unlockTarget.setHours(config.endHour, 0, 0, 0);
  if (unlockTarget.getTime() <= now.getTime()) {
    unlockTarget.setDate(unlockTarget.getDate() + 1);
  }
  const diffMs = Math.max(0, unlockTarget.getTime() - now.getTime());
  const remHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const remMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const currentTimeFormatted = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-[#040e0b]/95 backdrop-blur-xl flex items-center justify-center p-6 text-emerald-50 select-none">
      <div className="w-full max-w-md rounded-3xl bg-[#081914] border border-emerald-500/25 p-8 text-center shadow-2xl space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
          <Moon className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Leafsty Sleep Curfew Active</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white pt-1">
            Time to rest up
          </h2>
          <p className="text-xs text-emerald-200/75 leading-relaxed">
            Leafsty pauses between{" "}
            <strong className="text-emerald-200">
              {formatHourLabel(config.startHour)}
            </strong>{" "}
            and{" "}
            <strong className="text-emerald-200">
              {formatHourLabel(config.endHour)}
            </strong>{" "}
            so you can get proper sleep.
          </p>
        </div>

        <div className="rounded-2xl bg-[#0d261e] border border-emerald-500/20 p-4 space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Local Time: {currentTimeFormatted}</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400/75">
            {getLocalUtcLabel()}
          </div>
          <div className="pt-2 text-sm font-extrabold text-white">
            Unlocks in {remHrs}h {remMins}m ({formatHourLabel(config.endHour)})
          </div>
        </div>

        <div className="pt-1 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setSnoozeUntil(Date.now() + 10 * 60 * 1000)}
            className="px-4 py-2 rounded-xl bg-[#0d261e] hover:bg-emerald-500/20 border border-emerald-500/25 text-xs font-bold text-emerald-200 transition cursor-pointer"
          >
            Snooze 10 mins
          </button>
          <button
            type="button"
            onClick={() => {
              const next = { ...config, enabled: false };
              localStorage.setItem(SLEEP_CURFEW_KEY, JSON.stringify(next));
              setConfig(next);
              window.dispatchEvent(new Event("leafsty:curfew-updated"));
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-400/30 text-xs font-bold text-emerald-200 transition cursor-pointer"
          >
            Disable Curfew
          </button>
        </div>
      </div>
    </div>
  );
}
