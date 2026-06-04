"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { PasswordField } from "@/components/admin/password-field";
import { generateAccountPassword } from "@/lib/password";
import { cn } from "@/lib/utils";
import { Check, Copy, X } from "lucide-react";

type AccountKind = "advertiser" | "publisher";

export function CreateAccountDialog({
  kind,
  open,
  onClose,
}: {
  kind: AccountKind;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generateAccountPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    accountId: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const title =
    kind === "advertiser" ? "Create advertiser account" : "Create publisher account";
  const endpoint =
    kind === "advertiser"
      ? "/api/admin/accounts/advertiser"
      : "/api/admin/accounts/publisher";
  const detailHref = (id: string) =>
    kind === "advertiser"
      ? `/admin/advertisers/${id}`
      : `/admin/publishers/${id}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create account");
      setCreated({
        accountId: data.accountId,
        email: data.email,
        password: data.password,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setCompanyName("");
    setEmail("");
    setPassword(generateAccountPassword());
    setError("");
    setCreated(null);
    setCopied(false);
    onClose();
  }

  async function copyCredentials() {
    if (!created) return;
    const text = `Login: ${created.email}\nPassword: ${created.password}`;
    await navigator.clipboard.writeText(text);
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
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-[13px] text-muted">
              {created
                ? "Share these credentials with the account owner."
                : "A login will be created with a generated password."}
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
              Account created. Copy the password before closing.
            </div>
            <div>
              <p className="text-[12px] font-medium text-zinc-600">Company</p>
              <p className="text-[14px] font-medium text-foreground">
                {companyName}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-zinc-600">Email</p>
              <p className="font-mono text-[14px] text-foreground">
                {created.email}
              </p>
            </div>
            <PasswordField
              label="Password"
              value={created.password}
              readOnly
              hint="User can sign in at the traffic partner or advertiser login page."
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="h-9 gap-1.5 text-[12px]"
                onClick={() => void copyCredentials()}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy email & password"}
              </Button>
              <Button
                type="button"
                className="h-9 text-[12px]"
                onClick={() => {
                  handleClose();
                  router.push(detailHref(created.accountId));
                }}
              >
                View account
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-zinc-700">
                Company name
              </label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme BV"
                className="h-10 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-zinc-700">
                Primary user email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="h-10 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <PasswordField
              value={password}
              onChange={setPassword}
              onRegenerate={() => setPassword(generateAccountPassword())}
              hint="Share this password securely. You can regenerate before creating."
            />
            {error ? (
              <p className="text-[13px] text-red-600">{error}</p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="h-9"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-9" disabled={loading}>
                {loading ? "Creating…" : "Create account"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function CreateAccountButton({
  kind,
  className,
}: {
  kind: AccountKind;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className={cn("h-9 text-[12px]", className)}
        onClick={() => setOpen(true)}
      >
        Create {kind === "advertiser" ? "advertiser" : "publisher"}
      </Button>
      <CreateAccountDialog
        kind={kind}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
