import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "thumb.wikimedia.org",
  "upload.wikimedia.org",
]);

/**
 * A deliberately narrow relay: it stabilizes public motivation imagery while
 * refusing arbitrary URLs, credentials, redirects, and response types.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Image URL is required." }, { status: 400 });

  let source: URL;
  try {
    source = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
  }
  if (source.protocol !== "https:" || !ALLOWED_HOSTS.has(source.hostname) || source.username || source.password) {
    return NextResponse.json({ error: "Image source is not allowed." }, { status: 400 });
  }

  try {
    const response = await fetch(source, { redirect: "error", signal: AbortSignal.timeout(8_000) });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Image is unavailable." }, { status: 502 });
    }
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image is unavailable." }, { status: 502 });
  }
}
