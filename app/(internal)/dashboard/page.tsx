import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, formatTime, getAvatarColor } from "@/lib/utils";
import { Users, FolderKanban, UserCheck, AlertCircle, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: projects }, { data: tasks }, { data: profiles }] =
    await Promise.all([
      supabase.from("clients").select("id"),
      supabase.from("projects").select("id").eq("status", "active"),
      supabase.from("tasks").select("*, assignee:profiles(*), project:projects(name, client:clients(name))").order("due_date"),
      supabase.from("profiles").select("id").eq("role", "team"),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskList = (tasks ?? []) as any[];
  const delays = taskList.filter((t) => t.status === "late").length;
  const upcoming = taskList.slice(0, 5);
  const ongoing = taskList.filter((t) => t.status === "in_progress").slice(0, 5);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar tabs={["Overview", "Board", "Timeline", "Reports"]} activeTab="Overview" />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin] [scrollbar-color:rgba(27,63,238,0.15)_transparent]">

        {/* Page header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">
              Good morning 👋
            </h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              Here&apos;s what&apos;s happening across your workspace today.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/clients">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] hover:-translate-y-px transition-all cursor-pointer">
                View Clients
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard icon={Users} iconColor="blue" value={clients?.length ?? 0} label="Active Clients" tag="+1 new" tagVariant="up" />
          <StatCard icon={FolderKanban} iconColor="green" value={projects?.length ?? 0} label="Projects in Progress" tag="Active" tagVariant="info" />
          <StatCard icon={UserCheck} iconColor="gold" value={profiles?.length ?? 0} label="Team Members" tag="Full team" tagVariant="gold" />
          <StatCard icon={AlertCircle} iconColor="red" value={delays} label="Delays" tag={delays > 0 ? "Needs action" : "On track"} tagVariant={delays > 0 ? "warn" : "up"} />
        </div>

        <div className="grid grid-cols-[1fr_330px] gap-3.5">
          {/* Left column */}
          <div className="flex flex-col gap-3.5">
            {/* Goal Banner */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-[18px] py-[15px] border-b border-white/50">
                <span className="text-[14.5px] font-bold text-[#0f172a]">Primary Goal</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 text-[#475569] border border-slate-200/60">
                  {projects?.[0] ? "Active project" : "No active projects"}
                </span>
                <Link href="/projects" className="ml-auto text-[12px] font-semibold text-[#1B3FEE] flex items-center gap-1 hover:underline">
                  View milestones →
                </Link>
              </div>
              {projects?.[0] ? (
                <div className="m-[18px] rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1B3FEE 0%,#7b8ef5 100%)", boxShadow: "0 8px 24px rgba(27,63,238,0.3)" }}>
                  <div className="absolute top-[-30px] right-[-30px] w-[110px] h-[110px] rounded-full bg-white/[0.08]" />
                  <div className="absolute bottom-[-20px] right-[60px] w-[70px] h-[70px] rounded-full bg-white/[0.05]" />
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/75 mb-1">Primary Goal</div>
                  <div className="text-xl font-extrabold text-white mb-1">{(projects[0] as any).name}</div>
                  {(projects[0] as any).target_date && (
                    <div className="text-[12px] text-white/75 mb-4">
                      Target: <strong className="text-white">{formatDate((projects[0] as any).target_date, { month: "short", year: "numeric" })}</strong>
                    </div>
                  )}
                  <div className="bg-white/20 rounded-full h-1.5 mb-2.5">
                    <div className="bg-white rounded-full h-1.5 relative" style={{ width: `${(projects[0] as any).overall_progress ?? 0}%` }}>
                      <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[rgba(27,63,238,0.5)]" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-white tracking-tight">
                    {(projects[0] as any).overall_progress ?? 0}% <span className="text-[13px] font-medium text-white/75">complete</span>
                  </div>
                </div>
              ) : (
                <div className="m-[18px] rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg,#1B3FEE 0%,#7b8ef5 100%)" }}>
                  <p className="text-white/80 text-[13px] mb-3">No active projects yet.</p>
                  <Link href="/clients" className="inline-block px-4 py-2 rounded-[8px] bg-white/20 border border-white/25 text-white text-[12px] font-semibold hover:bg-white/30 transition-colors">
                    Add a Client →
                  </Link>
                </div>
              )}

              {/* Upcoming activities */}
              <div className="flex items-center gap-2.5 px-[18px] py-[15px] border-t border-b border-white/50">
                <span className="text-[14.5px] font-bold text-[#0f172a]">Upcoming Activities</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 text-[#475569] border border-slate-200/60">
                  {upcoming.length} this week
                </span>
                <Link href="/tasks" className="ml-auto text-[12px] font-semibold text-[#1B3FEE] hover:underline">Go to Schedule →</Link>
              </div>
              {upcoming.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-[18px] py-3 border-b border-white/50 last:border-0 hover:bg-white/40 cursor-pointer transition-colors">
                  <div className="min-w-[88px]">
                    <div className="text-[12px] font-semibold text-[#0f172a]">{formatDate(task.due_date, { month: "short", day: "numeric" })}</div>
                    <div className="text-[11px] text-[#94a3b8]">{task.due_date ? formatTime(task.due_date) : "—"}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.status === "in_progress" ? "#1B3FEE" : task.status === "late" ? "#f59f00" : "#10b981" }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[#0f172a]">{task.title}</div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">{task.assignee?.full_name ?? "Unassigned"}</div>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              ))}
            </div>

            {/* Delays / Late tasks */}
            {delays > 0 && (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-[18px] py-[15px] border-b border-white/50">
                  <div className="w-6 h-6 bg-[rgba(239,68,68,0.1)] rounded-[7px] flex items-center justify-center">
                    <Zap className="w-3 h-3 text-[#ef4444]" />
                  </div>
                  <span className="text-[14.5px] font-bold text-[#0f172a]">Needs Attention</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-[#ef4444] border border-red-100">{delays} late</span>
                </div>
                <div className="p-[18px] flex flex-col gap-2">
                  {taskList.filter(t => t.status === "late").slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 px-2.5 py-2 bg-red-50/60 rounded-[8px] border border-red-100/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
                      <span className="text-[12px] text-[#0f172a] flex-1 truncate">{task.title}</span>
                      <span className="text-[11px] text-[#ef4444] font-semibold whitespace-nowrap">
                        {task.due_date ? formatDate(task.due_date, { month: "short", day: "numeric" }) : "Overdue"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3.5">
            {/* Ongoing tasks */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-[18px] py-[15px] border-b border-white/50">
                <span className="text-[14.5px] font-bold text-[#0f172a]">Ongoing Tasks</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 text-[#475569] border border-slate-200/60">{ongoing.length}</span>
              </div>
              {ongoing.length === 0 ? (
                <div className="px-[18px] py-6 text-[13px] text-[#94a3b8] text-center">No tasks in progress</div>
              ) : (
                ongoing.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-[18px] py-2.5 border-b border-white/50 last:border-0 hover:bg-white/40 cursor-pointer transition-colors">
                    <Avatar name={task.assignee?.full_name ?? "?"} color={getAvatarColor(task.assignee?.full_name ?? "A")} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#0f172a] truncate">{task.title}</div>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">{task.assignee?.full_name ?? "Unassigned"}</div>
                    </div>
                    <div className="w-[22px] h-[22px] rounded-full bg-[rgba(27,63,238,0.08)] flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-2.5 h-2.5 text-[#1B3FEE]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
