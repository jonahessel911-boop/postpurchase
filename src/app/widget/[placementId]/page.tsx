import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPlacementForWidget } from "@/lib/api/widget-offers";
import { WidgetPublicPage } from "@/components/publisher/widget-public-page";
import { hasServiceClient } from "@/lib/supabase/service";

export default async function WidgetPlacementPage({
  params,
}: {
  params: Promise<{ placementId: string }>;
}) {
  const { placementId } = await params;

  if (!hasServiceClient()) {
    return (
      <p className="p-8 text-center text-[14px] text-muted">
        Widget preview unavailable (service role not configured).
      </p>
    );
  }

  const placement = await getPlacementForWidget(placementId);
  if (!placement) notFound();

  return (
    <Suspense fallback={null}>
      <WidgetPublicPage placementId={placementId} placement={placement} />
    </Suspense>
  );
}
