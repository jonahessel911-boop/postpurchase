"use client";

import { useState } from "react";
import { Button, Card, TabList, TabButton } from "@/components/ui";
import { savePublisherInvoiceSettings } from "@/lib/api/publisher-settings-actions";
import type {
  CreditInvoice,
  PublisherInvoiceSettings,
} from "@/lib/api/publisher-settings-server";
import { cn, formatCurrency } from "@/lib/utils";
import { Download, FileText } from "lucide-react";

type SubTab = "list" | "settings";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-zinc-700">{label}</label>
      {hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[14px] text-foreground placeholder:text-zinc-400 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
    />
  );
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

function statusLabel(status: CreditInvoice["status"]) {
  const labels: Record<CreditInvoice["status"], string> = {
    draft: "Draft",
    sent: "Processing",
    paid: "Paid",
    overdue: "Overdue",
  };
  return labels[status];
}

function statusClass(status: CreditInvoice["status"]) {
  const styles: Record<CreditInvoice["status"], string> = {
    draft: "bg-zinc-50 text-muted",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-emerald-50 text-emerald-700",
    overdue: "bg-red-500/10 text-red-600",
  };
  return styles[status];
}

function CreditInvoiceList({ invoices }: { invoices: CreditInvoice[] }) {
  return (
    <div className="space-y-4">
      <Card className="border-accent/15 bg-accent/[0.04] p-4 sm:p-5">
        <p className="text-[13px] leading-relaxed text-zinc-700">
          Every first of the month a credit invoice gets generated based on your
          clicks from the previous month. This amount will be paid within 14
          days to your bank account.
        </p>
      </Card>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
            <FileText className="h-5 w-5 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold text-foreground">
            No credit invoices yet
          </h3>
          <p className="mt-1 max-w-md text-[13px] text-muted">
            Your first credit invoice will appear here after a full month of
            traffic. Earnings are calculated from verified clicks on your
            placements.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Clicks</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {formatPeriod(invoice.period_start, invoice.period_end)}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {invoice.clicks_count.toLocaleString("nl-NL")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                          statusClass(invoice.status)
                        )}
                      >
                        {statusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {invoice.pdf_url ? (
                        <a
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/30 hover:text-accent"
                          aria-label={`Download ${invoice.invoice_number}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-[12px] text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PublisherInvoiceSettingsForm({
  initial,
}: {
  initial: PublisherInvoiceSettings;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field: keyof PublisherInvoiceSettings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePublisherInvoiceSettings(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold">Invoice & payout details</h2>
        <p className="mt-1 text-[13px] text-muted">
          Used on your credit invoices and for bank transfers. Payouts are based
          on your monthly click earnings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <TextInput
            value={form.company_name}
            onChange={(v) => update("company_name", v)}
            placeholder="Partner B.V."
          />
        </Field>
        <Field label="Billing email">
          <TextInput
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="finance@partner.nl"
          />
        </Field>
        <Field label="VAT / Tax ID">
          <TextInput
            value={form.vat_number}
            onChange={(v) => update("vat_number", v)}
            placeholder="NL123456789B01"
          />
        </Field>
        <Field label="Country">
          <TextInput
            value={form.country}
            onChange={(v) => update("country", v)}
            placeholder="NL"
          />
        </Field>
      </div>

      <Field label="Address line 1">
        <TextInput
          value={form.address_line1}
          onChange={(v) => update("address_line1", v)}
          placeholder="Keizersgracht 123"
        />
      </Field>

      <Field label="Address line 2 (optional)">
        <TextInput
          value={form.address_line2}
          onChange={(v) => update("address_line2", v)}
          placeholder="Suite 4"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Postal code">
          <TextInput
            value={form.postal_code}
            onChange={(v) => update("postal_code", v)}
            placeholder="1015 CJ"
          />
        </Field>
        <Field label="City">
          <TextInput
            value={form.city}
            onChange={(v) => update("city", v)}
            placeholder="Amsterdam"
          />
        </Field>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="text-[13px] font-semibold text-foreground">
          Bank account
        </h3>
        <p className="mt-1 text-[12px] text-muted">
          Credit invoice payouts are transferred to this account within 14 days.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Account holder name">
            <TextInput
              value={form.bank_account_holder}
              onChange={(v) => update("bank_account_holder", v)}
              placeholder="Partner B.V."
            />
          </Field>
          <Field label="IBAN">
            <TextInput
              value={form.bank_iban}
              onChange={(v) => update("bank_iban", v)}
              placeholder="NL00 BANK 0123 4567 89"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button disabled={saving} onClick={handleSave} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Save invoice settings"}
        </Button>
        {saved ? (
          <span className="text-[12px] text-emerald-600">Saved</span>
        ) : null}
      </div>
    </Card>
  );
}

export function PublisherCreditInvoicesPanel({
  invoices,
  invoiceSettings,
}: {
  invoices: CreditInvoice[];
  invoiceSettings: PublisherInvoiceSettings;
}) {
  const [subTab, setSubTab] = useState<SubTab>("list");

  return (
    <div className="min-w-0 space-y-4">
      <TabList>
        <TabButton active={subTab === "list"} onClick={() => setSubTab("list")}>
          Credit invoices
        </TabButton>
        <TabButton
          active={subTab === "settings"}
          onClick={() => setSubTab("settings")}
        >
          Invoice settings
        </TabButton>
      </TabList>
      {subTab === "list" ? (
        <CreditInvoiceList invoices={invoices} />
      ) : (
        <PublisherInvoiceSettingsForm initial={invoiceSettings} />
      )}
    </div>
  );
}
