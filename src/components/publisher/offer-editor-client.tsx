"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { OfferTypePicker } from "@/components/publisher/offer-type-picker";
import { offerTypeLabel } from "@/lib/publisher-offer-types";
import { buildRedirectPageUrl } from "@/lib/publisher-embed";
import type { PublisherPlacement } from "@/lib/publisher-types";
import type { ClickPlacement } from "@/lib/types";

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10";

export function OfferEditorClient({
  placement,
}: {
  placement: PublisherPlacement;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: placement.name,
    site_url: placement.site_url,
    page_path: placement.page_path,
    intent_product: placement.intent_product,
    placement: placement.placement,
    geo_country: placement.geo_country ?? "",
    max_offers: placement.max_offers,
    active: placement.active,
    submit_element_id: placement.submit_element_id ?? "submit-button",
    post_submit_redirect_url:
      placement.post_submit_redirect_url ??
      buildRedirectPageUrl(placement.id),
  });

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/publisher/placements/${placement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          geo_country: form.geo_country || null,
          submit_element_id:
            form.placement === "popup" ? form.submit_element_id : null,
          post_submit_redirect_url:
            form.placement === "redirect"
              ? form.post_submit_redirect_url
              : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      router.push(`/publisher/manager/${placement.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfbfd]">
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href={`/publisher/manager/${placement.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold">Edit offer</h1>
            <p className="text-[12px] text-muted">{placement.name}</p>
          </div>
          <Button
            type="button"
            className="h-9 gap-1.5 text-[13px]"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          ) : null}

          <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-[14px] font-semibold">Offer type</h2>
            <p className="mt-1 text-[12px] text-zinc-500">
              Current: {offerTypeLabel(form.placement)}
            </p>
            <div className="mt-4">
              <OfferTypePicker
                value={form.placement}
                onChange={(t: ClickPlacement) =>
                  setForm((f) => ({ ...f, placement: t }))
                }
              />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-medium">
                  Name
                </label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium">
                  Site URL
                </label>
                <input
                  className={inputClass}
                  value={form.site_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, site_url: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium">
                  Page path
                </label>
                <input
                  className={inputClass}
                  value={form.page_path}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, page_path: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-medium">
                  Intent product
                </label>
                <input
                  className={inputClass}
                  value={form.intent_product}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      intent_product: e.target.value,
                    }))
                  }
                />
              </div>

              {form.placement === "redirect" ? (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[12px] font-medium">
                    Redirect URL
                  </label>
                  <p className="mb-1.5 text-[11px] text-zinc-400">
                    Post-submit URL in your form settings
                  </p>
                  <input
                    className={inputClass}
                    value={form.post_submit_redirect_url}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        post_submit_redirect_url: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}

              {form.placement === "popup" ? (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[12px] font-medium">
                    Submit button element id
                  </label>
                  <input
                    className={inputClass}
                    value={form.submit_element_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        submit_element_id: e.target.value.replace(/\s/g, ""),
                      }))
                    }
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
