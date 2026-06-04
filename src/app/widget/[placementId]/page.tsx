import { Suspense } from "react";
import { WidgetPublicPage } from "@/components/publisher/widget-public-page";
import { WidgetUnavailable } from "@/components/publisher/widget-unavailable";
import { loadWidgetPartnerPageData } from "@/lib/widget-partner-page";

export default async function WidgetPartnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ placementId: string }>;
  searchParams: Promise<{ embed?: string; format?: string }>;
}) {
  const { placementId } = await params;
  const sp = await searchParams;
  const data = await loadWidgetPartnerPageData(placementId, sp);

  if (!data.ok) {
    if (data.reason === "no_service") {
      return (
        <WidgetUnavailable message="Widget is temporarily unavailable (server configuration)." />
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
        format={data.format}
        embed={data.embed}
      />
    </Suspense>
  );
}
