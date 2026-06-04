"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { MetaStatusBadge } from "@/components/campaigns/meta-badge";
import {
  AdsManagerTable,
  ColumnsMenu,
  type ColumnDef,
} from "@/components/campaigns/ads-manager-table";
import {
  AdsManagerToolbar,
  BulkActionBar,
  PaginationBar,
  ViewTabs,
  type ToolbarFilters,
} from "@/components/campaigns/ads-manager-toolbar";
import { Toggle } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  bulkUpdateCampaignsOnOff,
  updateAdActive,
  updateCampaignOnOff,
} from "@/lib/api/campaign-actions";
import {
  MetaAdsTable,
  MetaAdsToolbar,
  useMetaAdsColumns,
  type MetaAdColKey,
} from "@/components/campaigns/meta-ads-manager";
import type { CampaignWithMetrics } from "@/lib/campaign-types";
import {
  campaignsWithMetricsFromSnapshot,
  type AdvertiserMetricsSnapshot,
} from "@/lib/metrics-from-snapshot";
import { toolbarDateToPreset } from "@/lib/date-range";
import {
  createAdPath,
  resolveCreateAdCampaignId,
} from "@/lib/campaign-create-ad";
import { verticalLabel } from "@/lib/campaign-types";
import { cn } from "@/lib/utils";
import {
  campaignDisplayId,
  sortCampaigns,
  sortAds,
  flattenAds,
  estimateRevenue,
  estimateRoas,
  type CampaignSortKey,
  type AdSortKey,
  type SortDir,
  type SavedView,
  type AdRow,
} from "@/lib/campaign-table-utils";
import {
  isAdDelivering,
  isCampaignOn,
  isCampaignRejected,
} from "@/lib/campaign-status";

const PAGE_SIZE = 25;

type Tab = "campaigns" | "ads";

type CampaignColKey =
  | "campaign"
  | "vertical"
  | "status"
  | "spend"
  | "daily_budget"
  | "clicks"
  | "ctr"
  | "conversions"
  | "cpa"
  | "revenue"
  | "roas";

const DEFAULT_CAMPAIGN_COLS: Record<CampaignColKey, boolean> = {
  campaign: true,
  vertical: false,
  status: true,
  spend: false,
  daily_budget: true,
  clicks: true,
  ctr: true,
  conversions: true,
  cpa: true,
  revenue: false,
  roas: false,
};

function CellValue({
  children,
  align = "left",
  muted,
  strong,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <span
      className={cn(
        "block font-mono tabular-nums",
        align === "right" && "text-right",
        strong && "font-medium text-zinc-900",
        muted ? "text-zinc-500" : !strong && "text-zinc-700"
      )}
    >
      {children}
    </span>
  );
}

function matchesStatus(c: CampaignWithMetrics, status: string): boolean {
  if (status === "all") return true;
  if (status === "active") return isCampaignOn(c);
  if (status === "paused") return !c.on_off && c.status !== "rejected";
  if (status === "rejected") return c.status === "rejected";
  return true;
}

function matchesAdStatus(row: AdRow, status: string): boolean {
  if (status === "all") return true;
  if (status === "active") return isAdDelivering(row.campaign, row.ad.active);
  if (status === "paused")
    return !isAdDelivering(row.campaign, row.ad.active) && row.campaign.status !== "rejected";
  if (status === "rejected") return row.campaign.status === "rejected";
  return true;
}

