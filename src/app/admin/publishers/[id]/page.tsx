import { notFound } from "next/navigation";
import { AdminPublisherDetailClient } from "@/components/admin/admin-publisher-detail-client";
import { loadAccountMembers } from "@/lib/api/admin-accounts";
import { getAdminPublisher } from "@/lib/api/admin-server";

export default async function AdminPublisherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [publisher, members] = await Promise.all([
    getAdminPublisher(id),
    loadAccountMembers(id, "publisher"),
  ]);

  if (!publisher) notFound();

  return (
    <AdminPublisherDetailClient publisher={publisher} members={members} />
  );
}
