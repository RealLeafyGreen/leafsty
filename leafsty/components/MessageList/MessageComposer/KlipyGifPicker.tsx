"use client";

import React, { useEffect, useState } from "react";
import { Search, X, Sparkles } from "lucide-react";

export interface KlipyGifItem {
  id: string;
  title: string;
  previewUrl: string;
  fullUrl: string;
}

interface KlipyGifPickerProps {
  onSelectGif: (gif: KlipyGifItem) => void;
  onClose: () => void;
}

function parseKlipyPayload(data: any): KlipyGifItem[] {
  const rawItems =
    data?.data?.data ||
    data?.data?.items ||
    data?.data ||
    data?.results ||
    (Array.isArray(data) ? data : []);

  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item: any, idx: number) => {
      const previewUrl =
        item?.file?.sm?.gif?.url ||
        item?.file?.xs?.gif?.url ||
        item?.file?.md?.gif?.url ||
        item?.media_formats?.tinygif?.url ||
        item?.media_formats?.gif?.url ||
        item?.images?.fixed_width_small?.url ||
        item?.url ||
        "";

      const fullUrl =
        item?.file?.md?.gif?.url ||
        item?.file?.hd?.gif?.url ||
        item?.file?.sm?.gif?.url ||
        item?.media_formats?.gif?.url ||
        item?.images?.original?.url ||
        previewUrl;

      return {
        id: String(item.id || item.slug || idx),
        title: item.title || "GIF",
        previewUrl,
        fullUrl,
      };
    })
    .filter((g: KlipyGifItem) => Boolean(g.fullUrl));
}

export default function KlipyGifPicker({
  onSelectGif,
  onClose,
}: KlipyGifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<KlipyGifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const apiKey = (process.env.NEXT_PUBLIC_KLIPY_API_KEY || "").trim();
        const trimmedQ = query.trim();

        // 1. Try direct browser fetch to Klipy using NEXT_PUBLIC_KLIPY_API_KEY
        if (apiKey) {
          const encodedKey = encodeURIComponent(apiKey);
          const endpoints = trimmedQ
            ? [
                `https://klipy.com{encodedKey}/gifs/search?q=${encodeURIComponent(trimmedQ)}&per_page=24&customer_id=leafsty`,
                `https://klipy.co{encodedKey}/gifs/search?q=${encodeURIComponent(trimmedQ)}&per_page=24&customer_id=leafsty`,
              ]
            : [
                `https://klipy.com{encodedKey}/gifs/trending?per_page=24&customer_id=leafsty`,
                `https://klipy.co{encodedKey}/gifs/trending?per_page=24&customer_id=leafsty`,
              ];

          for (const ep of endpoints) {
            try {
              const directRes = await fetch(ep);
              if (directRes.ok) {
                const json = await directRes.json();
                const parsed = parseKlipyPayload(json);
                if (parsed.length > 0) {
                  if (!cancelled) setGifs(parsed);
                  return;
                }
              }
            } catch {}
          }
        }

        // 2. Fallback to /api/gifs server route
        const url = trimmedQ
          ? `/api/gifs?q=${encodeURIComponent(trimmedQ)}`
          : `/api/gifs`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({ gifs: [] }));
        if (!cancelled) {
          if (!apiKey && data?.source === "fallback") {
            setErrorMsg(
              "NEXT_PUBLIC_KLIPY_API_KEY not found in build — redeploy Vercel after saving env var."
            );
          }
          setGifs(Array.isArray(data?.gifs) ? data.gifs : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || "Failed to load Klipy GIFs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="w-80 sm:w-96 rounded-2xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden text-emerald-50">
      <div className="p-2.5 border-b border-emerald-500/15 bg-[#061410] flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Klipy GIFs..."
            autoFocus
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Close GIF Picker"
          className="p-1.5 rounded-lg text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="px-3 py-1.5 bg-amber-500/15 border-b border-amber-500/25 text-[11px] text-amber-200">
          {errorMsg}
        </div>
      )}

      <div className="h-64 overflow-y-auto p-2">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-emerald-300/60 gap-2">
            <Sparkles className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>Loading Klipy GIFs...</span>
          </div>
        ) : gifs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-emerald-300/60 text-center px-4">
            No GIFs found. Try another search term!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelectGif(gif)}
                className="group relative aspect-video rounded-xl overflow-hidden bg-[#0d261e] border border-emerald-500/15 hover:border-emerald-400 transition cursor-pointer"
              >
                <img
                  src={gif.previewUrl || gif.fullUrl}
                  alt={gif.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-[#04120e] border-t border-emerald-500/15 text-[10px] text-emerald-400/70 flex items-center justify-between">
        <span>Powered by Klipy</span>
        <span>Click a GIF to send</span>
      </div>
    </div>
  );
}
