"use client";

import { useEffect, useState } from "react";
import type { WidgetOffersResponse } from "@/lib/publisher-types";
import { WidgetOffersView } from "@/components/publisher/widget-offers-view";
import type { PublisherPlacement } from "@/lib/publisher-types";
import { placementWidgetPageUrl } from "@/lib/api/publisher-placements";
import { WIDGET_DEMO_OFFERS } from "@/lib/widget-demo-offers";
import { buildWidgetClickUrl } from "@/lib/widget-url";
import type { ClickPlacement } from "@/lib/types";
import { Loader2 } from "lucide-react";

export function WidgetPreview({
  placementId,
  placement,
  allowPreview = false,
  /** Install wizard: show 3 sample offers, not live campaigns */
  demo = false,
}: {
  placementId: string;
  placement?: PublisherPlacement;
  allowPreview?: boolean;
  demo?: boolean;
}) {
  const [data, setData] = useState<WidgetOffersResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!demo);
  const [popupDismissed, setPopupDismissed] = useState(false);

  const placementType: ClickPlacement =
    placement?.placement ?? data?.placement ?? "native";

  useEffect(() => {
    if (demo) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setPopupDismissed(false);

    const previewParam = allowPreview ? "&preview=1" : "";
    fetch(`/api/widget/offers?placement_id=${placementId}${previewParam}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load preview");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placementId, allowPreview, demo]);

  if (!demo && loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!demo && error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
        {error}
      </p>
    );
  }

  const offers = demo ? WIDGET_DEMO_OFFERS : data?.offers ?? [];

  if (!demo && !offers.length) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted">
        No live offers right now. Turn on advertiser campaigns with active ads
        and wallet balance.
      </p>
    );
  }

  const widgetUrl = placement
    ? placementWidgetPageUrl(placement)
    : undefined;

  const getClickHref = (offer: (typeof offers)[0]) => {
    if (demo) return "#";
    if (!placement || !data) return "#";
    return buildWidgetClickUrl(offer.campaign_id, {
      widgetUrl: widgetUrl || "",
      publisherId: placement.publisher_id,
      intentProduct: placement.intent_product,
      productChoose: offer.product_label,
      productSelection: offers.map((o) => o.product_label),
      placement: placement.placement,
      geoCountry: placement.geo_country,
      adId: offer.ad_id,
    });
  };

  if (placementType === "popup" && popupDismissed) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted">
        Popup dismissed (preview)
      </p>
    );
  }

  const cardsOnly = demo || placementType === "native";


  return (
    <WidgetOffersView
      offers={offers}
      placement={placementType}
      getClickHref={getClickHref}
      cardsOnly={cardsOnly}
      onDismiss={
        demo || placementType !== "popup"
          ? undefined
          : () => setPopupDismissed(true)
      }
    />
  );
}
