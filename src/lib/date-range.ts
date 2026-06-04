export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "all";

export const DATE_RANGE_PRESETS: {
  value: DateRangePreset;
  label: string;
}[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export function dateRangeBounds(preset: DateRangePreset): {
  since: Date | null;
  until: Date;
} {
  const until = new Date();
  until.setHours(23, 59, 59, 999);

  if (preset === "all") {
    return { since: null, until };
  }

  const since = new Date(until);
  if (preset === "today") {
    since.setHours(0, 0, 0, 0);
    return { since, until };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  return { since, until };
}

export function chartDaysForPreset(preset: DateRangePreset): number {
  switch (preset) {
    case "today":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
      return 90;
  }
}

export function isWithinDateRange(
  iso: string,
  since: Date | null,
  until: Date
): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (since && t < since.getTime()) return false;
  if (t > until.getTime()) return false;
  return true;
}

export function formatDateRangeLabel(preset: DateRangePreset): string {
  if (preset === "today") return "Today";
  const { since, until } = dateRangeBounds(preset);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!since) return "All time";
  const yearOpts = { year: "numeric" as const };
  const startYear = since.getFullYear();
  const endYear = until.getFullYear();
  const start = fmt(since);
  const end = fmt(until);
  if (startYear !== endYear) {
    return `${since.toLocaleDateString("en-US", { month: "short", day: "numeric", ...yearOpts })} – ${until.toLocaleDateString("en-US", { month: "short", day: "numeric", ...yearOpts })}`;
  }
  return `${start} – ${end}, ${endYear}`;
}

/** Map toolbar filter string to preset (legacy "30d" default). */
export function toolbarDateToPreset(value: string): DateRangePreset {
  if (
    value === "today" ||
    value === "7d" ||
    value === "30d" ||
    value === "90d" ||
    value === "all"
  ) {
    return value;
  }
  return "30d";
}
