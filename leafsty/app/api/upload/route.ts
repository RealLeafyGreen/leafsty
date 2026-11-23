import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const channelType = String(formData.get("channelType") || "messaging");
    const channelId = String(formData.get("channelId") || "");
    const userId = String(formData.get("userId") || "");
    const kind = String(formData.get("kind") || "file"); // "image" | "file" | "voice"

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file in upload request" },
        { status: 400 }
      );
    }

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
        { error: "Stream credentials are not configured on the server" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const channel = (serverClient as any).chat.channel(channelType, channelId);

    const isImage = kind === "image" || file.type.startsWith("image/");
    const uploadRes = isImage
      ? await channel.sendImage(file, file.name, file.type, { id: userId })
      : await channel.sendFile(file, file.name, file.type, { id: userId });

    const uploadedUrl = uploadRes?.file || "";
    if (!uploadedUrl) {
      return NextResponse.json(
        { error: "Stream CDN did not return a file URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: uploadedUrl,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      isImage,
    });
  } catch (err: any) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: err?.message || "File upload failed" },
      { status: 500 }
    );
  }
}
