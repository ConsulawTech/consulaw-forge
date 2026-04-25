"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Unauthorized");

  const full_name = (formData.get("full_name") as string | null)?.trim() ?? "";
  const job_title = (formData.get("job_title") as string | null)?.trim() ?? "";

  const { error } = await (supabase as any)
    .from("profiles")
    .update({ full_name, job_title })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  return { success: true };
}

export async function changePasswordAction(formData: FormData) {
  const currentPassword = (formData.get("currentPassword") as string | null) ?? "";
  const newPassword = (formData.get("newPassword") as string | null) ?? "";

  if (!currentPassword || !newPassword) throw new Error("Missing fields");
  if (newPassword.length < 10) throw new Error("New password must be at least 10 characters");

  // Get current user's email to verify old password
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user?.email) throw new Error("Unauthorized");

  // Verify current password using a stateless raw client (no session side-effects)
  const { createClient: createRaw } = await import("@supabase/supabase-js");
  const rawClient = createRaw(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error: verifyErr } = await rawClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) throw new Error("Current password is incorrect");

  // Update password in Supabase Auth — applies to all platforms on this Supabase project
  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
  if (updateErr) throw new Error(updateErr.message);

  return { success: true };
}
