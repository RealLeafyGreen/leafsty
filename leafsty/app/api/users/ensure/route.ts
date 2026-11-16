import { NextResponse } from "next/server";
import crypto from "crypto";

function createServerToken(secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ server: true })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export async function POST(req: Request) {
  try {
    const { userId, name, baseURL } = await req.json();
    const cleanId = String(userId || "").trim().replace(/^@/, "");
    if (!cleanId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const apiKey = (process.env.NEXT_PUBLIC_STREAM_API_KEY || "").replace(/^["']|["']$/g, "").trim();
    const secret = (process.env.STREAM_API_SECRET || "").replace(/^["']|["']$/g, "").trim();
    const serverToken = createServerToken(secret);
    const streamHost = (baseURL || "https://stream-io-api.com").replace(/\/$/, "");

    const res = await fetch(
      `${streamHost}/users?api_key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: serverToken,
          "stream-auth-type": "jwt",
        },
        body: JSON.stringify({
          users: {
            [cleanId]: { id: cleanId, name: name || cleanId, role: "user" },
          },
        }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data.message || `Stream error ${res.status}` }, { status: res.status });
    }

    return NextResponse.json({ ok: true, user: data.users?.[cleanId] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
