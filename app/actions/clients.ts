"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();

  if (!name || !email) return { success: false, error: "Name and email are required." };

  const logoLetter = name[0].toUpperCase();
  const colors = ["#e50914", "#1B3FEE", "#10b981", "#f59f00", "#8b5cf6", "#0ea5e9"];
  const logoColor = colors[Math.floor(Math.random() * colors.length)];

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("clients")
    .insert({ name, email, logo_letter: logoLetter, logo_color: logoColor });

  if (error) return { success: false, error: error.message };

  revalidatePath("/clients");
  return { success: true };
}
