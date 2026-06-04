const CLICK_ID_PLACEHOLDER = "{CLICK_ID}";

/** Strip any existing click_id param so we store the base destination URL only. */
export function normalizeDestinationUrl(url: string): string {
  if (!url.trim()) return "";

  try {
    const parsed = new URL(url.trim());
    parsed.searchParams.delete("click_id");
    const normalized = parsed.toString();
    return normalized.endsWith("?") ? normalized.slice(0, -1) : normalized;
  } catch {
    return url
      .trim()
      .replace(/([?&])click_id=[^&]*/g, (_, sep) => (sep === "?" ? "?" : ""))
      .replace(/\?&/g, "?")
      .replace(/\?$/, "");
  }
}

/** Preview URL shown in the editor — click_id appended automatically on redirect. */
export function destinationUrlWithClickId(
  baseUrl: string,
  clickId = CLICK_ID_PLACEHOLDER
): string {
  const base = normalizeDestinationUrl(baseUrl);
  if (!base) return "";

  try {
    const parsed = new URL(base);
    parsed.searchParams.set("click_id", clickId);
    return parsed.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}click_id=${clickId}`;
  }
}

export { CLICK_ID_PLACEHOLDER };
