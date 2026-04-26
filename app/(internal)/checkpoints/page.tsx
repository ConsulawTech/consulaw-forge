import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate, getAvatarColor } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { TaskStatusSelect } from "@/components/tasks/TaskStatusSelect";
import Link from "next/link";
import type { TaskStatus } from "@/lib/types";

const STATUS_TABS: { value: string; label: string; color?: string }[] = [
  { value: "all",         label: "All" },
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress", color: "#1B3FEE" },
  { value: "done",        label: "Done",        color: "#10b981" },
  { value: "late",        label: "Late",        color: "#f59f00" },
];

export default async function CheckpointsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; project?: string }> }) {
  const { q, status, project: projectFilter } = await searchParams;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("tasks")
    .select("*, assignee:profiles(*), milestone:milestones(id, title, project_id), project:projects(id, name, client:clients(name))")
    .order("due_date");

  if (q)             query = query.ilike("title", `%${q}%`);
  if (status && status !== "all") query = query.eq("status", status);
  if (projectFilter) query = query.eq("project_id", projectFilter);

  const [{ data: tasks }, { data: projectsRaw }, { data: profiles }] = await Promise.all([
    query,
    supabase.from("projects").select("id, name, milestones(id, title)").order("created_at"),
    supabase.from("profiles").select("id, full_name").eq("role", "team"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectsForModal = (projectsRaw ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    milestones: (p.milestones ?? []).map((m: any) => ({ id: m.id, title: m.title })),
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesForModal = (profiles ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name }));

  // Group checkpoints by milestone (task)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: Record<string, { milestone: any; project: any; checkpoints: any[] }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const task of (tasks ?? []) as any[]) {
    const msId = task.milestone?.id ?? "unassigned";
    if (!grouped[msId]) {
      grouped[msId] = {
        milestone: task.milestone,
        project: task.project,
        checkpoints: [],
      };
    }
    grouped[msId].checkpoints.push(task);
  }
  const groups = Object.values(grouped);

  const activeStatus = status ?? "all";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-start sm:items-end justify-between mb-4 gap-3">
          <div>
            <h1 className="text-[20px] md:text-[22px] font-extrabold text-[#0f172a] tracking-tight">
              {q ? `Results for "${q}"` : "All Checkpoints"}
            </h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              {tasks?.length ?? 0} checkpoint{tasks?.length !== 1 ? "s" : ""} {q ? "matching your search" : "across all tasks"}
            </p>
          </div>
          <NewTaskButton projects={projectsForModal} profiles={profilesForModal} />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1 [scrollbar-width:none] flex-shrink-0">
          {STATUS_TABS.map(({ value, label, color }) => {
            const isActive = activeStatus === value;
            return (
              <Link
                key={value}
                href={`/checkpoints?${new URLSearchParams({ ...(q ? { q } : {}), ...(value !== "all" ? { status: value } : {}), ...(projectFilter ? { project: projectFilter } : {}) }).toString()}`}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)]"
                    : "bg-white/60 border border-white/60 text-[#475569] hover:bg-white/85"
                }`}
                style={isActive && color ? { background: color, boxShadow: `0 2px 8px ${color}44` } : undefined}
              >
                {label}
              </Link>
            );
          })}

          {projectFilter && (
            <Link
              href={`/checkpoints?${new URLSearchParams({ ...(q ? { q } : {}), ...(status && status !== "all" ? { status } : {}) }).toString()}`}
              className="whitespace-nowrap ml-2 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[rgba(239,68,68,0.08)] text-[#ef4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.12)] flex-shrink-0"
            >
              Clear project filter ×
            </Link>
          )}
        </div>

        {/* Checkpoint groups */}
        {groups.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(27,63,238,0.06)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-[#0f172a] mb-1">
              {q ? `No checkpoints matching "${q}"` : activeStatus !== "all" ? `No ${STATUS_TABS.find(t => t.value === activeStatus)?.label} checkpoints` : "No checkpoints yet"}
            </p>
            <p className="text-[13px] text-[#94a3b8]">
              {!q && activeStatus === "all" ? "Create your first checkpoint to get started." : "Try a different filter."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {groups.map(({ milestone, project, checkpoints: groupCheckpoints }: { milestone: any; project: any; checkpoints: any[] }) => {
              const doneCount = groupCheckpoints.filter((t: { status: string }) => t.status === "done").length;
              return (
                <div key={milestone?.id ?? "unassigned"} className="glass rounded-2xl overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center justify-between px-4 md:px-[18px] py-3.5 border-b border-white/50 bg-[rgba(241,245,249,0.5)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {milestone ? (
                        <>
                          <div className="text-[13.5px] font-bold text-[#0f172a] truncate">
                            {project?.client?.name && <span className="text-[#94a3b8] font-medium">{project.client.name} / </span>}
                            {project?.name} — {milestone.title}
                          </div>
                        </>
                      ) : (
                        <div className="text-[13.5px] font-bold text-[#0f172a]">Unassigned Checkpoints</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-[#475569]">
                        {doneCount}/{groupCheckpoints.length} done
                      </span>
                      {project && (
                        <Link
                          href={`/checkpoints?${new URLSearchParams({ ...(status && status !== "all" ? { status } : {}), project: project.id }).toString()}`}
                          className="text-[11px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-2 py-0.5 rounded-full hover:bg-[rgba(27,63,238,0.14)] transition-colors hidden sm:inline"
                        >
                          Filter
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Checkpoints */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {groupCheckpoints.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-4 md:px-[18px] py-3 border-b border-white/40 last:border-0 hover:bg-white/40 transition-colors"
                    >
                      {/* Date — hidden on xs */}
                      <div className="hidden sm:block min-w-[80px]">
                        <div className="text-[12px] font-semibold text-[#0f172a]">
                          {formatDate(task.due_date, { month: "short", day: "numeric" })}
                        </div>
                        <div className="text-[11px] text-[#94a3b8]">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </div>
                      </div>

                      <Avatar
                        name={task.assignee?.full_name ?? "?"}
                        color={getAvatarColor(task.assignee?.full_name ?? "A")}
                        size="xs"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[#0f172a] truncate">{task.title}</div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5 truncate">
                          {task.assignee?.full_name ?? "Unassigned"}
                          <span className="sm:hidden">
                            {task.due_date ? ` · ${formatDate(task.due_date, { month: "short", day: "numeric" })}` : ""}
                          </span>
                        </div>
                      </div>

                      <TaskStatusSelect taskId={task.id} status={task.status as TaskStatus} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
