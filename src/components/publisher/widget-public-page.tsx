"use client";

import { WidgetPreview } from "@/components/publisher/widget-preview";
import type { ClickPlacement } from "@/lib/types";

export function WidgetPublicPage({
  partnerId,
  companyName,
  format,
  embed,
}: {
  partnerId: string;
  companyName: string;
  format: ClickPlacement;
  embed: boolean;
}) {
  const isRedirect = format === "redirect";

  return (
    <div
      className={
        embed
          ? "bg-transparent px-1 py-1"
          : isRedirect
            ? "min-h-screen bg-[#f4f4f8] px-4 py-8 sm:py-12"
            : "min-h-screen bg-[#fbfbfd] px-4 py-8"
      }
    >
      <div
        className={
          isRedirect && !embed
            ? "mx-auto w-full max-w-3xl"
            : "mx-auto w-full max-w-md"
        }
      >
        {!embed && !isRedirect ? (
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            PostPurchase · {companyName}
          </p>
        ) : null}
        <WidgetPreview partnerId={partnerId} format={format} />
      </div>
    </div>
  );
}
