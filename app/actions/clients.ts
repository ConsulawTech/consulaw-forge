"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function generatePassword(length = 12) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

type ActionResult =
  | { success: true; tempPassword: string }
  | { success: false; error: string };

// Look up a Supabase Auth user by email using the GoTrue admin REST endpoint.
// The JS SDK's listUsers() paginates at 50 and has no email filter — this is reliable.
async function findAuthUserByEmail(email: string): Promise<string | null> {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`
  );
  url.searchParams.set("filter", email);
  url.searchParams.set("per_page", "10");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  });

  if (!res.ok) return null;

  const body = await res.json();
  // GoTrue may return { users: [] } or a raw array depending on version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: any[] = Array.isArray(body) ? body : (body.users ?? []);
  const match = users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  return match?.id ?? null;
}

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();

  if (!name || !email) return { success: false, error: "Name and email are required." };

  const logoLetter = name[0].toUpperCase();
  const colors = ["#e50914", "#1B3FEE", "#10b981", "#f59f00", "#8b5cf6", "#0ea5e9"];
  const logoColor = colors[Math.floor(Math.random() * colors.length)];
  const tempPassword = generatePassword();

  const admin = createAdminClient();

  // 1. Try to create the auth user.
  //    The on_auth_user_created trigger auto-inserts the profiles row from
  //    user_metadata, so we must NOT insert manually.
  let userId: string;
  let isExistingUser = false;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name, role: "client" },
  });

  if (authError) {
    const alreadyExists =
      authError.message.toLowerCase().includes("already registered") ||
      authError.message.toLowerCase().includes("already exists");

    if (!alreadyExists) {
      return { success: false, error: `Failed to create account: ${authError.message}` };
    }

    // Auth user exists (orphaned from a prior failed attempt) — look them up
    const existingId = await findAuthUserByEmail(email);
    if (!existingId) {
      return { success: false, error: "An account with this email already exists and could not be recovered. Contact support." };
    }

    // If a client row already exists for this profile, truly block
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingClient } = await (admin as any)
      .from("clients")
      .select("id")
      .eq("profile_id", existingId)
      .maybeSingle();

    if (existingClient) {
      return { success: false, error: "This email already has a fully created client in Forge." };
    }

    userId = existingId;
    isExistingUser = true;
  } else {
    userId = authData.user.id;
  }

  // 2. Update profile — sets fields the trigger doesn't populate (initials, avatar_color)
  //    and corrects full_name/role in case the orphaned profile has stale values.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("profiles")
    .update({ initials: logoLetter, avatar_color: logoColor, full_name: name, role: "client" })
    .eq("id", userId);

  // 3. Insert the clients row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: clientError } = await (admin as any)
    .from("clients")
    .insert({ name, logo_letter: logoLetter, logo_color: logoColor, profile_id: userId });

  if (clientError) {
    if (!isExistingUser) await admin.auth.admin.deleteUser(userId);
    return { success: false, error: `Failed to create client record: ${clientError.message}` };
  }

  // 4. Send magic link for first-login (fire-and-forget)
  await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: { full_name: name },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://consulaw-forge.vercel.app"}/portal`,
    },
  }).catch(() => null);

  revalidatePath("/clients");
  return { success: true, tempPassword };
}
