import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

function toIsoTimestamp(raw: any): string | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? undefined : raw.toISOString();
  }
  if (typeof raw === "object") {
    const inner = raw.seconds ?? raw.created_at ?? raw.$date;
    return toIsoTimestamp(inner);
  }
  const str = String(raw).trim();
  const num = Number(str);
  if (!Number.isNaN(num) && str !== "") {
    let ms = num;
    if (ms > 1e16) ms = Math.floor(ms / 1e6); // nanoseconds -> ms
    else if (ms > 1e13) ms = Math.floor(ms / 1e3); // microseconds -> ms
    else if (ms < 1e11) ms = ms * 1000; // seconds -> ms
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelType = searchParams.get("channelType") || "messaging";
    const channelId = searchParams.get("channelId") || "";
    const beforeId = searchParams.get("beforeId") || "";
    const limit = Math.min(
      10000,
      Math.max(1, Number(searchParams.get("limit") || 10000))
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
      state: true,
      watch: false,
      messages: {
        limit,
        ...(beforeId ? { id_lt: beforeId } : {}),
      },
    });

    const rawMessages = Array.isArray(response?.messages) ? response.messages : [];
    const messages = rawMessages.map((m: any) => ({
      ...m,
      created_at:
        toIsoTimestamp(m?.created_at) ??
        toIsoTimestamp(m?.createdAt) ??
        toIsoTimestamp(m?.updated_at),
      updated_at:
        toIsoTimestamp(m?.updated_at) ?? toIsoTimestamp(m?.updatedAt),
    }));

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
