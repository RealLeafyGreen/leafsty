import { NextResponse } from "next/server";

export interface FullEmojiRecord {
  char: string;
  name: string;
  shortcode: string;
  cat: "Smileys" | "Hands" | "Nature" | "Food" | "Objects" | "Symbols";
  skinTones?: boolean;
}

let cachedList: FullEmojiRecord[] | null = null;

function unifiedToChar(unified: string): string {
  try {
    const cps = unified
      .split("-")
      .map((hex) => parseInt(hex, 16))
      .filter((n) => !Number.isNaN(n));
    return String.fromCodePoint(...cps);
  } catch {
    return "";
  }
}

export async function GET() {
  if (cachedList && cachedList.length > 1500) {
    return NextResponse.json({ emojis: cachedList });
  }

  try {
    const res = await fetch(
      "https://jsdelivr.net",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error(`Twemoji JSON fetch failed (${res.status})`);

    const rawItems = await res.json();
    if (!Array.isArray(rawItems)) throw new Error("Invalid Twemoji JSON");

    const catMap: Record<string, FullEmojiRecord["cat"]> = {
      "Smileys & Emotion": "Smileys",
      "People & Body": "Hands",
      "Animals & Nature": "Nature",
      "Food & Drink": "Food",
      Activities: "Objects",
      "Travel & Places": "Objects",
      Objects: "Objects",
      Symbols: "Symbols",
      Flags: "Symbols",
    };

    const sorted = [...rawItems].sort(
      (a: any, b: any) => (a?.sort_order ?? 9999) - (b?.sort_order ?? 9999)
    );

    const emojis: FullEmojiRecord[] = [];

    for (const item of sorted) {
      if (!item?.unified || !item?.short_name) continue;
      if (item.category === "Component") continue;

      const char = unifiedToChar(String(item.unified));
      if (!char) continue;

      const cat = catMap[String(item.category)] || "Symbols";
      const shortcode = String(item.short_name).toLowerCase();
      const name = String(item.name || shortcode)
        .toLowerCase()
        .replace(/_/g, " ");

      emojis.push({
        char,
        name,
        shortcode,
        cat,
        skinTones: Boolean(item.skin_variations),
      });
    }

    cachedList = emojis;
    return NextResponse.json({ emojis: cachedList });
  } catch (err: any) {
    return NextResponse.json(
      { emojis: [], error: err?.message || "Failed to load Twemoji dataset" },
      { status: 502 }
    );
  }
}
