import { PublisherIntegrationClient } from "@/components/publisher/publisher-integration-client";
import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PublisherIntegrationPage() {
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) redirect("/login/publisher");

  const supabase = await createClient();
  const { data: publisher } = await supabase
    .from("publishers")
    .select("company_name, submit_element_id")
    .eq("id", ctx.publisherId)
    .maybeSingle();

  return (
    <PublisherIntegrationClient
      partnerId={ctx.publisherId}
      companyName={publisher?.company_name ?? ctx.publisher?.company_name ?? "Partner"}
      submitElementId={
        (publisher?.submit_element_id as string) || "submit-button"
      }
    />
  );
}
