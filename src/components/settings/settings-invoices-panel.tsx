"use client";

import { useState } from "react";
import { Button, Card, TabList, TabButton } from "@/components/ui";
import { saveInvoiceSettings } from "@/lib/api/settings-actions";
import type { Invoice, InvoiceSettings } from "@/lib/api/settings-server";
import { cn, formatCurrency } from "@/lib/utils";
import { Download, FileText } from "lucide-react";

type InvoiceSubTab = "list" | "settings";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-zinc-700">{label}</label>
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

function statusLabel(status: Invoice["status"]) {
  const labels: Record<Invoice["status"], string> = {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue",
  };
  return labels[status];
}

function statusClass(status: Invoice["status"]) {
  const styles: Record<Invoice["status"], string> = {
    draft: "bg-zinc-50 text-muted",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-emerald-50 text-emerald-700",
    overdue: "bg-red-500/10 text-red-600",
  };
  return styles[status];
}

function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-14">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50">
          <FileText className="h-5 w-5 text-zinc-400" />
        </div>
        <h3 className="mt-4 text-[15px] font-semibold text-foreground">
          No invoices yet
        </h3>
        <p className="mt-1 max-w-sm text-[13px] text-muted">
          Monthly invoices for ad spend will appear here once billing starts.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted">
              <th className="px-5 py-3">Invoice</th>
              <th className="px-5 py-3">Period</th>
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
  );
}

function InvoiceSettingsForm({
  initial,
}: {
  initial: InvoiceSettings;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field: keyof InvoiceSettings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveInvoiceSettings(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold">Business details</h2>
        <p className="mt-1 text-[13px] text-muted">
          These details appear on your invoices. Make sure your VAT number and
          address are correct for tax purposes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <TextInput
            value={form.company_name}
            onChange={(v) => update("company_name", v)}
            placeholder="Acme B.V."
          />
        </Field>
        <Field label="Billing email">
          <TextInput
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="billing@company.nl"
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

export function SettingsInvoicesPanel({
  invoices,
  invoiceSettings,
}: {
  invoices: Invoice[];
  invoiceSettings: InvoiceSettings;
}) {
  const [subTab, setSubTab] = useState<InvoiceSubTab>("list");

  return (
    <div className="min-w-0 space-y-4">
      <TabList>
        <TabButton active={subTab === "list"} onClick={() => setSubTab("list")}>
          Invoices
        </TabButton>
        <TabButton
          active={subTab === "settings"}
          onClick={() => setSubTab("settings")}
        >
          Invoice settings
        </TabButton>
      </TabList>
      {subTab === "list" ? (
        <InvoiceList invoices={invoices} />
      ) : (
        <InvoiceSettingsForm initial={invoiceSettings} />
      )}
    </div>
  );
}
