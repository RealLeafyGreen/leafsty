import { NextRequest, NextResponse } from "next/server";

const FALLBACK_GIFS = [
  {
    id: "leafsty-wave",
    title: "Hello Wave",
    previewUrl: "https://giphy.com",
    fullUrl: "https://giphy.com",
  },
  {
    id: "leafsty-cat-typing",
    title: "Cat Typing Fast",
    previewUrl: "https://giphy.com",
    fullUrl: "https://giphy.com",
  },
  {
    id: "leafsty-thumbs-up",
    title: "Thumbs Up",
    previewUrl: "https://giphy.com",
    fullUrl: "https://giphy.com",
  },
  {
    id: "leafsty-party",
    title: "Celebration",
    previewUrl: "https://giphy.com",
    fullUrl: "https://giphy.com",
  },
  {
    id: "leafsty-mind-blown",
    title: "Mind Blown",
    previewUrl: "https://giphy.com",
    fullUrl: "https://giphy.com",
  },
  {
    id: "leafsty-laugh",
    title: "Laughing",
    previewUrl: "https://giphy.com",
    fullUrl: "https://giphy.com",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = searchParams.get("limit") || "24";

  const giphyKey = (
    process.env.GIPHY_API_KEY ||
    process.env.NEXT_PUBLIC_GIPHY_API_KEY ||
    "dc6zaTOxFJmzC"
  ).trim();

  const klipyKey = (
    process.env.NEXT_PUBLIC_KLIPY_API_KEY ||
    process.env.KLIPY_API_KEY ||
    ""
  ).trim();

  // 1. Try Klipy if a custom base URL or valid host responds
  if (klipyKey) {
    const base = (process.env.KLIPY_API_BASE || "https://klipy.com").replace(/\/$/, "");
    const klipyUrl = q
      ? `${base}/api/v1/${encodeURIComponent(klipyKey)}/gifs/search?q=${encodeURIComponent(q)}&per_page=${limit}&customer_id=leafsty&locale=en`
      : `${base}/api/v1/${encodeURIComponent(klipyKey)}/gifs/trending?per_page=${limit}&customer_id=leafsty&locale=en`;

    try {
      const res = await fetch(klipyUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const rawItems =
          data?.data?.data || data?.data || data?.results || [];
        const gifs = (Array.isArray(rawItems) ? rawItems : [])
          .map((item: any, idx: number) => ({
            id: String(item.id || idx),
            title: item.title || "GIF",
            previewUrl:
              item?.file?.sm?.gif?.url ||
              item?.file?.md?.gif?.url ||
              item?.url ||
              "",
            fullUrl:
              item?.file?.md?.gif?.url ||
              item?.file?.hd?.gif?.url ||
              item?.file?.sm?.gif?.url ||
              item?.url ||
              "",
          }))
          .filter((g: any) => Boolean(g.fullUrl));

        if (gifs.length > 0) {
          return NextResponse.json({ gifs, source: "klipy" });
        }
      }
    } catch {}
  }

  // 2. Live Giphy trending & search API (works reliably from Vercel)
  try {
    const giphyUrl = q
      ? `https://giphy.com{encodeURIComponent(giphyKey)}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13`
      : `https://giphy.com{encodeURIComponent(giphyKey)}&limit=${limit}&rating=pg-13`;

    const gRes = await fetch(giphyUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (gRes.ok) {
      const gData = await gRes.json();
      const items = Array.isArray(gData?.data) ? gData.data : [];
      const gifs = items
        .map((item: any) => ({
          id: String(item.id),
          title: item.title || "GIF",
          previewUrl:
            item?.images?.fixed_width_small?.url ||
            item?.images?.fixed_width?.url ||
            "",
          fullUrl:
            item?.images?.downsized_medium?.url ||
            item?.images?.original?.url ||
            item?.images?.fixed_width?.url ||
            "",
        }))
        .filter((g: any) => Boolean(g.fullUrl));

      if (gifs.length > 0) {
        return NextResponse.json({ gifs, source: "giphy" });
      }
    }
  } catch {}

  const filtered = q
    ? FALLBACK_GIFS.filter((g) =>
        g.title.toLowerCase().includes(q.toLowerCase())
      )
    : FALLBACK_GIFS;

  return NextResponse.json({
    gifs: filtered.length > 0 ? filtered : FALLBACK_GIFS,
    source: "fallback",
  });
}
