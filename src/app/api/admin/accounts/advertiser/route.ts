import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api/admin-auth";
import { createAdvertiserAccount } from "@/lib/api/admin-accounts";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const result = await createAdvertiserAccount({
      company_name: body.company_name ?? "",
      email: body.email ?? "",
      password: body.password,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create account" },
      { status: 500 }
    );
  }
}
