import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { TestSandbox } from "@/components/test/test-sandbox";

export default async function TestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Suspense fallback={null}>
      <TestSandbox isLoggedIn={Boolean(user)} />
    </Suspense>
  );
}
