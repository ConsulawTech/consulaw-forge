import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, getAvatarColor } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

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
  const project = client.projects?.[0];
  const members = project?.project_members ?? [];
  const milestones = project?.milestones ?? [];
  const currentMilestone = milestones[0];

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assignee:profiles(*)")
    .eq("project_id", project?.id ?? "")
    .order("due_date")
    .limit(8);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Client Overview</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">{client.name} · {project?.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/portal`}>
              <button className="px-3.5 py-2 rounded-[10px] bg-white/65 border border-white/60 text-[13px] font-semibold text-[#475569] hover:bg-white/85 cursor-pointer transition-colors">
                Client Portal View
              </button>
            </Link>
            <button className="px-3.5 py-2 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] transition-colors">
              + Schedule Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[270px_1fr] gap-3.5">
          {/* Client profile */}
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
                <div className="text-[12.5px] text-[#1B3FEE] font-semibold mb-3">{project?.name}</div>
                <p className="text-[12.5px] text-[#475569] leading-relaxed mb-4">
                  {project?.description ?? "No project description provided."}
                </p>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-2">Team: Internal</div>
                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {members.map((m: any) => (
                    <div key={m.profile_id} className="flex flex-col items-center gap-1">
                      <Avatar name={m.profile?.full_name ?? "?"} color={getAvatarColor(m.profile?.full_name ?? "A")} size="sm" />
                      <span className="text-[10px] text-[#475569]">{m.profile?.full_name?.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 bg-[#1B3FEE] text-white rounded-[10px] text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] transition-colors shadow-[0_2px_8px_rgba(27,63,238,0.25)]">
                  Schedule Tasks
                </button>
              </div>

              {/* Current milestone card */}
              {currentMilestone && (
                <div className="m-3.5 rounded-2xl p-[18px] text-white border border-white/[0.08]" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e2a5e 100%)" }}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 mb-1">Current Milestone</div>
                  <div className="text-[18px] font-extrabold mb-0.5">{currentMilestone.title}</div>
                  <div className="text-[12px] text-white/55 mb-3.5 leading-snug">{currentMilestone.description}</div>
                  <div className="bg-white/[0.12] rounded h-[5px] mb-1.5">
                    <div className="bg-[#f59f00] rounded h-[5px] transition-all" style={{ width: `${currentMilestone.progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[22px] font-extrabold">{currentMilestone.progress}%</span>
                    <span className="text-[11px] bg-white/[0.1] px-2.5 py-1 rounded-full text-white/70">
                      Deadline: {formatDate(currentMilestone.deadline, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/50 flex items-center gap-2.5">
              <span className="text-[14px] font-bold text-[#0f172a]">Project Timeline</span>
              <span className="text-[12px] text-[#94a3b8]">
                Deadline: <strong className="text-[#0f172a]">{formatDate(project?.target_date ?? null, { month: "short", day: "numeric", year: "numeric" })}</strong>
              </span>
              <button className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-3 py-1.5 rounded-[8px] border border-[rgba(27,63,238,0.15)] hover:bg-[rgba(27,63,238,0.14)] cursor-pointer transition-colors">
                <Plus className="w-3 h-3" /> Schedule Task
              </button>
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(tasks ?? []).map((task: any) => (
              <div key={task.id} className="px-5 py-3.5 border-b border-white/50 last:border-0 grid grid-cols-[160px_80px_1fr] gap-3 items-center hover:bg-white/40 cursor-pointer transition-colors">
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">
                    {task.due_date ? formatDate(task.due_date, { month: "long", day: "numeric", weekday: "long" }) : "No date"}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">This week</div>
                </div>
                <Avatar name={task.assignee?.full_name ?? "?"} color={getAvatarColor(task.assignee?.full_name ?? "A")} size="sm" />
                <div>
                  <div className="text-[13px] font-medium text-[#0f172a]">{task.title}</div>
                  <div className="text-[11.5px] text-[#94a3b8] mt-0.5 flex items-center gap-1">
                    🕓 {task.due_date ? new Date(task.due_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                </div>
              </div>
            ))}
            {(!tasks || tasks.length === 0) && (
              <div className="px-5 py-8 text-center text-[13px] text-[#94a3b8]">No tasks scheduled yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
