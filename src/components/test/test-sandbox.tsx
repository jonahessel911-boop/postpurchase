"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { MediaPreview } from "@/components/campaigns/media-preview";
import type { TestOffer } from "@/lib/api/test-offer";
import type { ClickResult } from "@/lib/api/test-tracking";
import { conversionGoalLabel, type MediaType } from "@/lib/types";
import { cn, getApiDomain } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  MousePointerClick,
  XCircle,
} from "lucide-react";
import { PoweredByLogo } from "@/components/layout/brand-logo";

const DEFAULT_MEDIA =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80";

type StepStatus = "pending" | "active" | "done" | "error";

interface FlowStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

function TestOfferCard({
  title,
  subheadline,
  mediaUrl,
  mediaType,
  ctaText,
  onClick,
  loading,
}: {
  title: string;
  subheadline: string;
  mediaUrl: string | null;
  mediaType: MediaType;
  ctaText: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#F5F5F7] p-4">
      <div className="mb-4 text-center">
        <p className="text-[13px] font-semibold text-foreground">Thank you!</p>
        <p className="text-[11px] text-muted">Your order is confirmed.</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="block w-full overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        <div className="relative aspect-[16/10] w-full bg-zinc-50">
          <MediaPreview
            url={mediaUrl || DEFAULT_MEDIA}
            mediaType={mediaUrl ? mediaType : "image"}
            alt={title}
          />
        </div>
        <div className="p-3">
          <h4 className="text-[14px] font-semibold leading-snug text-foreground">
            {title}
          </h4>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            {subheadline || "Offer description"}
          </p>
          <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-[12px] font-medium text-white">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Recording click…
              </>
            ) : (
              ctaText || "Go to offer"
            )}
          </div>
        </div>
        <PoweredByLogo />
      </button>
    </div>
  );
}

