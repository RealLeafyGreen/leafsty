import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: Request) {
  try {
    const { channelId, channelType = "messaging", userId, text, attachments, parent_id, custom } =
      await req.json();

    if (!channelId || !userId) {
      return NextResponse.json(
        { error: "Missing channelId or userId" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials missing on server" },
        { status: 500 }
      );
    }

const quotedId = body?.quoted_message_id || body?.parent_id || undefined;

  const quotedId = body?.quoted_message_id || body?.parent_id || undefined;

const response = await channel.sendMessage({
  text: String(body?.text || ""),
  user_id: String(body?.userId || ""),
  attachments: Array.isArray(body?.attachments) ? body.attachments : [],
  ...(quotedId ? { quoted_message_id: String(quotedId) } : {}),
});

  text: String(body?.text || ""),
  user_id: String(body?.userId || ""),
  attachments: Array.isArray(body?.attachments) ? body.attachments : [],
  ...(quotedId ? { quoted_message_id: String(quotedId) } : {}),
});

    const serverClient = new StreamClient(apiKey, apiSecret);
    const channel = (serverClient as any).chat.channel(channelType, channelId);

    const response = await channel.sendMessage({
      message: {
        user_id: userId,
        text: text || "",
        attachments: attachments || [],
        parent_id,
        custom: custom || {},
      },
    });

    return NextResponse.json({
      ok: true,
      message: response?.message || response,
    });
  } catch (err: any) {
    console.error("Server sendMessage failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
