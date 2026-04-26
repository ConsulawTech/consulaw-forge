import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, getAvatarColor } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ChatWidget } from "@/components/portal/ChatWidget";
import { AddProjectButton } from "@/components/projects/AddProjectButton";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { ResendCredentialsButton } from "@/components/clients/ResendCredentialsButton";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: clientRaw } = await supabase
    .from("clients")
    .select("*, projects(*, milestones(*), project_members(*, profile:profiles(*)))")
    .eq("id", id)
    .single();

  if (!clientRaw) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = clientRaw as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: any[] = client.projects ?? [];
  const projectIds = projects.map((p: any) => p.id).filter(Boolean);

  const [{ data: allTasks }, { data: messages }, { data: teamProfilesRaw }] = await Promise.all([
    projectIds.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any)
          .from("tasks")
          .select("*, assignee:profiles(*)")
          .in("project_id", projectIds)
          .order("due_date")
      : Promise.resolve({ data: [] }),
    projects[0]
      ? supabase
          .from("messages")
          .select("*")
          .eq("project_id", projects[0].id)
          .order("created_at")
          .limit(30)
      : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, full_name, job_title").eq("role", "team"),
  ]);

  // Group tasks by project_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasksByProject = (allTasks ?? []).reduce((acc: Record<string, any[]>, task: any) => {
    if (!acc[task.project_id]) acc[task.project_id] = [];
    acc[task.project_id].push(task);
    return acc;
  }, {});

  // Collect all unique team members across all projects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberMap = new Map<string, any>();
  for (const p of projects) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const m of (p.project_members ?? [])) {
      if (!memberMap.has(m.profile_id)) memberMap.set(m.profile_id, m);
    }
  }
  const members = Array.from(memberMap.values());

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Client Overview</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              {client.name} · {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <ResendCredentialsButton clientId={client.id} />
            <DeleteClientButton clientId={client.id} clientName={client.name} variant="button" />
            <AddProjectButton
              clients={[{ id: client.id, name: client.name }]}
              teamProfiles={(teamProfilesRaw ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name, job_title: p.job_title }))}
              preselectedClientId={client.id}
              label="Add Project"
            />
          </div>
        </div>

        <div className="grid grid-cols-[270px_1fr] gap-3.5">
          {/* Left: client profile */}
          <div className="flex flex-col gap-3.5">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 pt-7 pb-5 text-center border-b border-white/50">
                <div
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-2xl font-black text-white mx-auto mb-3 shadow-[0_6px_16px_rgba(0,0,0,0.15)]"
                  style={{ background: client.logo_color ?? "#e50914" }}
                >
                  {client.logo_letter ?? client.name[0]}
                </div>
                <div className="text-[18px] font-extrabold text-[#0f172a] mb-0.5">{client.name}</div>
                {client.email && (
                  <div className="text-[12px] text-[#94a3b8] mb-3">{client.email}</div>
                )}
                {members.length > 0 && (
                  <>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-2">Internal Team</div>
                    <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {members.map((m: any) => (
                        <div key={m.profile_id} className="flex flex-col items-center gap-1">
                          <Avatar name={m.profile?.full_name ?? "?"} color={getAvatarColor(m.profile?.full_name ?? "A")} size="sm" />
                          <span className="text-[10px] text-[#475569]">{m.profile?.full_name?.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Projects progress list */}
              {projects.length > 0 && (
                <div className="p-4 flex flex-col gap-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">Projects</div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {projects.map((p: any) => (
                    <Link key={p.id} href={`/projects/${p.id}`} className="block">
                      <div className="rounded-xl border border-white/60 bg-white/40 hover:bg-white/60 transition-colors p-3 cursor-pointer">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12.5px] font-semibold text-[#0f172a] truncate">{p.name}</span>
                          <span className="text-[11px] font-bold text-[#1B3FEE] ml-2 flex-shrink-0">{p.overall_progress ?? 0}%</span>
                        </div>
                        <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#1B3FEE] transition-all"
                            style={{ width: `${p.overall_progress ?? 0}%` }}
                          />
                        </div>
                        {p.target_date && (
                          <div className="text-[10.5px] text-[#94a3b8] mt-1.5">
                            Due {formatDate(p.target_date, { month: "short", year: "numeric" })}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: one panel per project */}
          <div className="flex flex-col gap-3.5">
            {projects.length === 0 && (
              <div className="glass rounded-2xl p-12 text-center text-[#94a3b8] text-[13px]">
                No projects yet. Click &quot;Add Project&quot; to get started.
              </div>
            )}

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {projects.map((project: any) => {
              const projectTasks = tasksByProject[project.id] ?? [];
              return (
                <div key={project.id} className="glass rounded-2xl overflow-hidden">
                  {/* Project header */}
                  <div className="px-5 py-4 border-b border-white/50 flex items-center gap-3">
                    <div>
                      <div className="text-[14px] font-bold text-[#0f172a]">{project.name}</div>
                      {project.target_date && (
                        <div className="text-[11.5px] text-[#94a3b8] mt-0.5">
                          Target: {formatDate(project.target_date, { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[#1B3FEE]">{project.overall_progress ?? 0}% complete</span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-3 py-1.5 rounded-[8px] border border-[rgba(27,63,238,0.15)] hover:bg-[rgba(27,63,238,0.14)] cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Schedule Task
                      </Link>
                    </div>
                  </div>

                  {/* Tasks */}
                  {projectTasks.map((task: any) => (
                    <div key={task.id} className="px-5 py-3.5 border-b border-white/50 last:border-0 grid grid-cols-[160px_44px_1fr] gap-3 items-center hover:bg-white/40 cursor-pointer transition-colors">
                      <div>
                        <div className="text-[13px] font-bold text-[#0f172a]">
                          {task.due_date ? formatDate(task.due_date, { month: "long", day: "numeric", weekday: "short" }) : "No date"}
                        </div>
                      </div>
                      <Avatar name={task.assignee?.full_name ?? "?"} color={getAvatarColor(task.assignee?.full_name ?? "A")} size="sm" />
                      <div>
                        <div className="text-[13px] font-medium text-[#0f172a]">{task.title}</div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5">
                          {task.due_date ? new Date(task.due_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {projectTasks.length === 0 && (
                    <div className="px-5 py-8 text-center text-[13px] text-[#94a3b8]">No tasks scheduled yet</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat tied to the first project */}
      {projects[0] && (
        <ChatWidget
          projectId={projects[0].id}
          initialMessages={messages ?? []}
        />
      )}
    </div>
  );
}
