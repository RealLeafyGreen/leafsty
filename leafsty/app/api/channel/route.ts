import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
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

    const serverClient = new StreamClient(apiKey, apiSecret);
    const response = await (serverClient as any).chat.queryChannels({
      filter_conditions: {
        type: "messaging",
        members: { $in: [userId] },
      },
      sort: [{ last_message_at: -1 }, { updated_at: -1 }],
      limit: 50,
      state: true,
    });

    const list = Array.isArray(response)
      ? response
      : response?.channels || [];

    const serialized = list.map((item: any) => {
      const ch = item?.channel || item;
      const members = Array.isArray(item?.members)
        ? item.members
        : Object.values(ch?.state?.members || item?.state?.members || {});

      return {
        id: ch?.id,
        type: ch?.type || "messaging",
        data: ch || {},
        members: members.map((m: any) => ({
          user_id: m?.user_id || m?.user?.id,
          user: m?.user || { id: m?.user_id },
        })),
      };
    });

    return NextResponse.json({ channels: serialized });
  } catch (err: any) {
    console.error("Failed to fetch channels on server:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load channels" },
      { status: 500 }
    );
  }
}
