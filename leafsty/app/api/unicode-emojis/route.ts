import { NextResponse } from "next/server";

let cachedCatalog: Array<{
  char: string;
  name: string;
  shortcode: string;
  category: string;
  skinTones: boolean;
}> | null = null;

export async function GET() {
  if (cachedCatalog && cachedCatalog.length > 500) {
    return NextResponse.json({ emojis: cachedCatalog, source: "memory" });
  }

  try {
    const res = await fetch(
      "https://unicode.org",
      {
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      throw new Error(`Unicode fetch failed (${res.status})`);
    }

    const raw = await res.text();
    const lines = raw.split(/\r?\n/);

    const catMap: Record<string, string> = {
      "Smileys & Emotion": "Smileys",
      "People & Body": "People",
      "Animals & Nature": "Nature",
      "Food & Drink": "Food",
      Activities: "Activities",
      "Travel & Places": "Objects",
      Objects: "Objects",
      Symbols: "Symbols",
      Flags: "Flags",
    };

    let currentGroup = "Smileys";
    const items: Array<{
      char: string;
      name: string;
      shortcode: string;
      category: string;
      skinTones: boolean;
    }> = [];
    const seenBase = new Set<string>();

    for (const line of lines) {
      if (line.startsWith("# group:")) {
        const grp = line.replace("# group:", "").trim();
        if (catMap[grp]) currentGroup = catMap[grp];
        continue;
      }
      if (!line || line.startsWith("#")) continue;

      // Only keep fully-qualified standard emojis (skip skin-tone duplicates; picker handles skin tones)
      if (!line.includes("; fully-qualified")) continue;
      if (/1F3F[B-F]/.test(line.split(";")[0])) {
        const baseKey = line
          .split(";")[0]
          .replace(/\b1F3F[B-F]\b/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const existing = items.find((it) => (it as any)._key === baseKey);
        if (existing) existing.skinTones = true;
        continue;
      }

      const [codePart, rest] = line.split(";");
      if (!codePart || !rest) continue;

      const hashIdx = rest.indexOf("#");
      if (hashIdx === -1) continue;

          const afterHash = rest.slice(hashIdx + 1).trim();
      const match = afterHash.match(/^(\S+)\s+E[\d.]+\s+(.+)$/);
      if (!match) continue;

      const char = match[1];
      const cldrName = match[2].trim().toLowerCase();
      const shortcode = cldrName
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      const key = codePart.trim();
      if (seenBase.has(key)) continue;
      seenBase.add(key);

      const entry: any = {
        char,
        name: cldrName,
        shortcode,
        category: currentGroup,
        skinTones: false,
        _key: key,
      };
      items.push(entry);
    }

    cachedCatalog = items.map(({ _key, ...clean }: any) => clean);
    return NextResponse.json({
      emojis: cachedCatalog,
      source: "unicode.org",
    });
  } catch (err: any) {
    return NextResponse.json(
      { emojis: [], error: err?.message || "Failed to load Unicode list" },
      { status: 502 }
    );
  }
}
