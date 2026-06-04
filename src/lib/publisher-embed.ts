import type { ClickPlacement } from "@/lib/types";
import { getAppOrigin } from "@/lib/widget-url";

export function buildRedirectPageUrl(placementId: string): string {
  return `${getAppOrigin()}/p/${placementId}`;
}

export function buildWidgetIframeUrl(placementId: string): string {
  return `${getAppOrigin()}/widget/${placementId}?embed=1`;
}

export interface EmbedSnippetOptions {
  geo?: string;
  widgetUrl?: string;
  submitElementId?: string;
  postSubmitRedirectUrl?: string;
}

export function buildEmbedSnippet(
  placementId: string,
  placementType: ClickPlacement,
  options?: EmbedSnippetOptions
): string {
  const origin = getAppOrigin();
  const geo = options?.geo?.trim();
  const geoAttr = geo ? `,\n    geo: "${geo}"` : "";
  const widgetUrl = options?.widgetUrl?.trim();
  const widgetAttr = widgetUrl
    ? `,\n    widgetUrl: "${widgetUrl.replace(/"/g, '\\"')}"`
    : "";

  if (placementType === "redirect") {
    const offersUrl =
      options?.postSubmitRedirectUrl?.trim() || buildRedirectPageUrl(placementId);
    return `<!-- PostPurchase — full redirect page after form submit -->
<!-- Paste this URL into your form's "redirect after submit" setting: -->
${offersUrl}

<!-- Option A: HTTP redirect (server-side) -->
<!-- Location: ${offersUrl} -->

<!-- Option B: JavaScript redirect -->
<script>
  window.location.href = "${offersUrl}";
</script>`;
  }

  if (placementType === "popup") {
    const elementId = options?.submitElementId?.trim() || "submit-button";
    return `<!-- PostPurchase — popup when your submit button is clicked -->
<!-- Set your submit button: <button id="${elementId}" type="submit">...</button> -->
<script src="${origin}/embed/postpurchase.js" async></script>
<script>
  (function () {
    function attach() {
      if (!window.PostPurchase) {
        setTimeout(attach, 50);
        return;
      }
      window.PostPurchase.attachSubmit("${placementId}", {
        submitElementId: "${elementId}"${geoAttr}${widgetAttr}
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

  const iframeSrc = buildWidgetIframeUrl(placementId);
  return `<!-- PostPurchase — native offer card (iframe) -->
<iframe
  src="${iframeSrc}"
  title="PostPurchase offers"
  style="width:100%;max-width:420px;border:0;border-radius:12px;min-height:400px;display:block"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>`;
}

/** @deprecated Use buildEmbedSnippet with placement type */
export function buildEmbedSnippetWithOverrides(
  placementId: string,
  options?: EmbedSnippetOptions & { placementType?: ClickPlacement }
): string {
  return buildEmbedSnippet(
    placementId,
    options?.placementType ?? "native",
    options
  );
}
