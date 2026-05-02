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
    .insert({ title, slug, html, client_id: clientId, status: "draft" });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That slug is already taken. Choose a different one." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/proposals");
  return { success: true };
}

export async function sendProposalAction(proposalId: string): Promise<SendResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, title, slug, status, client_id, client:clients(name, email)")
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return { success: false, error: "Proposal not found." };
  }

  const clientEmail: string | null = proposal.client?.email ?? null;
  if (!clientEmail) {
    return {
      success: false,
      error: "No email address on file for the linked client. Attach a client with an email first.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://forge.consulawtech.com";
  const proposalUrl = `${appUrl}/${proposal.slug}`;

  const html = proposalEmail({
    clientName: proposal.client.name,
    proposalTitle: proposal.title,
    proposalUrl,
  });

  const emailResult = await sendEmail({
    to: clientEmail,
    subject: `Proposal: ${proposal.title}`,
    html,
  });

  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposalId);

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);

  if (!emailResult.ok) {
    return { success: true, emailSent: false, emailError: emailResult.reason ?? "Unknown email error" };
  }
  return { success: true, emailSent: true };
}

export async function deleteProposalAction(proposalId: string): Promise<SimpleResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase.from("proposals").delete().eq("id", proposalId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/proposals");
  return { success: true };
}
