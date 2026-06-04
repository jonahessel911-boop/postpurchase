import { createAdPath } from "@/lib/campaign-create-ad";
import { redirect } from "next/navigation";

/** Legacy URL — opens the editor with a client-side draft (no auto-insert). */
export default async function NewAdInCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(createAdPath(id));
}
