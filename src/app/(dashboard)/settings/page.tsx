import {
  loadAdvertiserProfile,
  loadCampaignsWithMetrics,
} from "@/lib/api/campaigns-server";
import {
  loadInvoiceSettings,
  loadInvoices,
  EMPTY_INVOICE_SETTINGS,
} from "@/lib/api/settings-server";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const [advertiser, campaigns, invoiceSettings, invoices] = await Promise.all([
    loadAdvertiserProfile(),
    loadCampaignsWithMetrics(),
    loadInvoiceSettings(),
    loadInvoices(),
  ]);

  return (
    <SettingsClient
      advertiser={advertiser}
      campaignIds={campaigns.map((c) => c.id)}
      invoices={invoices}
      invoiceSettings={invoiceSettings ?? EMPTY_INVOICE_SETTINGS}
    />
  );
}
