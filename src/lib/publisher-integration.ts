import type { ClickPlacement } from "@/lib/types";
import { getPublisherPlatformOrigin } from "@/lib/widget-url";

export const TRAFFIC_PARTNER_ID_LABEL = "Traffic partner ID";

export function buildRedirectPageUrl(partnerId: string): string {
  return `${getPublisherPlatformOrigin()}/p/${partnerId}`;
}

export function buildWidgetIframeUrl(
  partnerId: string,
  format: ClickPlacement = "native"
): string {
  const base = `${getPublisherPlatformOrigin()}/widget/${partnerId}?embed=1`;
  return format === "native" ? base : `${base}&format=${format}`;
}

export interface PartnerEmbedOptions {
  submitElementId?: string;
  geo?: string;
}

export function buildPartnerEmbedSnippet(
  partnerId: string,
  format: ClickPlacement,
  options?: PartnerEmbedOptions
): string {
  const origin = getPublisherPlatformOrigin();
  const geo = options?.geo?.trim();
  const geoAttr = geo ? `,\n    geo: "${geo}"` : "";

  if (format === "redirect") {
    const url = buildRedirectPageUrl(partnerId);
    return `<!-- PostPurchase — redirect after form submit -->
<!-- Paste this URL in your form's "redirect after submit" setting: -->
${url}

<!-- Option A: HTTP redirect -->
<!-- Location: ${url} -->

<!-- Option B: JavaScript -->
<script>
  window.location.href = "${url}";
</script>`;
  }

  if (format === "popup") {
    const elementId = options?.submitElementId?.trim() || "submit-button";
    return `<!-- PostPurchase — popup on submit (traffic partner: ${partnerId}) -->
<!-- Your submit button: <button id="${elementId}" type="submit">...</button> -->
<script src="${origin}/embed/postpurchase.js" async></script>
<script>
  (function () {
    function attach() {
      if (!window.PostPurchase) {
        setTimeout(attach, 50);
        return;
      }
      window.PostPurchase.attachSubmit("${partnerId}", {
        submitElementId: "${elementId}"${geoAttr}
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attach);
    } else {
      attach();
    }
  })();
</script>`;
  }

  const iframeSrc = buildWidgetIframeUrl(partnerId, "native");
  return `<!-- PostPurchase — native offers (traffic partner: ${partnerId}) -->
<iframe
  src="${iframeSrc}"
  title="PostPurchase offers"
  style="width:100%;max-width:420px;border:0;border-radius:12px;min-height:400px;display:block"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>`;
}

/** @alias buildPartnerEmbedSnippet — install codes always use the public platform URL. */
export function buildPartnerEmbedSnippetForDocs(
  partnerId: string,
  format: ClickPlacement,
  options?: PartnerEmbedOptions
): string {
  return buildPartnerEmbedSnippet(partnerId, format, options);
}
