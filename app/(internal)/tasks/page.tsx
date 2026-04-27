import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate, deadlineStatus } from "@/lib/utils";
import Link from "next/link";
import { AddMilestoneButton } from "@/components/projects/AddMilestoneButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteMilestoneAction } from "@/app/actions/projects";
import { CheckCircle2, Circle, AlertCircle, Clock, FolderKanban } from "lucide-react";

function ProgressRing({ pct, color, size = 40 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">
        {pct}%
      </div>
    </div>
  );
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ q?: string; project?: string }> }) {
  const { q, project: projectFilter } = await searchParams;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("milestones")
    .select("*, project:projects(id, name, client:clients(name)), tasks(id, status)")
    .order("order_index");

  if (q) query = query.ilike("title", `%${q}%`);
  if (projectFilter) query = query.eq("project_id", projectFilter);

  const [{ data: milestones }, { data: projectsRaw }] = await Promise.all([
    query,
    supabase.from("projects").select("id, name").order("created_at"),
  ]);

  // Group by project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: Record<string, { project: any; milestones: any[] }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ms of (milestones ?? []) as any[]) {
    const pid = ms.project?.id ?? "unassigned";
    if (!grouped[pid]) grouped[pid] = { project: ms.project, milestones: [] };
    grouped[pid].milestones.push(ms);
  }
  const groups = Object.values(grouped);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">
              {q ? `Results for "${q}"` : "All Tasks"}
            </h1>
            <p className="text-[14px] text-slate-500 mt-1">
              {milestones?.length ?? 0} task{milestones?.length !== 1 ? "s" : ""} {q ? "matching your search" : "across all projects"}
            </p>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AddMilestoneButton projects={(projectsRaw ?? []).map((p: any) => ({ id: p.id, name: p.name }))} label="Add Task" />
        </div>

        {/* Task groups */}
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-[15px] font-semibold text-slate-900 mb-1">
              {q ? `No tasks matching "${q}"` : "No tasks yet"}
            </p>
            <p className="text-[13px] text-slate-500">
              {!q ? "Create your first task to get started." : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {groups.map(({ project, milestones: groupMilestones }: { project: any; milestones: any[] }) => (
              <div key={project?.id ?? "unassigned"} className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
                {/* Group header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {project ? (
                      <>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: project.client?.logo_color ?? "#1B3FEE" }}
                        >
                          {project.client?.logo_letter ?? project.client?.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-bold text-slate-900 truncate">
                            {project.name}
                          </div>
                          <div className="text-[12px] text-slate-500">{project.client?.name}</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-[14px] font-bold text-slate-900">Unassigned</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[12px] font-semibold text-slate-500">
                      {groupMilestones.length} task{groupMilestones.length !== 1 ? "s" : ""}
                    </span>
                    {project && (
                      <Link
                        href={`/tasks?${new URLSearchParams({ ...(q ? { q } : {}), project: project.id }).toString()}`}
                        className="text-[11px] font-semibold text-[#1B3FEE] bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors hidden sm:inline"
                      >
                        Filter
                      </Link>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {groupMilestones.map((ms: any) => {
                  const dlMs = deadlineStatus(ms.deadline);
                  const doneCount = (ms.tasks ?? []).filter((t: { status: string }) => t.status === "done").length;
                  const totalCount = (ms.tasks ?? []).length;
                  return (
                    <div
                      key={ms.id}
                      className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: ms.color ?? "#1B3FEE" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-slate-800">{ms.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {doneCount}/{totalCount} checkpoints
                        </div>
                      </div>
                      <div className="hidden sm:block text-[12px] font-medium text-slate-600 w-[80px]">
                        {formatDate(ms.deadline, { month: "short", day: "numeric" })}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ms.deadline && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            dlMs === "ok" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : dlMs === "warn" ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-red-50 text-red-600 border border-red-100"
                          }`}>
                            {dlMs === "late" ? "Overdue" : formatDate(ms.deadline, { month: "short", day: "numeric" })}
                          </span>
                        )}
                        <ProgressRing pct={totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0} color={ms.color ?? "#1B3FEE"} size={36} />
                        <DeleteButton
                          entityId={ms.id}
                          entityName={ms.title}
                          entityType="task"
                          deleteAction={deleteMilestoneAction}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
