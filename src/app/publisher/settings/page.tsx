import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";
import { redirect } from "next/navigation";

export default async function PublisherSettingsPage() {
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) redirect("/login/publisher");

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Account
        </p>
        <p className="mt-2 text-[15px] font-semibold">
          {ctx.publisher?.company_name}
        </p>
        <p className="mt-1 text-[13px] text-muted">
          {ctx.publisher?.contact_email}
        </p>
        <p className="mt-3 text-[12px] text-zinc-500">
          Partner ID:{" "}
          <code className="font-mono text-[11px]">{ctx.publisherId}</code>
        </p>
      </div>
    </div>
  );
}
