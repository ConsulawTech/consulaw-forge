import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditProposalForm } from "@/components/proposals/EditProposalForm";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: proposal }, { data: projectsRaw }] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, title, slug, html, project_id, recipient_email")
      .eq("id", id)
      .single(),
    supabase
      .from("projects")
      .select("id, name, client:clients(name)")
      .order("name"),
  ]);

  if (!proposal) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (projectsRaw ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 [scrollbar-width:thin]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 flex items-center gap-2 text-[13px] text-[#94a3b8]">
            <Link href="/proposals" className="hover:text-[#475569] transition-colors">Proposals</Link>
            <span>/</span>
            <Link href={`/proposals/${id}`} className="hover:text-[#475569] transition-colors truncate max-w-[160px]">
              {proposal.title}
            </Link>
            <span>/</span>
            <span className="text-[#0f172a] font-medium">Edit</span>
          </div>
          <div className="mb-6">
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Edit Proposal</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              Upload a new HTML file to replace the content, or leave it blank to keep the current one.
            </p>
          </div>
          <EditProposalForm proposal={proposal} projects={projects} />
        </div>
      </div>
    </div>
  );
}
