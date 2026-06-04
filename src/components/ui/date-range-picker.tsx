"use client";

import { useEffect, useRef, useState } from "react";
import {
  DATE_RANGE_PRESETS,
  formatDateRangeLabel,
  type DateRangePreset,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown } from "lucide-react";

export function DateRangePicker({
  value: valueProp,
  onChange: onChangeProp,
  className,
}: {
  value?: DateRangePreset;
  onChange?: (preset: DateRangePreset) => void;
  className?: string;
}) {
  const [internal, setInternal] = useState<DateRangePreset>("30d");
  const value = valueProp ?? internal;
  const onChange = onChangeProp ?? setInternal;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-accent/30"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Calendar className="h-4 w-4 text-muted" strokeWidth={1.5} />
        {formatDateRangeLabel(value)}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {DATE_RANGE_PRESETS.map((opt) => (
            <li key={opt.value} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-zinc-50",
                  value === opt.value
                    ? "font-medium text-accent"
                    : "text-foreground"
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
