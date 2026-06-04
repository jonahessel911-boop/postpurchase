"use client";

import { OFFER_TYPES } from "@/lib/publisher-offer-types";
import type { ClickPlacement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalLink, Layers, MessageSquare } from "lucide-react";

const ICONS = {
  redirect: ExternalLink,
  popup: MessageSquare,
  native: Layers,
} as const;

export function OfferTypePicker({
  value,
  onChange,
}: {
  value: ClickPlacement | null;
  onChange: (type: ClickPlacement) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OFFER_TYPES.map((type) => {
        const Icon = ICONS[type.id];
        const selected = value === type.id;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={cn(
              "flex flex-col rounded-xl border p-5 text-left transition-all",
              selected
                ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                : "border-zinc-200/80 bg-white hover:border-zinc-300"
            )}
          >
            <div
              className={cn(
                "mb-3 flex h-10 w-10 items-center justify-center rounded-lg",
                selected ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-[14px] font-semibold text-zinc-900">
              {type.title}
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
              {type.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
