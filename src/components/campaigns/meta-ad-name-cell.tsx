"use client";

import Link from "next/link";
import { Copy, MoreHorizontal, Pencil } from "lucide-react";
import { MediaPreview } from "@/components/campaigns/media-preview";
import type { AdRow } from "@/lib/campaign-table-utils";
import { cn } from "@/lib/utils";

export function MetaAdNameCell({
  row,
  onEdit,
}: {
  row: AdRow;
  onEdit: () => void;
}) {
  const editHref = `/campaigns/${row.campaign.id}/edit`;

  return (
    <div className="group/name relative flex min-w-0 items-center gap-2.5 py-0.5">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-zinc-200/80 bg-zinc-100">
        <MediaPreview
          url={row.ad.media_url}
          mediaType={row.ad.media_type}
          alt={row.ad.name}
          fill
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#050505]">
          {row.ad.name}
        </p>
        <div
          className={cn(
            "mt-0.5 flex flex-wrap items-center gap-1 opacity-0 transition-opacity",
            "group-hover/name:opacity-100 group-focus-within/name:opacity-100"
          )}
        >
          <Link
            href={editHref}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[12px] font-medium text-[#050505] hover:bg-zinc-200/80"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
          <button
            type="button"
            title="Duplicate (coming soon)"
            disabled
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[12px] font-medium text-zinc-400"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200/80"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
