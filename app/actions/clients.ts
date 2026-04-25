"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function generatePassword(length = 12) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createClientAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const logoLetter = (name.trim()[0] ?? "C").toUpperCase();
  const colors = ["#e50914", "#1B3FEE", "#10b981", "#f59f00", "#8b5cf6", "#0ea5e9"];
  const logoColor = colors[Math.floor(Math.random() * colors.length)];
  const tempPassword = generatePassword();

  const admin = createAdminClient();

  // 1. Create Supabase Auth user for the client
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name, role: "client" },
  });

  if (authError) throw new Error(authError.message);
  const userId = authData.user.id;

  // 2. Create profile row (role = client)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin as any)
    .from("profiles")
    .insert({ id: userId, full_name: name, role: "client", initials: logoLetter });

  if (profileError) throw new Error(profileError.message);

  // 3. Create client row linked to profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: clientError } = await (admin as any)
    .from("clients")
    .insert({ name, logo_letter: logoLetter, logo_color: logoColor, profile_id: userId });

  if (clientError) throw new Error(clientError.message);

  // 4. Send welcome email via Supabase magic link (sets temp password in the email)
  await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: { full_name: name },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://consulaw-forge.vercel.app"}/portal`,
    },
  });

  revalidatePath("/clients");
  return { success: true, tempPassword };
}
