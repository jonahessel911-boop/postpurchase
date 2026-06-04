import { NextResponse } from "next/server";
import { ensureAdvertiserMemberLink } from "@/lib/api/advertiser-account";
import { ensureAdvertiserProfile } from "@/lib/api/ensure-advertiser";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient, hasServiceClient } from "@/lib/supabase/service";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await ensureAdvertiserProfile(supabase, user.id, user.email ?? "");
    return NextResponse.json({ ok: true });
  } catch {
    if (!hasServiceClient()) {
      return NextResponse.json(
        {
          error:
            "Advertiser profile missing. Run migration 009_ensure_advertiser_profile.sql in Supabase.",
        },
        { status: 500 }
      );
    }

    try {
      const admin = getServiceClient();
      await ensureAdvertiserProfile(admin, user.id, user.email ?? "");

      const { data: members } = await admin
        .from("account_members")
        .select("account_id")
        .eq("user_id", user.id)
        .eq("account_type", "advertiser");

      if (!members?.length) {
        const { data: adv } = await admin
          .from("advertisers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (adv?.id) {
          await ensureAdvertiserMemberLink(admin, user.id, adv.id, "owner");
        } else {
          const { data: anyAdv } = await admin
            .from("advertisers")
            .select("id")
            .eq("email", user.email ?? "")
            .limit(1)
            .maybeSingle();
          if (anyAdv?.id) {
            await ensureAdvertiserMemberLink(
              admin,
              user.id,
              anyAdv.id,
              "owner"
            );
          }
        }
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to create profile" },
        { status: 500 }
      );
    }
  }
}
