import { NextResponse } from "next/server";
import crypto from "crypto";

function createStreamToken(userId: string, secret: string) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({ user_id: userId })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export async function POST(req: Request) {
  try {
    const { userId, username } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const apiSecret = (process.env.STREAM_API_SECRET || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!apiSecret) {
      return NextResponse.json(
        { error: "Missing STREAM_API_SECRET in .env.local" },
        { status: 500 }
      );
    }

    const token = createStreamToken(userId, apiSecret);

    return NextResponse.json({
      userId,
      username: username || userId,
      token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
