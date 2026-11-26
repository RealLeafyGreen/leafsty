import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();
    if (!credential) {
      return NextResponse.json(
        { error: "Missing Google credential token" },
        { status: 400 }
      );
    }

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials missing on server" },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(
      `https://googleapis.com{encodeURIComponent(credential)}`
    );
    const payload = await verifyRes.json();

    if (!verifyRes.ok || !payload?.sub || !payload?.email) {
      return NextResponse.json(
        { error: "Invalid Google sign-in token" },
        { status: 401 }
      );
    }

    if (googleClientId && payload.aud !== googleClientId) {
      return NextResponse.json(
        { error: "Google Client ID mismatch" },
        { status: 401 }
      );
    }

    const emailPrefix = String(payload.email)
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const userId = emailPrefix || `google_${String(payload.sub).slice(0, 16)}`;
    const displayName = String(payload.name || emailPrefix || "Leafsty User");
    const avatarUrl = String(payload.picture || "");

    const serverClient = new StreamClient(apiKey, apiSecret);

    const existingRes = await serverClient.queryUsers({
      payload: { filter_conditions: { id: userId } },
    });
    const existingUser: any = existingRes?.users?.[0] || null;

    await serverClient.upsertUsers([
      {
        id: userId,
        name: existingUser?.name || displayName,
        image: existingUser?.image || avatarUrl,
        role: "user",
        custom: {
          ...(existingUser?.custom || {}),
          googleSub: payload.sub,
          email: payload.email,
        },
      },
    ]);

    const token = serverClient.generateUserToken({ user_id: userId });

    return NextResponse.json({
      ok: true,
      token,
      apiKey,
      user: {
        id: userId,
        name: existingUser?.name || displayName,
        image: existingUser?.image || avatarUrl,
        ...(existingUser?.custom || {}),
      },
    });
  } catch (err: any) {
    console.error("POST /api/google-auth error:", err);
    return NextResponse.json(
      { error: err?.message || "Google authentication failed" },
      { status: 500 }
    );
  }
}
