import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { isLeafstyAdmin } from "../../../utils/adminCommands";

export const dynamic = "force-dynamic";

function getServerClient() {
  const apiKey =
    process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
  const apiSecret =
    process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;
  if (!apiKey || !apiSecret) return null;
  return new StreamClient(apiKey, apiSecret);
}

export async function GET() {
  try {
    const serverClient = getServerClient();
    if (!serverClient) {
      return NextResponse.json({ posts: [] });
    }

    const channel = (serverClient as any).chat.channel(
      "messaging",
      "leafsty-global-news"
    );
    await channel.getOrCreate({
      data: {
        created_by_id: "leafygreen",
        name: "Leafsty Global News",
      },
    });

    const res = await channel.query({
      messages: { limit: 100 },
    });

    const messages = Array.isArray(res?.messages) ? res.messages : [];
    const posts = messages
      .filter((m: any) => !m?.deleted_at)
      .map((m: any) => ({
        id: String(m.id),
        title: String(m.news_title || "Leafsty Update"),
        tag: String(m.news_tag || "Announcement"),
        body: String(m.text || ""),
        imageUrl: String(m.news_image || ""),
        authorId: String(m.user?.id || "leafygreen"),
        authorName: String(m.user?.name || m.user?.id || "Leafsty Team"),
        authorImage: String(m.user?.image || ""),
        createdAt: m.created_at || new Date().toISOString(),
        likes: Number(m.reaction_counts?.like || 0),
        likedBy: Array.isArray(m.latest_reactions)
          ? m.latest_reactions
              .filter((r: any) => r?.type === "like" && r?.user_id)
              .map((r: any) => String(r.user_id))
          : [],
      }))
      .reverse();

    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error("GET /api/news error:", err);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "create");
    const userId = String(body?.userId || "").trim().toLowerCase();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const serverClient = getServerClient();
    if (!serverClient) {
      return NextResponse.json(
        { error: "Stream credentials missing" },
        { status: 500 }
      );
    }

    const channel = (serverClient as any).chat.channel(
      "messaging",
      "leafsty-global-news"
    );
    await channel.getOrCreate({
      data: {
        created_by_id: "leafygreen",
        name: "Leafsty Global News",
      },
    });

    if (action === "like") {
      const postId = String(body?.postId || "");
      const liked = Boolean(body?.liked);
      if (!postId) {
        return NextResponse.json({ error: "Missing postId" }, { status: 400 });
      }
      if (liked) {
        await (serverClient as any).chat.deleteReaction({
          id: postId,
          type: "like",
          user_id: userId,
        });
      } else {
        await (serverClient as any).chat.sendReaction({
          id: postId,
          reaction: { type: "like", user_id: userId },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      if (!isLeafstyAdmin(userId)) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }
      const postId = String(body?.postId || "");
      if (!postId) {
        return NextResponse.json({ error: "Missing postId" }, { status: 400 });
      }
      await (serverClient as any).chat.deleteMessage({
        id: postId,
        hard: true,
      });
      return NextResponse.json({ ok: true });
    }

    // Create post — Admin only
    if (!isLeafstyAdmin(userId)) {
      return NextResponse.json(
        { error: "Only Leafsty admins can publish news posts." },
        { status: 403 }
      );
    }

    const title = String(body?.title || "").trim();
    const content = String(body?.body || "").trim();
    const tag = String(body?.tag || "Announcement").trim();
    const imageUrl = String(body?.imageUrl || "").trim();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and post text are required." },
        { status: 400 }
      );
    }

    await channel.sendMessage({
      message: {
        user_id: userId,
        text: content,
        news_title: title,
        news_tag: tag,
        news_image: imageUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/news error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update news" },
      { status: 500 }
    );
  }
}
