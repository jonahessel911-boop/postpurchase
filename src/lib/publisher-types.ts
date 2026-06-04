import type { ClickPlacement } from "@/lib/types";

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
  /** DOM id of the form submit button (popup). */
  submit_element_id: string | null;
  /** Full redirect URL after form submit (redirect). */
  post_submit_redirect_url: string | null;
  created_at: string;
  updated_at: string;
}

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
  placement_id: string;
  publisher_id: string;
  page: string;
  intent_product: string;
  placement: ClickPlacement;
  api_domain: string;
  offers: WidgetOffer[];
}
