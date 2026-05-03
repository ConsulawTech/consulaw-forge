"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail, proposalEmail } from "@/lib/email";

type SimpleResult = { success: true } | { success: false; error: string };
type SendResult =
  | { success: true; emailSent: true }
  | { success: true; emailSent: false; emailError: string }
  | { success: false; error: string };

export async function createProposalAction(formData: FormData): Promise<SimpleResult> {
  const title = (formData.get("title") as string | null)?.trim();
  const slug = (formData.get("slug") as string | null)?.trim();
  const html = (formData.get("html") as string | null)?.trim();
  const clientId = (formData.get("client_id") as string | null)?.trim() || null;
  const recipientEmail = (formData.get("recipient_email") as string | null)?.trim() || null;

  if (!title || !slug || !html) {
    return { success: false, error: "Title, slug, and HTML content are required." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: "Slug may only contain lowercase letters, numbers, and hyphens." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase
    .from("proposals")
    .insert({ title, slug, html, client_id: clientId, recipient_email: recipientEmail, status: "draft" });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That slug is already taken. Choose a different one." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/proposals");
  return { success: true };
}

// email is always provided by the UI — the team types it manually or it's pre-filled
export async function sendProposalAction(proposalId: string, email: string): Promise<SendResult> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { success: false, error: "Please enter a recipient email address." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, title, slug, client:clients(name)")
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return { success: false, error: "Proposal not found." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://forge.consulawtech.com";
  const proposalUrl = `${appUrl}/${proposal.slug}`;

  // Use the client name if linked, otherwise address generically
  const clientName = proposal.client?.name ?? "there";

  const html = proposalEmail({
    clientName,
    proposalTitle: proposal.title,
    proposalUrl,
  });

  const emailResult = await sendEmail({
    to: trimmedEmail,
    subject: `Proposal: ${proposal.title}`,
    html,
  });

  // Persist the last-used email and update status
  await supabase
    .from("proposals")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_email: trimmedEmail,
    })
    .eq("id", proposalId);

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);

  if (!emailResult.ok) {
    return { success: true, emailSent: false, emailError: emailResult.reason ?? "Unknown email error" };
  }
  return { success: true, emailSent: true };
}

export async function updateProposalAction(proposalId: string, formData: FormData): Promise<SimpleResult> {
  const title = (formData.get("title") as string | null)?.trim();
  const slug = (formData.get("slug") as string | null)?.trim();
  const html = (formData.get("html") as string | null)?.trim();
  const clientId = (formData.get("client_id") as string | null)?.trim() || null;
  const recipientEmail = (formData.get("recipient_email") as string | null)?.trim() || null;

  if (!title || !slug) {
    return { success: false, error: "Title and slug are required." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: "Slug may only contain lowercase letters, numbers, and hyphens." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = { title, slug, client_id: clientId, recipient_email: recipientEmail };
  // Only replace HTML if a new one was provided
  if (html) updates.html = html;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase.from("proposals").update(updates).eq("id", proposalId);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That slug is already taken. Choose a different one." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
  return { success: true };
}

export async function deleteProposalAction(proposalId: string): Promise<SimpleResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase.from("proposals").delete().eq("id", proposalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/proposals");
  return { success: true };
}
