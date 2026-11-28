import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  let cleanUserId = "";
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

    cleanUserId = String(userId || "").trim().toLowerCase();

    if (!channelId || !cleanUserId) {
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
        { error: "Server credentials are not configured" },
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
    const rawMsg = String(err?.message || "Failed to send message");

    if (
      rawMsg.toLowerCase().includes("banned") ||
      rawMsg.toLowerCase().includes("do not have access")
    ) {
      let reason = "Violation of Leafsty community rules";
      let expiresAt: string | null = null;

      try {
        const apiKey =
          process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
        const apiSecret = process.env.STREAM_API_SECRET;
        if (apiKey && apiSecret && cleanUserId) {
          const serverClient = new StreamClient(apiKey, apiSecret);
          const qRes = await (serverClient as any).queryUsers({
            payload: {
              filter_conditions: { id: { $eq: cleanUserId } },
              limit: 1,
            },
          });
          const u: any = Array.isArray(qRes?.users) ? qRes.users[0] : null;
          if (u?.leafstyBanReason || u?.custom?.leafstyBanReason) {
            reason = String(u.leafstyBanReason || u.custom.leafstyBanReason);
          }
          if (u?.leafstyBanExpiresAt || u?.custom?.leafstyBanExpiresAt) {
            expiresAt = String(
              u.leafstyBanExpiresAt || u.custom.leafstyBanExpiresAt
            );
          }
        }
      } catch {}

      return NextResponse.json(
        {
          banned: true,
          reason,
          expiresAt,
        },
        { status: 403 }
      );
    }

    const cleanError = rawMsg
      .replace(/stream error(\s*code\s*\d+:)?/gi, "")
      .trim();

    return NextResponse.json(
      { error: cleanError || "Failed to send message" },
      { status: 500 }
    );
  }
}
