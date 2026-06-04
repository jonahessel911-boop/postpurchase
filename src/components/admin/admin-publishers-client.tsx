"use client";

import { useRouter } from "next/navigation";
import { CreateAccountButton } from "@/components/admin/create-account-dialog";
import type { AdminPublisher } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

export function AdminPublishersClient({ rows }: { rows: AdminPublisher[] }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Traffic partners
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Publisher accounts and their login users
          </p>
        </div>
        <CreateAccountButton kind="publisher" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-muted">
            No publisher accounts yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead className="border-b border-border bg-zinc-50/80">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-2.5">Company</th>
                  <th className="px-4 py-2.5">Contact</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "cursor-pointer border-b border-border hover:bg-violet-50/40",
                      i % 2 === 1 && "bg-zinc-50/50"
                    )}
                    onClick={() => router.push(`/admin/publishers/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.company_name}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.contact_email}</td>
                    <td className="px-4 py-3 capitalize text-emerald-600">
                      {p.status}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(p.created_at).toLocaleDateString("nl-NL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
