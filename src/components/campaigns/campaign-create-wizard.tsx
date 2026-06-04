"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, CopyButton } from "@/components/ui";
import { CompactAdPreview } from "@/components/campaigns/ad-preview-panel";
import { CampaignStepIndicator } from "@/components/campaigns/campaign-step-indicator";
import { WizardEstimatesPanel } from "@/components/campaigns/wizard-estimates-panel";
import {
  acceptForMediaType,
  detectMediaType,
  MediaPreview,
} from "@/components/campaigns/media-preview";
import {
  VERTICALS,
  CONVERSION_GOALS,
  DEFAULT_CPC_BY_VERTICAL,
  MEDIA_FORMAT_SPECS,
  MEDIA_TYPES,
  type AdDraft,
  type ConversionGoal,
  type EndDateMode,
  type Vertical,
} from "@/lib/types";
import { normalizeDestinationUrl } from "@/lib/url";
import {
  createEmptyAd,
  createVariationFromAd,
  trafficSharePercent,
} from "@/lib/ads";
import { verticalLabel } from "@/lib/campaign-types";
import { cn, formatCurrency, formatNumber, getApiDomain } from "@/lib/utils";

export type WizardSavePayload = {
  name: string;
  vertical: Vertical;
  cpc_bid: number;
  daily_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  end_date_mode: EndDateMode;
  destination_url: string;
  conversion_goal: ConversionGoal;
  ads: AdDraft[];
};

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

const STEP_META = [
  { title: "Campaign basics", subtitle: "Name your campaign and pick a category." },
  { title: "Creative", subtitle: "Write your offer and upload media." },
  { title: "Budget & launch", subtitle: "Set tracking, budget, and publish." },
] as const;

