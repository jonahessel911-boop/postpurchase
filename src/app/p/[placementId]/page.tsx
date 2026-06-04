import { notFound, redirect } from "next/navigation";

/** Full redirect-page offers (alias for /widget). */
export default async function RedirectOfferPage({
  params,
}: {
  params: Promise<{ placementId: string }>;
}) {
  const { placementId } = await params;
  redirect(`/widget/${placementId}`);
}
