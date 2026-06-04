"use client";

import { useState } from "react";
import { Card, PageHeader, TabList, TabButton } from "@/components/ui";
import { PublisherCreditInvoicesPanel } from "@/components/publisher/publisher-credit-invoices-panel";
import type {
  CreditInvoice,
  PublisherInvoiceSettings,
} from "@/lib/api/publisher-settings-server";

type SettingsTab = "account" | "credit-invoices";

export function PublisherSettingsClient({
  publisherId,
  companyName,
  contactEmail,
  invoices,
  invoiceSettings,
}: {
  publisherId: string;
  companyName: string;
  contactEmail: string;
  invoices: CreditInvoice[];
  invoiceSettings: PublisherInvoiceSettings;
}) {
  const [tab, setTab] = useState<SettingsTab>("account");

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <PageHeader title="Settings" />

      <TabList>
        <TabButton
          active={tab === "account"}
          onClick={() => setTab("account")}
        >
          Account
        </TabButton>
        <TabButton
          active={tab === "credit-invoices"}
          onClick={() => setTab("credit-invoices")}
        >
          Credit invoices
        </TabButton>
      </TabList>

      {tab === "account" ? (
        <Card className="p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Traffic partner
          </p>
          <p className="mt-2 text-[15px] font-semibold">{companyName}</p>
          <p className="mt-1 text-[13px] text-muted">{contactEmail}</p>
          <p className="mt-3 text-[12px] text-zinc-500">
            Partner ID:{" "}
            <code className="font-mono text-[11px]">{publisherId}</code>
          </p>
        </Card>
      ) : (
        <PublisherCreditInvoicesPanel
          invoices={invoices}
          invoiceSettings={invoiceSettings}
        />
      )}
    </div>
  );
}
