"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, CopyButton } from "@/components/ui";
import { CompactAdPreview, AdPreviewThumbnail, OfferPreviewModal } from "@/components/campaigns/ad-preview-panel";
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
import {
  normalizeDestinationUrl,
} from "@/lib/url";
import {
  createEmptyAd,
  adToDraft,
  publishedAds,
  trafficSharePercent,
  createVariationFromAd,
} from "@/lib/ads";
import type { CampaignWithMetrics } from "@/lib/campaign-types";
import { verticalLabel } from "@/lib/campaign-types";
import { CampaignServerTrackingStatus } from "@/components/campaigns/campaign-server-tracking-status";
import { estimateDailyResults } from "@/lib/estimates";
import { cn, formatCurrency, formatNumber, getApiDomain } from "@/lib/utils";
import {
  ArrowLeft,
  Upload,
  Trash2,
  TrendingUp,
} from "lucide-react";

interface AdEditorWorkspaceProps {
  campaign?: Partial<CampaignWithMetrics>;
  onSave?: (
    data: {
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
    },
    options: {
      mode: "draft" | "publish" | "default";
      selectedAdId: string;
    }
  ) => Promise<void>;
  saving?: boolean;
  isNew?: boolean;
  initialAdId?: string;
  /** Open editor with a new unsaved ad (no DB row until Save draft / Publish). */
  initialNewAd?: boolean;
}

function Block({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-4 border-b border-border pb-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[12px] text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-[12px] font-medium text-zinc-700">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none transition-colors",
        "focus:border-accent/40 focus:ring-2 focus:ring-accent/10",
        mono && "font-mono text-[12px]",
        className
      )}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
    />
  );
}

function MetricPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[14px] font-semibold tabular-nums",
          highlight ? "text-accent" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function AdEditorWorkspace({
  campaign = {},
  onSave,
  saving = false,
  isNew = false,
  initialAdId,
  initialNewAd = false,
}: AdEditorWorkspaceProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadModeRef = useRef<"replace" | "variation">("replace");
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);

  const initialVertical = (campaign.vertical ?? "energy") as Vertical;
  const [campaignForm, setCampaignForm] = useState({
    name: campaign.name ?? "",
    vertical: initialVertical,
    cpc_bid: campaign.cpc_bid ?? DEFAULT_CPC_BY_VERTICAL[initialVertical],
    daily_budget: campaign.daily_budget ?? 50,
    start_date: campaign.start_date ?? new Date().toISOString().split("T")[0],
    end_date: campaign.end_date ?? "",
    end_date_mode: (campaign.end_date
      ? "select_end_date"
      : "run_till_pause") as EndDateMode,
    destination_url: normalizeDestinationUrl(campaign.destination_url ?? ""),
    conversion_goal: (campaign.conversion_goal ?? "lead") as ConversionGoal,
  });

  const [ads, setAds] = useState<AdDraft[]>(() => {
    const all = campaign.ads ?? [];
    if (initialNewAd) {
      const live = publishedAds(all);
      const draft = createEmptyAd(live.length, { isDraft: true });
      return [...live.map(adToDraft), draft];
    }
    return all.length ? all.map(adToDraft) : [createEmptyAd(0)];
  });
  const [selectedAdId, setSelectedAdId] = useState(() => {
    if (initialNewAd) {
      return ads[ads.length - 1]?.id ?? "";
    }
    if (initialAdId && campaign.ads?.some((a) => a.id === initialAdId)) {
      return initialAdId;
    }
    return ads[0]?.id ?? "";
  });

  useEffect(() => {
    if (initialAdId && ads.some((a) => a.id === initialAdId)) {
      setSelectedAdId(initialAdId);
    }
  }, [initialAdId, ads]);

  const selectedAd = ads.find((a) => a.id === selectedAdId) ?? ads[0];
  const adOnlyMode = Boolean(
    initialNewAd ||
      (initialAdId &&
        !isNew &&
        campaign.ads?.some((a) => a.id === initialAdId))
  );
  const adCreateFlow = adOnlyMode && (initialNewAd || selectedAd?.is_draft);
  const share = trafficSharePercent(ads);
  const activeCount = ads.filter((a) => a.active).length;
  const backHref =
    !isNew && campaign.id ? `/campaigns/${campaign.id}` : "/campaigns";

  const estimates = estimateDailyResults(
    Number(campaignForm.daily_budget),
    Number(campaignForm.cpc_bid),
    campaignForm.vertical
  );

  const postbackUrl = `${getApiDomain()}/postback?click_id={CLICK_ID}`;

  function updateAd(id: string, patch: Partial<AdDraft>) {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function updateCampaign(field: string, value: string | number) {
    setCampaignForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateVertical(vertical: Vertical) {
    setCampaignForm((prev) => ({
      ...prev,
      vertical,
      cpc_bid: DEFAULT_CPC_BY_VERTICAL[vertical],
    }));
  }

  function removeAd(id: string) {
    if (ads.length <= 1) return;
    const next = ads.filter((a) => a.id !== id);
    setAds(next);
    if (selectedAdId === id) setSelectedAdId(next[0].id);
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

    if (uploadModeRef.current === "variation" && !adOnlyMode) {
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

  function buildSavePayload() {
    return adOnlyMode
      ? {
          name: campaign.name ?? campaignForm.name,
          vertical: (campaign.vertical ?? campaignForm.vertical) as Vertical,
          cpc_bid: Number(campaign.cpc_bid ?? campaignForm.cpc_bid),
          daily_budget:
            campaign.daily_budget != null
              ? Number(campaign.daily_budget)
              : campaignForm.daily_budget != null
                ? Number(campaignForm.daily_budget)
                : null,
          start_date: campaign.start_date ?? campaignForm.start_date ?? null,
          end_date: campaign.end_date ?? null,
          end_date_mode: (campaign.end_date
            ? "select_end_date"
            : "run_till_pause") as EndDateMode,
          destination_url: normalizeDestinationUrl(
            campaign.destination_url ?? campaignForm.destination_url
          ),
          conversion_goal: (campaign.conversion_goal ??
            campaignForm.conversion_goal) as ConversionGoal,
          ads,
        }
      : {
          name: campaignForm.name,
          vertical: campaignForm.vertical,
          cpc_bid: Number(campaignForm.cpc_bid),
          daily_budget: Number(campaignForm.daily_budget) || null,
          start_date: campaignForm.start_date || null,
          end_date:
            campaignForm.end_date_mode === "select_end_date"
              ? campaignForm.end_date || null
              : null,
          end_date_mode: campaignForm.end_date_mode,
          destination_url: normalizeDestinationUrl(campaignForm.destination_url),
          conversion_goal: campaignForm.conversion_goal,
          ads,
        };
  }

  async function persistAd(mode: "draft" | "publish" | "default") {
    const adsForSave =
      mode === "default"
        ? ads
        : ads.map((a) =>
            a.id === selectedAdId
              ? {
                  ...a,
                  is_draft: mode === "draft",
                  active: mode === "publish",
                }
              : a
          );
    const payload = { ...buildSavePayload(), ads: adsForSave };

    if (onSave) {
      await onSave(payload, { mode, selectedAdId });
    } else if (isNew) {
      router.push("/campaigns");
    } else if (campaign.id) {
      router.push(`/campaigns/${campaign.id}`);
    }
  }

  if (!selectedAd) return null;

  const previewAd = ads.find((a) => a.id === previewAdId) ?? null;

  const previewPanel = (
    <div className="space-y-2">
      {!adOnlyMode ? (
        <p className="text-[11px] text-muted">
          Click a variant to see the full offer on a thank-you page.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {(adOnlyMode ? [selectedAd] : ads).map((ad) => (
          <AdPreviewThumbnail
            key={ad.id}
            ad={ad}
            isSelected={ad.id === selectedAdId}
            onClick={() => setPreviewAdId(ad.id)}
          />
        ))}
      </div>
    </div>
  );

  const estimatedResultsPanel = (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Estimated results
      </p>
      <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <MetricPill
          label="Daily budget"
          value={formatCurrency(Number(campaignForm.daily_budget))}
        />
        <MetricPill
          label="CPC bid"
          value={formatCurrency(Number(campaignForm.cpc_bid))}
          highlight
        />
        <MetricPill
          label="Traffic share"
          value={
            selectedAd.active && activeCount > 0
              ? `${formatNumber(share, 1)}%`
              : "0%"
          }
        />
        <MetricPill
          label="Est. daily clicks"
          value={estimates?.clicksLabel ?? "—"}
        />
        <MetricPill
          label="Est. conversions"
          value={estimates?.conversionsLabel ?? "—"}
        />
        <MetricPill
          label="Est. reach"
          value={estimates?.reachLabel ?? "—"}
        />
        {estimates ? (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-accent/15 bg-accent/5 px-3 py-2.5">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-[11px] leading-relaxed text-zinc-700">
              At this budget and bid, expect roughly{" "}
              <strong>{estimates.clicksLabel} clicks</strong> and{" "}
              <strong>{estimates.conversionsLabel} conversions</strong> per day
              in {verticalLabel(campaignForm.vertical).toLowerCase()}.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen min-h-0 flex-1 flex-col bg-zinc-50/80">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-card">
        <div className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Link
                href={backHref}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-muted hover:bg-zinc-50 hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                {isNew
                  ? "New campaign"
                  : adOnlyMode
                    ? "Edit ad"
                    : "Edit campaign"}
              </span>
            </div>

            {adOnlyMode ? (
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Ad
                </p>
                <p className="text-[18px] font-semibold text-foreground">
                  {selectedAd.name}
                </p>
                <p className="text-[12px] text-muted">
                  Campaign: {campaignForm.name}
                </p>
              </div>
            ) : (
              <Field label="Campaign name">
                <TextInput
                  value={campaignForm.name}
                  onChange={(v) => updateCampaign("name", v)}
                  placeholder="Summer Energy Push"
                  className="h-10 text-[15px] font-medium"
                />
              </Field>
            )}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {adCreateFlow ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 w-full rounded-lg px-3 text-[12px] sm:w-auto"
                  disabled={saving}
                  onClick={() => persistAd("draft")}
                >
                  {saving ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  type="button"
                  className="h-9 w-full rounded-lg px-3 text-[12px] sm:w-auto"
                  disabled={saving}
                  onClick={() => persistAd("publish")}
                >
                  {saving ? "Publishing…" : "Publish ad"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                className="h-9 w-full rounded-lg px-3 text-[12px] sm:w-auto"
                disabled={saving}
                onClick={() => persistAd("default")}
              >
                {saving ? "Saving…" : adOnlyMode ? "Save ad" : "Publish"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "grid w-full grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:items-start lg:px-8",
            !adOnlyMode &&
              "lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_300px]"
          )}
        >
          <main className="min-w-0 space-y-4">
            <Block
              title={adOnlyMode ? "Creative" : "Creatives"}
              description={
                adOnlyMode
                  ? "Edit headline, copy, and image for this ad."
                  : "Headline, copy, and image drive performance."
              }
            >
              {!adOnlyMode ? (
              <div className="mb-4 rounded-lg border border-border bg-zinc-50 px-3 py-2.5">
                <p className="text-[12px] font-medium text-zinc-700">
                  Ad variants in this campaign
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Upload an extra image to create a variation with the same copy.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {ads.map((ad) => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={() => setSelectedAdId(ad.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                        ad.id === selectedAdId
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-card text-muted hover:border-border",
                        !ad.active && "opacity-50"
                      )}
                    >
                      {ad.name}
                    </button>
                  ))}
                  {ads.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeAd(selectedAd.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove variant
                    </button>
                  ) : null}
                </div>
              </div>
              ) : null}

              <div className="space-y-4">
                <Field label="Headline">
                  <TextInput
                    value={selectedAd.title}
                    onChange={(v) => updateAd(selectedAd.id, { title: v })}
                    placeholder="Get Solar & Save Up to 70%"
                    className="text-[15px] font-medium"
                  />
                </Field>
                <Field label="Description">
                  <TextArea
                    value={selectedAd.subheadline}
                    onChange={(v) => updateAd(selectedAd.id, { subheadline: v })}
                    placeholder="Switch to clean energy and cut your bills."
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Call to action">
                    <TextInput
                      value={selectedAd.cta_text}
                      onChange={(v) => updateAd(selectedAd.id, { cta_text: v })}
                      placeholder="Get my quote"
                    />
                  </Field>
                  <Field label="Media type">
                    <div className="flex rounded-lg border border-border p-0.5">
                      {MEDIA_TYPES.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            updateAd(selectedAd.id, { media_type: value });
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          className={cn(
                            "flex-1 rounded-md py-1.5 text-[11px] font-medium",
                            selectedAd.media_type === value
                              ? "bg-accent text-white"
                              : "text-muted hover:text-accent"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <Field
                  label="Image / video"
                  hint={`${MEDIA_FORMAT_SPECS[selectedAd.media_type].formats} · ${MEDIA_FORMAT_SPECS[selectedAd.media_type].size}`}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedAd.media_url ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-zinc-50">
                        <MediaPreview
                          url={selectedAd.media_url}
                          mediaType={selectedAd.media_type}
                          alt={selectedAd.name}
                        />
                        <button
                          type="button"
                          onClick={() => openUpload("replace")}
                          className="absolute bottom-2 left-2 rounded-md bg-card/90 px-2 py-1 text-[10px] font-medium text-zinc-700 shadow-sm hover:bg-card"
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openUpload("replace")}
                        className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-zinc-50/50 text-zinc-400 transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                      >
                        <Upload className="h-5 w-5" />
                        <span className="text-[11px] font-medium">Upload</span>
                      </button>
                    )}
                    {selectedAd.media_url && !adOnlyMode ? (
                      <button
                        type="button"
                        onClick={() => openUpload("variation")}
                        className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-accent/30 bg-accent/5 px-3 text-center text-accent transition-colors hover:border-accent/50 hover:bg-accent/10"
                      >
                        <Upload className="h-5 w-5" />
                        <span className="text-[11px] font-semibold">
                          Add variation
                        </span>
                        <span className="text-[10px] font-normal leading-snug text-accent/80">
                          Same headline &amp; CTA, new image
                        </span>
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
                </Field>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-3 text-[12px] font-medium text-zinc-700">
                  Preview
                </p>
                {previewPanel}
              </div>
            </Block>

            {!adOnlyMode ? (
              <>
            <Block
              title="Destination"
              description="Where users land after they click your ad."
            >
              <Field
                label="Landing page URL"
                hint="click_id is appended automatically when traffic is sent."
              >
                <TextInput
                  value={campaignForm.destination_url}
                  onChange={(v) =>
                    updateCampaign("destination_url", normalizeDestinationUrl(v))
                  }
                  placeholder="https://yoursite.com/landing"
                  mono
                />
              </Field>
            </Block>

            <Block title="Budget & bid">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Daily budget (€)">
                  <TextInput
                    type="number"
                    value={String(campaignForm.daily_budget)}
                    onChange={(v) => updateCampaign("daily_budget", v)}
                  />
                </Field>
                <Field
                  label="CPC bid (€)"
                  hint={`Benchmark for ${verticalLabel(campaignForm.vertical)}: ${formatCurrency(DEFAULT_CPC_BY_VERTICAL[campaignForm.vertical])}`}
                >
                  <TextInput
                    type="number"
                    value={String(campaignForm.cpc_bid)}
                    onChange={(v) => updateCampaign("cpc_bid", v)}
                    mono
                  />
                </Field>
                <Field label="Category" className="sm:col-span-2">
                  <select
                    value={campaignForm.vertical}
                    onChange={(e) => updateVertical(e.target.value as Vertical)}
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                  >
                    {VERTICALS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Block>

            <Block title="Tracking">
              <CampaignServerTrackingStatus
                lastPostbackAt={campaign?.last_postback_at}
                className="mb-4"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Conversion goal">
                  <select
                    value={campaignForm.conversion_goal}
                    onChange={(e) =>
                      updateCampaign("conversion_goal", e.target.value)
                    }
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                  >
                    {CONVERSION_GOALS.map((goal) => (
                      <option key={goal.value} value={goal.value}>
                        {goal.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Postback URL"
                  hint="Send only click_id — the platform records the conversion goal above."
                  className="sm:col-span-2"
                >
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg border border-border bg-zinc-50 px-3 py-2 font-mono text-[11px] text-muted">
                      {postbackUrl}
                    </code>
                    <CopyButton text={postbackUrl} />
                  </div>
                </Field>
              </div>
            </Block>
              </>
            ) : null}
          </main>

          {!adOnlyMode ? (
          <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">
            {estimatedResultsPanel}
          </aside>
          ) : null}
        </div>
      </div>

      <OfferPreviewModal
        ad={previewAd}
        open={Boolean(previewAd)}
        onClose={() => setPreviewAdId(null)}
      />
    </div>
  );
}
