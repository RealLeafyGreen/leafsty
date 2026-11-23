import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const cleanCode = (code || "")
    .replace(/\.svg$/i, "")
    .toLowerCase()
    .replace(/[^0-9a-f-]/g, "");

  if (!cleanCode) {
    return new NextResponse("Invalid code", { status: 400 });
  }

  const upstreamUrls = [
    `https://jsdelivr.net{cleanCode}.svg`,
    `https://githubusercontent.com{cleanCode}.svg`,
    `https://cloudflare.com{cleanCode}.svg`,
  ];

  for (const url of upstreamUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const svg = await res.text();
        return new NextResponse(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {}
  }

  return new NextResponse("Not found", { status: 404 });
}
