import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const { messageId, userId, gameState } = await req.json();
    if (!messageId || !userId || !gameState) {
      return NextResponse.json(
        { error: "Missing messageId, userId, or gameState" },
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
    await (serverClient as any).chat.partialUpdateMessage(messageId, {
      set: {
        attachments: [
          {
            type: "leafsty_game",
            ...gameState,
          },
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/game-move error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update game move" },
      { status: 500 }
    );
  }
}