export function CampaignsWorkspace({
  snapshot,
}: {
  snapshot: AdvertiserMetricsSnapshot;
}) {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [filters, setFilters] = useState<ToolbarFilters>({
    search: "",
    status: "all",
    vertical: "all",
    dateRange: "30d",
  });
  const [savedView, setSavedView] = useState("all");
  const [campaignSortKey, setCampaignSortKey] =
    useState<CampaignSortKey>("spend");
  const [adSortKey, setAdSortKey] = useState<AdSortKey>("spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(
    new Set()
  );
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [campaignCols, setCampaignCols] = useState(DEFAULT_CAMPAIGN_COLS);
  const metaCols = useMetaAdsColumns();
  const [showColMenu, setShowColMenu] = useState(false);
  const [pageMode, setPageMode] = useState<"infinite" | "pages">("infinite");
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadRef = useRef<HTMLDivElement>(null);

  const metricsCampaigns = useMemo(
    () =>
      campaignsWithMetricsFromSnapshot(
        snapshot,
        toolbarDateToPreset(filters.dateRange)
      ),
    [snapshot, filters.dateRange]
  );

  const [campaigns, setCampaigns] = useState(metricsCampaigns);

  useEffect(() => {
    setCampaigns(metricsCampaigns);
  }, [metricsCampaigns]);

  const allAds = useMemo(() => flattenAds(campaigns), [campaigns]);

  const filteredCampaigns = useMemo(() => {
    let list = campaigns.filter((c) => {
      const q = filters.search.toLowerCase();
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !campaignDisplayId(c.id).toLowerCase().includes(q)
      ) {
        return false;
      }
      if (!matchesStatus(c, filters.status)) return false;
      if (filters.vertical !== "all" && c.vertical !== filters.vertical)
        return false;
      return true;
    });
    return sortCampaigns(list, campaignSortKey, sortDir);
  }, [campaigns, filters, campaignSortKey, sortDir]);

  const filteredAds = useMemo(() => {
    let list = allAds.filter((row) => {
      const q = filters.search.toLowerCase();
      if (
        q &&
        !row.ad.name.toLowerCase().includes(q) &&
        !row.campaign.name.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (!matchesAdStatus(row, filters.status)) return false;
      if (
        filters.vertical !== "all" &&
        row.campaign.vertical !== filters.vertical
      )
        return false;
      return true;
    });
    return sortAds(list, adSortKey, sortDir);
  }, [allAds, filters, adSortKey, sortDir]);

  const activeList = tab === "campaigns" ? filteredCampaigns : filteredAds;
  const total = activeList.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const visibleCampaigns = useMemo(() => {
    if (pageMode === "pages") {
      const start = (page - 1) * PAGE_SIZE;
      return filteredCampaigns.slice(start, start + PAGE_SIZE);
    }
    return filteredCampaigns.slice(0, visibleCount);
  }, [filteredCampaigns, pageMode, page, visibleCount]);

  const visibleAds = useMemo(() => {
    if (pageMode === "pages") {
      const start = (page - 1) * PAGE_SIZE;
      return filteredAds.slice(start, start + PAGE_SIZE);
    }
    return filteredAds.slice(0, visibleCount);
  }, [filteredAds, pageMode, page, visibleCount]);

  const showing =
    tab === "campaigns" ? visibleCampaigns.length : visibleAds.length;

  useEffect(() => {
    setPage(1);
    setVisibleCount(PAGE_SIZE);
  }, [filters, tab, campaignSortKey, adSortKey, sortDir, pageMode]);

  useEffect(() => {
    if (pageMode !== "infinite") return;
    const el = loadRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < total) {
          setVisibleCount((n) => Math.min(n + PAGE_SIZE, total));
        }
      },
      { rootMargin: "100px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageMode, visibleCount, total]);

  const toggleCampaignSort = useCallback(
    (key: string) => {
      const k = key as CampaignSortKey;
      if (campaignSortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setCampaignSortKey(k);
        setSortDir("desc");
      }
    },
    [campaignSortKey]
  );

  const toggleAdSort = useCallback(
    (key: string) => {
      const k = key as AdSortKey;
      if (adSortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setAdSortKey(k);
        setSortDir("desc");
      }
    },
    [adSortKey]
  );

  function applySavedView(view: SavedView) {
    setSavedView(view.id);
    if (view.status) setFilters((f) => ({ ...f, status: view.status! }));
    if (view.vertical) setFilters((f) => ({ ...f, vertical: view.vertical! }));
    if (view.sortKey && tab === "campaigns") {
      setCampaignSortKey(view.sortKey as CampaignSortKey);
      setSortDir("desc");
    }
  }

  async function bulkPauseCampaigns() {
    const ids = [...selectedCampaigns];
    await bulkUpdateCampaignsOnOff(ids, false);
    setCampaigns((list) =>
      list.map((c) => (selectedCampaigns.has(c.id) ? { ...c, on_off: false } : c))
    );
    setSelectedCampaigns(new Set());
  }

  async function bulkActivateCampaigns() {
    const ids = [...selectedCampaigns].filter((id) => {
      const c = campaigns.find((x) => x.id === id);
      return c && c.status !== "rejected";
    });
    await bulkUpdateCampaignsOnOff(ids, true);
    setCampaigns((list) =>
      list.map((c) =>
        selectedCampaigns.has(c.id) && c.status !== "rejected"
          ? { ...c, on_off: true }
          : c
      )
    );
    setSelectedCampaigns(new Set());
  }

  async function bulkArchiveCampaigns() {
    await bulkPauseCampaigns();
  }

  const handleCampaignOnOff = useCallback(
    async (campaignId: string, onOff: boolean) => {
      await updateCampaignOnOff(campaignId, onOff);
      setCampaigns((list) =>
        list.map((c) => (c.id === campaignId ? { ...c, on_off: onOff } : c))
      );
    },
    []
  );

  const campaignColumns: ColumnDef<CampaignWithMetrics>[] = useMemo(
    () => [
      {
        id: "on_off",
        header: "",
        width: 56,
        minWidth: 56,
        sticky: true,
        sortable: true,
        sortValue: (c) => (c.on_off ? 1 : 0),
        render: (c) => (
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Toggle
              checked={c.on_off}
              disabled={isCampaignRejected(c.status)}
              onChange={(v) => void handleCampaignOnOff(c.id, v)}
            />
          </div>
        ),
      },
      {
        id: "campaign",
        header: "Campaign",
        width: 240,
        minWidth: 160,
        sticky: true,
        sortable: true,
        visible: campaignCols.campaign,
        sortValue: (c) => c.name,
        cellClassName: "overflow-hidden",
        render: (c) => (
          <Link
            href={`/campaigns/${c.id}`}
            className="block truncate text-[13px] font-semibold leading-snug text-zinc-950 hover:text-[#5B47FB]"
          >
            {c.name}
          </Link>
        ),
      },
      {
        id: "vertical",
        header: "Vertical",
        width: 100,
        sortable: true,
        visible: campaignCols.vertical,
        sortValue: (c) => c.vertical,
        render: (c) => (
          <CellValue muted>{verticalLabel(c.vertical)}</CellValue>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: 104,
        sortable: true,
        visible: campaignCols.status,
        render: (c) => (
          <MetaStatusBadge status={c.status} onOff={c.on_off} anchor />
        ),
      },
      {
        id: "spend",
        header: "Spend",
        width: 88,
        align: "right",
        sortable: true,
        visible: campaignCols.spend,
        render: (c) => (
          <CellValue align="right">
            {formatCurrency(c.metrics.spend)}
          </CellValue>
        ),
      },
      {
        id: "daily_budget",
        header: "Spend / Budget",
        width: 120,
        align: "right",
        sortable: true,
        visible: campaignCols.daily_budget,
        sortValue: (c) => Number(c.daily_budget ?? 0),
        render: (c) => {
          const budget =
            c.daily_budget != null ? Number(c.daily_budget) : null;
          return (
            <span className="block text-right font-mono tabular-nums text-[13px]">
              <span className="font-medium text-zinc-900">
                {formatCurrency(c.metrics.spend)}
              </span>
              <span className="text-zinc-400">
                {" / "}
                {budget != null ? formatCurrency(budget) : "—"}
              </span>
            </span>
          );
        },
      },
      {
        id: "clicks",
        header: "Clicks",
        width: 72,
        align: "right",
        sortable: true,
        visible: campaignCols.clicks,
        render: (c) => (
          <CellValue align="right" muted>
            {formatNumber(c.metrics.clicks)}
          </CellValue>
        ),
      },
      {
        id: "ctr",
        header: "CTR",
        width: 72,
        align: "right",
        sortable: true,
        visible: campaignCols.ctr,
        render: (c) => (
          <CellValue align="right" muted>
            {formatNumber(c.metrics.ctr * 100, 1)}%
          </CellValue>
        ),
      },
      {
        id: "conversions",
        header: "Conv.",
        width: 64,
        align: "right",
        sortable: true,
        visible: campaignCols.conversions,
        render: (c) => (
          <CellValue align="right" strong>
            {formatNumber(c.metrics.conversions)}
          </CellValue>
        ),
      },
      {
        id: "cpa",
        header: "CPA",
        width: 80,
        align: "right",
        sortable: true,
        visible: campaignCols.cpa,
        render: (c) => (
          <CellValue align="right" strong>
            {c.metrics.conversions > 0
              ? formatCurrency(c.metrics.cpa)
              : "—"}
          </CellValue>
        ),
      },
      {
        id: "revenue",
        header: "Revenue",
        width: 88,
        align: "right",
        sortable: true,
        visible: campaignCols.revenue,
        render: (c) => (
          <CellValue align="right">
            {formatCurrency(estimateRevenue(c))}
          </CellValue>
        ),
      },
      {
        id: "roas",
        header: "ROAS",
        width: 72,
        align: "right",
        sortable: true,
        visible: campaignCols.roas,
        render: (c) => (
          <CellValue align="right">
            {formatNumber(estimateRoas(c), 1)}×
          </CellValue>
        ),
      },
    ],
    [campaignCols, handleCampaignOnOff]
  );

  const adRowData = useMemo(
    () =>
      visibleAds.map((row) => ({
        ...row,
        id: row.ad.id,
      })),
    [visibleAds]
  );

  const createAdCampaignId = useMemo(
    () => resolveCreateAdCampaignId(selectedAds, adRowData),
    [selectedAds, adRowData]
  );

  const createAdHref = createAdCampaignId
    ? createAdPath(createAdCampaignId)
    : null;

  type AdTableRow = AdRow & { id: string };

  const colMenuItems =
    tab === "campaigns"
      ? (
          Object.entries(campaignCols) as [CampaignColKey, boolean][]
        ).map(([id, visible]) => ({
          id,
          label:
            id === "campaign"
              ? "Campaign"
              : id === "vertical"
                ? "Vertical"
                : id === "daily_budget"
                  ? "Spend / Budget"
                  : id.charAt(0).toUpperCase() + id.slice(1),
          visible,
          locked: id === "campaign",
        }))
      : metaCols.menuItems;

  async function handleAdToggle(
    row: AdTableRow,
    active: boolean
  ) {
    await updateAdActive(row.ad.id, active);
    setCampaigns((list) =>
      list.map((c) =>
        c.id === row.campaign.id
          ? {
              ...c,
              ads: c.ads.map((a) =>
                a.id === row.ad.id ? { ...a, active } : a
              ),
            }
          : c
      )
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
            Campaigns
          </h1>
        </div>
        <ViewTabs
          active={tab}
          onChange={(t) => {
            setTab(t);
            setShowColMenu(false);
          }}
          campaignCount={filteredCampaigns.length}
          adCount={filteredAds.length}
          premium
        />
      </header>

      <div
        className={cn(
          "overflow-hidden bg-white",
          tab === "ads"
            ? "rounded-md border border-zinc-200"
            : "rounded-lg border border-zinc-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        )}
      >
        {tab === "ads" ? (
          <MetaAdsToolbar
            search={filters.search}
            onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
            selectedCount={selectedAds.size}
            createAdHref={createAdHref}
            onColumnsClick={() => setShowColMenu((v) => !v)}
            showColumnsMenu={showColMenu}
            columnsMenu={
              <ColumnsMenu
                columns={colMenuItems}
                onToggle={(id) => {
                  metaCols.setCols((c) => ({
                    ...c,
                    [id]: !c[id as MetaAdColKey],
                  }));
                }}
                onClose={() => setShowColMenu(false)}
              />
            }
          />
        ) : (
          <AdsManagerToolbar
            activeTab={tab}
            createAdHref={createAdHref}
            filters={filters}
            onFiltersChange={(next) =>
              setFilters((f) => ({ ...f, ...next }))
            }
            savedView={savedView}
            onSavedViewChange={applySavedView}
            onColumnsClick={() => setShowColMenu((v) => !v)}
            showColumnsMenu={showColMenu}
            premium
            columnsMenu={
              <ColumnsMenu
                columns={colMenuItems}
                onToggle={(id) => {
                  setCampaignCols((c) => ({
                    ...c,
                    [id]: !c[id as CampaignColKey],
                  }));
                }}
                onClose={() => setShowColMenu(false)}
              />
            }
          />
        )}

        {tab === "campaigns" ? (
          <BulkActionBar
            count={selectedCampaigns.size}
            onPause={bulkPauseCampaigns}
            onActivate={bulkActivateCampaigns}
            onArchive={bulkArchiveCampaigns}
            onClear={() => setSelectedCampaigns(new Set())}
            premium
          />
        ) : null}

        {tab === "campaigns" ? (
          <AdsManagerTable
            rows={visibleCampaigns}
            columns={campaignColumns}
            sortKey={campaignSortKey}
            sortDir={sortDir}
            onSort={toggleCampaignSort}
            selected={selectedCampaigns}
            onSelectRow={(id, checked) => {
              setSelectedCampaigns((s) => {
                const next = new Set(s);
                if (checked) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
            onSelectAll={(checked) => {
              setSelectedCampaigns(
                checked
                  ? new Set(visibleCampaigns.map((c) => c.id))
                  : new Set()
              );
            }}
            loadMoreRef={pageMode === "infinite" ? loadRef : undefined}
            premium
            emptyMessage="No campaigns"
          />
        ) : (
          <MetaAdsTable
            rows={adRowData}
            sortKey={adSortKey}
            sortDir={sortDir}
            onSort={(key) => toggleAdSort(key)}
            selected={selectedAds}
            onSelectRow={(id, checked) => {
              setSelectedAds((s) => {
                const next = new Set(s);
                if (checked) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
            onSelectAll={(checked) => {
              setSelectedAds(
                checked
                  ? new Set(adRowData.map((r) => r.id))
                  : new Set()
              );
            }}
            visibleCols={metaCols.cols}
            onToggleAd={handleAdToggle}
          />
        )}

        <PaginationBar
          mode={pageMode}
          onModeChange={setPageMode}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          showing={showing}
          premium
        />
      </div>
    </div>
  );
}
