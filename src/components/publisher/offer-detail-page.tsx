"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button, CopyButton, Toggle } from "@/components/ui";
import { WidgetPreview } from "@/components/publisher/widget-preview";
import { offerTypeLabel } from "@/lib/publisher-offer-types";
import { buildEmbedSnippet } from "@/lib/publisher-embed";
import { placementWidgetPageUrl } from "@/lib/api/publisher-placements";
import type { PublisherPlacement } from "@/lib/publisher-types";
import { formatNumber } from "@/lib/utils";

export function OfferDetailPage({
  placement: initial,
  metrics,
}: {
  placement: PublisherPlacement;
  metrics: { clicks: number; conversions: number };
}) {
  const router = useRouter();
  const [placement, setPlacement] = useState(initial);

  const embedCode = buildEmbedSnippet(placement.id, placement.placement, {
    geo: placement.geo_country ?? undefined,
    widgetUrl: placementWidgetPageUrl(placement),
    submitElementId: placement.submit_element_id ?? undefined,
    postSubmitRedirectUrl: placement.post_submit_redirect_url ?? undefined,
  });

  async function toggleActive(active: boolean) {
    const res = await fetch(`/api/publisher/placements/${placement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) setPlacement((p) => ({ ...p, active }));
  }

  async function handleDelete() {
    if (!confirm("Delete this offer?")) return;
    const res = await fetch(`/api/publisher/placements/${placement.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/publisher/manager");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/publisher/manager"
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
              {placement.name}
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              {offerTypeLabel(placement.placement)} · {placement.page_path}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle checked={placement.active} onChange={toggleActive} />
          <span className="text-[12px] text-muted">
            {placement.active ? "Live" : "Paused"}
          </span>
          <Link href={`/publisher/manager/${placement.id}/edit`}>
            <Button type="button" variant="secondary" className="h-9 gap-1.5 text-[13px]">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Clicks", value: formatNumber(metrics.clicks) },
          { label: "Conversions", value: formatNumber(metrics.conversions) },
          {
            label: "Intent",
            value: placement.intent_product || "—",
            mono: false,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {item.label}
            </p>
            <p className="mt-1 text-[16px] font-semibold text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold">Preview</h2>
          <div className="mt-4">
            <WidgetPreview
              placementId={placement.id}
              placement={placement}
              allowPreview={!placement.active}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold">Install</h2>
          <p className="mt-1 text-[13px] text-muted">
            {placement.placement === "redirect"
              ? "Post-submit redirect URL for your form"
              : placement.placement === "popup"
                ? "Popup script — fires when your submit button is clicked"
                : "Native iframe for your confirmation page"}
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-[11px] leading-relaxed text-zinc-100">
            {embedCode}
          </pre>
          <div className="mt-3">
            <CopyButton text={embedCode} />
          </div>
        </section>
      </div>
    </div>
  );
}
