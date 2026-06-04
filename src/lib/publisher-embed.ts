/** @deprecated Use @/lib/publisher-integration */
export {
  buildRedirectPageUrl,
  buildWidgetIframeUrl,
  buildPartnerEmbedSnippet as buildEmbedSnippet,
  buildPartnerEmbedSnippetForDocs as buildEmbedSnippetWithOverrides,
  TRAFFIC_PARTNER_ID_LABEL,
} from "@/lib/publisher-integration";

export type { PartnerEmbedOptions as EmbedSnippetOptions } from "@/lib/publisher-integration";
