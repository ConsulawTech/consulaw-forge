import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { AddClientButton } from "@/components/clients/AddClientButton";
import { ClientsView } from "@/components/clients/ClientsView";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clientsRaw } = await supabase
    .from("clients")
    .select("*, projects(id, name, overall_progress, target_date)")
    .order("created_at");

  const clients = (clientsRaw ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
    email: c.email as string | null,
    logo_color: c.logo_color as string | null,
    logo_letter: c.logo_letter as string | null,
    created_at: c.created_at as string,
    updated_at: c.updated_at as string | null,
    projects: ((c.projects ?? []) as Record<string, unknown>[]).map((p) => ({
      id: p.id as string,
      name: p.name as string,
      overall_progress: p.overall_progress as number | null,
      target_date: p.target_date as string | null,
    })),
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Clients</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">Manage your clients and their projects</p>
          </div>
          <AddClientButton />
        </div>

        <ClientsView clients={clients} />
      </div>
    </div>
  );
}
