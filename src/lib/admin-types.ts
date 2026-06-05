import type { CampaignWithMetrics } from "@/lib/campaign-types";

export interface AdminPublisher {
  id: string;
  company_name: string;
  contact_email: string;
  status: "active" | "suspended";
  created_at: string;
  clicks: number;
  publisher_revenue: number;
}

export interface AdminAdvertiser {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  status: "active" | "suspended";
  wallet_balance: number;
  created_at: string;
  billing: {
    company_name: string;
    email: string;
    vat_number: string;
    address_line1: string;
    address_line2: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

export interface AdminInvoice {
  id: string;
  advertiser_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  created_at: string;
}

export interface AdminCampaignRow extends CampaignWithMetrics {
  advertiser: AdminAdvertiser;
  revenue: number;
  roas: number;
}

export interface ClickLog {
  id: string;
  created_at: string;
  click_id: string;
  campaign_id: string;
  campaign_name: string;
  ad_id: string;
  ad_name: string;
  advertiser_email: string;
  cost: number;
  country: string;
  device: "desktop" | "mobile" | "tablet" | "";
  converted: boolean;
  traffic_partner: string;
  page: string;
  intent_product: string;
  product_choose: string;
  product_selection: string[];
  placement: string;
  widget_url: string;
}

export interface PostbackLog {
  id: string;
  created_at: string;
  click_id: string;
  click_created_at: string;
  campaign_id: string;
  campaign_name: string;
  ad_name: string;
  advertiser_email: string;
  event: string;
  value: number;
  status: "success" | "failed" | "duplicate";
  http_status: number;
  latency_ms: number;
  traffic_partner: string;
  page: string;
  intent_product: string;
  product_choose: string;
  product_selection: string[];
  placement: string;
  country: string;
  widget_url: string;
}

export interface AdminPlatformTotals {
  spend: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  activeCampaigns: number;
  totalCampaigns: number;
  advertisers: number;
  postbacks24h: number;
  clicks24h: number;
}

export interface AdminChartPoint {
  date: string;
  spend: number;
  clicks: number;
  conversions: number;
  label: string;
}

export function formatLogTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
