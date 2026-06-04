import { NextResponse } from "next/server";
import {
  DEMO_ADMIN,
  DEMO_ADVERTISER,
} from "@/lib/demo-accounts";
import { ensureAdvertiserProfile } from "@/lib/demo-seed";
import { getServiceClient, hasServiceClient } from "@/lib/supabase/service";

type DemoRole = "advertiser" | "admin";

async function findUserIdByEmail(
  admin: ReturnType<typeof getServiceClient>,
  email: string
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return null;
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  return user?.id ?? null;
}

export async function POST(request: Request) {
  if (!hasServiceClient()) {
    return NextResponse.json(
      {
        error:
          "Add SUPABASE_SERVICE_ROLE_KEY to .env.local to auto-create demo accounts.",
      },
      { status: 503 }
    );
  }

  let role: DemoRole;
  try {
    const body = await request.json();
    role = body.role === "admin" ? "admin" : "advertiser";
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const account = role === "admin" ? DEMO_ADMIN : DEMO_ADVERTISER;

  try {
    const admin = getServiceClient();
    let userId = await findUserIdByEmail(admin, account.email);

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata:
          role === "admin"
            ? { full_name: "Platform Admin", role: "admin" }
            : { full_name: "Demo Advertiser", role: "advertiser" },
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to create demo user" },
          { status: 500 }
        );
      }

      userId = data.user.id;
    } else {
      await admin.auth.admin.updateUserById(userId, {
        password: account.password,
        email_confirm: true,
      });
    }

    if (role === "advertiser" && userId) {
      await ensureAdvertiserProfile(admin, userId, account.email);
    }

    return NextResponse.json({ ok: true, email: account.email });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Provision failed" },
      { status: 500 }
    );
  }
}
