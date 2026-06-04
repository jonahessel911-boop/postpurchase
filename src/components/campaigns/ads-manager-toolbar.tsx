"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SAVED_VIEWS, type SavedView } from "@/lib/campaign-table-utils";
import { Search, SlidersHorizontal, Columns3, Plus, ChevronDown } from "lucide-react";

export interface ToolbarFilters {
  search: string;
  status: string;
  vertical: string;
  dateRange: string;
}

interface AdsManagerToolbarProps {
  filters: ToolbarFilters;
  onFiltersChange: (next: Partial<ToolbarFilters>) => void;
  savedView: string;
  onSavedViewChange: (view: SavedView) => void;
  onColumnsClick: () => void;
  showColumnsMenu?: boolean;
  columnsMenu?: React.ReactNode;
  activeTab?: "campaigns" | "ads";
  minimal?: boolean;
  premium?: boolean;
  createAdHref?: string | null;
}

export function AdsManagerToolbar({
  filters,
  onFiltersChange,
  savedView,
  onSavedViewChange,
  onColumnsClick,
  showColumnsMenu,
  columnsMenu,
  activeTab = "campaigns",
  minimal = false,
  premium = false,
  createAdHref,
}: AdsManagerToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isPremium = premium && !minimal;

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
    filters.vertical !== "all",
    filters.dateRange !== "30d",
    savedView !== "all",
  ].filter(Boolean).length;

  if (isPremium) {
    return (
      <div>
        <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search campaigns…"
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

          <div className="relative">
            <button
              type="button"
              title="Columns"
              onClick={onColumnsClick}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900"
            >
              <Columns3 className="h-3.5 w-3.5" />
            </button>
            {showColumnsMenu && columnsMenu}
          </div>

          <Link
            href="/campaigns/new"
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-[#5B47FB] px-3 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-[#4f3fe0]"
          >
            <Plus className="h-3.5 w-3.5" />
            New campaign
          </Link>
        </div>

        {filtersOpen ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-zinc-100 bg-zinc-50/50 px-3 py-2">
            <PremiumSelect
              value={filters.status}
              onChange={(v) => onFiltersChange({ status: v })}
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
              ]}
            />
            <PremiumSelect
              value={filters.vertical}
              onChange={(v) => onFiltersChange({ vertical: v })}
              options={[
                { value: "all", label: "All verticals" },
                { value: "energy", label: "Energy" },
                { value: "insurance", label: "Insurance" },
                { value: "finance", label: "Finance" },
                { value: "home_improvement", label: "Home improvement" },
              ]}
            />
            <PremiumSelect
              value={filters.dateRange}
              onChange={(v) => onFiltersChange({ dateRange: v })}
              options={[
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 90 days" },
                { value: "all", label: "All time" },
              ]}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (!minimal) {
    return (
      <LegacyToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        savedView={savedView}
        onSavedViewChange={onSavedViewChange}
        onColumnsClick={onColumnsClick}
        showColumnsMenu={showColumnsMenu}
        columnsMenu={columnsMenu}
        activeTab={activeTab}
        createAdHref={createAdHref}
        searchRef={searchRef}
      />
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-3 py-2">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search campaigns…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="h-8 w-full border-0 border-b border-transparent bg-transparent pl-6 pr-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-200 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 px-2 text-[12px] text-zinc-500 transition-colors hover:text-zinc-900",
            filtersOpen && "text-zinc-900"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="text-zinc-400">{activeFilterCount}</span>
          ) : null}
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              filtersOpen && "rotate-180"
            )}
          />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={onColumnsClick}
            className="inline-flex h-8 items-center gap-1.5 px-2 text-[12px] text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <Columns3 className="h-3.5 w-3.5" />
            Columns
          </button>
          {showColumnsMenu && columnsMenu}
        </div>

        <Link
          href="/campaigns/new"
          className="inline-flex h-8 items-center gap-1 rounded-md bg-zinc-900 px-3 text-[12px] font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Link>
      </div>

      {filtersOpen ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 py-3 text-[12px]">
          <MinimalSelect
            value={filters.status}
            onChange={(v) => onFiltersChange({ status: v })}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
            ]}
          />
          <MinimalSelect
            value={filters.vertical}
            onChange={(v) => onFiltersChange({ vertical: v })}
            options={[
              { value: "all", label: "All verticals" },
              { value: "energy", label: "Energy" },
              { value: "insurance", label: "Insurance" },
              { value: "finance", label: "Finance" },
              { value: "home_improvement", label: "Home improvement" },
            ]}
          />
          <MinimalSelect
            value={filters.dateRange}
            onChange={(v) => onFiltersChange({ dateRange: v })}
            options={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "90d", label: "Last 90 days" },
              { value: "all", label: "All time" },
            ]}
          />
          <MinimalSelect
            value={savedView}
            onChange={(id) => {
              const view = SAVED_VIEWS.find((v) => v.id === id);
              if (view) onSavedViewChange(view);
            }}
            options={SAVED_VIEWS.map((v) => ({ value: v.id, label: v.label }))}
          />
        </div>
      ) : null}
    </div>
  );
}

function PremiumSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 cursor-pointer rounded-md border border-zinc-200 bg-white px-2 pr-7 text-[12px] text-zinc-700 focus:border-zinc-300 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function MinimalSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer border-0 bg-transparent py-0 pr-4 text-[12px] text-zinc-600 focus:outline-none focus:ring-0"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** @deprecated Used when minimal=false */
function LegacyToolbar({
  filters,
  onFiltersChange,
  savedView,
  onSavedViewChange,
  onColumnsClick,
  showColumnsMenu,
  columnsMenu,
  activeTab,
  createAdHref,
  searchRef,
}: Omit<AdsManagerToolbarProps, "minimal"> & {
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center">
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="h-9 w-full rounded-lg border border-border bg-zinc-50/50 pl-9 pr-3 text-[13px] focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
        />
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={onColumnsClick}
          className="h-9 rounded-lg border border-border px-3 text-[13px]"
        >
          Columns
        </button>
        {showColumnsMenu && columnsMenu}
      </div>
      {activeTab === "campaigns" ? (
        <Link href="/campaigns/new">
          <span className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-[13px] text-white">
            <Plus className="h-4 w-4" />
            New campaign
          </span>
        </Link>
      ) : createAdHref ? (
        <Link href={createAdHref}>
          <span className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-[13px] text-white">
            <Plus className="h-4 w-4" />
            New ad
          </span>
        </Link>
      ) : (
        <span
          title="Filter or select ads from one campaign"
          className="inline-flex h-9 cursor-not-allowed items-center rounded-lg bg-zinc-200 px-4 text-[13px] text-zinc-500"
        >
          <Plus className="h-4 w-4" />
          New ad
        </span>
      )}
    </div>
  );
}

export function BulkActionBar({
  count,
  onPause,
  onActivate,
  onArchive,
  onClear,
  minimal = false,
  premium = false,
}: {
  count: number;
  onPause: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onClear: () => void;
  minimal?: boolean;
  premium?: boolean;
}) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-3 text-[12px]",
        premium
          ? "border-b border-[#5B47FB]/15 bg-[#5B47FB]/[0.04] py-1.5"
          : minimal
            ? "border-b border-zinc-100 py-2"
            : "border-b border-accent/20 bg-accent/[0.04] px-4 py-2"
      )}
    >
      <span className="text-zinc-600">{count} selected</span>
      <button type="button" onClick={onPause} className="text-zinc-500 hover:text-zinc-900">
        Pause
      </button>
      <button type="button" onClick={onActivate} className="text-zinc-500 hover:text-zinc-900">
        Activate
      </button>
      <button type="button" onClick={onArchive} className="text-zinc-500 hover:text-zinc-900">
        Archive
      </button>
      <button type="button" onClick={onClear} className="ml-auto text-zinc-400 hover:text-zinc-600">
        Clear
      </button>
    </div>
  );
}

export function PaginationBar({
  mode,
  onModeChange,
  page,
  totalPages,
  onPageChange,
  total,
  showing,
  minimal = false,
  premium = false,
}: {
  mode: "infinite" | "pages";
  onModeChange: (m: "infinite" | "pages") => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  total: number;
  showing: number;
  minimal?: boolean;
  premium?: boolean;
}) {
  if (minimal || premium) {
    return (
      <div
        className={cn(
          "flex items-center justify-between px-3 text-[11px] tabular-nums text-zinc-500",
          premium ? "border-t border-zinc-100 bg-zinc-50/60 py-2" : "py-2"
        )}
      >
        <span>
          {showing} of {total}
        </span>
        {mode === "pages" && totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="disabled:opacity-30 hover:text-zinc-700"
            >
              Prev
            </button>
            <span className="tabular-nums">
              {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="disabled:opacity-30 hover:text-zinc-700"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-zinc-50/50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-muted">
        Showing {showing} of {total}
      </p>
    </div>
  );
}

export function ViewTabs({
  active,
  onChange,
  campaignCount,
  adCount,
  minimal = false,
  premium = false,
}: {
  active: "campaigns" | "ads";
  onChange: (tab: "campaigns" | "ads") => void;
  campaignCount: number;
  adCount: number;
  minimal?: boolean;
  premium?: boolean;
}) {
  if (premium) {
    return (
      <div className="inline-flex rounded-md border border-zinc-200 bg-zinc-50/80 p-0.5 text-[12px]">
        {(
          [
            { id: "campaigns" as const, label: "Campaigns", count: campaignCount },
            { id: "ads" as const, label: "Ads", count: adCount },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 font-medium transition-colors",
              active === tab.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "tabular-nums",
                active === tab.id ? "text-zinc-500" : "text-zinc-400"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (minimal) {
    return (
      <div className="flex items-center gap-4 text-[12px]">
        {(
          [
            { id: "campaigns" as const, label: "Campaigns", count: campaignCount },
            { id: "ads" as const, label: "Ads", count: adCount },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 transition-colors",
              active === tab.id
                  ? "font-medium text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            {tab.label}
            <span className="tabular-nums text-zinc-400">{tab.count}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1 border-b border-border px-4">
      {(
        [
          { id: "campaigns" as const, label: "Campaigns", count: campaignCount },
          { id: "ads" as const, label: "Ads", count: adCount },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "border-b-2 px-3 py-3 text-[13px] font-medium",
            active === tab.id
              ? "border-accent text-foreground"
              : "border-transparent text-muted"
          )}
        >
          {tab.label} {tab.count}
        </button>
      ))}
    </div>
  );
}
