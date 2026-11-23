import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials missing" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const updates = body?.updates || {};

    const customSet: Record<string, any> = {
      ...(updates.pronouns !== undefined ? { pronouns: String(updates.pronouns) } : {}),
      ...(updates.bio !== undefined
        ? { bio: String(updates.bio), aboutMe: String(updates.bio) }
        : {}),
      ...(updates.status !== undefined
        ? { status: String(updates.status), statusText: String(updates.status) }
        : {}),
      ...(updates.name !== undefined ? { name: String(updates.name) } : {}),
      ...(updates.image !== undefined ? { image: String(updates.image) } : {}),
    };

    await serverClient.upsertUsers([
      {
        id: userId,
        ...(customSet.name ? { name: customSet.name } : {}),
        ...(customSet.image ? { image: customSet.image } : {}),
        custom: customSet,
      },
    ]);

    return NextResponse.json({ ok: true, updates: customSet });
  } catch (err: any) {
    console.error("POST /api/profile error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
