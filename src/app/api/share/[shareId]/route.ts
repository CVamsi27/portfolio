import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ shareId: string }> };

function notFound() {
  return NextResponse.json({ error: "Share not found" }, { status: 404 });
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function storagePathFromUrl(value: string | null): string | null {
  if (!value) return null;
  const marker = "/drops/";
  const index = value.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(value.slice(index + marker.length).split("?")[0]);
}

export async function GET(_request: Request, context: Context) {
  const { shareId } = await context.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceRoleKey || !isValidUUID(shareId)) return notFound();

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("shared_drops")
    .select("text, image_path, image_url, created_at, expires_at, owner_email, is_public")
    .eq("id", shareId)
    .eq("is_public", true)
    .maybeSingle();
  if (error || !data || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) {
    return notFound();
  }

  let imageUrl: string | null = null;
  const imagePath = data.image_path ?? storagePathFromUrl(data.image_url);
  if (imagePath) {
    const signed = await supabase.storage.from("drops").createSignedUrl(imagePath, 300);
    if (signed.error || !signed.data?.signedUrl) return notFound();
    imageUrl = signed.data.signedUrl;
  }

  return NextResponse.json({
    text: data.text,
    imageUrl,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    ownerEmail: data.owner_email,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
