"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  LayoutDashboard,
  Megaphone,
  Settings,
  Wallet,
} from "lucide-react";
import {
  fetchAdvertiserProfile,
  topUpWallet,
} from "@/lib/api/campaign-actions";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <div className="px-2">
      <BrandLogo href="/dashboard" size={36} />
    </div>
  );
}

function userInitials(email: string, name?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
      if (user?.user_metadata?.full_name) {
        setName(user.user_metadata.full_name as string);
      }
      const profile = await fetchAdvertiserProfile();
      if (profile) setBalance(profile.wallet_balance);
    })();
  }, []);

  return (
    <>
      <aside className="hidden md:flex md:w-[240px] md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6">
        <div className="mb-8">
          <Logo />
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-accent-light text-accent"
                  : "text-muted hover:bg-background hover:text-accent"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Wallet className="h-3.5 w-3.5" />
            Wallet Balance
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight">
            {formatCurrency(balance)}
          </p>
          <button
            type="button"
            onClick={async () => setBalance(await topUpWallet(100))}
            className="mt-3 w-full rounded-xl bg-accent py-2 text-xs font-medium text-white transition-colors hover:bg-accent/90"
          >
            Top up
          </button>
        </div>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent">
              {userInitials(email, name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name ?? email}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await createClient().auth.signOut();
              router.push("/login/advertiser");
              router.refresh();
            }}
            className="w-full rounded-lg px-2 py-1.5 text-left text-[12px] font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card md:hidden">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
              pathname.startsWith(href) ? "text-accent" : "text-muted"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor =
    pathname === "/campaigns/new" ||
    /\/campaigns\/[^/]+\/edit$/.test(pathname);

  return (
    <div className="flex h-screen min-h-0 bg-background">
      <Sidebar />
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-auto pb-20 md:pb-0",
          isEditor && "overflow-hidden"
        )}
      >
        <div
          className={cn(
            isEditor
              ? "flex h-full min-h-0 flex-1 flex-col"
              : "mx-auto w-full min-w-0 max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
