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
