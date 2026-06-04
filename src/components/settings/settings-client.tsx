"use client";

import { useState } from "react";
import { Card, Button, CopyButton, PageHeader, TabList, TabButton } from "@/components/ui";
import { SettingsInvoicesPanel } from "@/components/settings/settings-invoices-panel";
import type { Invoice, InvoiceSettings } from "@/lib/api/settings-server";
import { formatCurrency, getApiDomain } from "@/lib/utils";
import { getClickApiBase } from "@/lib/widget-url";
import { topUpWallet } from "@/lib/api/campaign-actions";
import { ExternalLink } from "lucide-react";

type SettingsTab = "general" | "invoices";

interface SettingsClientProps {
  advertiser: {
    email: string;
    wallet_balance: number;
  } | null;
  campaignIds: string[];
  invoices: Invoice[];
  invoiceSettings: InvoiceSettings;
}

function GeneralSettings({
  advertiser,
  campaignIds,
}: {
  advertiser: SettingsClientProps["advertiser"];
  campaignIds: string[];
}) {
  const [balance, setBalance] = useState(advertiser?.wallet_balance ?? 0);
  const [loading, setLoading] = useState(false);

  const clickUrl = `${getClickApiBase()}/{campaign_id}`;
  const postbackUrl = `${getApiDomain()}/postback?click_id={CLICK_ID}`;

  async function handleTopUp() {
    setLoading(true);
    try {
      setBalance(await topUpWallet(100));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(280px,360px)_1fr]">
      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Wallet Balance</h2>
        <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight sm:text-[32px]">
          {formatCurrency(balance)}
        </p>
        <Button
          variant="secondary"
          className="mt-4 w-full sm:w-auto"
          disabled={loading}
          onClick={handleTopUp}
        >
          Top up (+€100)
        </Button>
      </Card>

      <Card className="space-y-5 p-5 sm:p-6 lg:col-span-1 xl:col-span-1">
        <h2 className="text-sm font-semibold">Integration</h2>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-muted">Click URL</label>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-background px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
            <code className="min-w-0 flex-1 break-all font-mono text-[12px] sm:text-[13px]">
              {clickUrl}
            </code>
            <CopyButton text={clickUrl} />
          </div>
          {campaignIds.length > 0 ? (
            <p className="text-xs text-muted">
              Replace {"{campaign_id}"} with a campaign UUID, e.g.{" "}
              <code className="break-all font-mono">{campaignIds[0]}</code>
            </p>
          ) : (
            <p className="text-xs text-muted">
              Create a campaign first, then use its ID in the click URL.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-muted">
            Postback URL
          </label>
          <p className="text-xs text-muted">
            Call this when a conversion happens. Only send the click_id — the
            platform records the conversion goal set on each campaign.
          </p>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-background px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
            <code className="min-w-0 flex-1 break-all font-mono text-[12px] sm:text-[13px]">
              {postbackUrl}
            </code>
            <CopyButton text={postbackUrl} />
          </div>
        </div>

        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
        >
          View Integration Guide
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Card>
    </div>
  );
}

export function SettingsClient({
  advertiser,
  campaignIds,
  invoices,
  invoiceSettings,
}: SettingsClientProps) {
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <PageHeader title="Settings" />

      <TabList>
        <TabButton active={tab === "general"} onClick={() => setTab("general")}>
          General
        </TabButton>
        <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")}>
          Invoices
        </TabButton>
      </TabList>

      {tab === "general" ? (
        <GeneralSettings advertiser={advertiser} campaignIds={campaignIds} />
      ) : (
        <SettingsInvoicesPanel
          invoices={invoices}
          invoiceSettings={invoiceSettings}
        />
      )}
    </div>
  );
}
