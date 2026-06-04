import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaType } from "@/lib/types";

function extensionForType(mediaType: MediaType, blobType?: string): string {
  if (blobType?.includes("png")) return "png";
  if (blobType?.includes("webp")) return "webp";
  if (blobType?.includes("gif")) return "gif";
  if (blobType?.includes("mp4")) return "mp4";
  if (mediaType === "video") return "mp4";
  if (mediaType === "gif") return "gif";
  return "jpg";
}

/** Upload blob: URLs to Supabase Storage; leave remote https URLs as-is. */
export async function persistAdMediaUrl(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  adId: string,
  mediaUrl: string | null,
  mediaType: MediaType
): Promise<string | null> {
  if (!mediaUrl) return null;
  if (!mediaUrl.startsWith("blob:")) return mediaUrl;

  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error("Failed to read uploaded media");
  }

  const blob = await response.blob();
  const ext = extensionForType(mediaType, blob.type);
  const path = `${userId}/${campaignId}/${adId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("campaign-media")
    .upload(path, blob, {
      upsert: true,
      contentType: blob.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("campaign-media").getPublicUrl(path);
  return data.publicUrl;
}
