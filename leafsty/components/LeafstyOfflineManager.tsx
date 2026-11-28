"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

const OUTBOX_KEY = "leafsty_offline_outbox_v1";

export interface QueuedMessage {
  id: string;
  channelType: string;
  channelId: string;
  userId: string;
  text: string;
  attachments?: any[];
  parent_id?: string;
  createdAt: string;
}

export function enqueueOfflineMessage(msg: Omit<QueuedMessage, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  try {
    const existing: QueuedMessage[] = JSON.parse(
      localStorage.getItem(OUTBOX_KEY) || "[]"
    );
    existing.push({
      ...msg,
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event("leafsty:outbox-updated"));
  } catch {}
}

export default function LeafstyOfflineManager() {
  const [isOffline, setIsOffline] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [flushing, setFlushing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const readQueueCount = () => {
    try {
      const list = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
      setQueuedCount(Array.isArray(list) ? list.length : 0);
    } catch {
      setQueuedCount(0);
    }
  };

  const flushOutbox = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    let queue: QueuedMessage[] = [];
    try {
      queue = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
    } catch {
      queue = [];
    }
    if (!Array.isArray(queue) || queue.length === 0) return;

    setFlushing(true);
    const remaining: QueuedMessage[] = [];

    for (const item of queue) {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelType: item.channelType,
            channelId: item.channelId,
            userId: item.userId,
            text: item.text,
            attachments: item.attachments || [],
            parent_id: item.parent_id,
          }),
        });
        if (!res.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
    setQueuedCount(remaining.length);
    setFlushing(false);

    if (remaining.length < queue.length) {
      setJustSynced(true);
      window.dispatchEvent(new Event("leafsty:channels-updated"));
      setTimeout(() => setJustSynced(false), 3000);
    }
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    setIsOffline(!navigator.onLine);
    readQueueCount();

    const onOffline = () => setIsOffline(true);
    const onOnline = () => {
      setIsOffline(false);
      flushOutbox();
    };
    const onOutbox = () => readQueueCount();

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    window.addEventListener("leafsty:outbox-updated", onOutbox);

    if (navigator.onLine) {
      flushOutbox();
    }

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("leafsty:outbox-updated", onOutbox);
    };
  }, []);

  if (!isOffline && queuedCount === 0 && !justSynced) return null;

  return (
    <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[9998] pointer-events-none">
      {justSynced && !isOffline ? (
        <div className="px-3.5 py-1.5 rounded-full bg-emerald-600/95 border border-emerald-300/40 text-white text-xs font-extrabold shadow-xl flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Back online · Queued messages sent!</span>
        </div>
      ) : (
              <div className="px-3.5 py-1.5 rounded-full bg-[#061410]/95 border border-amber-400/45 text-amber-200 text-xs font-extrabold shadow-xl flex items-center gap-2">
          {flushing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>
            {isOffline
              ? queuedCount > 0
                ? `Offline Mode · ${queuedCount} message${queuedCount > 1 ? "s" : ""} queued`
                : "Offline Mode · Viewing cached Leafsty"
              : `Syncing ${queuedCount} queued message${queuedCount > 1 ? "s" : ""}...`}
          </span>

                  <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("leafsty:open-lan-mesh"))}
            className="pointer-events-auto ml-1 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold transition cursor-pointer"
          >
            LAN P2P
          </button>
        </div>
      )}
    </div>
  );
}
