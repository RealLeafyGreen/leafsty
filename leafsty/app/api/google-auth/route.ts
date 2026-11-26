import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();
    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: "Missing Google authorization code" },
        { status: 400 }
      );
    }

    const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing Google Client ID or GOOGLE_CLIENT_SECRET on server" },
        { status: 500 }
      );
    }

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials missing on server" },
        { status: 500 }
      );
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://googleapis.com", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData?.access_token) {
      return NextResponse.json(
        { error: tokenData?.error_description || "Failed to exchange Google code" },
        { status: 401 }
      );
    }

    // Fetch Google user profile
    const userRes = await fetch("https://googleapis.com", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const payload = await userRes.json();

    if (!userRes.ok || !payload?.sub || !payload?.email) {
      return NextResponse.json(
        { error: "Could not load Google user profile" },
        { status: 401 }
      );
    }

    const emailPrefix = String(payload.email)
      .split("@")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const userId = emailPrefix || `google_${String(payload.sub).slice(0, 16)}`;
    const displayName = String(payload.name || emailPrefix || "Leafsty User");
    const avatarUrl = String(payload.picture || "");

    const serverClient = new StreamClient(apiKey, apiSecret);
    const existingRes = await serverClient.queryUsers({
      payload: { filter_conditions: { id: userId } },
    });
    const existingUser: any = existingRes?.users?. || null;

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
