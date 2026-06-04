"use client";

import { Check } from "lucide-react";
import { PoweredByLogo } from "@/components/layout/brand-logo";
import type { MediaType } from "@/lib/types";
import { MediaPreview } from "./media-preview";

interface AdPreviewProps {
  title: string;
  subheadline: string;
  mediaUrl: string | null;
  mediaType: MediaType;
  ctaText: string;
}

export function AdPreview({
  title,
  subheadline,
  mediaUrl,
  mediaType,
  ctaText,
}: AdPreviewProps) {
  const defaultMedia =
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80";

  return (
    <div className="rounded-2xl border border-border bg-[#F5F5F7] p-5">
      <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-widest text-muted">
        Live Preview
      </p>

      <div className="mx-auto max-w-[320px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="px-6 pb-2 pt-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-semibold">Thank you!</h3>
          <p className="mt-1 text-[13px] text-muted">
            Your order has been confirmed.
          </p>
        </div>

        <div className="mx-4 mb-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="relative aspect-[16/10] w-full bg-zinc-50">
            <MediaPreview
              url={mediaUrl || defaultMedia}
              mediaType={mediaUrl ? mediaType : "image"}
              alt={title || "Ad preview"}
            />
          </div>
          <div className="p-4">
            <h4 className="text-[15px] font-semibold leading-snug">
              {title || "Get Solar & Save Up to 70%"}
            </h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {subheadline ||
                "Switch to clean energy and cut your bills. Free quote in 2 minutes."}
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-accent py-2.5 text-[13px] font-medium text-white shadow-sm"
            >
              {ctaText || "Get my quote"}
            </button>
          </div>
          <PoweredByLogo className="border-border" />
        </div>
      </div>
    </div>
  );
}
