export const DEMO_ADVERTISER = {
  email: "demo@demo.nl",
  password: "1234",
} as const;

export const DEMO_ADMIN = {
  email: "admin@admin.nl",
  password: "1234",
} as const;

export type PortalRole = "advertiser" | "publisher" | "admin";

const ADMIN_EMAILS = new Set<string>([DEMO_ADMIN.email]);

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
