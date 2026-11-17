import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey =
    process.env.KLIPY_API_KEY || process.env.NEXT_PUBLIC_KLIPY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing KLIPY_API_KEY", gifs: [] },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = searchParams.get("limit") || "24";

  const endpoint = q
    ? `https://klipy.co{apiKey}/gifs/search?q=${encodeURIComponent(q)}&per_page=${limit}`
    : `https://klipy.co{apiKey}/gifs/trending?per_page=${limit}`;

  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    const data = await res.json();
    const items = data?.data?.data || data?.data || [];

    const gifs = items
      .map((item: any) => ({
        id: String(item.id || item.slug || Math.random()),
        title: item.title || "GIF",
        previewUrl:
          item?.file?.sm?.gif?.url ||
          item?.file?.xs?.gif?.url ||
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

    return NextResponse.json({ gifs });
  } catch (err) {
    console.error("Klipy fetch error:", err);
    return NextResponse.json({ gifs: [] }, { status: 500 });
  }
}
