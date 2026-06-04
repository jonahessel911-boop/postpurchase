import { getPublisherAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/server";

export interface PublisherInvoiceSettings {
  company_name: string;
  email: string;
  vat_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  bank_account_holder: string;
  bank_iban: string;
}

export interface CreditInvoice {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  amount: number;
  clicks_count: number;
  status: "draft" | "sent" | "paid" | "overdue";
  pdf_url: string | null;
  created_at: string;
}

export const EMPTY_PUBLISHER_INVOICE_SETTINGS: PublisherInvoiceSettings = {
  company_name: "",
  email: "",
  vat_number: "",
  address_line1: "",
  address_line2: "",
  city: "",
  postal_code: "",
  country: "NL",
  bank_account_holder: "",
  bank_iban: "",
};

export async function loadPublisherInvoiceSettings(): Promise<PublisherInvoiceSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const publisherId = await getPublisherAccountId(supabase, user.id);
  if (!publisherId) {
    return { ...EMPTY_PUBLISHER_INVOICE_SETTINGS, email: user.email ?? "" };
  }

  const { data, error } = await supabase
    .from("publishers")
    .select(
      "company_name, contact_email, invoice_company_name, invoice_email, invoice_vat_number, invoice_address_line1, invoice_address_line2, invoice_city, invoice_postal_code, invoice_country, bank_account_holder, bank_iban"
    )
    .eq("id", publisherId)
    .maybeSingle();

  if (error || !data) {
    return {
      ...EMPTY_PUBLISHER_INVOICE_SETTINGS,
      email: user.email ?? "",
    };
  }

  return {
    company_name:
      (data.invoice_company_name as string) ||
      (data.company_name as string) ||
      "",
    email:
      (data.invoice_email as string) ||
      (data.contact_email as string) ||
      "",
    vat_number: (data.invoice_vat_number as string) ?? "",
    address_line1: (data.invoice_address_line1 as string) ?? "",
    address_line2: (data.invoice_address_line2 as string) ?? "",
    city: (data.invoice_city as string) ?? "",
    postal_code: (data.invoice_postal_code as string) ?? "",
    country: (data.invoice_country as string) ?? "NL",
    bank_account_holder: (data.bank_account_holder as string) ?? "",
    bank_iban: (data.bank_iban as string) ?? "",
  };
}

export async function loadCreditInvoices(): Promise<CreditInvoice[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const publisherId = await getPublisherAccountId(supabase, user.id);
  if (!publisherId) return [];

  const { data, error } = await supabase
    .from("credit_invoices")
    .select("*")
    .eq("publisher_id", publisherId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error && error.code !== "42P01") {
      console.error("loadCreditInvoices:", error.message);
    }
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    invoice_number: row.invoice_number as string,
    period_start: row.period_start as string,
    period_end: row.period_end as string,
    amount: Number(row.amount),
    clicks_count: Number(row.clicks_count ?? 0),
    status: row.status as CreditInvoice["status"],
    pdf_url: (row.pdf_url as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}
