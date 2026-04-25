import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatWidget } from "@/components/portal/ChatWidget";
import { formatDate } from "@/lib/utils";
import { Activity, CheckSquare, Users, Clock, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: client } = await supabase
    .from("clients")
    .select("*, projects(*, milestones(*), project_members(*, profile:profiles(*)))")
    .eq("profile_id", user.id)
    .single() as any;

  if (!client) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center max-w-sm border border-white/50">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-[#1B3FEE]" />
          </div>
          <div className="text-[#0f172a] font-bold text-[16px] mb-1.5">No project assigned yet</div>
          <p className="text-[13px] text-[#475569]">Your Consulaw Tech team is setting things up. Check back soon!</p>
        </div>
      </div>
    );
  }

  const project = client.projects?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const milestones: any[] = project?.milestones ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members: any[] = project?.project_members ?? [];

  const [{ data: updates }, { data: tasks }, { data: messages }] = await Promise.all([
    supabase
      .from("updates")
      .select("*")
      .eq("project_id", project?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("tasks")
      .select("id, title, status, due_date, milestone:milestones(title)")
      .eq("project_id", project?.id ?? "")
      .order("due_date"),
    supabase
      .from("messages")
      .select("*")
      .eq("project_id", project?.id ?? "")
      .order("created_at")
      .limit(30),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTasks: any[] = tasks ?? [];
  const doneTasks = allTasks.filter(t => t.status === "done").length;
  const inProgressTasks = allTasks.filter(t => t.status === "in_progress").length;
  const lateTasks = allTasks.filter(t => t.status === "late").length;
  const todoTasks = allTasks.filter(t => t.status === "todo").length;

  return (
    <div className="h-full overflow-y-auto p-6 [scrollbar-width:thin] relative z-10 pb-24">

      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-7 text-white mb-4 flex items-center gap-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1a2060 60%, #1B3FEE 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div className="absolute top-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full bg-white/[0.04]" />
        <div className="absolute bottom-[-30px] right-[120px] w-[100px] h-[100px] rounded-full bg-white/[0.03]" />
        <div
          className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[22px] font-black text-white flex-shrink-0 relative z-10"
          style={{ background: client.logo_color ?? "#e50914", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
        >
          {client.logo_letter ?? client.name[0]}
        </div>
        <div className="flex-1 relative z-10">
          <div className="text-[13px] text-white/55 mb-1">Welcome back, {client.name} team</div>
          <div className="text-[22px] font-extrabold tracking-tight">{project?.name ?? "Your Project"}</div>
          {project?.target_date && (
            <div className="text-[12px] text-white/50 mt-1">
              Target: {formatDate(project.target_date, { month: "long", day: "numeric", year: "numeric" })}
            </div>
          )}
        </div>
        <div className="relative z-10 text-right">
          <div className="text-[42px] font-extrabold text-[#f59f00] leading-none">
            {project?.overall_progress ?? 0}%
          </div>
          <div className="text-[12px] text-white/50 mt-1">Overall Complete</div>
          {/* Mini progress bar */}
          <div className="mt-2 w-[100px] bg-white/10 rounded-full h-1">
            <div
              className="h-1 rounded-full bg-[#f59f00] transition-all duration-700"
              style={{ width: `${project?.overall_progress ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {allTasks.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Tasks", value: allTasks.length, icon: Circle, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
            { label: "Completed", value: doneTasks, icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
            { label: "In Progress", value: inProgressTasks, icon: Clock, color: "#1B3FEE", bg: "rgba(27,63,238,0.1)" },
            { label: lateTasks > 0 ? "Overdue" : "Upcoming", value: lateTasks > 0 ? lateTasks : todoTasks, icon: lateTasks > 0 ? AlertCircle : Circle, color: lateTasks > 0 ? "#ef4444" : "#f59f00", bg: lateTasks > 0 ? "rgba(239,68,68,0.08)" : "rgba(245,159,0,0.1)" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass rounded-2xl p-4 border border-white/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon className="w-4.5 h-4.5" style={{ color }} strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[20px] font-extrabold text-[#0f172a] leading-none">{value}</div>
                <div className="text-[11px] text-[#94a3b8] mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestones + Updates grid */}
      <div className="grid grid-cols-2 gap-3.5 mb-3.5">
        {/* Milestones */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-white/50">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#1B3FEE]" />
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">Milestone Progress</span>
          </div>
          <div className="p-[18px] flex flex-col gap-4">
            {milestones.map((ms) => (
              <div key={ms.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[12.5px] font-semibold text-[#0f172a]">{ms.title}</div>
                  <span className="text-[12px] font-bold text-[#475569]">{ms.progress}%</span>
                </div>
                <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${ms.progress}%`, background: ms.color ?? "#1B3FEE" }}
                  />
                </div>
                {ms.deadline && (
                  <div className="text-[11px] text-[#94a3b8] mt-1">
                    Due {formatDate(ms.deadline, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}
              </div>
            ))}
            {milestones.length === 0 && (
              <p className="text-[13px] text-[#94a3b8]">Milestones will appear here once set up.</p>
            )}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-white/50">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-[#10b981]" />
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">Recent Updates</span>
          </div>
          <div className="p-[18px] flex flex-col gap-3.5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((updates ?? []) as any[]).map((u) => (
              <div key={u.id} className="flex gap-2.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: u.color ?? "#1B3FEE" }}
                />
                <div>
                  <div className="text-[12.5px] font-medium text-[#0f172a] leading-snug">{u.title}</div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">
                    {formatDate(u.created_at, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
            {(!updates || updates.length === 0) && (
              <p className="text-[13px] text-[#94a3b8]">Updates from your team will appear here.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tasks section */}
      {allTasks.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden mb-3.5">
          <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-white/50">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(245,159,0,0.1)] flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-[#f59f00]" />
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">Project Tasks</span>
            <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 text-[#475569]">
              {doneTasks}/{allTasks.length} done
            </span>
          </div>
          <div className="divide-y divide-white/40">
            {allTasks.map((task) => {
              const statusConfig = {
                done:        { label: "Done",        color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
                in_progress: { label: "In Progress", color: "#1B3FEE", bg: "rgba(27,63,238,0.1)"  },
                late:        { label: "Overdue",     color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
                todo:        { label: "To Do",       color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
              }[task.status as string] ?? { label: task.status, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };

              return (
                <div key={task.id} className="flex items-center gap-3 px-[18px] py-3 hover:bg-white/30 transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusConfig.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#0f172a] truncate">{task.title}</div>
                    {task.milestone?.title && (
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">{task.milestone.title}</div>
                    )}
                  </div>
                  {task.due_date && (
                    <div className="text-[11px] text-[#94a3b8] flex-shrink-0">
                      {formatDate(task.due_date, { month: "short", day: "numeric" })}
                    </div>
                  )}
                  <span
                    className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: statusConfig.color, background: statusConfig.bg }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#475569]" />
          <span className="text-[13px] font-bold text-[#0f172a]">Your Dedicated Team</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {members.map((m) => (
            <div key={m.profile_id} className="text-center">
              <Avatar
                name={m.profile?.full_name ?? "?"}
                color={m.profile?.avatar_color ?? "#1B3FEE"}
                size="lg"
                className="mx-auto mb-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
              />
              <div className="text-[12px] font-semibold text-[#0f172a]">{m.profile?.full_name}</div>
              <div className="text-[10.5px] text-[#94a3b8] mt-0.5">{m.profile?.job_title ?? "Team Member"}</div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="col-span-4 text-[13px] text-[#94a3b8]">Team members will appear here once assigned.</p>
          )}
        </div>
      </div>

      {/* Chat widget */}
      {project && (
        <ChatWidget
          projectId={project.id}
          initialMessages={messages ?? []}
        />
      )}
    </div>
  );
}
