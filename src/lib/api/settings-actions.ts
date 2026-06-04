import { getAdvertiserAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceSettings } from "@/lib/api/settings-server";

export async function saveInvoiceSettings(
  settings: InvoiceSettings
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in");

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) throw new Error("No advertiser account found");

  const { error } = await supabase
    .from("advertisers")
    .update({
      invoice_company_name: settings.company_name.trim() || null,
      invoice_email: settings.email.trim() || null,
      invoice_vat_number: settings.vat_number.trim() || null,
      invoice_address_line1: settings.address_line1.trim() || null,
      invoice_address_line2: settings.address_line2.trim() || null,
      invoice_city: settings.city.trim() || null,
      invoice_postal_code: settings.postal_code.trim() || null,
      invoice_country: settings.country.trim() || "NL",
    })
    .eq("id", accountId);

  if (error) throw new Error(error.message);
}
