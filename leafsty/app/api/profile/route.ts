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

    let cleanUsername: string | undefined;
    if (updates.username !== undefined) {
      cleanUsername = String(updates.username)
        .trim()
        .toLowerCase()
        .replace(/^@/, "")
        .replace(/[^a-z0-9_.-]/g, "");

      if (cleanUsername.length < 2) {
        return NextResponse.json(
          { error: "Username must be at least 2 characters." },
          { status: 400 }
        );
      }

      if (cleanUsername !== userId.toLowerCase()) {
        const dupRes = await (serverClient as any).queryUsers({
          payload: {
            filter_conditions: {
              $or: [
                { id: { $eq: cleanUsername } },
                { username: { $eq: cleanUsername } },
              ],
            },
            limit: 2,
          },
        });
        const takenByOther = (dupRes?.users || []).some(
          (u: any) => String(u.id).toLowerCase() !== userId.toLowerCase()
        );
        if (takenByOther) {
          return NextResponse.json(
            { error: `@${cleanUsername} is already taken.` },
            { status: 409 }
          );
        }
      }
    }

    const customSet: Record<string, any> = {
      ...(cleanUsername !== undefined
        ? { username: cleanUsername, handle: cleanUsername }
        : {}),
      ...(updates.pronouns !== undefined
        ? { pronouns: String(updates.pronouns) }
        : {}),
      ...(updates.bio !== undefined
        ? { bio: String(updates.bio), aboutMe: String(updates.bio) }
        : {}),
      ...(updates.status !== undefined
        ? { status: String(updates.status), statusText: String(updates.status) }
        : {}),
      ...(updates.name !== undefined ? { name: String(updates.name) } : {}),
      ...(updates.image !== undefined ? { image: String(updates.image) } : {}),
            ...(updates.socials !== undefined
        ? { socials: updates.socials }
        : {}),
      ...(Array.isArray(updates.badges)
        ? { badges: updates.badges }
        : {}),

    };

    await (serverClient as any).updateUsersPartial({
      users: [
        {
          id: userId,
          set: {
            ...(customSet.name ? { name: customSet.name } : {}),
            ...(customSet.image ? { image: customSet.image } : {}),
            ...(cleanUsername !== undefined
              ? { username: cleanUsername, handle: cleanUsername }
              : {}),
            ...customSet,
          },
        },
      ],
    });

    return NextResponse.json({ ok: true, updates: customSet });
  } catch (err: any) {
    console.error("POST /api/profile error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
