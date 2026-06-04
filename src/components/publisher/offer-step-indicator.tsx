"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const OFFER_WIZARD_STEPS = [
  { id: 1, label: "Offer type" },
  { id: 2, label: "Page setup" },
  { id: 3, label: "Install" },
] as const;

export function OfferStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav className="mb-6" aria-label="Progress">
      <ol className="flex items-center gap-0">
        {OFFER_WIZARD_STEPS.map((step, i) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all",
                    done && "bg-zinc-900 text-white",
                    active && "bg-zinc-900 text-white ring-4 ring-zinc-900/10",
                    !done &&
                      !active &&
                      "border border-zinc-200 bg-white text-zinc-400"
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "hidden truncate text-[13px] font-medium sm:inline",
                    active ? "text-zinc-900" : "text-zinc-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < OFFER_WIZARD_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 h-px min-w-[12px] flex-1",
                    done ? "bg-zinc-300" : "bg-zinc-100"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
