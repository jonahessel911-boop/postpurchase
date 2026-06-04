"use client";

import { useMemo, useState } from "react";
import { formatLogTime, type PostbackLog } from "@/lib/admin-types";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Search, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

export function AdminPostbacksClient({ logs }: { logs: PostbackLog[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((p) => {
      const q = search.toLowerCase();
      if (
        q &&
        !p.click_id.toLowerCase().includes(q) &&
        !p.campaign_name.toLowerCase().includes(q) &&
        !p.advertiser_email.toLowerCase().includes(q) &&
        !p.traffic_partner.toLowerCase().includes(q) &&
        !p.page.toLowerCase().includes(q) &&
        !p.intent_product.toLowerCase().includes(q) &&
        !p.product_choose.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [logs, search, statusFilter]);

  const stats = useMemo(() => {
    const success = filtered.filter((p) => p.status === "success").length;
    const failed = filtered.filter((p) => p.status === "failed").length;
    const value = filtered
      .filter((p) => p.status === "success")
      .reduce((s, p) => s + p.value, 0);
    return { success, failed, value, total: filtered.length };
  }, [filtered]);

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Postback logs
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Conversions with full click attribution (partner, page, intent, offers,
          GEO, placement)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total events", value: formatNumber(stats.total) },
          { label: "Successful", value: formatNumber(stats.success) },
          { label: "Failed", value: formatNumber(stats.failed) },
          { label: "Attributed value", value: formatCurrency(stats.value) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {item.label}
            </p>
            <p className="mt-1 font-mono text-[16px] font-semibold text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search click ID, partner, page, product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-[13px]"
        >
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="duplicate">Duplicate</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-muted">
            No postback logs yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-[13px]">
              <thead className="border-b border-border bg-zinc-50/80">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="w-8 px-2 py-2.5" />
                  <th className="px-3 py-2.5">Postback</th>
                  <th className="px-3 py-2.5">Click time</th>
                  <th className="px-3 py-2.5">Click ID</th>
                  <th className="px-3 py-2.5">Partner</th>
                  <th className="px-3 py-2.5">Page</th>
                  <th className="px-3 py-2.5">Intent</th>
                  <th className="px-3 py-2.5">Chosen</th>
                  <th className="px-3 py-2.5">Placement</th>
                  <th className="px-3 py-2.5">GEO</th>
                  <th className="px-3 py-2.5">Event</th>
                  <th className="px-3 py-2.5 text-right">Value</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <PostbackRow
                    key={p.id}
                    log={p}
                    zebra={i % 2 === 1}
                    copied={copied}
                    expanded={expandedId === p.id}
                    onToggle={() =>
                      setExpandedId((id) => (id === p.id ? null : p.id))
                    }
                    onCopy={copyId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PostbackRow({
  log: p,
  zebra,
  copied,
  expanded,
  onToggle,
  onCopy,
}: {
  log: PostbackLog;
  zebra: boolean;
  copied: string | null;
  expanded: boolean;
  onToggle: () => void;
  onCopy: (id: string) => void;
}) {
  const statusStyles: Record<string, string> = {
    success: "text-emerald-600",
    failed: "text-red-600",
    duplicate: "text-amber-600",
  };

  const offersLabel =
    p.product_selection.length > 0 ? p.product_selection.join(", ") : "—";

  return (
    <>
      <tr
        className={cn(
          "border-b border-border hover:bg-violet-50/60",
          zebra && "bg-zinc-50/50"
        )}
      >
        <td className="px-2 py-2.5">
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-0.5 text-zinc-400 hover:text-foreground"
            aria-label="Toggle attribution details"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-muted">
          {formatLogTime(p.created_at)}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-zinc-500">
          {p.click_created_at ? formatLogTime(p.click_created_at) : "—"}
        </td>
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => onCopy(p.click_id)}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:text-accent"
          >
            {p.click_id.length > 14 ? `${p.click_id.slice(0, 14)}…` : p.click_id}
            {copied === p.click_id ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </td>
        <td
          className="max-w-[110px] truncate px-3 py-2.5"
          title={p.traffic_partner}
        >
          {p.traffic_partner}
        </td>
        <td className="max-w-[120px] truncate px-3 py-2.5" title={p.page}>
          {p.page}
        </td>
        <td
          className="max-w-[100px] truncate px-3 py-2.5"
          title={p.intent_product}
        >
          {p.intent_product}
        </td>
        <td
          className="max-w-[120px] truncate px-3 py-2.5"
          title={p.product_choose}
        >
          {p.product_choose}
        </td>
        <td className="px-3 py-2.5 capitalize text-muted">
          {p.placement !== "—" ? p.placement.replace("_", " ") : "—"}
        </td>
        <td className="px-3 py-2.5 font-mono text-[12px]">{p.country}</td>
        <td className="px-3 py-2.5">
          <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
            {p.event}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right font-mono font-medium">
          {formatCurrency(p.value)}
        </td>
        <td
          className={cn(
            "px-3 py-2.5 text-[12px] font-medium capitalize",
            statusStyles[p.status]
          )}
        >
          {p.status}
        </td>
      </tr>
      {expanded ? (
        <tr
          className={cn(
            "border-b border-border bg-violet-50/30",
            zebra && "bg-zinc-50/80"
          )}
        >
          <td colSpan={13} className="px-4 py-3 text-[12px] text-muted">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Campaign" value={p.campaign_name} />
              <Detail label="Ad" value={p.ad_name} />
              <Detail label="Advertiser" value={p.advertiser_email} />
              <Detail label="Offers shown" value={offersLabel} />
              <Detail label="HTTP status" value={String(p.http_status)} />
              <Detail
                label="Latency"
                value={p.latency_ms > 0 ? `${p.latency_ms}ms` : "—"}
              />
              <Detail
                label="Widget URL"
                value={p.widget_url || "—"}
                mono
                className="sm:col-span-2 lg:col-span-4"
              />
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Detail({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 break-all text-foreground",
          mono && "font-mono text-[11px]"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
