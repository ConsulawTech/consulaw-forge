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

  // 1. Create Supabase Auth user — the on_auth_user_created trigger automatically
  //    inserts the profiles row using user_metadata, so we must NOT insert it again.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name, role: "client" },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already exists")) {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: `Failed to create account: ${authError.message}` };
  }

  const userId = authData.user.id;

  // 2. Update the auto-created profile to add initials + avatar_color
  //    (trigger only sets id, full_name, role — initials/color are missing)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("profiles")
    .update({ initials: logoLetter, avatar_color: logoColor })
    .eq("id", userId);

  // 3. Insert client row linked to profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: clientError } = await (admin as any)
    .from("clients")
    .insert({ name, logo_letter: logoLetter, logo_color: logoColor, profile_id: userId });

  if (clientError) {
    // Roll back: delete the auth user so partial state doesn't persist
    await admin.auth.admin.deleteUser(userId);
    return { success: false, error: `Failed to create client record: ${clientError.message}` };
  }

  // 4. Send magic link so the client can set their own password on first login
  //    (fire-and-forget — don't fail client creation if email sending fails)
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
