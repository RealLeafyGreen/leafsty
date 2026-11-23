import { NextResponse } from "next/server";

export async function GET() {
  const fontSources = [
    "https://github.com",
    "https://jsdelivr.net",
    "https://unpkg.com",
  ];

  for (const url of fontSources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const isWoff2 = url.endsWith(".woff2");
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": isWoff2 ? "font/woff2" : "font/ttf",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {}
  }

  return new NextResponse("Font unavailable", { status: 502 });
}
