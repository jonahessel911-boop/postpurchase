export type Vertical = "energy" | "home_improvement" | "finance" | "insurance" | "other";
export type CampaignStatus = "approved" | "rejected";
export type MediaType = "image" | "video" | "gif";
export type ConversionGoal = "purchase" | "lead" | "signup" | "subscribe" | "custom";

export interface Advertiser {
  id: string;
  email: string;
  wallet_balance: number;
  created_at: string;
}

export interface AdMetrics {
  spend: number;
  clicks: number;
  cpc: number;
  ctr: number;
  conversions: number;
  cpa: number;
  impressions: number;
}

export interface Ad {
  id: string;
  campaign_id: string;
  name: string;
  active: boolean;
  is_draft: boolean;
  title: string;
  subheadline: string;
  media_url: string | null;
  media_type: MediaType;
  cta_text: string;
  created_at: string;
}

export interface AdWithMetrics extends Ad {
  metrics: AdMetrics;
}

export interface Campaign {
  id: string;
  advertiser_id: string;
  name: string;
  vertical: Vertical;
  cpc_bid: number;
  daily_budget: number | null;
  total_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  on_off: boolean;
  destination_url: string;
  conversion_goal: ConversionGoal;
  created_at: string;
  updated_at: string;
}

export type ClickPlacement = "redirect" | "popup" | "native";

export interface Click {
  id: string;
  campaign_id: string;
  ad_id: string;
  click_id: string;
  cost: number;
  created_at: string;
  publisher_id?: string | null;
  widget_url?: string | null;
  page?: string | null;
  intent_product?: string | null;
  product_choose?: string | null;
  product_selection?: string[] | null;
  geo_country?: string | null;
  placement?: ClickPlacement | null;
}

export interface Conversion {
  id: string;
  click_id: string;
  value: number;
  event: string;
  created_at: string;
}

export interface CampaignMetrics {
  spend: number;
  clicks: number;
  cpc: number;
  ctr: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
}

/** Form state for creating/editing ads (no metrics). */
export interface AdDraft {
  id: string;
  name: string;
  active: boolean;
  is_draft: boolean;
  title: string;
  subheadline: string;
  media_url: string | null;
  media_type: MediaType;
  cta_text: string;
}

export const VERTICALS: { value: Vertical; label: string }[] = [
  { value: "energy", label: "Energy" },
  { value: "home_improvement", label: "Home Improvement" },
  { value: "finance", label: "Finance" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

/** Default CPC bid (€) per vertical. */
export const DEFAULT_CPC_BY_VERTICAL: Record<Vertical, number> = {
  energy: 0.45,
  home_improvement: 0.41,
  finance: 0.55,
  insurance: 0.62,
  other: 0.5,
};

export type EndDateMode = "run_till_pause" | "select_end_date";

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  approved: "Active",
  rejected: "Rejected",
};

export const CONVERSION_GOALS: { value: ConversionGoal; label: string }[] = [
  { value: "purchase", label: "Purchase" },
  { value: "lead", label: "Lead" },
  { value: "signup", label: "Sign up" },
  { value: "subscribe", label: "Subscribe" },
  { value: "custom", label: "Custom" },
];

export function conversionGoalLabel(goal: ConversionGoal | string): string {
  return CONVERSION_GOALS.find((g) => g.value === goal)?.label ?? goal;
}

export const MEDIA_TYPES: { value: MediaType; label: string; accept: string }[] = [
  { value: "image", label: "Image", accept: "image/jpeg,image/png,image/webp" },
  { value: "video", label: "Video", accept: "video/mp4,video/webm,video/quicktime" },
  { value: "gif", label: "GIF", accept: "image/gif,.gif" },
];

export const MEDIA_FORMAT_SPECS: Record<
  MediaType,
  { formats: string; size: string; notes?: string }
> = {
  image: {
    formats: "JPG, PNG, or WebP",
    size: "1200 × 630 px recommended",
    notes: "Max 5 MB · 16:9 or 1.91:1 aspect ratio",
  },
  video: {
    formats: "MP4 or WebM",
    size: "1280 × 720 px (16:9)",
    notes: "Max 30 seconds · Max 20 MB",
  },
  gif: {
    formats: "Animated GIF",
    size: "800 × 800 px max",
    notes: "Max 10 MB · Looping recommended",
  },
};
