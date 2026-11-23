import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const {
      channelType = "messaging",
      channelId,
      userId,
      text = "",
      attachments = [],
      quoted_message_id,
      parent_id,
    } = await req.json();

    if (!channelId || !userId) {
      return NextResponse.json(
        { error: "Missing channelId or userId" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream API credentials are not configured on the server" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const channel = (serverClient as any).chat.channel(channelType, channelId);

    const quotedId = quoted_message_id || parent_id || undefined;

    const response = await channel.sendMessage({
      message: {
        user_id: String(userId),
        text: String(text || ""),
        attachments: Array.isArray(attachments) ? attachments : [],
        ...(quotedId ? { quoted_message_id: String(quotedId) } : {}),
      },
    });

    return NextResponse.json({ message: response?.message || null });
  } catch (err: any) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
