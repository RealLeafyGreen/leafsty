"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

export default function LeafstyUpdateNotifier() {
  const [updateReady, setUpdateReady] = useState(false);
  const initialBuildRef = useRef<string | null>(null);

  const triggerReload = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        }
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  };

  useEffect(() => {
    let active = true;

    const checkVersion = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const latestId = String(data?.buildId || "");
        if (!latestId || latestId === "dev") return;

        if (!initialBuildRef.current) {
          initialBuildRef.current = latestId;
        } else if (initialBuildRef.current !== latestId && active) {
          setUpdateReady(true);
        }
      } catch {}
    };

    checkVersion();
    const interval = setInterval(checkVersion, 25000);
    window.addEventListener("focus", checkVersion);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller &&
              active
            ) {
              setUpdateReady(true);
            }
          });
        });
      });
    }

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", checkVersion);
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div
      onClick={triggerReload}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-[#081914] border border-emerald-400/40 p-6 text-emerald-50 shadow-2xl text-center space-y-4 cursor-default"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white">
            New Leafsty Update Available!
          </h3>
          <p className="text-xs text-emerald-300/75">
            A fresh version of Leafsty was just deployed. Refresh now to load the latest features and fixes.
          </p>
        </div>

        <button
          type="button"
          onClick={triggerReload}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh & Update Leafsty</span>
        </button>

        <p className="text-[10px] text-emerald-400/60">
          Click anywhere outside this popup or press the button to refresh.
        </p>
      </div>
    </div>
  );
}
