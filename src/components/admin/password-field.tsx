"use client";

import { useState } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordField({
  value,
  onChange,
  onRegenerate,
  label = "Password",
  hint,
  readOnly,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  onRegenerate?: () => void;
  label?: string;
  hint?: string;
  readOnly?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-[12px] font-medium text-zinc-700">{label}</label>
        {onRegenerate ? (
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </button>
        ) : null}
      </div>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-card pr-10 pl-3 font-mono text-[13px] outline-none",
            "focus:border-accent/40 focus:ring-2 focus:ring-accent/10",
            readOnly && "bg-zinc-50"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-[11px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}
