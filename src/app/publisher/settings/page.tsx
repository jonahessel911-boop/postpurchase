import { PublisherSettingsClient } from "@/components/publisher/publisher-settings-client";
import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";
import {
  EMPTY_PUBLISHER_INVOICE_SETTINGS,
  loadCreditInvoices,
  loadPublisherInvoiceSettings,
} from "@/lib/api/publisher-settings-server";
import { redirect } from "next/navigation";

export default async function PublisherSettingsPage() {
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) redirect("/login/publisher");

  const [invoiceSettings, creditInvoices] = await Promise.all([
    loadPublisherInvoiceSettings(),
    loadCreditInvoices(),
  ]);

  return (
    <PublisherSettingsClient
      publisherId={ctx.publisherId}
      companyName={ctx.publisher?.company_name ?? "Traffic partner"}
      contactEmail={ctx.publisher?.contact_email ?? ""}
      invoices={creditInvoices}
      invoiceSettings={invoiceSettings ?? EMPTY_PUBLISHER_INVOICE_SETTINGS}
    />
  );
}
