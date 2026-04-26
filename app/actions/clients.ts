"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendEmail, clientWelcomeEmail } from "@/lib/email";

type SimpleResult = { success: true } | { success: false; error: string };
type CreateClientResult =
  | { success: true; emailSent: true }
  | { success: true; emailSent: false; emailError: string }
  | { success: false; error: string };

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createClientAction(formData: FormData): Promise<CreateClientResult> {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();

  if (!name || !email) return { success: false, error: "Name and email are required." };

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  // Create auth user — on_auth_user_created trigger auto-creates profiles row with role='client'
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name, role: "client" },
  });

  if (authError) return { success: false, error: authError.message };

  const logoLetter = name[0].toUpperCase();
  const colors = ["#e50914", "#1B3FEE", "#10b981", "#f59f00", "#8b5cf6", "#0ea5e9"];
  const logoColor = colors[Math.floor(Math.random() * colors.length)];

  // Insert client record linked to the new auth user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: clientError } = await (admin as any)
    .from("clients")
    .insert({
      name,
      email,
      logo_letter: logoLetter,
      logo_color: logoColor,
      profile_id: authData.user.id,
    });

  if (clientError) {
    // Roll back: remove the auth user we just created
    await admin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: clientError.message };
  }

  // Send welcome email (non-blocking — don't fail the whole action if email fails)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://consulaw-forge.vercel.app";
  const html = clientWelcomeEmail({
    clientName: name,
    email,
    tempPassword,
    portalUrl: `${appUrl}/portal`,
  });
  const emailResult = await sendEmail({
    to: email,
    subject: "Welcome — your Consulaw client portal is ready",
    html,
  });

  revalidatePath("/clients");

  if (!emailResult.ok) {
    console.error("Welcome email failed:", emailResult.reason);
    return { success: true, emailSent: false, emailError: emailResult.reason ?? "Unknown error" };
  }

  return { success: true, emailSent: true };
}

export async function resendClientCredentialsAction(clientId: string): Promise<SimpleResult> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientRow } = await (supabase as any)
    .from("clients")
    .select("name, email, profile_id")
    .eq("id", clientId)
    .single();

  if (!clientRow?.email) return { success: false, error: "No email address on file for this client." };

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  if (clientRow.profile_id) {
    // Reset existing auth user's password
    const { error } = await admin.auth.admin.updateUserById(clientRow.profile_id, {
      password: tempPassword,
    });
    if (error) return { success: false, error: error.message };
  } else {
    // No auth account yet — create one now and link it
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: clientRow.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: clientRow.name, role: "client" },
    });
    if (authError) return { success: false, error: authError.message };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("clients")
      .update({ profile_id: authData.user.id })
      .eq("id", clientId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://consulaw-forge.vercel.app";
  const html = clientWelcomeEmail({
    clientName: clientRow.name,
    email: clientRow.email,
    tempPassword,
    portalUrl: `${appUrl}/portal`,
  });
  const emailResult = await sendEmail({
    to: clientRow.email,
    subject: "Your Consulaw client portal — updated login details",
    html,
  });

  if (!emailResult.ok) return { success: false, error: `Email failed: ${emailResult.reason}` };
  return { success: true };
}

export async function deleteClientAction(clientId: string): Promise<SimpleResult> {
  const supabase = await createClient();

  // Fetch profile_id before deleting so we can remove the auth user too
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientRow } = await (supabase as any)
    .from("clients")
    .select("profile_id")
    .eq("id", clientId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  // Remove the linked auth user if one exists
  if (clientRow?.profile_id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(clientRow.profile_id);
  }

  revalidatePath("/clients");
  revalidatePath("/projects");
  return { success: true };
}
