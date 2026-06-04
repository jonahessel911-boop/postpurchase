"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, TabList, TabButton } from "@/components/ui";
import { AccountMembersPanel } from "@/components/admin/account-members-panel";
import { MetaStatusBadge } from "@/components/campaigns/meta-badge";
import type { AccountMemberRow } from "@/lib/api/admin-accounts";
import type {
  AdminAdvertiser,
  AdminInvoice,
  AdminCampaignRow,
} from "@/lib/admin-types";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";

type DetailTab = "overview" | "invoices" | "campaigns";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-[12px] font-medium text-muted">{label}</dt>
      <dd className="text-[13px] text-foreground sm:text-right">{value || "—"}</dd>
    </div>
  );
}

function invoiceStatusClass(status: AdminInvoice["status"]) {
  const styles: Record<AdminInvoice["status"], string> = {
    draft: "bg-zinc-50 text-muted",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-emerald-50 text-emerald-700",
    overdue: "bg-red-500/10 text-red-600",
  };
  return styles[status];
}

function formatPeriod(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function AccountStatus({ status }: { status: AdminAdvertiser["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium capitalize",
        status === "active" ? "text-emerald-600" : "text-red-600"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" ? "bg-emerald-500" : "bg-red-500"
        )}
      />
      {status}
    </span>
  );
}

export function AdminAdvertiserDetailClient({
  advertiser,
  invoices,
  campaigns,
  members,
}: {
  advertiser: AdminAdvertiser;
  invoices: AdminInvoice[];
  campaigns: AdminCampaignRow[];
  members: AccountMemberRow[];
}) {
  const [tab, setTab] = useState<DetailTab>("overview");

  const spend = useMemo(
    () => campaigns.reduce((s, c) => s + c.metrics.spend, 0),
    [campaigns]
  );
  const activeCampaigns = campaigns.filter(
    (c) => c.on_off && c.status !== "rejected"
  ).length;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <Link
          href="/admin/advertisers"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All advertisers
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {advertiser.company}
          </h1>
          <AccountStatus status={advertiser.status} />
        </div>
        <p className="mt-1.5 text-[13px] text-muted">
          {advertiser.billing.company_name}
          <span className="mx-2 text-zinc-300">·</span>
          Member since {formatDate(advertiser.created_at)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: "Wallet", value: formatCurrency(advertiser.wallet_balance) },
          { label: "Total spend", value: formatCurrency(spend) },
          { label: "Campaigns", value: formatNumber(campaigns.length) },
          { label: "Active", value: formatNumber(activeCampaigns) },
        ].map((item) => (
          <Card key={item.label} className="p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight sm:text-[22px]">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <TabList>
        <TabButton
          active={tab === "overview"}
          onClick={() => setTab("overview")}
        >
          Overview
        </TabButton>
        <TabButton
          active={tab === "invoices"}
          onClick={() => setTab("invoices")}
        >
          Invoices ({invoices.length})
        </TabButton>
        <TabButton
          active={tab === "campaigns"}
          onClick={() => setTab("campaigns")}
        >
          Campaigns ({campaigns.length})
        </TabButton>
      </TabList>

      {tab === "overview" ? (
        <div className="space-y-4">
          <AccountMembersPanel
            accountId={advertiser.id}
            accountType="advertiser"
            companyName={advertiser.company}
            members={members}
          />
          <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4 p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Company details</h2>
            <dl className="space-y-3">
              <DetailRow
                label="Legal name"
                value={advertiser.billing.company_name}
              />
              <DetailRow label="VAT / Tax ID" value={advertiser.billing.vat_number} />
              <DetailRow label="Address" value={advertiser.billing.address_line1} />
              {advertiser.billing.address_line2 ? (
                <DetailRow label="Address line 2" value={advertiser.billing.address_line2} />
              ) : null}
              <DetailRow
                label="City"
                value={`${advertiser.billing.postal_code} ${advertiser.billing.city}`}
              />
              <DetailRow label="Country" value={advertiser.billing.country} />
              <DetailRow label="Billing email" value={advertiser.billing.email} />
            </dl>
          </Card>

          <Card className="space-y-4 p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Contact details</h2>
            <dl className="space-y-3">
              <DetailRow label="Contact name" value={advertiser.name} />
              <DetailRow label="Email" value={advertiser.email} />
              <DetailRow label="Phone" value={advertiser.phone ?? ""} />
              <DetailRow label="Account status" value={advertiser.status} />
              <DetailRow
                label="Wallet balance"
                value={formatCurrency(advertiser.wallet_balance)}
              />
            </dl>
          </Card>
        </div>
        </div>
      ) : null}

      {tab === "invoices" ? (
        invoices.length === 0 ? (
          <Card className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
              <FileText className="h-5 w-5 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">
              No invoices
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              This advertiser has no invoices yet.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-2.5">Invoice</th>
                    <th className="px-4 py-2.5">Period</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-right">Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border last:border-0 hover:bg-zinc-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatPeriod(invoice.period_start, invoice.period_end)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                            invoiceStatusClass(invoice.status)
                          )}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted">
                        {formatDate(invoice.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : null}

      {tab === "campaigns" ? (
        campaigns.length === 0 ? (
          <Card className="px-4 py-12 text-center text-[13px] text-muted">
            No campaigns for this advertiser.
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <th className="px-4 py-2.5">Campaign</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Spend</th>
                    <th className="px-4 py-2.5 text-right">Clicks</th>
                    <th className="px-4 py-2.5 text-right">Conv.</th>
                    <th className="px-4 py-2.5 text-right">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-0 hover:bg-zinc-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {c.name}
                      </td>
                      <td className="px-4 py-3">
                        <MetaStatusBadge status={c.status} onOff={c.on_off} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(c.metrics.spend)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatNumber(c.metrics.clicks)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatNumber(c.metrics.conversions)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {c.metrics.conversions > 0
                          ? formatCurrency(c.metrics.cpa)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : null}
    </div>
  );
}
