"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        )}
      >
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {description && (
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={destructive ? "bg-red-600 hover:bg-red-700" : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