export function CampaignCreateWizard({
  onPersist,
  onFinalize,
}: {
  onPersist: (data: WizardSavePayload) => Promise<string>;
  onFinalize: (campaignId: string) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const uploadModeRef = useRef<"replace" | "variation">("replace");

  const [campaign, setCampaign] = useState({
    name: "",
    vertical: "energy" as Vertical,
    cpc_bid: DEFAULT_CPC_BY_VERTICAL.energy,
    daily_budget: 50,
    destination_url: "",
    conversion_goal: "lead" as ConversionGoal,
  });

  const [ads, setAds] = useState<AdDraft[]>(() => [createEmptyAd(0)]);
  const [selectedAdId, setSelectedAdId] = useState(ads[0].id);

  const selectedAd = ads.find((a) => a.id === selectedAdId) ?? ads[0];
  const postbackUrl = `${getApiDomain()}/postback?click_id={CLICK_ID}`;

  function updateCampaign<K extends keyof typeof campaign>(
    key: K,
    value: (typeof campaign)[K]
  ) {
    setCampaign((c) => ({ ...c, [key]: value }));
  }

  function updateVertical(vertical: Vertical) {
    setCampaign((c) => ({
      ...c,
      vertical,
      cpc_bid: DEFAULT_CPC_BY_VERTICAL[vertical],
    }));
  }

  function updateAd(id: string, patch: Partial<AdDraft>) {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function buildPayload(): WizardSavePayload {
    return {
      name: campaign.name.trim() || "Untitled campaign",
      vertical: campaign.vertical,
      cpc_bid: Number(campaign.cpc_bid),
      daily_budget: Number(campaign.daily_budget) || null,
      start_date: new Date().toISOString().split("T")[0],
      end_date: null,
      end_date_mode: "run_till_pause",
      destination_url: normalizeDestinationUrl(campaign.destination_url),
      conversion_goal: campaign.conversion_goal,
      ads,
    };
  }

  async function autoSave() {
    setSaving(true);
    setError("");
    try {
      const id = await onPersist(buildPayload());
      setDraftId(id);
      setSavedHint(true);
      setTimeout(() => setSavedHint(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!campaign.name.trim()) return "Enter a campaign name.";
      return null;
    }
    if (step === 2) {
      if (!selectedAd.title.trim()) return "Add a headline for your ad.";
      return null;
    }
    if (step === 3) {
      if (!normalizeDestinationUrl(campaign.destination_url)) {
        return "Enter a landing page URL.";
      }
      if (Number(campaign.daily_budget) <= 0) return "Set a daily budget.";
      if (Number(campaign.cpc_bid) <= 0) return "Set a CPC bid.";
      return null;
    }
    return null;
  }

  async function handleContinue() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    try {
      await autoSave();
      setStep((s) => Math.min(3, s + 1));
    } catch {
      /* error shown */
    }
  }

  async function handlePublish() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setPublishing(true);
    try {
      const id = await onPersist(buildPayload());
      setDraftId(id);
      await onFinalize(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  function openUpload(mode: "replace" | "variation") {
    uploadModeRef.current = mode;
    fileRef.current?.click();
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedAd) return;
    const mediaUrl = URL.createObjectURL(file);
    const mediaType = detectMediaType(file);
    if (uploadModeRef.current === "variation") {
      const variation = createVariationFromAd(
        selectedAd,
        ads,
        mediaUrl,
        mediaType
      );
      setAds((prev) => [...prev, variation]);
      setSelectedAdId(variation.id);
    } else {
      updateAd(selectedAd.id, { media_url: mediaUrl, media_type: mediaType });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeAd(id: string) {
    if (ads.length <= 1) return;
    const next = ads.filter((a) => a.id !== id);
    setAds(next);
    if (selectedAdId === id) setSelectedAdId(next[0].id);
  }

  const meta = STEP_META[step - 1];
  const share = trafficSharePercent(ads);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-zinc-50/60">
      <header className="shrink-0 border-b border-zinc-200/80 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href="/campaigns"
              className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Campaigns
            </Link>
            <p className="text-[12px] font-medium text-zinc-400">
              Step {step} of 3
              {savedHint ? (
                <span className="ml-2 text-emerald-600">Saved</span>
              ) : saving ? (
                <span className="ml-2 inline-flex items-center gap-1 text-zinc-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving…
                </span>
              ) : draftId ? (
                <span className="ml-2 text-zinc-400">Draft saved</span>
              ) : null}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
              {meta.title}
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">{meta.subtitle}</p>
          </div>
        </div>
        <div className="mx-auto mt-5 max-w-5xl">
          <CampaignStepIndicator currentStep={step} compact />
        </div>
      </header>

      <WizardEstimatesPanel
        dailyBudget={Number(campaign.daily_budget)}
        cpc={Number(campaign.cpc_bid)}
        vertical={campaign.vertical}
        collapsible
      />

      {error ? (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-center text-[13px] text-red-700 sm:px-6">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-0 flex-1 gap-8 py-5 pb-24 lg:pb-5">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
              {step === 1 ? (
                <WizardCard className="max-w-lg">
                  <FieldLabel hint="Shown in your campaigns list.">
                    Campaign name
                  </FieldLabel>
                  <input
                    autoFocus
                    value={campaign.name}
                    onChange={(e) => updateCampaign("name", e.target.value)}
                    placeholder="e.g. Summer Energy Push"
                    className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-[16px] font-medium text-zinc-900 outline-none transition-shadow focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                  />

                  <div className="mt-8">
                    <FieldLabel>Category</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {VERTICALS.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() => updateVertical(v.value)}
                          className={cn(
                            "rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors",
                            campaign.vertical === v.value
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                          )}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </WizardCard>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-4">
                    <WizardCard>
                      <FieldLabel>Headline</FieldLabel>
                      <input
                        autoFocus
                        value={selectedAd.title}
                        onChange={(e) =>
                          updateAd(selectedAd.id, { title: e.target.value })
                        }
                        placeholder="Get Solar & Save Up to 70%"
                        className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-[15px] font-medium outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                      />

                      <div className="mt-5">
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                          value={selectedAd.subheadline}
                          onChange={(e) =>
                            updateAd(selectedAd.id, {
                              subheadline: e.target.value,
                            })
                          }
                          rows={2}
                          placeholder="Short supporting line for your offer."
                          className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-[14px] outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                        />
                      </div>

                      <div className="mt-5">
                        <FieldLabel>Call to action</FieldLabel>
                        <input
                          value={selectedAd.cta_text}
                          onChange={(e) =>
                            updateAd(selectedAd.id, { cta_text: e.target.value })
                          }
                          placeholder="Get my quote"
                          className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-[14px] outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                        />
                      </div>
                    </WizardCard>

                    <WizardCard>
                      <FieldLabel
                        hint={`${MEDIA_FORMAT_SPECS[selectedAd.media_type].formats} · ${MEDIA_FORMAT_SPECS[selectedAd.media_type].size}`}
                      >
                        Media
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {selectedAd.media_url ? (
                          <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-zinc-200">
                            <MediaPreview
                              url={selectedAd.media_url}
                              mediaType={selectedAd.media_type}
                              alt=""
                            />
                            <button
                              type="button"
                              onClick={() => openUpload("replace")}
                              className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium shadow"
                            >
                              Replace
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openUpload("replace")}
                            className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
                          >
                            <Upload className="h-5 w-5" />
                            <span className="text-[11px] font-medium">Upload</span>
                          </button>
                        )}
                        {selectedAd.media_url ? (
                          <button
                            type="button"
                            onClick={() => openUpload("variation")}
                            className="flex h-24 w-32 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-zinc-300 px-2 text-center text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
                          >
                            <Upload className="h-4 w-4" />
                            Add variant
                          </button>
                        ) : null}
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept={acceptForMediaType(selectedAd.media_type)}
                        className="hidden"
                        onChange={handleUpload}
                      />

                      <details className="mt-4 group">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-800">
                          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                          Advanced
                        </summary>
                        <div className="mt-3 flex rounded-lg border border-zinc-200 p-0.5">
                          {MEDIA_TYPES.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                updateAd(selectedAd.id, { media_type: value })
                              }
                              className={cn(
                                "flex-1 rounded-md py-1.5 text-[11px] font-medium",
                                selectedAd.media_type === value
                                  ? "bg-zinc-900 text-white"
                                  : "text-zinc-500"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </details>
                    </WizardCard>

                    <div className="lg:hidden">
                      <WizardCard>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          Live preview
                        </p>
                        <CompactAdPreview
                          title={selectedAd.title}
                          subheadline={selectedAd.subheadline}
                          mediaUrl={selectedAd.media_url}
                          mediaType={selectedAd.media_type}
                          ctaText={selectedAd.cta_text}
                          compact
                        />
                      </WizardCard>
                    </div>

                    {ads.length > 1 ? (
                      <WizardCard className="!py-4">
                        <p className="mb-2 text-[12px] font-medium text-zinc-600">
                          Ad variants · {formatNumber(share, 1)}% traffic each
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {ads.map((ad) => (
                            <button
                              key={ad.id}
                              type="button"
                              onClick={() => setSelectedAdId(ad.id)}
                              className={cn(
                                "rounded-md border px-2.5 py-1 text-[12px] font-medium",
                                ad.id === selectedAdId
                                  ? "border-zinc-900 bg-zinc-900 text-white"
                                  : "border-zinc-200 text-zinc-600"
                              )}
                            >
                              {ad.name}
                            </button>
                          ))}
                          {ads.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeAd(selectedAd.id)}
                              className="inline-flex items-center gap-1 px-2 text-[12px] text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </WizardCard>
                    ) : null}
                  </div>

                  <div className="hidden lg:block">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Live preview
                    </p>
                    <div className="sticky top-4">
                      <CompactAdPreview
                        title={selectedAd.title}
                        subheadline={selectedAd.subheadline}
                        mediaUrl={selectedAd.media_url}
                        mediaType={selectedAd.media_type}
                        ctaText={selectedAd.cta_text}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4 max-w-xl">
                  <WizardCard>
                    <FieldLabel hint="click_id is appended automatically on click.">
                      Landing page URL
                    </FieldLabel>
                    <input
                      autoFocus
                      value={campaign.destination_url}
                      onChange={(e) =>
                        updateCampaign(
                          "destination_url",
                          normalizeDestinationUrl(e.target.value)
                        )
                      }
                      placeholder="https://yoursite.com/landing"
                      className="h-10 w-full rounded-lg border border-zinc-200 px-3 font-mono text-[13px] outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                    />

                    <div className="mt-5">
                      <FieldLabel>Conversion goal</FieldLabel>
                      <select
                        value={campaign.conversion_goal}
                        onChange={(e) =>
                          updateCampaign(
                            "conversion_goal",
                            e.target.value as ConversionGoal
                          )
                        }
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[14px] outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                      >
                        {CONVERSION_GOALS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="mt-5 flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-800"
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          showAdvanced && "rotate-180"
                        )}
                      />
                      {showAdvanced ? "Hide" : "Show"} tracking details
                    </button>

                    {showAdvanced ? (
                      <div className="mt-3 rounded-lg bg-zinc-50 p-3">
                        <p className="text-[12px] font-medium text-zinc-700">
                          Postback URL
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Fire on conversion with click_id only.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="min-w-0 flex-1 truncate rounded border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[10px] text-zinc-600">
                            {postbackUrl}
                          </code>
                          <CopyButton text={postbackUrl} />
                        </div>
                      </div>
                    ) : null}
                  </WizardCard>

                  <WizardCard>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Daily budget</FieldLabel>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-zinc-400">
                            €
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={campaign.daily_budget}
                            onChange={(e) =>
                              updateCampaign(
                                "daily_budget",
                                Number(e.target.value)
                              )
                            }
                            className="h-11 w-full rounded-lg border border-zinc-200 pl-8 pr-3 text-[15px] font-medium tabular-nums outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel
                          hint={`Typical for ${verticalLabel(campaign.vertical)}: ${formatCurrency(DEFAULT_CPC_BY_VERTICAL[campaign.vertical])}`}
                        >
                          CPC bid
                        </FieldLabel>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-zinc-400">
                            €
                          </span>
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={campaign.cpc_bid}
                            onChange={(e) =>
                              updateCampaign("cpc_bid", Number(e.target.value))
                            }
                            className="h-11 w-full rounded-lg border border-zinc-200 pl-8 pr-3 text-[15px] font-medium tabular-nums outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5"
                          />
                        </div>
                      </div>
                    </div>
                  </WizardCard>

                  <WizardCard className="!py-4">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
                      Review
                    </p>
                    <dl className="mt-3 space-y-2 text-[13px]">
                      <ReviewRow label="Campaign" value={campaign.name} />
                      <ReviewRow
                        label="Category"
                        value={verticalLabel(campaign.vertical)}
                      />
                      <ReviewRow label="Headline" value={selectedAd.title} />
                      <ReviewRow
                        label="Budget"
                        value={`${formatCurrency(Number(campaign.daily_budget))}/day · ${formatCurrency(Number(campaign.cpc_bid))} CPC`}
                      />
                    </dl>
                  </WizardCard>
                </div>
              ) : null}
            </div>

            <aside className="hidden w-[240px] shrink-0 lg:block xl:w-[260px]">
              <div className="sticky top-4 space-y-4">
                <WizardEstimatesPanel
                  dailyBudget={Number(campaign.daily_budget)}
                  cpc={Number(campaign.cpc_bid)}
                  vertical={campaign.vertical}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-16 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md md:bottom-0 md:left-[240px]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-4 text-[13px]"
            disabled={step === 1 || saving || publishing}
            onClick={() => {
              setError("");
              setStep((s) => Math.max(1, s - 1));
            }}
          >
            Previous
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              className="h-10 min-w-[120px] rounded-lg px-6 text-[13px] font-medium"
              disabled={saving || publishing}
              onClick={() => handleContinue()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Continue"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10 min-w-[140px] rounded-lg bg-[#5B47FB] px-6 text-[13px] font-medium hover:bg-[#4f3fe0]"
              disabled={saving || publishing}
              onClick={() => handlePublish()}
            >
              {publishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                "Publish campaign"
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="truncate text-right font-medium text-zinc-900">{value || "—"}</dd>
    </div>
  );
}
