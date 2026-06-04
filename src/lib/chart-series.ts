import {
  chartDaysForPreset,
  dateRangeBounds,
  type DateRangePreset,
} from "@/lib/date-range";

export type ChartGranularity = "daily" | "weekly" | "monthly" | "yearly";

export const CHART_GRANULARITY_OPTIONS: {
  value: ChartGranularity;
  label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export interface ChartSeriesPoint {
  date: string;
  spend: number;
  clicks: number;
  conversions: number;
  label: string;
}

type ClickPoint = { cost: number | string; created_at: string };
type ConversionPoint = {
  value: number | string;
  created_at: string;
};

/** Calendar date key in UTC — matches `created_at.split("T")[0]` from the DB. */
function utcDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function weekStartUTC(d: Date): Date {
  const start = utcStartOfDay(d);
  const dow = start.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1;
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
}

function bucketKeyFromDate(d: Date, granularity: ChartGranularity): string {
  switch (granularity) {
    case "daily":
      return utcDateKey(utcStartOfDay(d));
    case "weekly":
      return utcDateKey(weekStartUTC(d));
    case "monthly":
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
    case "yearly":
      return `${d.getUTCFullYear()}-01-01`;
  }
}

export function bucketKeyFromIso(
  iso: string,
  granularity: ChartGranularity
): string {
  return bucketKeyFromDate(new Date(iso), granularity);
}

function advanceBucket(cursor: Date, granularity: ChartGranularity): void {
  switch (granularity) {
    case "daily":
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      break;
    case "weekly":
      cursor.setUTCDate(cursor.getUTCDate() + 7);
      break;
    case "monthly":
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      break;
    case "yearly":
      cursor.setUTCFullYear(cursor.getUTCFullYear() + 1);
      break;
  }
}

function generateBucketKeys(
  since: Date,
  until: Date,
  granularity: ChartGranularity
): string[] {
  const keys: string[] = [];
  let cursor =
    granularity === "weekly"
      ? weekStartUTC(since)
      : utcStartOfDay(since);
  const end = utcStartOfDay(until);

  while (cursor <= end) {
    keys.push(bucketKeyFromDate(cursor, granularity));
    advanceBucket(cursor, granularity);
  }

  return keys;
}

function formatBucketLabel(
  key: string,
  granularity: ChartGranularity
): string {
  const d = new Date(key + "T12:00:00Z");
  switch (granularity) {
    case "daily":
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    case "weekly": {
      const end = new Date(d);
      end.setUTCDate(end.getUTCDate() + 6);
      const a = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      const b = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      return `${a} – ${b}`;
    }
    case "monthly":
      return d.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    case "yearly":
      return String(d.getUTCFullYear());
  }
}

export function defaultGranularityForPreset(
  preset: DateRangePreset
): ChartGranularity {
  switch (preset) {
    case "today":
    case "7d":
    case "30d":
      return "daily";
    case "90d":
      return "weekly";
    case "all":
      return "monthly";
  }
}

export function buildChartSeries(
  clicks: ClickPoint[],
  conversions: ConversionPoint[],
  preset: DateRangePreset,
  granularity: ChartGranularity
): ChartSeriesPoint[] {
  const { since, until } = dateRangeBounds(preset);
  let rangeStart: Date;
  if (since) {
    rangeStart = since;
  } else {
    const times = [
      ...clicks.map((c) => new Date(c.created_at).getTime()),
      ...conversions.map((c) => new Date(c.created_at).getTime()),
    ].filter((t) => !Number.isNaN(t));
    if (times.length) {
      rangeStart = new Date(Math.min(...times));
    } else {
      const d = new Date(until);
      d.setDate(d.getDate() - (chartDaysForPreset(preset) - 1));
      rangeStart = d;
    }
  }

  const bucketKeys = generateBucketKeys(rangeStart, until, granularity);
  const spendByKey = new Map<string, number>();
  const clicksByKey = new Map<string, number>();
  const conversionsByKey = new Map<string, number>();

  function ensureKey(key: string) {
    if (!spendByKey.has(key)) {
      spendByKey.set(key, 0);
      clicksByKey.set(key, 0);
      conversionsByKey.set(key, 0);
    }
  }

  for (const key of bucketKeys) ensureKey(key);

  for (const click of clicks) {
    const key = bucketKeyFromIso(click.created_at, granularity);
    ensureKey(key);
    spendByKey.set(key, (spendByKey.get(key) ?? 0) + Number(click.cost));
    clicksByKey.set(key, (clicksByKey.get(key) ?? 0) + 1);
  }

  for (const conv of conversions) {
    const key = bucketKeyFromIso(conv.created_at, granularity);
    ensureKey(key);
    conversionsByKey.set(key, (conversionsByKey.get(key) ?? 0) + 1);
  }

  const allKeys = [...new Set([...bucketKeys, ...spendByKey.keys()])].sort();

  return allKeys.map((key) => ({
    date: key,
    spend: spendByKey.get(key) ?? 0,
    clicks: clicksByKey.get(key) ?? 0,
    conversions: conversionsByKey.get(key) ?? 0,
    label: formatBucketLabel(key, granularity),
  }));
}
