import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "leafsty-auth" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "login").toLowerCase();
    const rawUsername = String(body?.username || "").trim();
    const userId = rawUsername.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const password = String(body?.password || body?.newPassword || "");

    if (!userId) {
      return NextResponse.json(
        { error: "Please enter a valid username." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials are missing on the server." },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);

    // Case-insensitive persistent user lookup in Stream Chat
    const existingRes = await serverClient.queryUsers({
      filter_conditions: {
        id: { $in: Array.from(new Set([userId, rawUsername])) },
      },
    });
    const existingUser: any = existingRes?.users?.[0] || null;
    const resolvedUserId: string = existingUser?.id || userId;
    const storedHash: string =
      existingUser?.custom?.passwordHash || existingUser?.passwordHash || "";

    if (action === "register" || action === "signup") {
      if (password.length < 4) {
        return NextResponse.json(
          { error: "Password must be at least 4 characters." },
          { status: 400 }
        );
      }

      if (existingUser && storedHash) {
        return NextResponse.json(
          { error: "Username already exists — sign in instead!" },
          { status: 409 }
        );
      }

      const passwordHash = hashPassword(password);
      await serverClient.upsertUsers([
        {
          id: resolvedUserId,
          name: existingUser?.name || rawUsername || resolvedUserId,
          role: "user",
          custom: {
            ...(existingUser?.custom || {}),
            passwordHash,
          },
        },
      ]);

      const token = serverClient.generateUserToken({ user_id: resolvedUserId });
      return NextResponse.json({
        token,
        apiKey,
        user: {
          id: resolvedUserId,
          name: existingUser?.name || rawUsername || resolvedUserId,
          image: existingUser?.image || "",
          ...(existingUser?.custom || {}),
        },
      });
    }

    if (action === "reset_password") {
      if (password.length < 4) {
        return NextResponse.json(
          { error: "New password must be at least 4 characters." },
          { status: 400 }
        );
      }
      const passwordHash = hashPassword(password);
      await serverClient.upsertUsers([
        {
          id: resolvedUserId,
          name: existingUser?.name || rawUsername || resolvedUserId,
          custom: {
            ...(existingUser?.custom || {}),
            passwordHash,
          },
        },
      ]);
      return NextResponse.json({ ok: true });
    }

    // Default: login / sign in
    if (!existingUser) {
      return NextResponse.json(
        { error: "Account not found — click 'Create an account' below first!" },
        { status: 404 }
      );
    }

    const incomingHash = hashPassword(password);

    if (!storedHash) {
      if (password.length < 4) {
        return NextResponse.json(
          { error: "Password must be at least 4 characters." },
          { status: 400 }
        );
      }
      await serverClient.upsertUsers([
        {
          id: resolvedUserId,
          name: existingUser.name || rawUsername || resolvedUserId,
          custom: {
            ...(existingUser.custom || {}),
            passwordHash: incomingHash,
          },
        },
      ]);
    } else if (storedHash !== incomingHash) {
      return NextResponse.json(
        { error: "Incorrect password — try again or click Forgot password." },
        { status: 401 }
      );
    }

    const token = serverClient.generateUserToken({ user_id: resolvedUserId });
    return NextResponse.json({
      token,
      apiKey,
      user: {
        id: resolvedUserId,
        name: existingUser.name || rawUsername || resolvedUserId,
        image: existingUser.image || "",
        ...(existingUser.custom || {}),
      },
    });
  } catch (err: any) {
    console.error("POST /api/auth error:", err);
    return NextResponse.json(
      { error: err?.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
