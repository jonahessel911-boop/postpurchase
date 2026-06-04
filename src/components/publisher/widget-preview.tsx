"use client";

import { useEffect, useState } from "react";
import type { WidgetOffersResponse } from "@/lib/publisher-types";
import { WidgetOffersView } from "@/components/publisher/widget-offers-view";
import { buildOfferClickUrl } from "@/lib/api/widget-offers";
import type { ClickPlacement } from "@/lib/types";
import { WIDGET_DEMO_OFFERS } from "@/lib/widget-demo-offers";
import { Loader2 } from "lucide-react";

export function WidgetPreview({
  partnerId,
  format = "native",
  allowPreview = false,
  demo = false,
}: {
  /** Traffic partner id */
  partnerId: string;
  format?: ClickPlacement;
  allowPreview?: boolean;
  demo?: boolean;
}) {
  const [data, setData] = useState<WidgetOffersResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!demo);
  const [popupDismissed, setPopupDismissed] = useState(false);

  useEffect(() => {
    if (demo) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setPopupDismissed(false);

    const previewParam = allowPreview ? "&preview=1" : "";
    fetch(
      `/api/widget/offers?publisher_id=${encodeURIComponent(partnerId)}&format=${format}${previewParam}`
    )
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
  }, [partnerId, format, allowPreview, demo]);

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
  const placementType = format;

  if (!demo && !offers.length) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted">
        No live offers right now. Turn on advertiser campaigns with active ads
        and wallet balance.
      </p>
    );
  }

  const getClickHref = (offer: (typeof offers)[0]) => {
    if (demo) return "#";
    if (!data) return "#";
    return buildOfferClickUrl(partnerId, placementType, offer, offers, {
      widgetUrl: typeof window !== "undefined" ? window.location.href : "",
      intentProduct: data.intent_product,
    });
  };

  if (placementType === "popup" && popupDismissed) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted">
        Popup dismissed (preview)
      </p>
    );
  }

  return (
    <WidgetOffersView
      offers={offers}
      placement={placementType}
      getClickHref={getClickHref}
      cardsOnly={demo || placementType === "native"}
      onDismiss={
        placementType === "popup" && !demo
          ? () => setPopupDismissed(true)
          : undefined
      }
    />
  );
}
