"use client";

import Link from "next/link";
import { AccountMembersPanel } from "@/components/admin/account-members-panel";
import type { AdminPublisher } from "@/lib/admin-types";
import type { AccountMemberRow } from "@/lib/api/admin-accounts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export function AdminPublisherDetailClient({
  publisher,
  members,
}: {
  publisher: AdminPublisher;
  members: AccountMemberRow[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/publishers"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All traffic partners
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          {publisher.company_name}
        </h1>
        <p className="mt-1 text-[13px] text-muted">{publisher.contact_email}</p>
        <p className="mt-2 text-[13px] text-muted">
          {formatNumber(publisher.clicks)} clicks ·{" "}
          {formatCurrency(publisher.publisher_revenue)} publisher revenue
        </p>
      </div>

      <AccountMembersPanel
        accountId={publisher.id}
        accountType="publisher"
        companyName={publisher.company_name}
        members={members}
      />
    </div>
  );
}
