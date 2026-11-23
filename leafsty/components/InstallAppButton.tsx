"use client";

import React, { useEffect, useState } from "react";
import { Download, Sparkles, X, Monitor } from "lucide-react";

const DISMISS_KEY = "leafsty_install_popup_dismissed";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const wasDismissed = sessionStorage.getItem(DISMISS_KEY) === "1";

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!wasDismissed) {
        setShowPopup(true);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPopup(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    // Also show a friendly popup after 2.5s if not dismissed yet
    const timer = window.setTimeout(() => {
      if (!wasDismissed && !window.matchMedia("(display-mode: standalone)").matches) {
        setShowPopup(true);
      }
    }, 2500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const dismissPopup = () => {
    setShowPopup(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        setIsInstalled(true);
        setShowPopup(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowPopup(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Add Leafsty Desktop Shortcut"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-xs font-extrabold text-emerald-200 transition cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showPopup && (
        <div className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl bg-[#081914] border border-emerald-400/35 shadow-2xl p-4 text-emerald-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
              <Monitor className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Add Leafsty Desktop Shortcut
                </span>
                <button
                  type="button"
                  onClick={dismissPopup}
                  title="Close"
                  className="p-0.5 rounded-lg text-emerald-300/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="mt-1 text-[11px] text-emerald-200/80 leading-relaxed">
                {deferredPrompt
                  ? "Launch Leafsty straight from your desktop in its own dedicated window."
                  : "Click the Install icon in your browser's address bar (or menu ⋮ → Save and share → Install Leafsty) to pin a desktop shortcut."}
              </p>

              <div className="mt-3 flex items-center gap-2">
                {deferredPrompt && (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Now</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismissPopup}
                  className="px-3 py-1.5 rounded-xl bg-[#0d261e] hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-200/80 text-xs font-bold transition cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
