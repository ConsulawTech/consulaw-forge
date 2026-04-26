import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate, deadlineStatus } from "@/lib/utils";
import Link from "next/link";
import { AddMilestoneButton } from "@/components/projects/AddMilestoneButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteMilestoneAction } from "@/app/actions/projects";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";

function ProgressRing({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(241,245,249,0.95)" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#0f172a]">
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
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-start sm:items-end justify-between mb-5 gap-3">
          <div>
            <h1 className="text-[20px] md:text-[22px] font-extrabold text-[#0f172a] tracking-tight">
              {q ? `Results for "${q}"` : "All Tasks"}
            </h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              {milestones?.length ?? 0} task{milestones?.length !== 1 ? "s" : ""} {q ? "matching your search" : "across all projects"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <AddMilestoneButton projects={(projectsRaw ?? []).map((p: any) => ({ id: p.id, name: p.name }))} label="Add Task" />
          </div>
        </div>

        {/* Task groups */}
        {groups.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(27,63,238,0.06)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-[#0f172a] mb-1">
              {q ? `No tasks matching "${q}"` : "No tasks yet"}
            </p>
            <p className="text-[13px] text-[#94a3b8]">
              {!q ? "Create your first task to get started." : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {groups.map(({ project, milestones: groupMilestones }: { project: any; milestones: any[] }) => (
              <div key={project?.id ?? "unassigned"} className="glass rounded-2xl overflow-hidden">
                {/* Group header */}
                <div className="flex items-center justify-between px-4 md:px-[18px] py-3.5 border-b border-white/50 bg-[rgba(241,245,249,0.5)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {project ? (
                      <div className="text-[13.5px] font-bold text-[#0f172a] truncate">
                        {project.client?.name && <span className="text-[#94a3b8] font-medium">{project.client.name} / </span>}
                        {project.name}
                      </div>
                    ) : (
                      <div className="text-[13.5px] font-bold text-[#0f172a]">Unassigned</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-semibold text-[#475569]">
                      {groupMilestones.length} task{groupMilestones.length !== 1 ? "s" : ""}
                    </span>
                    {project && (
                      <Link
                        href={`/tasks?${new URLSearchParams({ ...(q ? { q } : {}), project: project.id }).toString()}`}
                        className="text-[11px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-2 py-0.5 rounded-full hover:bg-[rgba(27,63,238,0.14)] transition-colors hidden sm:inline"
                      >
                        Filter
                      </Link>
                    )}
                  </div>
                </div>

                {/* Milestones (Tasks) */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {groupMilestones.map((ms: any) => {
                  const dlMs = deadlineStatus(ms.deadline);
                  const doneCount = (ms.tasks ?? []).filter((t: { status: string }) => t.status === "done").length;
                  const totalCount = (ms.tasks ?? []).length;
                  return (
                    <div
                      key={ms.id}
                      className="flex items-center gap-3 px-4 md:px-[18px] py-3 border-b border-white/40 last:border-0 hover:bg-white/40 transition-colors"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: ms.color ?? "#1B3FEE" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[#0f172a] truncate">{ms.title}</div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5 truncate">
                          {doneCount}/{totalCount} checkpoints
                        </div>
                      </div>
                      <div className="hidden sm:block min-w-[80px]">
                        <div className="text-[12px] font-semibold text-[#0f172a]">
                          {formatDate(ms.deadline, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ms.deadline && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            dlMs === "ok" ? "bg-[rgba(16,185,129,0.1)] text-[#10b981]"
                            : dlMs === "warn" ? "bg-[rgba(245,159,0,0.1)] text-[#f59f00]"
                            : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"
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
