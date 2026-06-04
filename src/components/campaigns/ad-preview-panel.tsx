"use client";

import { useEffect } from "react";
import { Check, Monitor, Smartphone, X } from "lucide-react";
import { PoweredByLogo } from "@/components/layout/brand-logo";
import type { MediaType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MediaPreview } from "./media-preview";

interface PreviewFrameProps {
  title: string;
  subheadline: string;
  mediaUrl: string | null;
  mediaType: MediaType;
  ctaText: string;
  compact?: boolean;
}

export interface AdPreviewData {
  id: string;
  name: string;
  title: string;
  subheadline: string;
  media_url: string | null;
  media_type: MediaType;
  cta_text: string;
}

const DEFAULT_MEDIA =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80";

export function CompactAdPreview({
  title,
  subheadline,
  mediaUrl,
  mediaType,
  ctaText,
  compact,
}: PreviewFrameProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative aspect-[16/10] w-full bg-zinc-50">
        <MediaPreview
          url={mediaUrl || DEFAULT_MEDIA}
          mediaType={mediaUrl ? mediaType : "image"}
          alt={title || "Ad preview"}
        />
      </div>
      <div className={cn("p-3", compact && "p-2.5")}>
        <h4
          className={cn(
            "font-semibold leading-snug text-foreground",
            compact ? "text-[13px]" : "text-[14px]"
          )}
        >
          {title || "Your headline"}
        </h4>
        <p
          className={cn(
            "mt-1 leading-relaxed text-muted",
            compact ? "text-[11px] line-clamp-2" : "text-[12px]"
          )}
        >
          {subheadline || "Your description appears here."}
        </p>
        <button
          type="button"
          className={cn(
            "mt-3 w-full rounded-lg bg-accent font-medium text-white",
            compact ? "py-2 text-[11px]" : "py-2.5 text-[12px]"
          )}
        >
          {ctaText || "Learn more"}
        </button>
      </div>
      <PoweredByLogo />
    </div>
  );
}

export function AdPreviewThumbnail({
  ad,
  onClick,
  isSelected,
}: {
  ad: AdPreviewData;
  onClick: () => void;
  isSelected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-[88px] shrink-0 flex-col gap-1 rounded-lg border bg-card p-1.5 text-left transition-colors hover:border-accent/30 hover:shadow-sm",
        isSelected ? "border-accent ring-1 ring-accent/20" : "border-border"
      )}
    >
      <span className="truncate text-[8px] font-medium uppercase tracking-wide text-zinc-400">
        {ad.name}
      </span>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-zinc-50">
        <MediaPreview
          url={ad.media_url || DEFAULT_MEDIA}
          mediaType={ad.media_url ? ad.media_type : "image"}
          alt={ad.title || ad.name}
        />
      </div>
      <span className="line-clamp-2 text-[9px] leading-tight text-muted group-hover:text-accent">
        {ad.title || "No headline"}
      </span>
    </button>
  );
}

export function OfferPreviewModal({
  ad,
  open,
  onClose,
}: {
  ad: AdPreviewData | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !ad) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-preview-title"
        className="relative w-full max-w-[380px] rounded-2xl border border-border bg-card p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3
              id="offer-preview-title"
              className="text-[15px] font-semibold text-foreground"
            >
              Offer preview
            </h3>
            <p className="mt-0.5 text-[12px] text-muted">{ad.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-accent/90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-border bg-[#F5F5F7] p-4">
          <div className="mb-3 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
            </div>
            <p className="text-[13px] font-semibold text-foreground">Thank you!</p>
            <p className="text-[11px] text-muted">Your order is confirmed.</p>
          </div>
          <CompactAdPreview
            title={ad.title}
            subheadline={ad.subheadline}
            mediaUrl={ad.media_url}
            mediaType={ad.media_type}
            ctaText={ad.cta_text}
          />
        </div>
      </div>
    </div>
  );
}

export function AdPreviewPanel({
  title,
  subheadline,
  mediaUrl,
  mediaType,
  ctaText,
}: PreviewFrameProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          <Monitor className="h-3.5 w-3.5" />
          Desktop
        </div>
        <div className="rounded-xl border border-border bg-[#F5F5F7] p-4">
          <div className="mx-auto max-w-[280px]">
            <div className="mb-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              </div>
              <p className="text-[13px] font-semibold text-foreground">Thank you!</p>
              <p className="text-[11px] text-muted">Your order is confirmed.</p>
            </div>
            <CompactAdPreview
              title={title}
              subheadline={subheadline}
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              ctaText={ctaText}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          <Smartphone className="h-3.5 w-3.5" />
          Mobile
        </div>
        <div className="rounded-xl border border-border bg-[#F5F5F7] p-3">
          <div className="mx-auto w-[200px] rounded-[20px] border-[3px] border-zinc-800 bg-card p-1.5 shadow-lg">
            <div className="overflow-hidden rounded-2xl bg-card">
              <div className="bg-zinc-50 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-foreground">Thank you!</p>
              </div>
              <div className="p-2">
                <CompactAdPreview
                  title={title}
                  subheadline={subheadline}
                  mediaUrl={mediaUrl}
                  mediaType={mediaType}
                  ctaText={ctaText}
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
