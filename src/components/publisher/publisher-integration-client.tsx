"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Copy, Check } from "lucide-react";
import { CopyButton, PageHeader } from "@/components/ui";
import { WidgetPreview } from "@/components/publisher/widget-preview";
import { OFFER_TYPES, offerTypeLabel } from "@/lib/publisher-offer-types";
import {
  buildPartnerEmbedSnippet,
  TRAFFIC_PARTNER_ID_LABEL,
} from "@/lib/publisher-integration";
import { getResourcesExampleOrigin } from "@/lib/widget-url";
import type { ClickPlacement } from "@/lib/types";
import { cn } from "@/lib/utils";

function CopyIdButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[12px] font-medium text-muted hover:bg-zinc-50"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy ID"}
    </button>
  );
}

export function PublisherIntegrationClient({
  partnerId,
  companyName,
  submitElementId: initialSubmitId,
}: {
  partnerId: string;
  companyName: string;
  submitElementId: string;
}) {
  const [openFormat, setOpenFormat] = useState<ClickPlacement | "">("native");
  const [submitElementId, setSubmitElementId] = useState(initialSubmitId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const platformOrigin = getResourcesExampleOrigin();

  const snippets = useMemo(
    () =>
      Object.fromEntries(
        OFFER_TYPES.map((t) => [
          t.id,
          buildPartnerEmbedSnippet(partnerId, t.id, {
            submitElementId,
          }),
        ])
      ) as Record<ClickPlacement, string>,
    [partnerId, submitElementId]
  );

  async function saveSubmitId() {
    setSaving(true);
    try {
      const res = await fetch("/api/publisher/integration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submit_element_id: submitElementId }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Integration"
        action={
          <Link
            href="/publisher/resources"
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Installation guides →
          </Link>
        }
      />

      <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 sm:p-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {TRAFFIC_PARTNER_ID_LABEL}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
          Created when your traffic partner account was set up. Use this id in
          all install codes below — there is only one integration per partner,
          not separate offers.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="break-all rounded-lg bg-white px-3 py-2 font-mono text-[12px] text-accent shadow-sm">
            {partnerId}
          </code>
          <CopyIdButton text={partnerId} />
        </div>
        <p className="mt-3 text-[12px] text-muted">
          Platform:{" "}
          <code className="font-mono text-[11px]">{platformOrigin}</code> ·{" "}
          {companyName}
        </p>
        <p className="mt-2 text-[12px] text-muted">
          Site matching for which offers to show will be added later — offers
          are loaded for your traffic partner id automatically.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-[13px] font-semibold">Popup: trigger button id</h2>
        <p className="mt-1 text-[12px] text-muted">
          The HTML <code className="font-mono text-[11px]">id</code> of the
          button that should open the popup when clicked — must match exactly
          (e.g. <code className="font-mono text-[11px]">button-ada45a05</code>
          , not a different button on the page).
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-[13px]"
            value={submitElementId}
            onChange={(e) => {
              setSubmitElementId(e.target.value.replace(/\s/g, ""));
              setSaved(false);
            }}
            placeholder="submit-button"
          />
          <button
            type="button"
            disabled={saving}
            onClick={saveSubmitId}
            className="h-9 rounded-lg bg-accent px-4 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved ? (
            <span className="text-[12px] text-emerald-600">Saved</span>
          ) : null}
        </div>
      </div>

      <p className="text-[14px] text-muted">
        Choose a format, copy the code, and paste on your site. Three formats,
        one traffic partner id.
      </p>

      <div className="space-y-3">
        {OFFER_TYPES.map((type) => {
          const isOpen = openFormat === type.id;
          return (
            <div
              key={type.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenFormat(isOpen ? "" : type.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
              >
                <div>
                  <p className="text-[15px] font-semibold">
                    {offerTypeLabel(type.id)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {type.description}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-zinc-400 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen ? (
                <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        Install code
                      </p>
                      <CopyButton text={snippets[type.id]} />
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-[11px] leading-relaxed text-zinc-100">
                      {snippets[type.id]}
                    </pre>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                      Preview
                    </p>
                    <WidgetPreview
                      partnerId={partnerId}
                      format={type.id}
                      allowPreview
                      demo
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
