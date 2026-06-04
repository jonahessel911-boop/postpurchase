import type { Vertical } from "./types";

const BENCHMARKS: Record<Vertical, { ctr: number; cvr: number }> = {
  energy: { ctr: 0.034, cvr: 0.024 },
  home_improvement: { ctr: 0.025, cvr: 0.019 },
  finance: { ctr: 0.031, cvr: 0.032 },
  insurance: { ctr: 0.028, cvr: 0.026 },
  other: { ctr: 0.03, cvr: 0.022 },
};

function range(mid: number, spread = 0.15): [number, number] {
  return [Math.max(0, Math.floor(mid * (1 - spread))), Math.ceil(mid * (1 + spread))];
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

export interface DailyEstimate {
  clicks: [number, number];
  clicksLabel: string;
  conversions: [number, number];
  conversionsLabel: string;
  reach: [number, number];
  reachLabel: string;
  clicksFill: number;
  conversionsFill: number;
  reachFill: number;
}

export function estimateDailyResults(
  dailyBudget: number,
  cpc: number,
  vertical: Vertical
): DailyEstimate | null {
  if (dailyBudget <= 0 || cpc <= 0) return null;

  const { ctr, cvr } = BENCHMARKS[vertical];
  const clicksMid = dailyBudget / cpc;
  const clicks = range(clicksMid);
  const conversions = range(clicksMid * cvr);
  const reach = range(clicksMid / ctr);

  return {
    clicks,
    clicksLabel: `${formatCompact(clicks[0])} – ${formatCompact(clicks[1])}`,
    conversions,
    conversionsLabel: `${conversions[0]} – ${conversions[1]}`,
    reach,
    reachLabel: `${formatCompact(reach[0])} – ${formatCompact(reach[1])}`,
    clicksFill: Math.min(100, (clicksMid / 5000) * 100),
    conversionsFill: Math.min(100, ((clicksMid * cvr) / 200) * 100),
    reachFill: Math.min(100, (clicksMid / ctr / 150_000) * 100),
  };
}
