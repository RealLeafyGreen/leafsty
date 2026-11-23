import { NextResponse } from "next/server";

export interface FullEmojiRecord {
  char: string;
  name: string;
  shortcode: string;
  cat: "Smileys" | "Hands" | "Nature" | "Food" | "Objects" | "Symbols";
  skinTones?: boolean;
}

let cachedList: FullEmojiRecord[] | null = null;

export async function GET() {
  if (cachedList && cachedList.length > 1500) {
    return NextResponse.json({ emojis: cachedList });
  }

  try {
    const res = await fetch(
      "https://unicode.org",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error("Failed to fetch Unicode list");

    const raw = await res.text();
    const lines = raw.split(/\r?\n/);

    const groupMap: Record<string, FullEmojiRecord["cat"]> = {
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

    let currentCat: FullEmojiRecord["cat"] = "Smileys";
    const result: Array<FullEmojiRecord & { _base: string }> = [];
    const seenChars = new Set<string>();

    for (const line of lines) {
      if (line.startsWith("# group:")) {
        const grp = line.replace("# group:", "").trim();
        if (groupMap[grp]) currentCat = groupMap[grp];
        continue;
      }
      if (!line || line.startsWith("#")) continue;

      const semi = line.indexOf(";");
      if (semi === -1) continue;
      const codePart = line.slice(0, semi).trim();
      const rest = line.slice(semi + 1);

      // Skip unqualified duplicates when fully-qualified exists, but keep minimally-qualified
      if (rest.includes("unqualified")) continue;

      // Mark skin-tone support on base emoji instead of flooding grid with 5x skin duplicates
      if (/1F3F[B-F]/.test(codePart)) {
        const base = codePart
          .replace(/\b1F3F[B-F]\b/g, "")
          .replace(/\bFE0F\b/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const found = result.find((r) => r._base === base);
        if (found) found.skinTones = true;
        continue;
      }

      const hash = rest.indexOf("#");
      if (hash === -1) continue;
      const afterHash = rest.slice(hash + 1).trim();

      // Match: "<emoji_char> E<version> <cldr_name>"
      const match = afterHash.match(/^(\S+)\s+E[\d.]+\s+(.+)$/);
      const char = match?.at(1);
      const rawName = match?.at(2);
      if (!char || !rawName) continue;

      const normalizedKey = codePart.replace(/\bFE0F\b/g, "").replace(/\s+/g, " ").trim();
      if (seenChars.has(normalizedKey)) continue;
      seenChars.add(normalizedKey);

      const name = rawName.trim().toLowerCase();
      const shortcode = name.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

      result.push({
        char,
        name,
        shortcode,
        cat: currentCat,
        skinTones: false,
        _base: normalizedKey,
      });
    }

    cachedList = result.map(({ _base, ...clean }) => clean);
    return NextResponse.json({ emojis: cachedList });
  } catch (err: any) {
    return NextResponse.json(
      { emojis: [], error: err?.message || "Fetch error" },
      { status: 502 }
    );
  }
}
