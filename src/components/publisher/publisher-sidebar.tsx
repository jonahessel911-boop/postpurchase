"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LayoutDashboard, LayoutGrid, Settings, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/publisher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/publisher/manager", label: "Manager", icon: LayoutGrid },
  { href: "/publisher/settings", label: "Settings", icon: Settings },
];

function userInitials(email: string, name?: string): string {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function PublisherSidebar({
  companyName,
}: {
  companyName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user?.email) setEmail(user.email);
      });
  }, []);

  return (
    <>
      <aside className="hidden md:flex md:w-[240px] md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card md:px-4 md:py-6">
        <div className="mb-8">
          <BrandLogo href="/publisher/dashboard" size={36} />
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
            <Radio className="h-3.5 w-3.5" />
            Traffic partner
          </div>
          <p className="mt-2 text-sm font-semibold tracking-tight leading-snug">
            {companyName}
          </p>
        </div>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent">
              {userInitials(email, companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{companyName}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await createClient().auth.signOut();
              router.push("/login/publisher");
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

export function PublisherAppShell({
  companyName,
  children,
}: {
  companyName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEditor =
    pathname === "/publisher/manager/new" ||
    /\/publisher\/manager\/[^/]+\/edit$/.test(pathname);

  return (
    <div className="flex h-screen min-h-0 bg-background">
      <PublisherSidebar companyName={companyName} />
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
