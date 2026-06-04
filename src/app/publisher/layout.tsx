import { redirect } from "next/navigation";
import { PublisherAppShell } from "@/components/publisher/publisher-sidebar";
import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";

export default async function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadPublisherDashboardContext();

  if (!ctx) {
    redirect("/login/publisher");
  }

  if (!ctx.publisherId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">No publisher account</h1>
          <p className="mt-2 text-[14px] text-muted">
            This login is not linked to a traffic partner account. Ask your
            platform admin to add you under Admin → Traffic partners.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PublisherAppShell
      companyName={ctx.publisher?.company_name ?? "Publisher"}
    >
      {children}
    </PublisherAppShell>
  );
}
