"use client";

import React, { useEffect, useState } from "react";
import { Clock, LogOut } from "lucide-react";

export interface BanDetails {
  reason: string;
  expiresAt?: string | null;
  bannedBy?: string;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Expired — Refresh to check access";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m remaining`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s remaining`;
  return `${mins}m ${secs}s remaining`;
}

export default function BannedOverlay({
  ban,
  onLogout,
}: {
  ban: BanDetails;
  onLogout?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ban.expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ban.expiresAt]);

  const expiryMs = ban.expiresAt ? new Date(ban.expiresAt).getTime() : null;
  const remainingMs =
    expiryMs && !Number.isNaN(expiryMs) ? expiryMs - now : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#040e0b] flex items-center justify-center p-6 text-emerald-50 select-none">
      <div className="w-full max-w-lg rounded-3xl bg-[#081914] border border-red-500/40 p-8 shadow-2xl text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-white p-2.5 flex items-center justify-center mx-auto shadow-xl ring-4 ring-red-500/30">
          <img
            src="/bannedLeafsty.png"
            alt="Banned from Leafsty"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/15 border border-red-400/30 text-[11px] font-extrabold uppercase tracking-widest text-red-300">
            Account Suspended
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            You are banned from Leafsty
          </h1>
          <p className="text-sm text-emerald-200/75">
            Your access to Leafsty workspaces and direct messages has been restricted.
          </p>
        </div>

        <div className="rounded-2xl bg-[#05110d] border border-red-500/25 p-5 text-left space-y-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-red-300/80 mb-1">
              Reason
            </div>
            <p className="text-base font-bold text-white leading-snug">
              &ldquo;{ban.reason || "Violation of Leafsty community rules"}&rdquo;
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between gap-2 text-xs">
            <span className="text-emerald-300/70 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Duration</span>
            </span>
            {expiryMs && remainingMs !== null ? (
              <div className="text-right">
                <div className="font-extrabold text-amber-300">
                  {formatRemaining(remainingMs)}
                </div>
                <div className="text-[11px] text-emerald-300/60">
                  Unbans on{" "}
                  {new Date(expiryMs).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ) : (
              <span className="font-extrabold text-red-300">Permanent Ban</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          {remainingMs !== null && remainingMs <= 0 && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition cursor-pointer"
            >
              Check Unban Status
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/35 border border-red-400/35 text-red-200 text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
