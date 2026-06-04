import { generateAccountPassword } from "@/lib/password";
import { getServiceClient } from "@/lib/supabase/service";

export type AccountType = "advertiser" | "publisher";

export { generateAccountPassword };

async function findUserIdByEmail(
  admin: ReturnType<typeof getServiceClient>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized
    );
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function createAuthUser(
  admin: ReturnType<typeof getServiceClient>,
  email: string,
  password: string,
  metadata: Record<string, unknown>
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const existingId = await findUserIdByEmail(admin, normalized);

  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw new Error(error.message);
    return existingId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to create user");
  }

  return data.user.id;
}

export interface AccountMemberRow {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: "owner" | "member";
  created_at: string;
}

export async function loadAccountMembers(
  accountId: string,
  accountType: AccountType
): Promise<AccountMemberRow[]> {
  const admin = getServiceClient();
  const { data: members, error } = await admin
    .from("account_members")
    .select("id, user_id, role, created_at")
    .eq("account_id", accountId)
    .eq("account_type", accountType)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!members?.length) return [];

  const users = await admin.auth.admin.listUsers({ perPage: 1000 });
  const byId = new Map(
    users.data.users.map((u) => [
      u.id,
      {
        email: u.email ?? "",
        name:
          (typeof u.user_metadata?.full_name === "string"
            ? u.user_metadata.full_name
            : "") || u.email?.split("@")[0] || "",
      },
    ])
  );

  return members.map((m) => {
    const u = byId.get(m.user_id);
    return {
      id: m.id,
      user_id: m.user_id,
      email: u?.email ?? "",
      name: u?.name ?? "",
      role: m.role as "owner" | "member",
      created_at: m.created_at,
    };
  });
}

export async function createAdvertiserAccount(input: {
  company_name: string;
  email: string;
  password?: string;
}): Promise<{
  accountId: string;
  userId: string;
  email: string;
  password: string;
}> {
  const admin = getServiceClient();
  const password = input.password?.trim() || generateAccountPassword();
  const contactEmail = input.email.trim().toLowerCase();
  const companyName = input.company_name.trim();

  if (!companyName) throw new Error("Company name is required.");
  if (!contactEmail) throw new Error("Email is required.");

  const { data: account, error: accountError } = await admin
    .from("advertisers")
    .insert({
      email: contactEmail,
      company_name: companyName,
      invoice_company_name: companyName,
      invoice_email: contactEmail,
      wallet_balance: 0,
      status: "active",
    })
    .select("id")
    .single();

  if (accountError || !account) {
    throw new Error(accountError?.message ?? "Failed to create advertiser");
  }

  const userId = await createAuthUser(admin, contactEmail, password, {
    full_name: companyName,
    role: "advertiser",
    advertiser_account_id: account.id,
  });

  const { error: memberError } = await admin.from("account_members").insert({
    user_id: userId,
    account_id: account.id,
    account_type: "advertiser",
    role: "owner",
  });

  if (memberError) throw new Error(memberError.message);

  return {
    accountId: account.id,
    userId,
    email: contactEmail,
    password,
  };
}

export async function createPublisherAccount(input: {
  company_name: string;
  email: string;
  password?: string;
}): Promise<{
  accountId: string;
  userId: string;
  email: string;
  password: string;
}> {
  const admin = getServiceClient();
  const password = input.password?.trim() || generateAccountPassword();
  const contactEmail = input.email.trim().toLowerCase();
  const companyName = input.company_name.trim();

  if (!companyName) throw new Error("Company name is required.");
  if (!contactEmail) throw new Error("Email is required.");

  const { data: account, error: accountError } = await admin
    .from("publishers")
    .insert({
      company_name: companyName,
      contact_email: contactEmail,
      status: "active",
    })
    .select("id")
    .single();

  if (accountError || !account) {
    throw new Error(accountError?.message ?? "Failed to create publisher");
  }

  const userId = await createAuthUser(admin, contactEmail, password, {
    full_name: companyName,
    role: "publisher",
    publisher_account_id: account.id,
  });

  const { error: memberError } = await admin.from("account_members").insert({
    user_id: userId,
    account_id: account.id,
    account_type: "publisher",
    role: "owner",
  });

  if (memberError) throw new Error(memberError.message);

  return {
    accountId: account.id,
    userId,
    email: contactEmail,
    password,
  };
}

export async function addAccountMember(input: {
  account_id: string;
  account_type: AccountType;
  email: string;
  password?: string;
  role?: "owner" | "member";
}): Promise<{
  memberId: string;
  userId: string;
  email: string;
  password: string;
}> {
  const admin = getServiceClient();
  const password = input.password?.trim() || generateAccountPassword();
  const contactEmail = input.email.trim().toLowerCase();
  const role = input.role ?? "member";

  if (!contactEmail) throw new Error("Email is required.");

  if (input.account_type === "advertiser") {
    const { data: account, error: accountError } = await admin
      .from("advertisers")
      .select("id, company_name")
      .eq("id", input.account_id)
      .maybeSingle();
    if (accountError) throw new Error(accountError.message);
    if (!account) throw new Error("Account not found");
  } else {
    const { data: account, error: accountError } = await admin
      .from("publishers")
      .select("id, company_name")
      .eq("id", input.account_id)
      .maybeSingle();
    if (accountError) throw new Error(accountError.message);
    if (!account) throw new Error("Account not found");
  }

  const userId = await createAuthUser(admin, contactEmail, password, {
    full_name: contactEmail.split("@")[0],
    role: input.account_type,
    [`${input.account_type}_account_id`]: input.account_id,
  });

  const { data: member, error: memberError } = await admin
    .from("account_members")
    .insert({
      user_id: userId,
      account_id: input.account_id,
      account_type: input.account_type,
      role,
    })
    .select("id")
    .single();

  if (memberError) throw new Error(memberError.message);

  return {
    memberId: member!.id as string,
    userId,
    email: contactEmail,
    password,
  };
}
