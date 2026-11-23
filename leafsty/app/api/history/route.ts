import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelType = searchParams.get("channelType") || "messaging";
    const channelId = searchParams.get("channelId") || "";
    const beforeId = searchParams.get("beforeId") || "";
    const limit = Math.min(
      300,
      Math.max(1, Number(searchParams.get("limit") || 150))
    );

    if (!channelId) {
      return NextResponse.json(
        { error: "Missing channelId" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials not configured" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const channel = (serverClient as any).chat.channel(channelType, channelId);

    const response = await channel.query({
      messages: {
        limit,
        ...(beforeId ? { id_lt: beforeId } : {}),
      },
    });

    const messages = Array.isArray(response?.messages) ? response.messages : [];
    return NextResponse.json({
      messages,
      hasMore: messages.length >= limit,
    });
  } catch (err: any) {
    console.error("GET /api/history error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load message history" },
      { status: 500 }
    );
  }
}
