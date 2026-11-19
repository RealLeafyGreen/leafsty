import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = (
    process.env.NEXT_PUBLIC_KLIPY_API_KEY ||
    process.env.KLIPY_API_KEY ||
    ""
  ).trim();

  const baseUrl = (
    process.env.KLIPY_API_BASE ||
    process.env.NEXT_PUBLIC_KLIPY_API_BASE ||
    "https://klipy.com"
  )
    .trim()
    .replace(/\/$/, "");

  if (!apiKey) {
    return NextResponse.json(
      {
        gifs: [],
        source: "klipy",
        error: "Missing NEXT_PUBLIC_KLIPY_API_KEY in Vercel Environment Variables",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = searchParams.get("limit") || "24";

  const encodedKey = encodeURIComponent(apiKey);
  const encodedQ = encodeURIComponent(q);

  const candidates: Array<{ url: string; headers?: Record<string, string> }> = q
    ? [
        {
          url: `${baseUrl}/api/v1/${encodedKey}/gifs/search?q=${encodedQ}&per_page=${limit}&customer_id=leafsty&locale=en`,
        },
        {
          url: `${baseUrl}/v1/${encodedKey}/gifs/search?q=${encodedQ}&per_page=${limit}&customer_id=leafsty&locale=en`,
        },
        {
          url: `${baseUrl}/api/v1/gifs/search?q=${encodedQ}&per_page=${limit}&customer_id=leafsty&locale=en`,
          headers: {
            "x-api-key": apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ]
    : [
        {
          url: `${baseUrl}/api/v1/${encodedKey}/gifs/trending?per_page=${limit}&customer_id=leafsty&locale=en`,
        },
        {
          url: `${baseUrl}/v1/${encodedKey}/gifs/trending?per_page=${limit}&customer_id=leafsty&locale=en`,
        },
        {
          url: `${baseUrl}/api/v1/gifs/trending?per_page=${limit}&customer_id=leafsty&locale=en`,
          headers: {
            "x-api-key": apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ];

  const debug: string[] = [];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate.url, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
        headers: {
          Accept: "application/json",
          "User-Agent": "LeafstyChat/1.0",
          ...(candidate.headers || {}),
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        debug.push(`${candidate.url.split("?")[0]} -> HTTP ${res.status} ${text.slice(0, 80)}`);
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

      debug.push(`200 OK but 0 GIFs parsed: ${JSON.stringify(data).slice(0, 120)}`);
    } catch (err: any) {
      debug.push(`${baseUrl} -> ${err?.cause?.code || err?.message || "fetch error"}`);
    }
  }

  return NextResponse.json(
    {
      gifs: [],
      source: "klipy",
      error: `Could not reach Klipy at ${baseUrl}. Set KLIPY_API_BASE in Vercel to your Klipy docs base URL.`,
      klipyDebug: debug,
    },
    { status: 502 }
  );
}
