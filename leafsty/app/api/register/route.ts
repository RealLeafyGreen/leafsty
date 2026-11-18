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

    const body = await request.json();
    const rawUsername = body.username || body.userId || body.id || "";
    const cleanId = String(rawUsername)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const password = String(body.password || "").trim();
    const displayName = String(body.name || rawUsername || cleanId).trim();
    const mode = body.mode || "login";

    if (!cleanId || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
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
    const storedHash = existingUser?.custom?.passwordHash as string | undefined;
    const incomingHash = hashPassword(password);

    if (mode === "register") {
      if (storedHash) {
        return NextResponse.json(
          { error: "That username is already taken" },
          { status: 409 }
        );
      }

      await serverClient.upsertUsers([
        {
          id: cleanId,
          name: displayName || cleanId,
          custom: {
            ...(existingUser?.custom || {}),
            passwordHash: incomingHash,
          },
        },
      ]);

      return NextResponse.json({
        ok: true,
        user: {
          id: cleanId,
          name: displayName || cleanId,
          image: existingUser?.image,
        },
      });
    }

    // Login mode
    if (!existingUser || !storedHash) {
      return NextResponse.json(
        { error: "Account not found — click 'Create an account' below first!" },
        { status: 404 }
      );
    }

    if (storedHash !== incomingHash) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: cleanId,
        name: existingUser.name || displayName || cleanId,
        image: existingUser.image,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
