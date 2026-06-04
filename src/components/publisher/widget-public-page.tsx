"use client";

import { useSearchParams } from "next/navigation";
import { WidgetPreview } from "@/components/publisher/widget-preview";
import type { PublisherPlacement } from "@/lib/publisher-types";

export function WidgetPublicPage({
  placementId,
  placement,
}: {
  placementId: string;
  placement: PublisherPlacement;
}) {
  const searchParams = useSearchParams();
  const embed = searchParams.get("embed") === "1";
  const isRedirect = placement.placement === "redirect";

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
        <WidgetPreview placementId={placementId} placement={placement} />
      </div>
    </div>
  );
}
