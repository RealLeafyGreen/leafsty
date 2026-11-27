import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const { userId, status } = await req.json();
    const cleanId = String(userId || "").trim().toLowerCase();
    const valid =
      status === "idle" ||
      status === "dnd" ||
      status === "offline" ||
      status === "online"
        ? status
        : "online";

    if (!cleanId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
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
    await (serverClient as any).updateUsersPartial({
      users: [
        {
          id: cleanId,
          set: {
            presence_status: valid,
            invisible: valid === "offline",
          },
        },
      ],
    });

    return NextResponse.json({ ok: true, status: valid });
  } catch (err: any) {
    console.error("POST /api/status error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
