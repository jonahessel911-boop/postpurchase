"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Columns3,
  Copy,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { MetaAdNameCell } from "@/components/campaigns/meta-ad-name-cell";
import {
  getAdDeliveryState,
  MetaDeliveryStatus,
} from "@/components/campaigns/meta-delivery-status";
import type { AdRow, AdSortKey, SortDir } from "@/lib/campaign-table-utils";
import { formatRelativeUpdated } from "@/lib/campaign-table-utils";
import { conversionGoalLabel } from "@/lib/types";
import { isCampaignOn } from "@/lib/campaign-status";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

export type MetaAdColKey =
  | "delivery"
  | "results"
  | "cost_per_result"
  | "budget"
  | "amount_spent"
  | "clicks"
  | "ctr"
  | "impressions"
  | "ends"
  | "bid"
  | "last_edit";

const DEFAULT_META_COLS: Record<MetaAdColKey, boolean> = {
  delivery: true,
  results: true,
  cost_per_result: true,
  budget: true,
  amount_spent: true,
  clicks: true,
  ctr: true,
  impressions: true,
  ends: true,
  bid: true,
  last_edit: true,
};

const COL_LABELS: Record<MetaAdColKey, string> = {
  delivery: "Delivery",
  results: "Results",
  cost_per_result: "Cost per result",
  budget: "Budget",
  amount_spent: "Amount spent",
  clicks: "Clicks",
  ctr: "CTR",
  impressions: "Impressions",
  ends: "Ends",
  bid: "Bid strategy",
  last_edit: "Last significant edit",
};

function MetaToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-[34px] shrink-0 cursor-pointer rounded-full transition-colors",
        checked ? "bg-[#1877f2]" : "bg-zinc-300",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[17px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

function formatEnds(endDate: string | null): string {
  if (!endDate) return "Ongoing";
  const end = new Date(endDate);
  if (end.getTime() < Date.now()) {
    return end.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return end.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBid(cpc: number): string {
  return `Lowest cost · ${formatCurrency(cpc)} CPC`;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-zinc-400" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-zinc-600" />
  ) : (
    <ArrowDown className="h-3 w-3 text-zinc-600" />
  );
}

export function MetaAdsToolbar({
  search,
  onSearchChange,
  selectedCount,
  onColumnsClick,
  showColumnsMenu,
  columnsMenu,
  createAdHref,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  selectedCount: number;
  onColumnsClick: () => void;
  showColumnsMenu?: boolean;
  columnsMenu?: React.ReactNode;
  /** When set, Create adds an ad inside this campaign (not a new campaign). */
  createAdHref?: string | null;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
        {createAdHref ? (
          <Link
            href={createAdHref}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-accent px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[#4f3fe0]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Create ad
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="Filter or select ads from one campaign to create an ad"
            className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md bg-zinc-200 px-3 text-[13px] font-semibold text-zinc-500"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Create ad
          </button>
        )}
        <ToolbarBtn disabled={selectedCount === 0} icon={<Copy className="h-3.5 w-3.5" />}>
          Duplicate
        </ToolbarBtn>
        <ToolbarBtn disabled={selectedCount !== 1} icon={<Pencil className="h-3.5 w-3.5" />}>
          Edit
        </ToolbarBtn>
        <ToolbarBtn disabled>Analyze</ToolbarBtn>
        <ToolbarBtn disabled>A/B test</ToolbarBtn>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-0.5 rounded-md px-2 text-[13px] text-zinc-600 hover:bg-zinc-100"
        >
          More
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              placeholder="Search ads"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-44 rounded-md border border-zinc-200 bg-zinc-50/80 pl-7 pr-2 text-[13px] focus:border-zinc-300 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 sm:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={onColumnsClick}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              <Columns3 className="h-3.5 w-3.5 text-zinc-500" />
              Columns: <span className="font-medium">Performance</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>
            {showColumnsMenu && columnsMenu}
          </div>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-700 hover:bg-zinc-50"
          >
            Breakdown
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </div>
      </div>
      {filtersOpen ? (
        <div className="border-t border-zinc-100 px-2 py-2 sm:hidden">
          <input
            type="search"
            placeholder="Search ads"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 px-3 text-[13px]"
          />
        </div>
      ) : null}
    </div>
  );
}

function ToolbarBtn({
  children,
  disabled,
  icon,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px]",
        disabled
          ? "cursor-default text-zinc-300"
          : "text-zinc-600 hover:bg-zinc-100"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

type MetaAdTableRow = AdRow & { id: string };

export function MetaAdsTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  selected,
  onSelectRow,
  onSelectAll,
  visibleCols,
  onToggleAd,
  emptyMessage = "No ads yet. Create a campaign and add ads in the editor.",
}: {
  rows: MetaAdTableRow[];
  sortKey: AdSortKey;
  sortDir: SortDir;
  onSort: (key: AdSortKey) => void;
  selected: Set<string>;
  onSelectRow: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  visibleCols: Record<MetaAdColKey, boolean>;
  onToggleAd: (row: MetaAdTableRow, active: boolean) => void;
  emptyMessage?: string;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id));

  const headers: {
    key: string;
    id?: AdSortKey;
    label: string;
    sortable?: boolean;
    align?: "right";
  }[] = [
    { key: "toggle", label: "Off / On" },
    { key: "ad", id: "ad", label: "Ad", sortable: true },
    ...(visibleCols.delivery
      ? [{ key: "delivery", id: "status" as AdSortKey, label: "Delivery", sortable: true }]
      : []),
    { key: "actions", label: "Actions" },
    ...(visibleCols.results
      ? [{ key: "results", id: "conversions" as AdSortKey, label: "Results", sortable: true }]
      : []),
    ...(visibleCols.cost_per_result
      ? [
          {
            key: "cpa",
            id: "cpa" as AdSortKey,
            label: "Cost per result",
            sortable: true,
            align: "right" as const,
          },
        ]
      : []),
    ...(visibleCols.budget
      ? [{ key: "budget", id: "daily_budget" as AdSortKey, label: "Budget", sortable: true }]
      : []),
    ...(visibleCols.amount_spent
      ? [
          {
            key: "spend",
            id: "spend" as AdSortKey,
            label: "Amount spent",
            sortable: true,
            align: "right" as const,
          },
        ]
      : []),
    ...(visibleCols.clicks
      ? [
          {
            key: "clicks",
            id: "clicks" as AdSortKey,
            label: "Clicks",
            sortable: true,
            align: "right" as const,
          },
        ]
      : []),
    ...(visibleCols.ctr
      ? [
          {
            key: "ctr",
            id: "ctr" as AdSortKey,
            label: "CTR",
            sortable: true,
            align: "right" as const,
          },
        ]
      : []),
    ...(visibleCols.impressions
      ? [
          {
            key: "impressions",
            id: "impressions" as AdSortKey,
            label: "Impressions",
            sortable: true,
            align: "right" as const,
          },
        ]
      : []),
    ...(visibleCols.ends
      ? [{ key: "ends", id: "ends" as AdSortKey, label: "Ends", sortable: true }]
      : []),
    ...(visibleCols.bid ? [{ key: "bid", id: "bid" as AdSortKey, label: "Bid strategy" }] : []),
    ...(visibleCols.last_edit
      ? [
          {
            key: "last_edit",
            id: "last_edit" as AdSortKey,
            label: "Last significant edit",
            sortable: true,
          },
        ]
      : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
          <tr>
            <th className="w-9 px-2 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300"
              />
            </th>
            {headers.map((h) => (
              <th
                key={h.key}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-left text-[12px] font-semibold text-zinc-600",
                  h.align === "right" && "text-right",
                  h.key === "toggle" && "w-[72px]",
                  h.key === "ad" && "min-w-[220px]",
                  h.key === "actions" && "w-16"
                )}
              >
                {h.sortable && h.id ? (
                  <button
                    type="button"
                    onClick={() => onSort(h.id!)}
                    className={cn(
                      "inline-flex items-center gap-1 hover:text-zinc-900",
                      h.align === "right" && "ml-auto"
                    )}
                  >
                    {h.label}
                    <SortIcon active={sortKey === h.id} dir={sortDir} />
                  </button>
                ) : (
                  h.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + 1}
                className="px-4 py-20 text-center text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const delivering = getAdDeliveryState(row) === "active";
              const canToggle =
                isCampaignOn(row.campaign);
              const goal = conversionGoalLabel(row.campaign.conversion_goal);
              const isSelected = selected.has(row.id);

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "group border-b border-zinc-100 transition-colors",
                    delivering && "bg-white",
                    !delivering && "bg-white",
                    isSelected && "bg-[#5B47FB]/[0.06]",
                    "hover:bg-accent-light/80"
                  )}
                >
                  <td className="px-2 py-1.5 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        onSelectRow(row.id, e.target.checked)
                      }
                      className="h-3.5 w-3.5 rounded border-zinc-300"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <MetaToggle
                      checked={row.ad.active && row.campaign.on_off}
                      disabled={!canToggle}
                      onChange={(v) => onToggleAd(row, v)}
                    />
                  </td>
                  <td className="min-w-[220px] px-2 py-1 align-middle">
                    <MetaAdNameCell
                      row={row}
                      onEdit={() => {}}
                    />
                  </td>
                  {visibleCols.delivery ? (
                    <td className="whitespace-nowrap px-3 py-1.5 align-middle">
                      <MetaDeliveryStatus row={row} />
                    </td>
                  ) : null}
                  <td className="px-2 py-1.5 align-middle text-zinc-300">—</td>
                  {visibleCols.results ? (
                    <td className="px-3 py-1.5 align-middle">
                      <div>
                        <p className="font-medium text-zinc-900">
                          {formatNumber(row.ad.metrics.conversions)}
                        </p>
                        <p className="text-[12px] text-zinc-500">{goal}</p>
                      </div>
                    </td>
                  ) : null}
                  {visibleCols.cost_per_result ? (
                    <td className="px-3 py-1.5 text-right align-middle">
                      {row.ad.metrics.conversions > 0 ? (
                        <div>
                          <p className="font-medium text-zinc-900">
                            {formatCurrency(row.ad.metrics.cpa)}
                          </p>
                          <p className="text-[12px] text-zinc-500">
                            Per {goal}
                          </p>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  ) : null}
                  {visibleCols.budget ? (
                    <td className="px-3 py-1.5 align-middle text-zinc-600">
                      <span className="text-[12px]">Using campaign budget</span>
                    </td>
                  ) : null}
                  {visibleCols.amount_spent ? (
                    <td className="px-3 py-1.5 text-right align-middle font-medium tabular-nums text-zinc-900">
                      {formatCurrency(row.ad.metrics.spend)}
                    </td>
                  ) : null}
                  {visibleCols.clicks ? (
                    <td className="px-3 py-1.5 text-right align-middle tabular-nums text-zinc-800">
                      {formatNumber(row.ad.metrics.clicks)}
                    </td>
                  ) : null}
                  {visibleCols.ctr ? (
                    <td className="px-3 py-1.5 text-right align-middle tabular-nums text-zinc-800">
                      {formatNumber(row.ad.metrics.ctr * 100, 2)}%
                    </td>
                  ) : null}
                  {visibleCols.impressions ? (
                    <td className="px-3 py-1.5 text-right align-middle tabular-nums text-zinc-800">
                      {formatNumber(row.ad.metrics.impressions)}
                    </td>
                  ) : null}
                  {visibleCols.ends ? (
                    <td className="whitespace-nowrap px-3 py-1.5 align-middle text-zinc-700">
                      {formatEnds(row.campaign.end_date)}
                    </td>
                  ) : null}
                  {visibleCols.bid ? (
                    <td className="max-w-[200px] px-3 py-1.5 align-middle text-[12px] text-zinc-600">
                      {formatBid(Number(row.campaign.cpc_bid))}
                    </td>
                  ) : null}
                  {visibleCols.last_edit ? (
                    <td className="whitespace-nowrap px-3 py-1.5 align-middle text-zinc-600">
                      {formatRelativeUpdated(row.campaign.updated_at)}
                    </td>
                  ) : null}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function useMetaAdsColumns() {
  const [cols, setCols] = useState(DEFAULT_META_COLS);
  const menuItems = useMemo(
    () =>
      (Object.entries(cols) as [MetaAdColKey, boolean][]).map(
        ([id, visible]) => ({
          id,
          label: COL_LABELS[id],
          visible,
          locked: false,
        })
      ),
    [cols]
  );
  return { cols, setCols, menuItems };
}

export { DEFAULT_META_COLS, COL_LABELS };
