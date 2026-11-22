"use client";

import React, { useEffect, useState } from "react";
import { Search, X, Sparkles, Star, Flame } from "lucide-react";

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

const FAVORITES_STORAGE_KEY = "leafsty_favorite_gifs";

export default function KlipyGifPicker({
  onSelectGif,
  onClose,
}: KlipyGifPickerProps) {
  const [tab, setTab] = useState<"browse" | "favorites">("browse");
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<KlipyGifItem[]>([]);
  const [favorites, setFavorites] = useState<KlipyGifItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]"
      );
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {}
  }, []);

  const toggleFavorite = (e: React.MouseEvent, gif: KlipyGifItem) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === gif.id);
      const next = exists
        ? prev.filter((item) => item.id !== gif.id)
        : [gif, ...prev];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (tab !== "browse") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const trimmedQ = query.trim();
        const url = trimmedQ
          ? `/api/gifs?q=${encodeURIComponent(trimmedQ)}`
          : `/api/gifs`;

        const res = await fetch(url);
        const data = await res.json().catch(() => ({ gifs: [] }));
        if (!cancelled) {
          setGifs(Array.isArray(data?.gifs) ? data.gifs : []);
        }
      } catch {
        if (!cancelled) setGifs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, tab]);
  const displayedGifs =
    tab === "favorites"
      ? favorites.filter((g) =>
          !query.trim()
            ? true
            : g.title.toLowerCase().includes(query.trim().toLowerCase())
        )
      : gifs;

  return (
    <div className="w-80 sm:w-96 rounded-2xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden text-emerald-50">
      <div className="p-2.5 border-b border-emerald-500/15 bg-[#061410] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab("browse")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                tab === "browse"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-300/75 hover:bg-emerald-500/15 hover:text-emerald-50"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Trending</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("favorites")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                tab === "favorites"
                  ? "bg-amber-500/25 text-amber-200 border border-amber-400/35"
                  : "text-emerald-300/75 hover:bg-emerald-500/15 hover:text-emerald-50"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Favorites ({favorites.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close GIF Picker"
            className="p-1 rounded-lg text-emerald-300/70 hover:text-emerald-50 hover:bg-emerald-500/15 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "favorites"
                ? "Filter saved favorites..."
                : "Search GIFs..."
            }
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
      </div>

      <div className="h-64 overflow-y-auto p-2">
        {loading && tab === "browse" ? (
          <div className="h-full flex items-center justify-center text-xs text-emerald-300/60 gap-2">
            <Sparkles className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>Loading GIFs...</span>
          </div>
        ) : displayedGifs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-emerald-300/60 text-center px-4">
            <Star className="w-5 h-5 text-amber-400/60 mb-1.5" />
            <span>
              {tab === "favorites"
                ? "No favorite GIFs yet! Click the star icon on any GIF to save it here."
                : "No GIFs found. Try another search term!"}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {displayedGifs.map((gif) => {
              const isFav = favorites.some((f) => f.id === gif.id);
              return (
                <div
                  key={gif.id}
                  onClick={() => onSelectGif(gif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelectGif(gif);
                  }}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-[#0d261e] border border-emerald-500/15 hover:border-emerald-400 transition cursor-pointer"
                >
                  <img
                    src={gif.previewUrl || gif.fullUrl}
                    alt={gif.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                  />
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(e, gif)}
                    title={isFav ? "Remove from Favorites" : "Save to Favorites"}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-lg backdrop-blur-xs transition cursor-pointer ${
                      isFav
                        ? "bg-amber-500/85 text-white opacity-100"
                        : "bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 hover:text-amber-300"
                    }`}
                  >
                    <Star
                      className="w-3.5 h-3.5"
                      fill={isFav ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-[#04120e] border-t border-emerald-500/15 text-[10px] text-emerald-400/70 flex items-center justify-between">
        <span>Click ★ to favorite</span>
        <span>Click GIF to send</span>
      </div>
    </div>
  );
}
