import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, proposalSubmissionEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    message?: string;
    selectedTemplate?: string;
    template?: string;
    features?: string[];
    selectedFeatures?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: proposal, error } = await admin
    .from("proposals")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ message: "Proposal not found" }, { status: 404 });
  }

  // Accept features under either key name the HTML might use
  const rawFeatures = Array.isArray(body.features)
    ? body.features
    : Array.isArray(body.selectedFeatures)
    ? body.selectedFeatures
    : [];

  const rawTemplate = body.selectedTemplate ?? body.template ?? null;

  await admin.from("proposal_submissions").insert({
    proposal_id: proposal.id,
    client_name: body.name ?? null,
    client_email: body.email ?? null,
    client_phone: body.phone ?? null,
    client_company: body.company ?? null,
    message: body.message ?? null,
    selected_template: rawTemplate,
    selected_features: rawFeatures,
  });

  const teamEmail = process.env.TEAM_NOTIFICATION_EMAIL ?? "forge@consulawtech.com";
  await sendEmail({
    to: teamEmail,
    subject: `New proposal response: ${proposal.title}`,
    html: proposalSubmissionEmail({
      proposalTitle: proposal.title,
      slug,
      proposalId: proposal.id,
      submission: { ...body, selectedTemplate: rawTemplate ?? undefined, features: rawFeatures },
    }),
  });

  return NextResponse.json({ ok: true });
}
