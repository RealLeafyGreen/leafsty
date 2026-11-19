import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey =
    process.env.KLIPY_API_KEY || process.env.NEXT_PUBLIC_KLIPY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing KLIPY_API_KEY in Vercel Environment Variables",
        gifs: [],
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = searchParams.get("limit") || "24";

  const urls = q
    ? [
        `https://klipy.com{apiKey}/gifs/search?q=${encodeURIComponent(q)}&per_page=${limit}&customer_id=leafsty`,
        `https://klipy.co{apiKey}/gifs/search?q=${encodeURIComponent(q)}&per_page=${limit}&customer_id=leafsty`,
      ]
    : [
        `https://klipy.com{apiKey}/gifs/trending?per_page=${limit}&customer_id=leafsty`,
        `https://klipy.co{apiKey}/gifs/trending?per_page=${limit}&customer_id=leafsty`,
      ];

  let lastError = "Could not reach Klipy API";

  for (const endpoint of urls) {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) {
        lastError = `Klipy HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const rawItems =
        data?.data?.data ||
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

      return NextResponse.json({ gifs });
    } catch (err: any) {
      lastError = err?.message || "Klipy fetch error";
    }
  }

  return NextResponse.json({ error: lastError, gifs: [] }, { status: 502 });
}
