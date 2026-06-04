import { NextResponse } from "next/server";
import { getPublisherAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { submit_element_id?: string };
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const publisherId = await getPublisherAccountId(supabase, user.id);
    if (!publisherId) {
      return NextResponse.json({ error: "No publisher account" }, { status: 400 });
    }

    const submitElementId = body.submit_element_id?.trim() || "submit-button";

    const { error } = await supabase
      .from("publishers")
      .update({ submit_element_id: submitElementId })
      .eq("id", publisherId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, submit_element_id: submitElementId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save" },
      { status: 400 }
    );
  }
}
