import { NextResponse } from "next/server";

const FALLBACK_GIFS = [
  { id: "1", title: "Wave", url: "https://giphy.com" },
  { id: "2", title: "Thumbs Up", url: "https://giphy.com" },
  { id: "3", title: "Celebrate", url: "https://giphy.com" },
  { id: "4", title: "Mind Blown", url: "https://giphy.com" },
  { id: "5", title: "Vibe Cat", url: "https://giphy.com" },
  { id: "6", title: "Yes!", url: "https://giphy.com" },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const apiKey = (process.env.KLIPY_API_KEY || "").replace(/^["']|["']$/g, "").trim();

  if (!apiKey) {
    return NextResponse.json({ gifs: FALLBACK_GIFS, source: "no_key" });
  }

  const params = new URLSearchParams({
    customer_id: "leafsty_test_user",
    per_page: "16",
    locale: "en_US",
    ...(q ? { q } : {}),
  });

  const action = q ? "search" : "trending";
  const urls = [
    `https://klipy.com{encodeURIComponent(apiKey)}/gifs/${action}?${params}`,
    `https://klipy.co{encodeURIComponent(apiKey)}/gifs/${action}?${params}`,
  ];

  for (const endpoint of urls) {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const json = await res.json();
      console.log("KLIPY RESPONSE:", endpoint, JSON.stringify(json).slice(0, 400));

      const rawList = Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.results)
        ? json.results
        : [];

      const gifs = rawList
        .map((item: any, idx: number) => {
          const f = item?.file || {};
          const url =
            f?.sm?.gif?.url ||
            f?.md?.gif?.url ||
            f?.xs?.gif?.url ||
            f?.hd?.gif?.url ||
            f?.gif?.url ||
            item?.url;
          if (!url || typeof url !== "string") return null;
          return { id: String(item.id || idx), title: item.title || item.slug || "GIF", url };
        })
        .filter(Boolean);

      if (gifs.length > 0) {
        return NextResponse.json({ gifs, source: "klipy" });
      }
    } catch (e) {
      console.warn("Klipy attempt failed:", endpoint, e);
    }
  }

  return NextResponse.json({ gifs: FALLBACK_GIFS, source: "fallback" });
}
