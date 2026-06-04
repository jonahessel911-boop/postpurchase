"use client";

import { useRouter } from "next/navigation";
import { CreateAccountButton } from "@/components/admin/create-account-dialog";
import type { AdminAdvertiser } from "@/lib/admin-types";
import { formatCurrency, cn } from "@/lib/utils";

export type AdminAdvertiserRow = AdminAdvertiser & {
  campaigns: number;
  spend: number;
  active: number;
};

export function AdminAdvertisersClient({
  rows,
}: {
  rows: AdminAdvertiserRow[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Advertisers
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Company accounts and their login users
          </p>
        </div>
        <CreateAccountButton kind="advertiser" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-muted">
            No advertisers yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead className="border-b border-border bg-zinc-50/80">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-2.5">Company</th>
                  <th className="px-4 py-2.5">Contact</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Campaigns</th>
                  <th className="px-4 py-2.5 text-right">Active</th>
                  <th className="px-4 py-2.5 text-right">Spend</th>
                  <th className="px-4 py-2.5 text-right">Wallet</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => (
                  <tr
                    key={a.id}
                    className={cn(
                      "cursor-pointer border-b border-border hover:bg-violet-50/40",
                      i % 2 === 1 && "bg-zinc-50/50"
                    )}
                    onClick={() => router.push(`/admin/advertisers/${a.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {a.company}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{a.name}</p>
                      <p className="text-[11px] text-zinc-400">{a.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[12px] font-medium capitalize",
                          a.status === "active"
                            ? "text-emerald-600"
                            : "text-red-600"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            a.status === "active"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          )}
                        />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {a.campaigns}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {a.active}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(a.spend)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(a.wallet_balance)}
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
