import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import crypto from "crypto";

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Missing Stream API credentials" },
        { status: 500 }
      );
    }

    const { userId, newPassword } = await request.json();
    const cleanId = String(userId || "").trim().toLowerCase();

    if (!cleanId || !newPassword || String(newPassword).trim().length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const existing = await serverClient.queryUsers({
      payload: {
        filter_conditions: { id: cleanId },
      },
    });
    const existingUser = existing.users?.[0];

    await serverClient.upsertUsers([
      {
        id: cleanId,
        name: existingUser?.name || cleanId,
        custom: {
          ...(existingUser?.custom || {}),
          passwordHash: hashPassword(String(newPassword).trim()),
        },
      },
    ]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
