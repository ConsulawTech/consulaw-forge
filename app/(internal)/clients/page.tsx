import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AddClientButton } from "@/components/clients/AddClientButton";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(*, milestones(*))")
    .order("created_at");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Clients</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">Manage your clients and their projects</p>
          </div>
          <AddClientButton />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(clients ?? []).map((client: any) => {
            const project = client.projects?.[0];
            const progress = project?.overall_progress ?? 0;
            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="glass rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all duration-150">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div
                      className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                      style={{ background: client.logo_color ?? "#e50914" }}
                    >
                      {client.logo_letter ?? client.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#0f172a]">{client.name}</div>
                      <div className="text-[12px] text-[#1B3FEE] font-medium mt-0.5 truncate">
                        {project?.name ?? "No active project"}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#94a3b8] flex-shrink-0 mt-0.5" />
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] font-semibold text-[#475569] mb-1.5">
                      <span>Overall Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-[#1B3FEE] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                    <span>{client.projects?.length ?? 0} project{client.projects?.length !== 1 ? "s" : ""}</span>
                    {project?.target_date && (
                      <span>Due {formatDate(project.target_date, { month: "short", year: "numeric" })}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}

          {(!clients || clients.length === 0) && (
            <div className="col-span-3 glass rounded-2xl p-12 text-center text-[#94a3b8] text-sm">
              No clients yet. Click &quot;Add Client&quot; to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
