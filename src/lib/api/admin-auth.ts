import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/demo-accounts";
import { hasServiceClient } from "@/lib/supabase/service";

export async function requireAdminApi(): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  if (!hasServiceClient()) {
    return {
      ok: false,
      status: 503,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is required for admin account management.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return { ok: false, status: 403, error: "Admin access required." };
  }

  return { ok: true };
}
