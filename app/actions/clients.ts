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

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();

  if (!name || !email) return { success: false, error: "Name and email are required." };

  const logoLetter = name[0].toUpperCase();
  const colors = ["#e50914", "#1B3FEE", "#10b981", "#f59f00", "#8b5cf6", "#0ea5e9"];
  const logoColor = colors[Math.floor(Math.random() * colors.length)];
  const tempPassword = generatePassword();

  const admin = createAdminClient();

  // 1. Try to create the Supabase Auth user.
  //    The on_auth_user_created trigger auto-inserts the profiles row from user_metadata,
  //    so we must NOT insert it manually.
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

    // Auth user exists (from a prior failed attempt) but may have no client record yet.
    // Look up the user and attempt recovery instead of blocking.
    const { data: listData, error: listError } = await admin.auth.admin.listUsers();
    const existing = listData?.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (listError || !existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    // If a client row already exists for this user, truly block.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingClient } = await (admin as any)
      .from("clients")
      .select("id")
      .eq("profile_id", existing.id)
      .maybeSingle();

    if (existingClient) {
      return { success: false, error: "This email already has a client account in Forge." };
    }

    userId = existing.id;
    isExistingUser = true;
  } else {
    userId = authData.user.id;
  }

  // 2. Update profile — sets initials + avatar_color (trigger omits these),
  //    and corrects full_name/role in case the orphaned profile has stale values.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("profiles")
    .update({ initials: logoLetter, avatar_color: logoColor, full_name: name, role: "client" })
    .eq("id", userId);

  // 3. Insert the client row linked to the profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: clientError } = await (admin as any)
    .from("clients")
    .insert({ name, logo_letter: logoLetter, logo_color: logoColor, profile_id: userId });

  if (clientError) {
    // Only roll back the auth user if we freshly created it this attempt
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
