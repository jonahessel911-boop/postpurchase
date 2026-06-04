import Link from "next/link";
import { Card } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export default function SetupPage() {
  if (isSupabaseConfigured()) {
    redirect("/login/advertiser");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Post<span className="text-accent">Purchase</span>
          </h1>
          <p className="mt-2 text-sm text-muted">Supabase configuration required</p>
        </div>

        <Card className="space-y-5 p-6">
          <p className="text-sm leading-relaxed text-muted">
            Create a Supabase project, then add your credentials to{" "}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              .env.local
            </code>{" "}
            in the project root.
          </p>

          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            <li>
              Open{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                supabase.com/dashboard
              </a>{" "}
              and create a project (free tier is fine).
            </li>
            <li>
              Go to <strong>Project Settings → API</strong> and copy the{" "}
              <strong>Project URL</strong> and <strong>anon public</strong> key.
            </li>
            <li>
              Edit{" "}
              <code className="font-mono text-xs">.env.local</code>:
              <pre className="mt-2 overflow-x-auto rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_API_DOMAIN=https://xxx.supabase.co/functions/v1`}
              </pre>
            </li>
            <li>
              Run the SQL migration from{" "}
              <code className="font-mono text-xs">
                supabase/migrations/001_initial.sql
              </code>{" "}
              in the Supabase SQL editor.
            </li>
            <li>Restart the dev server: <code className="font-mono text-xs">npm run dev</code></li>
          </ol>
        </Card>

        <p className="text-center text-xs text-muted">
          Already configured?{" "}
          <Link href="/login/advertiser" className="text-accent hover:underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
}
