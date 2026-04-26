"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendInternalMessageAction(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
  const projectId = (formData.get("project_id") as string | null) || null;
  const recipientId = (formData.get("recipient_id") as string | null) || null;
  const content = (formData.get("content") as string | null)?.trim();
  const senderName = (formData.get("sender_name") as string | null)?.trim() || "Team";

  if (!content) return { success: false, error: "Message content is required." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await db.from("internal_messages").insert({
    project_id: projectId,
    sender_id: user?.id ?? null,
    sender_name: senderName,
    recipient_id: recipientId,
    content,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/messages");
  return { success: true };
}

export async function getInternalMessagesAction(
  projectId?: string | null,
  recipientId?: string | null
): Promise<{ success: true; messages: unknown[] } | { success: false; error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db.from("internal_messages").select("*").order("created_at");

  if (projectId) {
    query = query.eq("project_id", projectId).is("recipient_id", null);
  } else if (recipientId) {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;
    query = query
      .is("project_id", null)
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`);
  } else {
    // General chat: both project_id and recipient_id are null
    query = query.is("project_id", null).is("recipient_id", null);
  }

  const { data, error } = await query.limit(100);

  if (error) return { success: false, error: error.message };
  return { success: true, messages: data ?? [] };
}
