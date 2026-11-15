import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  maskEmail,
  ownedImagePaths,
  publishedImagePaths,
  signedUrlTtlSeconds,
} from "@/lib/share-domain";

type Context = { params: Promise<{ shareId: string }> };

const ROW_COLUMNS =
  "text, image_path, image_url, created_at, expires_at, owner_email, is_public, owner";

function notFound() {
  return NextResponse.json({ error: "Share not found" }, { status: 404 });
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

type SharedRow = {
  text: string;
  image_path: string | null;
  image_url: string | null;
  image_paths?: string[] | null;
  created_at: string;
  expires_at: string | null;
  owner_email: string | null;
  is_public: boolean;
  owner: string | null;
};

export async function GET(_request: Request, context: Context) {
  const { shareId } = await context.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceRoleKey || !isValidUUID(shareId)) return notFound();

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let { data, error } = await supabase
    .from("shared_drops")
    .select(`${ROW_COLUMNS}, image_paths`)
    .eq("id", shareId)
    .eq("is_public", true)
    .maybeSingle();
  if (error) {
    // Deployments without 0017_share_multi_image.sql fall back to one image.
    const legacy = await supabase
      .from("shared_drops")
      .select(ROW_COLUMNS)
      .eq("id", shareId)
      .eq("is_public", true)
      .maybeSingle();
    data = legacy.data as unknown as typeof data;
    error = legacy.error;
  }
  const row = data as unknown as SharedRow | null;
  if (
    error ||
    !row ||
    (row.expires_at && new Date(row.expires_at).getTime() <= Date.now())
  ) {
    return notFound();
  }

  const paths = ownedImagePaths(publishedImagePaths(row), row.owner);
  // Signing for an hour regardless of expiry kept expired drops readable.
  const ttl = signedUrlTtlSeconds(row.expires_at);
  if (ttl <= 0) return notFound();
  const imageUrls: string[] = [];
  for (const path of paths) {
    const signed = await supabase.storage
      .from("drops")
      .createSignedUrl(path, ttl);
    if (!signed.error && signed.data?.signedUrl)
      imageUrls.push(signed.data.signedUrl);
  }
  if (paths.length > 0 && imageUrls.length === 0) return notFound();

  return NextResponse.json(
    {
      text: row.text,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      created_at: row.created_at,
      expiresAt: row.expires_at,
      ownerEmail: maskEmail(row.owner_email),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
