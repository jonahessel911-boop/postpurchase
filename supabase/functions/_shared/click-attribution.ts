export type ClickPlacement = "redirect" | "popup" | "native";

export interface ClickAttributionInput {
  widget_url?: string | null;
  publisher_id?: string | null;
  intent_product?: string | null;
  product_choose?: string | null;
  product_selection?: string | null;
  geo_country?: string | null;
  placement?: string | null;
  page?: string | null;
  ad_id?: string | null;
}

export interface ParsedClickAttribution {
  widget_url: string | null;
  page: string | null;
  publisher_id: string | null;
  intent_product: string | null;
  product_choose: string | null;
  product_selection: string[];
  geo_country: string | null;
  placement: ClickPlacement | null;
  ad_id: string | null;
}

const PLACEMENT_ALIASES: Record<string, ClickPlacement> = {
  popup: "popup",
  pop: "popup",
  modal: "popup",
  native: "native",
  redirect: "redirect",
  "full_redirect": "redirect",
  "redirect_page": "redirect",
  inline: "native",
  in_page: "native",
  inpage: "native",
  "in-page": "native",
};

function firstParam(
  params: URLSearchParams,
  keys: string[]
): string | null {
  for (const key of keys) {
    const v = params.get(key);
    if (v?.trim()) return v.trim();
  }
  return null;
}

/** Page slug/path from the widget URL (explicit `page` param wins). */
export function extractPageFromWidgetUrl(widgetUrl: string | null): string | null {
  if (!widgetUrl?.trim()) return null;
  try {
    const parsed = new URL(widgetUrl);
    const explicit = parsed.searchParams.get("page")?.trim();
    if (explicit) return explicit.slice(0, 500);
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    if (path) return path.slice(0, 500);
    return parsed.hostname || null;
  } catch {
    return widgetUrl.slice(0, 500);
  }
}

export function normalizePlacement(raw: string | null): ClickPlacement | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return PLACEMENT_ALIASES[key] ?? null;
}

export function parseProductSelection(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") {
            const o = item as Record<string, unknown>;
            const label =
              o.name ?? o.title ?? o.product ?? o.id ?? o.campaign_id;
            return label != null ? String(label).trim() : "";
          }
          return "";
        })
        .filter(Boolean)
        .slice(0, 50);
    } catch {
      return [];
    }
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export function normalizeCountryCode(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const code = raw.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;
  return code.slice(0, 8);
}

export function parseClickAttribution(
  clickUrl: URL,
  headers?: Headers
): ParsedClickAttribution {
  const params = clickUrl.searchParams;
  const widget_url = firstParam(params, ["widget_url", "wu", "widget"]);
  const explicitPage = firstParam(params, ["page"]);
  const page =
    explicitPage ?? extractPageFromWidgetUrl(widget_url);

  let geo_country = normalizeCountryCode(
    firstParam(params, ["geo", "country", "geo_country"])
  );
  if (!geo_country && headers) {
    const fromHeader =
      headers.get("cf-ipcountry") ??
      headers.get("x-vercel-ip-country") ??
      headers.get("x-country-code");
    geo_country = normalizeCountryCode(fromHeader);
  }

  return {
    widget_url,
    page,
    publisher_id: firstParam(params, ["publisher_id", "pub", "partner"]),
    intent_product: firstParam(params, ["intent_product", "intent"]),
    product_choose: firstParam(params, ["product_choose", "chosen", "offer"]),
    product_selection: parseProductSelection(
      firstParam(params, ["product_selection", "offers", "selection"])
    ),
    geo_country,
    placement: normalizePlacement(firstParam(params, ["placement", "format"])),
    ad_id: firstParam(params, ["ad_id", "ad"]),
  };
}

export interface ClickAttributionRecord {
  click_id: string;
  created_at: string;
  timestamp: string;
  traffic_partner: string | null;
  traffic_partner_id: string | null;
  page: string | null;
  intent_product: string | null;
  product_choose: string | null;
  product_selection: string[];
  geo_country: string | null;
  placement: ClickPlacement | null;
  widget_url: string | null;
  campaign_id: string;
  ad_id: string | null;
  cost: number;
}

export function toClickAttributionRecord(row: {
  click_id: string;
  created_at: string;
  publisher_id?: string | null;
  publisher_name?: string | null;
  page?: string | null;
  intent_product?: string | null;
  product_choose?: string | null;
  product_selection?: unknown;
  geo_country?: string | null;
  placement?: string | null;
  widget_url?: string | null;
  campaign_id: string;
  ad_id?: string | null;
  cost: number | string;
}): ClickAttributionRecord {
  let selection: string[] = [];
  if (Array.isArray(row.product_selection)) {
    selection = row.product_selection.map((x) => String(x));
  } else if (typeof row.product_selection === "string") {
    selection = parseProductSelection(row.product_selection);
  }

  const placement = row.placement
    ? normalizePlacement(row.placement)
    : null;

  return {
    click_id: row.click_id,
    created_at: row.created_at,
    timestamp: row.created_at,
    traffic_partner: row.publisher_name ?? null,
    traffic_partner_id: row.publisher_id ?? null,
    page: row.page ?? null,
    intent_product: row.intent_product ?? null,
    product_choose: row.product_choose ?? null,
    product_selection: selection,
    geo_country: row.geo_country ?? null,
    placement,
    widget_url: row.widget_url ?? null,
    campaign_id: row.campaign_id,
    ad_id: row.ad_id ?? null,
    cost: Number(row.cost),
  };
}
