import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/admin-auth";
import { addAccountMember, type AccountType } from "@/lib/api/admin-accounts";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const accountType = body.account_type as AccountType;
    if (accountType !== "advertiser" && accountType !== "publisher") {
      return NextResponse.json(
        { error: "account_type must be advertiser or publisher" },
        { status: 400 }
      );
    }

    const result = await addAccountMember({
      account_id: body.account_id,
      account_type: accountType,
      email: body.email ?? "",
      password: body.password,
      role: body.role === "owner" ? "owner" : "member",
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add user" },
      { status: 500 }
    );
  }
}
