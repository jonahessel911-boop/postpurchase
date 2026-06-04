"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, Plus } from "lucide-react";

export interface ManagerToolbarFilters {
  search: string;
  status: string;
  offerType: string;
}

export function ManagerToolbar({
  filters,
  onFiltersChange,
}: {
  filters: ManagerToolbarFilters;
  onFiltersChange: (next: Partial<ManagerToolbarFilters>) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeFilterCount = [
    filters.status !== "all",
    filters.offerType !== "all",
  ].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
        <div className="relative min-w-0 max-w-md flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search offers…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="h-8 w-full rounded-md border border-zinc-200 bg-zinc-50/80 pl-8 pr-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
          />
        </div>

        <button
          type="button"
          title="Filters"
          onClick={() => setFiltersOpen((o) => !o)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900",
            filtersOpen && "border-zinc-300 bg-zinc-50 text-zinc-900",
            activeFilterCount > 0 && "text-[#5B47FB]"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>

        <Link
          href="/publisher/manager/new"
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-[#5B47FB] px-3 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-[#4f3fe0]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add offer
        </Link>
      </div>

      {filtersOpen ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-zinc-100 bg-zinc-50/50 px-3 py-2">
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => onFiltersChange({ status: v })}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
            ]}
          />
          <FilterSelect
            label="Type"
            value={filters.offerType}
            onChange={(v) => onFiltersChange({ offerType: v })}
            options={[
              { value: "all", label: "All types" },
              { value: "redirect", label: "Full redirect page" },
              { value: "popup", label: "Popup" },
              { value: "native", label: "Native" },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-zinc-600">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-[12px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
