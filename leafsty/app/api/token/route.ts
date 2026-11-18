import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Missing Stream API credentials" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || body.id || "").trim().toLowerCase();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const token = serverClient.generateUserToken({ user_id: userId });

    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create token" },
      { status: 500 }
    );
  }
}
