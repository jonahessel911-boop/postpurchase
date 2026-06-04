import type { ClickPlacement } from "@/lib/types";

/** @deprecated Legacy per-page config; integration uses publisher id only. */
export interface PublisherPlacementInput {
  name: string;
  site_url: string;
  page_path: string;
  intent_product: string;
  placement: ClickPlacement;
  geo_country?: string | null;
  max_offers?: number;
  active?: boolean;
  submit_element_id?: string | null;
  post_submit_redirect_url?: string | null;
}

export interface PublisherPlacement {
  id: string;
  publisher_id: string;
  name: string;
  site_url: string;
  page_path: string;
  intent_product: string;
  placement: ClickPlacement;
  geo_country: string | null;
  max_offers: number;
  active: boolean;
  submit_element_id: string | null;
  post_submit_redirect_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WidgetOffer {
  campaign_id: string;
  ad_id: string;
  title: string;
  subheadline: string;
  media_url: string | null;
  media_type: "image" | "video" | "gif";
  cta_text: string;
  product_label: string;
}

export interface WidgetOffersResponse {
  /** Traffic partner id (same as publisher account id). */
  publisher_id: string;
  /** Display format for this request (redirect | popup | native). */
  placement: ClickPlacement;
  page: string;
  intent_product: string;
  api_domain: string;
  offers: WidgetOffer[];
  /** @deprecated Legacy field; equals publisher_id when present. */
  placement_id?: string;
}
