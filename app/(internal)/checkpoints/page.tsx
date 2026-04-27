import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate, getAvatarColor } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { TaskStatusSelect } from "@/components/tasks/TaskStatusSelect";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteTaskAction } from "@/app/actions/projects";
import Link from "next/link";
import { User, FolderKanban } from "lucide-react";
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
    supabase.from("projects").select("id, name").order("created_at"),
    supabase.from("profiles").select("id, full_name").eq("role", "team"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectsForModal = (projectsRaw ?? []).map((p: any) => ({ id: p.id, name: p.name }));
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
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-start sm:items-end justify-between mb-4 gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">
              {q ? `Results for "${q}"` : "All Checkpoints"}
            </h1>
            <p className="text-[14px] text-slate-500 mt-1">
              {tasks?.length ?? 0} checkpoint{tasks?.length !== 1 ? "s" : ""} {q ? "matching your search" : "across all tasks"}
            </p>
          </div>
          <NewTaskButton projects={projectsForModal} profiles={profilesForModal} />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 [scrollbar-width:none] flex-shrink-0">
          {STATUS_TABS.map(({ value, label, color }) => {
            const isActive = activeStatus === value;
            return (
              <Link
                key={value}
                href={`/checkpoints?${new URLSearchParams({ ...(q ? { q } : {}), ...(value !== "all" ? { status: value } : {}), ...(projectFilter ? { project: projectFilter } : {}) }).toString()}`}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[13px] font-semibold transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-[#1B3FEE] text-white shadow-md shadow-blue-500/20"
                    : "bg-white/70 border border-slate-200/60 text-slate-600 hover:bg-white hover:border-slate-300"
                }`}
                style={isActive && color ? { background: color, boxShadow: `0 4px 12px ${color}33` } : undefined}
              >
                {label}
              </Link>
            );
          })}

          {projectFilter && (
            <Link
              href={`/checkpoints?${new URLSearchParams({ ...(q ? { q } : {}), ...(status && status !== "all" ? { status } : {}) }).toString()}`}
              className="whitespace-nowrap ml-2 px-3 py-2 rounded-xl text-[12px] font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 flex-shrink-0 transition-colors"
            >
              Clear filter ×
            </Link>
          )}
        </div>

        {/* Checkpoint groups */}
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-[15px] font-semibold text-slate-900 mb-1">
              {q ? `No checkpoints matching "${q}"` : activeStatus !== "all" ? `No ${STATUS_TABS.find(t => t.value === activeStatus)?.label} checkpoints` : "No checkpoints yet"}
            </p>
            <p className="text-[13px] text-slate-500">
              {!q && activeStatus === "all" ? "Create your first checkpoint to get started." : "Try a different filter."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {groups.map(({ milestone, project, checkpoints: groupCheckpoints }: { milestone: any; project: any; checkpoints: any[] }) => {
              const doneCount = groupCheckpoints.filter((t: { status: string }) => t.status === "done").length;
              return (
                <div key={milestone?.id ?? "unassigned"} className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {milestone ? (
                        <>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: project?.client?.logo_color ?? "#1B3FEE" }}
                          >
                            {project?.client?.logo_letter ?? project?.client?.name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] font-bold text-slate-900 truncate">
                              {project?.name} <span className="text-slate-300">·</span> {milestone.title}
                            </div>
                            <div className="text-[12px] text-slate-500">{project?.client?.name}</div>
                          </div>
                        </>
                      ) : (
                        <div className="text-[14px] font-bold text-slate-900">Unassigned Checkpoints</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[12px] font-semibold text-slate-500">
                        {doneCount}/{groupCheckpoints.length} done
                      </span>
                      {project && (
                        <Link
                          href={`/checkpoints?${new URLSearchParams({ ...(status && status !== "all" ? { status } : {}), project: project.id }).toString()}`}
                          className="text-[11px] font-semibold text-[#1B3FEE] bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors hidden sm:inline"
                        >
                          Filter
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Checkpoints */}
                  <div className="divide-y divide-slate-50">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {groupCheckpoints.map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/40 transition-colors"
                      >
                        {/* Date */}
                        <div className="hidden sm:block w-[90px] flex-shrink-0">
                          <div className="text-[12px] font-semibold text-slate-700">
                            {task.due_date ? formatDate(task.due_date, { month: "short", day: "numeric" }) : "—"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                              : "No date"}
                          </div>
                        </div>

                        {/* Assignee */}
                        {task.assignee ? (
                          <Avatar
                            name={task.assignee?.full_name ?? "?"}
                            color={getAvatarColor(task.assignee?.full_name ?? "A")}
                            size="xs"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-slate-400" />
                          </div>
                        )}

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium text-slate-800">{task.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {task.assignee?.full_name ?? "Unassigned"}
                            <span className="sm:hidden">
                              {task.due_date ? ` · ${formatDate(task.due_date, { month: "short", day: "numeric" })}` : ""}
                            </span>
                          </div>
                        </div>

                        <TaskStatusSelect taskId={task.id} status={task.status as TaskStatus} />
                        <DeleteButton
                          entityId={task.id}
                          entityName={task.title}
                          entityType="checkpoint"
                          deleteAction={deleteTaskAction}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
