export type {
  ClickPlacement,
  ClickAttributionInput,
  ParsedClickAttribution,
  ClickAttributionRecord,
} from "../../supabase/functions/_shared/click-attribution";

export {
  extractPageFromWidgetUrl,
  normalizePlacement,
  parseProductSelection,
  normalizeCountryCode,
  parseClickAttribution,
  toClickAttributionRecord,
} from "../../supabase/functions/_shared/click-attribution";
