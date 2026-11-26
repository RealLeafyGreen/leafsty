import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = String(formData.get("userId") || "leafsty-user");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";
    const fileName = file.name || `upload-${Date.now()}`;

    const apiKey =
      process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY;
    const apiSecret =
      process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

    if (apiKey && apiSecret) {
      try {
        const serverClient = new StreamClient(apiKey, apiSecret);
        const uploaded = await (serverClient as any).files.upload({
          file: new Blob([buffer], { type: contentType }),
          name: fileName,
          user: { id: userId },
        });
        if (uploaded?.file) {
          return NextResponse.json({ file: uploaded.file });
        }
      } catch (streamErr) {
        console.warn("Stream file upload fallback to data URL:", streamErr);
      }
    }

    if (buffer.byteLength <= 3_500_000) {
      const base64 = buffer.toString("base64");
      return NextResponse.json({
        file: `data:${contentType};base64,${base64}`,
      });
    }

    return NextResponse.json(
      { error: "File too large (max ~3.5 MB)" },
      { status: 413 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
