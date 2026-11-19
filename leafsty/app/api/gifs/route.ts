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
    process.env.KLIPY_API_KEY ||
    process.env.NEXT_PUBLIC_KLIPY_API_KEY ||
    ""
  ).trim();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = searchParams.get("limit") || "24";

    if (apiKey) {
    const encodedKey = encodeURIComponent(apiKey);
    const encodedQ = encodeURIComponent(q);

    const candidates: Array<{ url: string; headers?: Record<string, string> }> = q
      ? [
          {
            url: `https://klipy.com{encodedKey}/gifs/search?q=${encodedQ}&per_page=${limit}&customer_id=leafsty_user_1`,
          },
          {
            url: `https://klipy.co{encodedKey}/gifs/search?q=${encodedQ}&per_page=${limit}&customer_id=leafsty_user_1`,
          },
          {
            url: `https://klipy.com{encodedQ}&per_page=${limit}&customer_id=leafsty_user_1`,
            headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
          },
        ]
      : [
          {
            url: `https://klipy.com{encodedKey}/gifs/trending?per_page=${limit}&customer_id=leafsty_user_1`,
          },
          {
            url: `https://klipy.co{encodedKey}/gifs/trending?per_page=${limit}&customer_id=leafsty_user_1`,
          },
          {
            url: `https://klipy.com{limit}&customer_id=leafsty_user_1`,
            headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
          },
        ];

    const errors: string[] = [];

    for (const candidate of candidates) {
      try {
        const res = await fetch(candidate.url, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; Leafsty/1.0)",
            ...(candidate.headers || {}),
          },
        });
        if (!res.ok) {
          const bodySnippet = await res.text().catch(() => "");
          errors.push(`${res.status}: ${bodySnippet.slice(0, 100)}`);
          continue;
        }

        const data = await res.json();
        const rawItems =
          data?.data?.data ||
          data?.data?.items ||
          data?.data ||
          data?.results ||
          (Array.isArray(data) ? data : []);

        const gifs = rawItems
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
          .filter((g: any) => Boolean(g.fullUrl));

        if (gifs.length > 0) {
          return NextResponse.json({ gifs, source: "klipy" });
        }
        errors.push(`200 OK but 0 items parsed: ${JSON.stringify(data).slice(0, 120)}`);
      } catch (err: any) {
        errors.push(err?.message || "fetch error");
      }
    }

    return NextResponse.json({
      gifs: FALLBACK_GIFS,
      source: "fallback",
      klipyDebug: errors,
    });
  }


  // Fallback if Klipy is unreachable or key isn't set so GIFs still work
  const filtered = q
    ? FALLBACK_GIFS.filter((g) =>
        g.title.toLowerCase().includes(q.toLowerCase())
      )
    : FALLBACK_GIFS;

  return NextResponse.json({
    gifs: filtered.length > 0 ? filtered : FALLBACK_GIFS,
  });
}
