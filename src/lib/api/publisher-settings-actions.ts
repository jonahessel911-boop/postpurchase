import { getPublisherAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/client";
import type { PublisherInvoiceSettings } from "@/lib/api/publisher-settings-server";

export async function savePublisherInvoiceSettings(
  settings: PublisherInvoiceSettings
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in");

  const publisherId = await getPublisherAccountId(supabase, user.id);
  if (!publisherId) throw new Error("No publisher account found");

  const { error } = await supabase
    .from("publishers")
    .update({
      invoice_company_name: settings.company_name.trim() || null,
      invoice_email: settings.email.trim() || null,
      invoice_vat_number: settings.vat_number.trim() || null,
      invoice_address_line1: settings.address_line1.trim() || null,
      invoice_address_line2: settings.address_line2.trim() || null,
      invoice_city: settings.city.trim() || null,
      invoice_postal_code: settings.postal_code.trim() || null,
      invoice_country: settings.country.trim() || "NL",
      bank_account_holder: settings.bank_account_holder.trim() || null,
      bank_iban: settings.bank_iban.replace(/\s/g, "").trim() || null,
    })
    .eq("id", publisherId);

  if (error) throw new Error(error.message);
}
