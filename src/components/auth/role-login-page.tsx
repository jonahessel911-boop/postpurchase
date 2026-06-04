"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { BrandLogo } from "@/components/layout/brand-logo";
import { createClient } from "@/lib/supabase/client";
import {
  DEMO_ADMIN,
  DEMO_ADVERTISER,
  type PortalRole,
} from "@/lib/demo-accounts";
import { Building2, Megaphone, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const PORTAL_CONFIG: Record<
  PortalRole,
  {
    title: string;
    subtitle: string;
    icon: typeof Megaphone;
    demoEmail?: string;
    comingSoon?: boolean;
  }
> = {
  advertiser: {
    title: "Advertiser login",
    subtitle: "Manage campaigns, creatives, and ad spend",
    icon: Megaphone,
    demoEmail: DEMO_ADVERTISER.email,
  },
  publisher: {
    title: "Traffic partner login",
    subtitle: "Thank-you page traffic partner portal",
    icon: Building2,
  },
  admin: {
    title: "Admin login",
    subtitle: "Platform overview, logs, and advertisers",
    icon: Shield,
    demoEmail: DEMO_ADMIN.email,
  },
};

async function provisionDemoAccount(role: "advertiser" | "admin"): Promise<boolean> {
  const res = await fetch("/api/demo/provision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return res.status !== 503;
}

async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export function RoleLoginPage({ role }: { role: PortalRole }) {
  const router = useRouter();
  const config = PORTAL_CONFIG[role];
  const Icon = config.icon;

  const [email, setEmail] = useState(config.demoEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function completeSignIn(signedInEmail: string) {
    const isAdmin =
      signedInEmail.toLowerCase() === DEMO_ADMIN.email.toLowerCase();

    if (role === "admin") {
      if (!isAdmin) {
        await createClient().auth.signOut();
        throw new Error("This account does not have admin access.");
      }
      router.push("/admin");
    } else if (role === "advertiser") {
      if (isAdmin) {
        await createClient().auth.signOut();
        throw new Error("Use the admin login page for this account.");
      }
      const ensured = await fetch("/api/advertiser/ensure", { method: "POST" });
      if (!ensured.ok) {
        const body = await ensured.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            "Could not set up your advertiser profile."
        );
      }
      router.push("/dashboard");
    } else if (role === "publisher") {
      if (isAdmin) {
        await createClient().auth.signOut();
        throw new Error("Use the admin login page for this account.");
      }
      router.push("/publisher/manager");
    }

    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (config.comingSoon) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      await signInWithPassword(email.trim(), password);
      await completeSignIn(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    if (config.comingSoon || role === "publisher") return;

    const account = role === "admin" ? DEMO_ADMIN : DEMO_ADVERTISER;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      const provisioned = await provisionDemoAccount(role);
      if (!provisioned) {
        setNotice(
          "Demo auto-setup unavailable — using direct sign-in. Add SUPABASE_SERVICE_ROLE_KEY for full setup."
        );
      }

      await signInWithPassword(account.email, account.password);
      await completeSignIn(account.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo href="/login/advertiser" size={48} />
          <div
            className={cn(
              "mt-6 flex h-12 w-12 items-center justify-center rounded-2xl",
              role === "admin"
                ? "bg-zinc-900 text-white"
                : "bg-accent-light text-accent"
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {config.title}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">{config.subtitle}</p>
        </div>

        <Card className="space-y-5 p-6">
          {config.comingSoon ? (
            <div className="rounded-xl border border-border bg-zinc-50 px-4 py-6 text-center">
              <p className="text-[14px] font-medium text-zinc-800">
                Traffic partner portal coming soon
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Partner access is not available yet. Check back later or contact
                support.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}

          {!config.comingSoon && config.demoEmail ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
                  <span className="bg-card px-2 text-muted">Demo</span>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={loading}
                onClick={handleDemoLogin}
              >
                {loading ? "Signing in…" : "Continue with demo account"}
              </Button>
              <p className="text-center text-[12px] text-muted">
                Demo: {config.demoEmail} · password{" "}
                <code className="font-mono">1234</code>
              </p>
            </>
          ) : null}
        </Card>

        {notice ? (
          <p className="mt-4 text-center text-[12px] text-amber-700">{notice}</p>
        ) : null}
        {error ? (
          <p className="mt-4 text-center text-[13px] text-red-600">{error}</p>
        ) : null}

        <p className="mt-8 text-center text-[12px] text-muted">
          {role === "advertiser" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-medium text-accent hover:underline">
                Create account
              </Link>
            </>
          ) : (
            <>
              <Link href="/login/advertiser" className="hover:text-foreground">
                Advertiser
              </Link>
              {" · "}
              <Link href="/login/publisher" className="hover:text-foreground">
                Traffic partner
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
