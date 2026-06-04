import { notFound } from "next/navigation";
import { OfferEditorClient } from "@/components/publisher/offer-editor-client";
import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";

export default async function OfferEditRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) notFound();

  const placement = ctx.snapshot.placements.find((p) => p.id === id);
  if (!placement) notFound();

  return <OfferEditorClient placement={placement} />;
}
