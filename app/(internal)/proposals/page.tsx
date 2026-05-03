import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { ProposalsView } from "@/components/proposals/ProposalsView";

export default async function ProposalsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: raw } = await supabase
    .from("proposals")
    .select("id, title, slug, status, view_count, created_at, sent_at, viewed_at, project:projects(id, name, client:clients(name, logo_color, logo_letter))")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposals = (raw ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    view_count: p.view_count,
    created_at: p.created_at,
    sent_at: p.sent_at,
    viewed_at: p.viewed_at,
    project: p.project ?? null,
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Proposals</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/proposals/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] transition-all"
          >
            + New Proposal
          </Link>
        </div>
        <ProposalsView proposals={proposals} />
      </div>
    </div>
  );
}
