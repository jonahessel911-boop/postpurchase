import { notFound } from "next/navigation";
import { AdminAdvertiserDetailClient } from "@/components/admin/admin-advertiser-detail-client";
import { loadAccountMembers } from "@/lib/api/admin-accounts";
import {
  getAdminAdvertiser,
  getAdminAdvertiserCampaigns,
  getAdminAdvertiserInvoices,
} from "@/lib/api/admin-server";

export default async function AdminAdvertiserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [advertiser, invoices, campaigns, members] = await Promise.all([
    getAdminAdvertiser(id),
    getAdminAdvertiserInvoices(id),
    getAdminAdvertiserCampaigns(id),
    loadAccountMembers(id, "advertiser"),
  ]);

  if (!advertiser) notFound();

  return (
    <AdminAdvertiserDetailClient
      advertiser={advertiser}
      invoices={invoices}
      campaigns={campaigns}
      members={members}
    />
  );
}
