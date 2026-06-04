import { redirect } from "next/navigation";

export default async function TestPostbackRedirect({
  searchParams,
}: {
  searchParams: Promise<{ click_id?: string }>;
}) {
  const { click_id } = await searchParams;
  const params = new URLSearchParams();
  if (click_id) params.set("click_id", click_id);
  redirect(`/test${params.toString() ? `?${params}` : ""}`);
}
