"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdsManagerTable,
  type ColumnDef,
} from "@/components/campaigns/ads-manager-table";
import { ManagerToolbar } from "@/components/publisher/manager-toolbar";
import { Toggle } from "@/components/ui";
import { offerTypeLabel } from "@/lib/publisher-offer-types";
import type { PlacementWithMetrics } from "@/lib/publisher-metrics";
import type { PublisherMetricsSnapshot } from "@/lib/publisher-metrics";
import { placementsWithMetrics } from "@/lib/publisher-metrics";
import { toolbarDateToPreset } from "@/lib/date-range";
import { formatNumber, cn } from "@/lib/utils";

type SortKey = "name" | "clicks" | "conversions";

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

export function ManagerWorkspace({
  snapshot,
}: {
  snapshot: PublisherMetricsSnapshot;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    offerType: "all",
    dateRange: "30d",
  });
  const [sortKey, setSortKey] = useState<SortKey>("clicks");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<PlacementWithMetrics[]>(() =>
    placementsWithMetrics(snapshot, toolbarDateToPreset(filters.dateRange))
  );

  const metricsRows = useMemo(
    () => placementsWithMetrics(snapshot, toolbarDateToPreset(filters.dateRange)),
    [snapshot, filters.dateRange]
  );

  useEffect(() => {
    setRows(metricsRows);
  }, [metricsRows]);

  const filtered = useMemo(() => {
    let list = rows.filter((p) => {
      const q = filters.search.toLowerCase();
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.page_path.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filters.status === "active" && !p.active) return false;
      if (filters.status === "paused" && p.active) return false;
      if (filters.offerType !== "all" && p.placement !== filters.offerType) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let m = 0;
      if (sortKey === "name") {
        m = a.name.localeCompare(b.name);
      } else {
        m = a.metrics[sortKey] - b.metrics[sortKey];
      }
      return sortDir === "asc" ? m : -m;
    });
    return list;
  }, [rows, filters, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setSortDir("desc");
    }
  }

  async function toggleActive(row: PlacementWithMetrics, active: boolean) {
    const res = await fetch(`/api/publisher/placements/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) return;
    setRows((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, active } : p))
    );
  }

  const columns: ColumnDef<PlacementWithMetrics>[] = [
    {
      id: "offer",
      header: "Offer",
      width: 280,
      minWidth: 200,
      sticky: true,
      sortable: true,
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="min-w-0">
          <Link
            href={`/publisher/manager/${p.id}`}
            className="block truncate font-medium text-zinc-900 hover:text-accent"
          >
            {p.name}
          </Link>
          <p className="truncate text-[11px] text-zinc-400">{p.page_path}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      width: 140,
      render: (p) => (
        <span className="text-[12px] text-zinc-600">
          {offerTypeLabel(p.placement)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: 88,
      render: (p) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
            p.active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-zinc-100 text-zinc-500"
          )}
        >
          {p.active ? "Active" : "Paused"}
        </span>
      ),
    },
    {
      id: "clicks",
      header: "Clicks",
      width: 80,
      align: "right",
      sortable: true,
      sortValue: (p) => p.metrics.clicks,
      render: (p) => (
        <CellValue align="right" strong>
          {formatNumber(p.metrics.clicks)}
        </CellValue>
      ),
    },
    {
      id: "conversions",
      header: "Conv.",
      width: 72,
      align: "right",
      sortable: true,
      sortValue: (p) => p.metrics.conversions,
      render: (p) => (
        <CellValue align="right">
          {formatNumber(p.metrics.conversions)}
        </CellValue>
      ),
    },
    {
      id: "on",
      header: "On",
      width: 56,
      render: (p) => (
        <Toggle
          checked={p.active}
          onChange={(v) => toggleActive(p, v)}
        />
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-3">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
          Manager
        </h1>
      </header>

      <div className="overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <ManagerToolbar
          filters={filters}
          onFiltersChange={(next) =>
            setFilters((f) => ({ ...f, ...next }))
          }
        />
        <AdsManagerTable
          rows={filtered}
          columns={columns}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          selected={selected}
          onSelectRow={(id, checked) => {
            setSelected((prev) => {
              const next = new Set(prev);
              if (checked) next.add(id);
              else next.delete(id);
              return next;
            });
          }}
          onSelectAll={(checked) => {
            setSelected(
              checked ? new Set(filtered.map((p) => p.id)) : new Set()
            );
          }}
          onRowClick={(row) => router.push(`/publisher/manager/${row.id}`)}
          emptyMessage="No offers yet — click Add offer to create your first placement"
          premium
        />
      </div>
    </div>
  );
}
