"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button, CopyButton } from "@/components/ui";
import { OfferStepIndicator } from "@/components/publisher/offer-step-indicator";
import { OfferTypePicker } from "@/components/publisher/offer-type-picker";
import { WidgetPreview } from "@/components/publisher/widget-preview";
import { offerTypeLabel } from "@/lib/publisher-offer-types";
import {
  buildEmbedSnippet,
  buildRedirectPageUrl,
} from "@/lib/publisher-embed";
import { placementWidgetPageUrl } from "@/lib/api/publisher-placements";
import type { PublisherPlacement } from "@/lib/publisher-types";
import type { ClickPlacement } from "@/lib/types";
import { cn } from "@/lib/utils";

function WizardCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <label className="text-[13px] font-medium text-zinc-800">{children}</label>
      {hint ? <p className="mt-0.5 text-[12px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10";

export function OfferCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [offerType, setOfferType] = useState<ClickPlacement | null>(null);
  const [placementId, setPlacementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "Order confirmation",
    site_url: "",
    page_path: "/confirmation",
    intent_product: "",
    geo_country: "",
    max_offers: 3,
    submit_element_id: "submit-button",
    post_submit_redirect_url: "",
  });

  const savedPlacement: PublisherPlacement | null = placementId
    ? {
        id: placementId,
        publisher_id: "",
        name: form.name,
        site_url: form.site_url,
        page_path: form.page_path,
        intent_product: form.intent_product,
        placement: offerType ?? "native",
        geo_country: form.geo_country || null,
        max_offers: form.max_offers,
        active: true,
        submit_element_id: form.submit_element_id,
        post_submit_redirect_url: form.post_submit_redirect_url,
        created_at: "",
        updated_at: "",
      }
    : null;

  async function persistPlacement(active = false) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        site_url: form.site_url,
        page_path: form.page_path,
        intent_product: form.intent_product,
        placement: offerType,
        geo_country: form.geo_country || null,
        max_offers: form.max_offers,
        submit_element_id:
          offerType === "popup" ? form.submit_element_id : null,
        post_submit_redirect_url:
          offerType === "redirect"
            ? form.post_submit_redirect_url ||
              (placementId ? buildRedirectPageUrl(placementId) : null)
            : null,
        active,
      };

      const url = placementId
        ? `/api/publisher/placements/${placementId}`
        : "/api/publisher/placements";
      const method = placementId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");

      setPlacementId(json.placement.id);
      return json.placement.id as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleContinueFromStep1() {
    if (!offerType) return;
    if (!placementId) {
      const id = await persistPlacement(true);
      if (!id) return;
      if (offerType === "redirect") {
        setForm((f) => ({
          ...f,
          post_submit_redirect_url: buildRedirectPageUrl(id),
        }));
      }
    }
    setStep(2);
  }

  async function handleNextFromStep2() {
    if (!offerType) return;
    const id = await persistPlacement(true);
    if (id) {
      if (offerType === "redirect" && !form.post_submit_redirect_url) {
        setForm((f) => ({
          ...f,
          post_submit_redirect_url: buildRedirectPageUrl(id),
        }));
      }
      setStep(3);
    }
  }

  async function handleGoLive() {
    const id = await persistPlacement(true);
    if (id) {
      router.push(`/publisher/manager/${id}`);
      router.refresh();
    }
  }

  const embedCode =
    placementId && offerType
      ? buildEmbedSnippet(placementId, offerType, {
          submitElementId: form.submit_element_id,
        })
      : "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfbfd]">
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/publisher/manager"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-zinc-50 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold text-zinc-950">
              Add offer
            </h1>
            <p className="text-[12px] text-muted">
              {step === 1
                ? "Choose how offers appear on your confirmation page"
                : step === 2
                  ? "Configure your page and intent"
                  : "Install on your site"}
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <OfferStepIndicator currentStep={step} />

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          ) : null}

          {step === 1 ? (
            <WizardCard>
              <h2 className="text-[15px] font-semibold text-zinc-900">
                Offer type
              </h2>
              <p className="mt-1 text-[13px] text-zinc-500">
                Pick one format for this confirmation page placement.
              </p>
              <div className="mt-5">
                <OfferTypePicker value={offerType} onChange={setOfferType} />
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  className="h-9 text-[13px]"
                  disabled={!offerType}
                  onClick={handleContinueFromStep1}
                >
                  Continue
                </Button>
              </div>
            </WizardCard>
          ) : null}

          {step === 2 && offerType ? (
            <WizardCard>
              <p className="mb-4 inline-flex rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                {offerTypeLabel(offerType)}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>Offer name</FieldLabel>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel hint="Your website domain">Site URL</FieldLabel>
                  <input
                    className={inputClass}
                    value={form.site_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, site_url: e.target.value }))
                    }
                    placeholder="https://myshop.com"
                  />
                </div>
                <div>
                  <FieldLabel hint="Thank-you / confirmation path">
                    Page path
                  </FieldLabel>
                  <input
                    className={inputClass}
                    value={form.page_path}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, page_path: e.target.value }))
                    }
                    placeholder="/order/confirmation"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel hint="Primary product intent on this page">
                    Intent product
                  </FieldLabel>
                  <input
                    className={inputClass}
                    value={form.intent_product}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        intent_product: e.target.value,
                      }))
                    }
                    placeholder="e.g. Solar panels"
                  />
                </div>
                <div>
                  <FieldLabel>Default GEO</FieldLabel>
                  <input
                    className={inputClass}
                    value={form.geo_country}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        geo_country: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="NL"
                    maxLength={2}
                  />
                </div>
                <div>
                  <FieldLabel>Max offers shown</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className={inputClass}
                    value={form.max_offers}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        max_offers: Number(e.target.value) || 3,
                      }))
                    }
                  />
                </div>

                {offerType === "redirect" ? (
                  <div className="sm:col-span-2">
                    <FieldLabel hint="Paste into your form's redirect-after-submit setting">
                      Redirect URL
                    </FieldLabel>
                    <input
                      className={inputClass}
                      value={
                        form.post_submit_redirect_url ||
                        (placementId
                          ? buildRedirectPageUrl(placementId)
                          : "")
                      }
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          post_submit_redirect_url: e.target.value,
                        }))
                      }
                      placeholder={
                        placementId
                          ? buildRedirectPageUrl(placementId)
                          : "Saved after you continue"
                      }
                    />
                  </div>
                ) : null}

                {offerType === "popup" ? (
                  <div className="sm:col-span-2">
                    <FieldLabel hint='The id attribute on your submit button, e.g. id="checkout-submit"'>
                      Submit button element id
                    </FieldLabel>
                    <input
                      className={inputClass}
                      value={form.submit_element_id}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          submit_element_id: e.target.value.replace(
                            /\s/g,
                            ""
                          ),
                        }))
                      }
                      placeholder="submit-button"
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 text-[13px]"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="h-9 text-[13px]"
                  disabled={saving}
                  onClick={handleNextFromStep2}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Continue
                </Button>
              </div>
            </WizardCard>
          ) : null}

          {step === 3 && placementId && offerType && savedPlacement ? (
            <div className="space-y-4">
              <WizardCard>
                <h2 className="text-[15px] font-semibold">Preview</h2>
                <p className="mt-1 text-[13px] text-zinc-500">
                  How offers will look for visitors.
                </p>
                <div className="mt-4">
                  <WidgetPreview
                    partnerId={placementId}
                    format={offerType}
                    allowPreview
                    demo
                  />
                </div>
              </WizardCard>

              <WizardCard>
                <h2 className="text-[15px] font-semibold">Install</h2>
                <p className="mt-1 text-[13px] text-zinc-500">
                  {offerType === "redirect"
                    ? "Use this URL as your form's post-submit redirect destination."
                    : offerType === "popup"
                      ? `Attach to your submit button #${form.submit_element_id || "submit-button"}.`
                      : "Paste this iframe below your thank-you message."}
                </p>
                <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-[11px] leading-relaxed text-zinc-100">
                  {embedCode}
                </pre>
                <div className="mt-3">
                  <CopyButton text={embedCode} />
                </div>
              </WizardCard>

              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 text-[13px]"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="h-9 gap-1.5 text-[13px]"
                  disabled={saving}
                  onClick={handleGoLive}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save & go to Manager
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
