import { getAdvertiserAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/server";

export interface InvoiceSettings {
  company_name: string;
  email: string;
  vat_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  pdf_url: string | null;
  created_at: string;
}

export const EMPTY_INVOICE_SETTINGS: InvoiceSettings = {
  company_name: "",
  email: "",
  vat_number: "",
  address_line1: "",
  address_line2: "",
  city: "",
  postal_code: "",
  country: "NL",
};

export async function loadInvoiceSettings(): Promise<InvoiceSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) {
    return { ...EMPTY_INVOICE_SETTINGS, email: user.email ?? "" };
  }

  const { data, error } = await supabase
    .from("advertisers")
    .select(
      "invoice_company_name, invoice_email, invoice_vat_number, invoice_address_line1, invoice_address_line2, invoice_city, invoice_postal_code, invoice_country, email"
    )
    .eq("id", accountId)
    .maybeSingle();

  if (error || !data) {
    if (error && error.code !== "42703") {
      console.error("loadInvoiceSettings:", error.message);
    }
    return {
      ...EMPTY_INVOICE_SETTINGS,
      email: user.email ?? "",
    };
  }

  return {
    company_name: (data.invoice_company_name as string) ?? "",
    email: (data.invoice_email as string) ?? (data.email as string) ?? "",
    vat_number: (data.invoice_vat_number as string) ?? "",
    address_line1: (data.invoice_address_line1 as string) ?? "",
    address_line2: (data.invoice_address_line2 as string) ?? "",
    city: (data.invoice_city as string) ?? "",
    postal_code: (data.invoice_postal_code as string) ?? "",
    country: (data.invoice_country as string) ?? "NL",
  };
}

export async function loadInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) return [];

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("advertiser_id", accountId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error && error.code !== "42P01") {
      console.error("loadInvoices:", error.message);
    }
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    invoice_number: row.invoice_number as string,
    period_start: row.period_start as string,
    period_end: row.period_end as string,
    amount: Number(row.amount),
    status: row.status as Invoice["status"],
    pdf_url: (row.pdf_url as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}
