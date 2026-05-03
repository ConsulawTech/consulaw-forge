import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { SendProposalButton } from "@/components/proposals/SendProposalButton";
import { CopyLinkButton } from "@/components/proposals/CopyLinkButton";
import { DeleteProposalButton } from "@/components/proposals/DeleteProposalButton";
import type { ProposalSubmission } from "@/lib/types";
import { ProposalStats } from "@/components/proposals/ProposalStats";

const STATUS_COLORS: Record<string, string> = {
  draft:  "bg-[rgba(148,163,184,0.15)] text-[#475569]",
  sent:   "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]",
  viewed: "bg-[rgba(16,185,129,0.1)] text-[#10b981]",
};

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: p }, { data: submissionsRaw }] = await Promise.all([
    supabase
      .from("proposals")
      .select("*, recipient_email, client:clients(id, name, email, logo_color, logo_letter)")
      .eq("id", id)
      .single(),
    supabase
      .from("proposal_submissions")
      .select("*")
      .eq("proposal_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

  if (!p) notFound();

  const submissions: ProposalSubmission[] = submissionsRaw ?? [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://forge.consulawtech.com";
  const publicUrl = `${appUrl}/${p.slug}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-[13px] text-[#94a3b8]">
          <Link href="/proposals" className="hover:text-[#475569] transition-colors">
            Proposals
          </Link>
          <span>/</span>
          <span className="text-[#0f172a] font-medium truncate max-w-[200px]">{p.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          {/* Main panel */}
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="glass rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-[20px] font-extrabold text-[#0f172a] tracking-tight">{p.title}</h1>
                  <p className="text-[12px] text-[#94a3b8] mt-1 font-mono">{p.slug}</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[p.status] ?? ""}`}>
                  {p.status}
                </span>
              </div>

              {/* Stats — live via Supabase Realtime */}
              <ProposalStats
                proposalId={p.id}
                initialViewCount={p.view_count}
                initialSentAt={p.sent_at}
                initialViewedAt={p.viewed_at}
              />

              {/* Public URL */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-1.5">
                  Public URL
                </p>
                <div className="flex items-center gap-2 bg-[rgba(241,245,249,0.7)] rounded-xl px-3 py-2.5">
                  <span className="flex-1 text-[12px] text-[#475569] font-mono truncate">{publicUrl}</span>
                  <CopyLinkButton url={publicUrl} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap pt-2 border-t border-white/50">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-white/65 border border-white/60 text-[#475569] hover:bg-white/85 transition-all"
                >
                  Preview →
                </a>
                <Link
                  href={`/proposals/${p.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-white/65 border border-white/60 text-[#475569] hover:bg-white/85 transition-all"
                >
                  Edit
                </Link>
                <SendProposalButton
                  proposalId={p.id}
                  defaultEmail={p.recipient_email ?? p.client?.email ?? ""}
                />
                <DeleteProposalButton proposalId={p.id} proposalTitle={p.title} />
              </div>
            </div>

            {/* Submissions */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[15px] font-bold text-[#0f172a]">Responses</h2>
                {submissions.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]">
                    {submissions.length}
                  </span>
                )}
              </div>

              {submissions.length === 0 ? (
                <p className="text-[13px] text-[#94a3b8]">
                  No responses yet. Once the client submits the proposal form, their selections will appear here.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {submissions.map((s) => (
                    <div
                      key={s.id}
                      className="bg-[rgba(241,245,249,0.7)] rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="text-[14px] font-bold text-[#0f172a]">
                            {s.client_name ?? "Anonymous"}
                          </div>
                          {s.client_email && (
                            <div className="text-[12px] text-[#64748b]">{s.client_email}</div>
                          )}
                          {s.client_phone && (
                            <div className="text-[12px] text-[#64748b]">{s.client_phone}</div>
                          )}
                          {s.client_company && (
                            <div className="text-[12px] text-[#64748b]">{s.client_company}</div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#94a3b8] flex-shrink-0">
                          {formatDate(s.submitted_at)}
                        </span>
                      </div>

                      {s.selected_template && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-1">
                            Selected Design
                          </p>
                          <span className="text-[12px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-2 py-0.5 rounded-full">
                            {s.selected_template}
                          </span>
                        </div>
                      )}

                      {s.selected_features && s.selected_features.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-1.5">
                            Features ({s.selected_features.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.selected_features.map((f) => (
                              <span
                                key={f}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-white/80 border border-white/60 text-[#475569]"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.message && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-1">
                            Message
                          </p>
                          <p className="text-[12.5px] text-[#475569] leading-relaxed">{s.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: linked client */}
          <div className="glass rounded-2xl p-5 h-fit">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-3">
              Linked Client
            </p>
            {p.client ? (
              <Link
                href={`/clients/${p.client.id}`}
                className="flex items-center gap-3 hover:opacity-75 transition-opacity"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0"
                  style={{ background: p.client.logo_color ?? "#e50914" }}
                >
                  {p.client.logo_letter ?? p.client.name[0]}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">{p.client.name}</div>
                  <div className="text-[12px] text-[#94a3b8]">{p.client.email ?? "No email"}</div>
                </div>
              </Link>
            ) : (
              <p className="text-[13px] text-[#94a3b8]">
                No client linked. You can still copy and share the URL manually.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
