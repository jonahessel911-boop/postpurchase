import { notFound } from "next/navigation";
import { OfferDetailPage } from "@/components/publisher/offer-detail-page";
import {
  loadPublisherDashboardContext,
  placementsWithMetrics,
} from "@/lib/api/publisher-metrics-server";

export default async function OfferDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) notFound();

  const placement = ctx.snapshot.placements.find((p) => p.id === id);
  if (!placement) notFound();

  const withMetrics = placementsWithMetrics(ctx.snapshot, "all").find(
    (p) => p.id === id
  );

  return (
    <OfferDetailPage
      placement={placement}
      metrics={withMetrics?.metrics ?? { clicks: 0, conversions: 0 }}
    />
  );
}
