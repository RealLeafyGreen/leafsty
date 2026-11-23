"use client";

import React, { useEffect, useState } from "react";
import { Download, Check, X } from "lucide-react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowManualHint(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowManualHint((v) => !v);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleInstallClick}
        title="Add Leafsty Desktop Shortcut"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-xs font-extrabold text-emerald-200 transition cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showManualHint && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-2xl bg-[#081914] border border-emerald-500/30 shadow-2xl text-xs text-emerald-100 z-50 space-y-1.5">
          <div className="flex items-center justify-between font-extrabold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Add Desktop Shortcut
            </span>
            <button
              type="button"
              onClick={() => setShowManualHint(false)}
              className="text-emerald-300/60 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-emerald-200/80 leading-relaxed">
            In Chrome or Edge, click the <strong>Install icon</strong> on the right side of the address bar, or open the browser menu (<strong>⋮</strong>) → <strong>Save and share → Install Leafsty</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
