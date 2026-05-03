"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, User, FolderKanban } from "lucide-react";
import { formatDate, deadlineStatus, getAvatarColor } from "@/lib/utils";
import { TaskStatusSelect } from "@/components/tasks/TaskStatusSelect";
import { Avatar } from "@/components/ui/Avatar";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteMilestoneAction } from "@/app/actions/projects";
import type { TaskStatus } from "@/lib/types";
import Link from "next/link";

function ProgressRing({ pct, color, size = 36 }: { pct: number; color: string; size?: number }) {
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

interface TasksPageViewProps {
  groups: { project: any; milestones: any[] }[];
  q?: string;
}

export function TasksPageView({ groups, q }: TasksPageViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (groups.length === 0) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ project, milestones: groupMilestones }: { project: any; milestones: any[] }) => (
        <div
          key={project?.id ?? "unassigned"}
          className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
        >
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
                    <div className="text-[14px] font-bold text-slate-900 truncate">{project.name}</div>
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
                  href={`/projects/${project.id}`}
                  className="text-[11px] font-semibold text-[#1B3FEE] bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors hidden sm:inline"
                >
                  Open project →
                </Link>
              )}
            </div>
          </div>

          {/* Milestones */}
          {groupMilestones.map((ms: any) => {
            const dlMs = deadlineStatus(ms.deadline);
            const doneCount = (ms.tasks ?? []).filter((t: { status: string }) => t.status === "done").length;
            const totalCount = (ms.tasks ?? []).length;
            const isExpanded = expandedIds.has(ms.id);

            return (
              <div key={ms.id}>
                {/* Milestone row */}
                <div
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors cursor-pointer"
                  onClick={() => toggle(ms.id)}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: ms.color ?? "#1B3FEE" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-slate-800">{ms.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {doneCount}/{totalCount} checkpoints done
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ms.deadline && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline ${
                        dlMs === "ok" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : dlMs === "warn" ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                      }`}>
                        {dlMs === "late" ? "Overdue" : formatDate(ms.deadline, { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <ProgressRing
                      pct={totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}
                      color={ms.color ?? "#1B3FEE"}
                      size={34}
                    />
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeleteButton
                        entityId={ms.id}
                        entityName={ms.title}
                        entityType="task"
                        deleteAction={deleteMilestoneAction}
                      />
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Checkpoints */}
                {isExpanded && (
                  <div className="bg-slate-50/30 border-b border-slate-50 last:border-0">
                    {totalCount === 0 ? (
                      <div className="px-8 py-3 text-[12px] text-slate-400">
                        No checkpoints yet.
                      </div>
                    ) : (
                      (ms.tasks ?? []).map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-4 px-8 py-2.5 border-t border-slate-100/60 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="w-[80px] flex-shrink-0 text-[11.5px] font-medium text-slate-500">
                            {task.due_date ? formatDate(task.due_date, { month: "short", day: "numeric" }) : "—"}
                          </div>
                          {task.assignee ? (
                            <Avatar
                              name={task.assignee.full_name}
                              color={getAvatarColor(task.assignee.full_name)}
                              size="xs"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                              <User className="w-2.5 h-2.5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-slate-800 truncate">{task.title}</div>
                            {task.assignee && (
                              <div className="text-[11px] text-slate-400">{task.assignee.full_name}</div>
                            )}
                          </div>
                          <TaskStatusSelect taskId={task.id} status={task.status as TaskStatus} />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
