"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/types";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: CampaignStatus }) {
  const styles: Record<CampaignStatus, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    rejected: "bg-red-50 text-red-600 border-red-200/80",
  };

  const labels: Record<CampaignStatus, string> = {
    approved: "Active",
    rejected: "Rejected",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out",
        checked ? "bg-accent shadow-[inset_0_0_0_1px_rgba(91,71,251,0.2)]" : "bg-zinc-200",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-[3px] inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out",
          checked ? "translate-x-[21px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/30 hover:text-accent"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent/90 shadow-sm",
    secondary: "border border-border bg-card text-foreground hover:border-accent/30 hover:bg-background",
    ghost: "text-muted hover:bg-background hover:text-foreground",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  label,
  mono,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[13px] font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/10",
          mono && "font-mono text-[13px]",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Select({
  className,
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[13px] font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sparkline,
}: {
  label: string;
  value: string;
  sparkline?: number[];
}) {
  const data = (sparkline ?? []).map((v, i) => ({ i, v }));

  return (
    <Card className="p-3 sm:p-4">
      <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="min-w-0 truncate text-lg font-semibold leading-none tracking-tight sm:text-[22px]">
          {value}
        </p>
        {sparkline && sparkline.length > 0 && (
          <div className="hidden h-8 w-14 shrink-0 sm:block sm:w-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#5B47FB"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

export function TabList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto overscroll-x-contain", className)}>
      <div className="flex min-w-max gap-1 border-b border-border">{children}</div>
    </div>
  );
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative -mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
        active
          ? "border-accent text-zinc-900"
          : "border-transparent text-zinc-500 hover:text-zinc-700"
      )}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{title}</h1>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { DateRangePicker } from "@/components/ui/date-range-picker";
