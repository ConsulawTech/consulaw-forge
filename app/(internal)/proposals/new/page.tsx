import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { CreateProposalForm } from "@/components/proposals/CreateProposalForm";

export default async function NewProposalPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: raw } = await supabase
    .from("clients")
    .select("id, name, email")
    .order("name");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clients = (raw ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? null,
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 [scrollbar-width:thin]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">New Proposal</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              Upload or paste a full HTML document to create a shareable client proposal.
            </p>
          </div>
          <CreateProposalForm clients={clients} />
        </div>
      </div>
    </div>
  );
}
