"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { PasswordField } from "@/components/admin/password-field";
import { generateAccountPassword } from "@/lib/password";
import type { AccountType } from "@/lib/api/admin-accounts";
import { Check, Copy, X } from "lucide-react";

export function AddAccountUserDialog({
  accountId,
  accountType,
  companyName,
  open,
  onClose,
}: {
  accountId: string;
  accountType: AccountType;
  companyName: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generateAccountPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/accounts/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          account_type: accountType,
          email,
          password,
          role: "member",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add user");
      setCreated({ email: data.email, password: data.password });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setEmail("");
    setPassword(generateAccountPassword());
    setError("");
    setCreated(null);
    setCopied(false);
    onClose();
  }

  async function copyCredentials() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Login: ${created.email}\nPassword: ${created.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Add user</h2>
            <p className="mt-1 text-[13px] text-muted">
              Add another login to <strong>{companyName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-[13px] text-emerald-800">
              User added. Share these credentials.
            </div>
            <div>
              <p className="text-[12px] font-medium text-zinc-600">Email</p>
              <p className="font-mono text-[14px]">{created.email}</p>
            </div>
            <PasswordField label="Password" value={created.password} readOnly />
            <Button
              type="button"
              variant="secondary"
              className="h-9 gap-1.5"
              onClick={() => void copyCredentials()}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy email & password"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-zinc-700">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <PasswordField
              value={password}
              onChange={setPassword}
              onRegenerate={() => setPassword(generateAccountPassword())}
            />
            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding…" : "Add user"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
