import { getPublisherAccountId } from "@/lib/api/advertiser-account";
import type { PublisherPlacement, PublisherPlacementInput } from "@/lib/publisher-types";
import {
  buildWidgetPageUrl,
  normalizePagePath,
  normalizeSiteUrl,
} from "@/lib/widget-url";

function normalizeOptionalUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return normalizeSiteUrl(trimmed) || trimmed;
}
import type { ClickPlacement } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

function mapPlacement(row: Record<string, unknown>): PublisherPlacement {
  return {
    id: row.id as string,
    publisher_id: row.publisher_id as string,
    name: row.name as string,
    site_url: (row.site_url as string) ?? "",
    page_path: (row.page_path as string) ?? "/confirmation",
    intent_product: (row.intent_product as string) ?? "",
    placement: row.placement as ClickPlacement,
    geo_country: (row.geo_country as string | null) ?? null,
    max_offers: Number(row.max_offers ?? 3),
    active: Boolean(row.active),
    submit_element_id: (row.submit_element_id as string | null) ?? null,
    post_submit_redirect_url:
      (row.post_submit_redirect_url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function sanitizeInput(input: PublisherPlacementInput) {
  return {
    name: input.name.trim() || "Confirmation page",
    site_url: normalizeSiteUrl(input.site_url),
    page_path: normalizePagePath(input.page_path),
    intent_product: input.intent_product.trim(),
    placement: input.placement,
    geo_country: input.geo_country?.trim().toUpperCase().slice(0, 2) || null,
    max_offers: Math.min(12, Math.max(1, input.max_offers ?? 3)),
    active: input.active ?? true,
    submit_element_id: input.submit_element_id?.trim() || null,
    post_submit_redirect_url: normalizeOptionalUrl(
      input.post_submit_redirect_url
    ),
  };
}

export async function requirePublisherId(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const publisherId = await getPublisherAccountId(supabase, user.id);
  if (!publisherId) {
    throw new Error("No publisher account linked to this user");
  }
  return publisherId;
}

export async function listPublisherPlacements(
  supabase: SupabaseClient
): Promise<PublisherPlacement[]> {
  const publisherId = await requirePublisherId(supabase);
  const { data, error } = await supabase
    .from("publisher_placements")
    .select("*")
    .eq("publisher_id", publisherId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPlacement(row));
}

export async function getPublisherPlacement(
  supabase: SupabaseClient,
  id: string
): Promise<PublisherPlacement | null> {
  const publisherId = await requirePublisherId(supabase);
  const { data, error } = await supabase
    .from("publisher_placements")
    .select("*")
    .eq("id", id)
    .eq("publisher_id", publisherId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPlacement(data) : null;
}

export async function createPublisherPlacement(
  supabase: SupabaseClient,
  input: PublisherPlacementInput
): Promise<PublisherPlacement> {
  const publisherId = await requirePublisherId(supabase);
  const payload = { ...sanitizeInput(input), publisher_id: publisherId };

  const { data, error } = await supabase
    .from("publisher_placements")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create placement");
  }
  return mapPlacement(data);
}

export async function updatePublisherPlacement(
  supabase: SupabaseClient,
  id: string,
  input: Partial<PublisherPlacementInput>
): Promise<PublisherPlacement> {
  const publisherId = await requirePublisherId(supabase);
  const patch: Record<string, unknown> = {};
  if (input.name != null) patch.name = input.name.trim() || "Confirmation page";
  if (input.site_url != null) patch.site_url = normalizeSiteUrl(input.site_url);
  if (input.page_path != null) patch.page_path = normalizePagePath(input.page_path);
  if (input.intent_product != null) patch.intent_product = input.intent_product.trim();
  if (input.placement != null) patch.placement = input.placement;
  if (input.geo_country !== undefined) {
    patch.geo_country =
      input.geo_country?.trim().toUpperCase().slice(0, 2) || null;
  }
  if (input.max_offers != null) {
    patch.max_offers = Math.min(12, Math.max(1, input.max_offers));
  }
  if (input.active != null) patch.active = input.active;
  if (input.submit_element_id !== undefined) {
    patch.submit_element_id = input.submit_element_id?.trim() || null;
  }
  if (input.post_submit_redirect_url !== undefined) {
    patch.post_submit_redirect_url = normalizeOptionalUrl(
      input.post_submit_redirect_url
    );
  }

  const { data, error } = await supabase
    .from("publisher_placements")
    .update(patch)
    .eq("id", id)
    .eq("publisher_id", publisherId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update placement");
  }
  return mapPlacement(data);
}

export async function deletePublisherPlacement(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const publisherId = await requirePublisherId(supabase);
  const { error } = await supabase
    .from("publisher_placements")
    .delete()
    .eq("id", id)
    .eq("publisher_id", publisherId);

  if (error) throw new Error(error.message);
}

export function placementWidgetPageUrl(placement: PublisherPlacement): string {
  return buildWidgetPageUrl(placement.site_url, placement.page_path);
}
