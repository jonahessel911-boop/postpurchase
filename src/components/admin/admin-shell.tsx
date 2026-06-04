"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { createClient } from "@/lib/supabase/client";
import type { AdminPlatformTotals } from "@/lib/admin-types";
import {
  LayoutDashboard,
  Megaphone,
  MousePointerClick,
  Webhook,
  Users,
  Radio,
  ArrowLeft,
  BarChart3,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/clicks", label: "Click logs", icon: MousePointerClick },
  { href: "/admin/postbacks", label: "Postback logs", icon: Webhook },
  { href: "/admin/advertisers", label: "Advertisers", icon: Users },
  { href: "/admin/publishers", label: "Traffic partners", icon: Radio },
];

function userInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 0 && parts[0]) {
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function AdminShell({
  children,
  platformTotals,
}: {
  children: React.ReactNode;
  platformTotals: AdminPlatformTotals;
}) {
  const pathname = usePathname();
  const [email, setEmail] = useState("admin@admin.nl");
  const [name, setName] = useState("Platform Admin");
  const totals = platformTotals;

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user?.email) setEmail(user.email);
        const fullName = user?.user_metadata?.full_name;
        if (typeof fullName === "string") setName(fullName);
      });
  }, []);

  return (
    <div className="flex h-screen min-h-0 bg-background">
      <aside className="hidden md:flex md:w-[240px] md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6">
        <div className="mb-8 px-2">
          <BrandLogo href="/admin" size={36} />
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:bg-background hover:text-accent"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <BarChart3 className="h-3.5 w-3.5" />
            Platform totals
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight">
            {formatCurrency(totals.spend)}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {formatNumber(totals.advertisers)} advertisers ·{" "}
            {formatNumber(totals.totalCampaigns)} campaigns
          </p>
        </div>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted transition-colors hover:bg-background hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Advertiser portal
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent">
              {userInitials(name, email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card md:hidden">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                active ? "text-accent" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <main className="flex min-h-0 flex-1 flex-col overflow-auto pb-20 md:pb-0">
        <div className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