function FlowStepRow({ step }: { step: FlowStep }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        {step.status === "done" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : step.status === "error" ? (
          <XCircle className="h-5 w-5 text-red-500" />
        ) : step.status === "active" ? (
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        ) : (
          <Circle className="h-5 w-5 text-zinc-300" />
        )}
        <div className="mt-1 w-px flex-1 bg-border last:hidden" />
      </div>
      <div className="min-w-0 flex-1 pb-5">
        <p
          className={cn(
            "text-[13px] font-medium",
            step.status === "done" && "text-foreground",
            step.status === "active" && "text-accent",
            step.status === "error" && "text-red-600",
            step.status === "pending" && "text-zinc-400"
          )}
        >
          {step.label}
        </p>
        {step.detail ? (
          <p className="mt-0.5 break-all font-mono text-[11px] text-muted">
            {step.detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface TestSandboxProps {
  isLoggedIn: boolean;
}

export function TestSandbox({ isLoggedIn }: TestSandboxProps) {
  const searchParams = useSearchParams();
  const [offer, setOffer] = useState<TestOffer | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(false);
  const [clickLoading, setClickLoading] = useState(false);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [error, setError] = useState("");
  const [clickResult, setClickResult] = useState<ClickResult | null>(null);
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);

  const conversionGoal =
    clickResult?.conversionGoal ?? offer?.campaign.conversion_goal ?? "lead";

  const postbackUrl = useMemo(() => {
    if (!clickResult?.clickId) return null;
    const url = new URL(`${getApiDomain()}/postback`);
    url.searchParams.set("click_id", clickResult.clickId);
    return url.toString();
  }, [clickResult]);

  const flowSteps: FlowStep[] = useMemo(() => {
    const steps: FlowStep[] = [
      {
        id: "offer",
        label: "Offer loaded on partner page",
        status: offer ? "done" : "pending",
        detail: offer
          ? `${offer.campaign.name} · goal: ${conversionGoalLabel(offer.campaign.conversion_goal ?? "lead")}`
          : undefined,
      },
      {
        id: "click",
        label: "Click registered in platform",
        status: clickResult
          ? "done"
          : clickLoading
            ? "active"
            : "pending",
        detail: clickResult?.clickId,
      },
      {
        id: "landing",
        label: "User sent to landing page",
        status: clickResult?.destinationUrl
          ? "done"
          : flowError && !clickResult
            ? "error"
            : clickResult
              ? "done"
              : "pending",
        detail: clickResult?.destinationUrl || undefined,
      },
      {
        id: "postback",
        label: "Postback sent (click_id only)",
        status: conversionLoading
          ? "active"
          : conversionResult
            ? "done"
            : clickResult
              ? "pending"
              : "pending",
        detail: postbackUrl ?? undefined,
      },
      {
        id: "conversion",
        label: `Conversion stored as ${conversionGoalLabel(conversionGoal)}`,
        status: conversionResult ? "done" : "pending",
        detail: conversionResult ?? undefined,
      },
    ];

    if (flowError && !clickLoading && !conversionLoading) {
      if (!clickResult) steps[1].status = "error";
      if (clickResult && !conversionResult) steps[3].status = "error";
    }

    return steps;
  }, [
    offer,
    clickResult,
    clickLoading,
    conversionLoading,
    conversionResult,
    flowError,
    postbackUrl,
    conversionGoal,
  ]);

  const loadOfferFromApi = useCallback(async (id?: string) => {
    const params = new URLSearchParams();
    if (id?.trim()) params.set("campaignId", id.trim());

    const res = await fetch(`/api/test/offer?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load offer");

    setOffer(data.offer);
    setClickResult(null);
    setConversionResult(null);
    setFlowError(null);
  }, []);

  async function loadOffer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFlowError(null);

    if (!isLoggedIn) {
      setError("Sign in to load your campaigns.");
      setLoading(false);
      return;
    }

    try {
      await loadOfferFromApi(campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offer");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdClick() {
    if (!offer) return;
    setClickLoading(true);
    setError("");
    setFlowError(null);
    setConversionResult(null);

    try {
      const res = await fetch("/api/test/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: offer.campaign.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Click failed");
      setClickResult(data as ClickResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Click failed";
      setFlowError(msg);
      setError(msg);
    } finally {
      setClickLoading(false);
    }
  }

  async function sendConversion() {
    if (!clickResult?.clickId) return;
    setConversionLoading(true);
    setError("");
    setFlowError(null);

    try {
      const res = await fetch("/api/test/postback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clickId: clickResult.clickId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Postback failed");

      const goalLabel = conversionGoalLabel(data.event ?? conversionGoal);
      setConversionResult(
        data.status === "already_converted"
          ? `Already recorded as ${goalLabel}`
          : `${goalLabel} conversion recorded ✓`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Postback failed";
      setFlowError(msg);
      setError(msg);
    } finally {
      setConversionLoading(false);
    }
  }

  useEffect(() => {
    const clickId = searchParams.get("click_id");
    const destination = searchParams.get("destination");
    if (clickId && !clickResult) {
      setClickResult({
        clickId,
        destinationUrl: destination ?? "",
        adId: "",
        cost: 0,
        campaignId: "",
        conversionGoal: offer?.campaign.conversion_goal ?? "lead",
      });
    }
  }, [searchParams, clickResult, offer]);

  return (
    <div className="min-h-screen bg-zinc-50/80">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Partner page test
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Simulate the full flow: ad click → landing page → postback with
            only click_id. The platform records the conversion goal from your
            campaign settings.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Card className="p-5">
              <form onSubmit={loadOffer} className="space-y-4">
                <Input
                  label="Campaign ID (optional)"
                  placeholder="Random active campaign if empty"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Loading…" : "Load test offer"}
                </Button>
                {error ? (
                  <p className="text-[13px] text-red-600">{error}</p>
                ) : null}
              </form>
            </Card>

            {offer ? (
              <>
                <TestOfferCard
                  title={offer.ad.title || offer.ad.name}
                  subheadline={offer.ad.subheadline}
                  mediaUrl={offer.ad.media_url}
                  mediaType={offer.ad.media_type}
                  ctaText={offer.ad.cta_text || "Go to offer"}
                  onClick={handleAdClick}
                  loading={clickLoading}
                />

                <p className="flex items-center gap-1.5 text-[12px] text-muted">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Click the ad to register a click — landing page opens below
                </p>

                {clickResult?.destinationUrl ? (
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border bg-zinc-50 px-4 py-2.5">
                      <p className="text-[12px] font-semibold text-foreground">
                        Advertiser landing page
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                        {clickResult.destinationUrl}
                      </p>
                    </div>
                    <iframe
                      title="Landing page preview"
                      src={clickResult.destinationUrl}
                      className="h-[360px] w-full bg-card"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
                ) : null}

                {clickResult?.clickId ? (
                  <Card className="space-y-4 p-5">
                    <div>
                      <h2 className="text-[14px] font-semibold text-foreground">
                        Fire test conversion
                      </h2>
                      <p className="mt-1 text-[12px] text-muted">
                        Simulates your server calling the postback URL. Only{" "}
                        <code className="font-mono">click_id</code> is sent —
                        stored as{" "}
                        <strong>{conversionGoalLabel(conversionGoal)}</strong>{" "}
                        per campaign goal.
                      </p>
                    </div>
                    {postbackUrl ? (
                      <div className="rounded-lg border border-border bg-zinc-50 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                          Postback URL
                        </p>
                        <p className="mt-1 break-all font-mono text-[10px] text-muted">
                          {postbackUrl}
                        </p>
                      </div>
                    ) : null}
                    <Button
                      type="button"
                      className="w-full"
                      disabled={conversionLoading}
                      onClick={sendConversion}
                    >
                      {conversionLoading
                        ? "Sending postback…"
                        : "Test conversion"}
                    </Button>
                  </Card>
                ) : null}
              </>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
                Tracking flow
              </h2>
              <p className="mt-1 text-[12px] text-muted">
                Live status of each step in the click → conversion pipeline.
              </p>
              <div className="mt-5">
                {flowSteps.map((step) => (
                  <FlowStepRow key={step.id} step={step} />
                ))}
              </div>
              {flowError ? (
                <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {flowError}
                </div>
              ) : null}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
