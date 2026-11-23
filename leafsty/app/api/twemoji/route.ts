import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") || "")
    .toLowerCase()
    .replace(/[^0-9a-f-]/g, "");

  if (!code) {
    return new NextResponse("Missing code", { status: 400 });
  }

  const res = await fetch(
    `https://jsdelivr.net{code}.svg`
  );

  if (!res.ok) {
    return new NextResponse("Not found", { status: 404 });
  }

  const svg = await res.text();
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
