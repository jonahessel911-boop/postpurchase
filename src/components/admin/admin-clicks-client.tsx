"use client";

import { useMemo, useState } from "react";
import { formatLogTime, type ClickLog } from "@/lib/admin-types";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Search, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

export function AdminClicksClient({ logs }: { logs: ClickLog[] }) {
  const [search, setSearch] = useState("");
  const [convertedOnly, setConvertedOnly] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((c) => {
      const q = search.toLowerCase();
      if (
        q &&
        !c.click_id.toLowerCase().includes(q) &&
        !c.campaign_name.toLowerCase().includes(q) &&
        !c.ad_name.toLowerCase().includes(q) &&
        !c.traffic_partner.toLowerCase().includes(q) &&
        !c.page.toLowerCase().includes(q) &&
        !c.intent_product.toLowerCase().includes(q) &&
        !c.product_choose.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (convertedOnly && !c.converted) return false;
      return true;
    });
  }, [logs, search, convertedOnly]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      converted: filtered.filter((c) => c.converted).length,
      spend: filtered.reduce((s, c) => s + c.cost, 0),
    }),
    [filtered]
  );

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Click logs
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Attribution stored per click — lookup any field via click ID
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total clicks", value: formatNumber(stats.total) },
          { label: "Converted", value: formatNumber(stats.converted) },
          { label: "Click spend", value: formatCurrency(stats.spend) },
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

      <div className="flex flex-wrap items-center gap-2">
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
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px]">
          <input
            type="checkbox"
            checked={convertedOnly}
            onChange={(e) => setConvertedOnly(e.target.checked)}
            className="rounded border-border text-accent"
          />
          Converted only
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-muted">
            No click logs yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-[13px]">
              <thead className="border-b border-border bg-zinc-50/80">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="w-8 px-2 py-2.5" />
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">Click ID</th>
                  <th className="px-3 py-2.5">Partner</th>
                  <th className="px-3 py-2.5">Page</th>
                  <th className="px-3 py-2.5">Intent</th>
                  <th className="px-3 py-2.5">Chosen</th>
                  <th className="px-3 py-2.5">Placement</th>
                  <th className="px-3 py-2.5">GEO</th>
                  <th className="px-3 py-2.5 text-right">Cost</th>
                  <th className="px-3 py-2.5">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <ClickRow
                    key={c.id}
                    log={c}
                    zebra={i % 2 === 1}
                    copied={copied}
                    expanded={expandedId === c.id}
                    onToggle={() =>
                      setExpandedId((id) => (id === c.id ? null : c.id))
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

function ClickRow({
  log: c,
  zebra,
  copied,
  expanded,
  onToggle,
  onCopy,
}: {
  log: ClickLog;
  zebra: boolean;
  copied: string | null;
  expanded: boolean;
  onToggle: () => void;
  onCopy: (id: string) => void;
}) {
  const offersLabel =
    c.product_selection.length > 0
      ? c.product_selection.join(", ")
      : "—";

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
            aria-label="Toggle details"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-muted">
          {formatLogTime(c.created_at)}
        </td>
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => onCopy(c.click_id)}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:text-accent"
          >
            {c.click_id.length > 14 ? `${c.click_id.slice(0, 14)}…` : c.click_id}
            {copied === c.click_id ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </td>
        <td className="max-w-[120px] truncate px-3 py-2.5" title={c.traffic_partner}>
          {c.traffic_partner}
        </td>
        <td className="max-w-[140px] truncate px-3 py-2.5" title={c.page}>
          {c.page}
        </td>
        <td className="max-w-[120px] truncate px-3 py-2.5" title={c.intent_product}>
          {c.intent_product}
        </td>
        <td className="max-w-[140px] truncate px-3 py-2.5" title={c.product_choose}>
          {c.product_choose}
        </td>
        <td className="px-3 py-2.5 capitalize text-muted">
          {c.placement !== "—" ? c.placement.replace("_", " ") : "—"}
        </td>
        <td className="px-3 py-2.5 font-mono text-[12px]">{c.country}</td>
        <td className="px-3 py-2.5 text-right font-mono">
          {formatCurrency(c.cost)}
        </td>
        <td className="px-3 py-2.5">
          {c.converted ? (
            <span className="text-[12px] font-medium text-emerald-600">Yes</span>
          ) : (
            <span className="text-zinc-400">—</span>
          )}
        </td>
      </tr>
      {expanded ? (
        <tr className={cn("border-b border-border bg-violet-50/30", zebra && "bg-zinc-50/80")}>
          <td colSpan={11} className="px-4 py-3 text-[12px] text-muted">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Campaign" value={c.campaign_name} />
              <Detail label="Ad" value={c.ad_name} />
              <Detail label="Advertiser" value={c.advertiser_email} />
              <Detail label="Offers shown" value={offersLabel} />
              <Detail
                label="Widget URL"
                value={c.widget_url || "—"}
                mono
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
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
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
