import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { formatDate, getAvatarColor } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";

export default async function TasksPage() {
  const supabase = await createClient();
  const [{ data: tasks }, { data: projectsRaw }, { data: profiles }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, assignee:profiles(*), project:projects(name, client:clients(name))")
      .order("due_date"),
    supabase
      .from("projects")
      .select("id, name, milestones(id, title)")
      .order("created_at"),
    supabase.from("profiles").select("id, full_name").eq("role", "team"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectsForModal = (projectsRaw ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    milestones: (p.milestones ?? []).map((m: any) => ({ id: m.id, title: m.title })),
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesForModal = (profiles ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">All Tasks</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">Across all active projects and clients</p>
          </div>
          <div className="flex gap-2">
            <NewTaskButton projects={projectsForModal} profiles={profilesForModal} />
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-[18px] py-[15px] border-b border-white/50">
            <span className="text-[14.5px] font-bold text-[#0f172a]">Active Tasks</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 text-[#475569] border border-slate-200/60">
              {tasks?.length ?? 0} tasks
            </span>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(tasks ?? []).map((task: any) => (
            <div
              key={task.id}
              className="flex items-center gap-3 px-[18px] py-3 border-b border-white/50 last:border-0 hover:bg-white/40 cursor-pointer transition-colors"
            >
              <div className="min-w-[88px]">
                <div className="text-[12px] font-semibold text-[#0f172a]">
                  {formatDate(task.due_date, { month: "short", day: "numeric" })}
                </div>
                <div className="text-[11px] text-[#94a3b8]">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </div>
              </div>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background:
                    task.status === "in_progress" ? "#1B3FEE"
                    : task.status === "done" ? "#10b981"
                    : task.status === "late" ? "#f59f00"
                    : "#94a3b8",
                }}
              />
              <Avatar
                name={task.assignee?.full_name ?? "?"}
                color={getAvatarColor(task.assignee?.full_name ?? "A")}
                size="xs"
              />
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#0f172a]">{task.title}</div>
                <div className="text-[11px] text-[#94a3b8] mt-0.5">
                  {task.assignee?.full_name ?? "Unassigned"} · {task.project?.name ?? ""}
                  {task.project?.client ? ` · ${(task.project.client as { name: string }).name}` : ""}
                </div>
              </div>
              <TaskStatusBadge status={task.status} />
            </div>
          ))}
          {(!tasks || tasks.length === 0) && (
            <div className="px-[18px] py-8 text-center text-[13px] text-[#94a3b8]">
              No tasks yet. Create a task to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
