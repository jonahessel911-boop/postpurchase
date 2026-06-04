/** Client-safe publisher metrics helpers (no server imports). */
export type {
  PlacementWithMetrics,
  PublisherMetricsSnapshot,
} from "@/lib/api/publisher-metrics-shared";

export {
  placementsWithMetrics,
  publisherTotals,
  buildPublisherDashboardData,
} from "@/lib/api/publisher-metrics-shared";

export type {
  PublisherDashboardTotals,
} from "@/lib/api/publisher-metrics-shared";
