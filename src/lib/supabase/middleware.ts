import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { updateSession: supabaseUpdateSession } = await import(
    "@/lib/supabase/middleware-auth"
  );
  return supabaseUpdateSession(request);
}
