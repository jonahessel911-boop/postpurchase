"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { AddAccountUserDialog } from "@/components/admin/add-account-user-dialog";
import type { AccountMemberRow, AccountType } from "@/lib/api/admin-accounts";
import { UserPlus } from "lucide-react";

export function AccountMembersPanel({
  accountId,
  accountType,
  companyName,
  members,
}: {
  accountId: string;
  accountType: AccountType;
  companyName: string;
  members: AccountMemberRow[];
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Users</h3>
          <p className="mt-0.5 text-[12px] text-muted">
            {members.length} login{members.length !== 1 ? "s" : ""} on this account
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-8 gap-1.5 text-[12px]"
          onClick={() => setAddOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add user
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-[13px] text-muted">No users linked yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {m.name || m.email}
                </p>
                <p className="truncate text-[12px] text-muted">{m.email}</p>
              </div>
              <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-600">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      )}

      <AddAccountUserDialog
        accountId={accountId}
        accountType={accountType}
        companyName={companyName}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
