import { Suspense } from "react";
import { WidgetPublicPage } from "@/components/publisher/widget-public-page";
import { WidgetUnavailable } from "@/components/publisher/widget-unavailable";
import { loadWidgetPartnerPageData } from "@/lib/widget-partner-page";

/** Full redirect-page offers at /p/{traffic_partner_id} (no redirect to /widget). */
export default async function RedirectOfferPage({
  params,
}: {
  params: Promise<{ placementId: string }>;
}) {
  const { placementId } = await params;
  const data = await loadWidgetPartnerPageData(placementId, {
    format: "redirect",
  });

  if (!data.ok) {
    if (data.reason === "no_service") {
      return (
        <WidgetUnavailable message="Offers page is temporarily unavailable (server configuration)." />
      );
    }
    return (
      <WidgetUnavailable message="Traffic partner not found or inactive. Check your traffic partner id in Integration." />
    );
  }

  return (
    <Suspense fallback={null}>
      <WidgetPublicPage
        partnerId={data.partnerId}
        companyName={data.companyName}
        format="redirect"
        embed={false}
      />
    </Suspense>
  );
}
