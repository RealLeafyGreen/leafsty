import { NextResponse } from "next/server";
import crypto from "crypto";

const apiSecret = process.env.STREAM_API_SECRET!;

function signJwt(payloadObj: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const { userId, userName, password } = await request.json();

    if (!userId || !userName || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!apiSecret) {
      return NextResponse.json(
        { error: "Server secret is missing from .env.local" },
        { status: 500 }
      );
    }

    const defaultImage = `https://getstream.io{userId}&name=${userName}`;
    const userToken = signJwt({ user_id: userId }, apiSecret);

    return NextResponse.json({
      user: { id: userId, name: userName, image: defaultImage },
      token: userToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
