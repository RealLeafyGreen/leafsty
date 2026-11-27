import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

const ADMIN_USER_IDS = new Set([
  "leafygreen",
  "realleafygreen",
  "jomkos",
]);

function isServerAdmin(userId: string, userName = ""): boolean {
  return [userId, userName]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean)
    .some(
      (clean) =>
        ADMIN_USER_IDS.has(clean) ||
        clean.startsWith("leafygreen") ||
        clean.startsWith("realleafygreen") ||
        clean.startsWith("jomkos")
    );
}

export async function POST(req: NextRequest) {
  try {
    const {
      command,
      argText = "",
      userId,
      userName = "",
      channelType = "messaging",
      channelId,
    } = await req.json();

    const cleanUserId = String(userId || "").trim().toLowerCase();
    if (!isServerAdmin(cleanUserId, userName)) {
      return NextResponse.json(
        { error: `Permission denied for "${cleanUserId}": ${command} is restricted to admins.` },
        { status: 403 }
      );
    }

    if (!channelId) {
      return NextResponse.json(
        { error: "Missing active channelId" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials not configured" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const channel = (serverClient as any).chat.channel(channelType, channelId);
