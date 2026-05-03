"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail, invoiceEmail } from "@/lib/email";

export interface InvoiceItem {
  description: string;
  amount: number;
}

type SendInvoiceResult =
  | { success: true; emailSent: true }
  | { success: true; emailSent: false; emailError: string }
  | { success: false; error: string };

export async function sendInvoiceAction(opts: {
  proposalId: string;
  invoiceNumber: string;
  recipientEmail: string;
  clientName: string;
  proposalTitle: string;
  items: InvoiceItem[];
  currency: string;
  dueDate: string | null;
  notes: string | null;
}): Promise<SendInvoiceResult> {
  if (!opts.recipientEmail.trim()) {
    return { success: false, error: "Recipient email is required." };
  }
  if (opts.items.length === 0) {
    return { success: false, error: "Add at least one line item." };
  }

  const total = opts.items.reduce((sum, i) => sum + i.amount, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { error: dbError } = await supabase.from("invoices").insert({
    proposal_id: opts.proposalId,
    invoice_number: opts.invoiceNumber,
    client_name: opts.clientName,
    recipient_email: opts.recipientEmail,
    items: opts.items,
    currency: opts.currency,
    due_date: opts.dueDate || null,
    notes: opts.notes || null,
    amount_total: total,
  });

  if (dbError) return { success: false, error: dbError.message };

  const html = invoiceEmail({
    invoiceNumber: opts.invoiceNumber,
    clientName: opts.clientName,
    proposalTitle: opts.proposalTitle,
    items: opts.items,
    currency: opts.currency,
    total,
    dueDate: opts.dueDate,
    notes: opts.notes,
  });

  const emailResult = await sendEmail({
    to: opts.recipientEmail,
    subject: `Invoice ${opts.invoiceNumber} — ${opts.proposalTitle}`,
    html,
  });

  revalidatePath(`/proposals/${opts.proposalId}`);

  if (!emailResult.ok) {
    return { success: true, emailSent: false, emailError: emailResult.reason ?? "Email failed" };
  }
  return { success: true, emailSent: true };
}
