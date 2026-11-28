import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { isLeafstyAdmin } from "../../../../utils/adminCommands";

export async function POST(req: NextRequest) {
  try {
    const { requesterId, targetUserId } = await req.json();
    const adminId = String(requesterId || "").trim().toLowerCase();
    const victimId = String(targetUserId || "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    if (!adminId || !isLeafstyAdmin(adminId)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required." },
        { status: 403 }
      );
    }

    if (!victimId || victimId === adminId) {
      return NextResponse.json(
        { error: "Invalid target user ID." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials missing" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    await (serverClient as any).deleteUsers({
      user_ids: [victimId],
      user: "hard",
      messages: "hard",
      conversations: "hard",
    });

    return NextResponse.json({ ok: true, deleted: victimId });
  } catch (err: any) {
    console.error("POST /api/admin/delete-user error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
