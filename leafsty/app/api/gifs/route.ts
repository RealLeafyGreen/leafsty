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
  const apiKey = (
    process.env.NEXT_PUBLIC_KLIPY_API_KEY ||
    process.env.KLIPY_API_KEY ||
    ""
  ).trim();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = searchParams.get("limit") || "24";
  const errors: string[] = [];

  if (!apiKey) {
    errors.push("Missing NEXT_PUBLIC_KLIPY_API_KEY on server");
  } else {
    const encodedKey = encodeURIComponent(apiKey);
    const encodedQ = encodeURIComponent(q);

    const urls = q
      ? [
          `https://klipy.com{encodedKey}/gifs/search?q=${encodedQ}&per_page=${limit}&customer_id=leafsty&locale=en`,
          `https://klipy.co{encodedKey}/gifs/search?q=${encodedQ}&per_page=${limit}&customer_id=leafsty&locale=en`,
        ]
      : [
          `https://klipy.com{encodedKey}/gifs/trending?per_page=${limit}&customer_id=leafsty&locale=en`,
          `https://klipy.co{encodedKey}/gifs/trending?per_page=${limit}&customer_id=leafsty&locale=en`,
        ];

    for (const endpoint of urls) {
      try {
        const res = await fetch(endpoint, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          },
        });

        if (!res.ok) {
          const snippet = await res.text().catch(() => "");
          errors.push(`HTTP ${res.status}: ${snippet.slice(0, 80)}`);
          continue;
        }

        const data = await res.json();
        const rawItems =
          data?.data?.data ||
          data?.data?.items ||
          data?.data ||
          data?.results ||
          (Array.isArray(data) ? data : []);

        const gifs = (Array.isArray(rawItems) ? rawItems : [])
          .map((item: any, idx: number) => {
            const previewUrl =
              item?.file?.sm?.gif?.url ||
              item?.file?.xs?.gif?.url ||
              item?.file?.sm?.webp?.url ||
              item?.file?.md?.gif?.url ||
              item?.media_formats?.tinygif?.url ||
              item?.media_formats?.gif?.url ||
              item?.url ||
              "";

            const fullUrl =
              item?.file?.md?.gif?.url ||
              item?.file?.hd?.gif?.url ||
              item?.file?.sm?.gif?.url ||
              item?.file?.md?.webp?.url ||
              item?.media_formats?.gif?.url ||
              previewUrl;

            return {
              id: String(item.id || item.slug || idx),
              title: item.title || "GIF",
              previewUrl,
              fullUrl,
            };
          })
          .filter((g: any) => Boolean(g.fullUrl));

        if (gifs.length > 0) {
          return NextResponse.json({ gifs, source: "klipy" });
        }

        errors.push(`200 empty: ${JSON.stringify(data).slice(0, 100)}`);
      } catch (err: any) {
        errors.push(err?.cause?.code || err?.message || "server fetch failed");
      }
    }
  }

  const filtered = q
    ? FALLBACK_GIFS.filter((g) =>
        g.title.toLowerCase().includes(q.toLowerCase())
      )
    : FALLBACK_GIFS;

  return NextResponse.json({
    gifs: filtered.length > 0 ? filtered : FALLBACK_GIFS,
    source: "fallback",
    klipyDebug: errors,
  });
}
