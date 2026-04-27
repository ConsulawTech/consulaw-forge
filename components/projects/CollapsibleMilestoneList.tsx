"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Calendar, User } from "lucide-react";
import { formatDate, getAvatarColor, deadlineStatus } from "@/lib/utils";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { deleteMilestoneAction, deleteTaskAction } from "@/app/actions/projects";

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-[36px] h-[36px] flex-shrink-0">
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">{pct}%</div>
    </div>
  );
}

interface CollapsibleMilestoneListProps {
  milestones: any[];
  projectId: string;
  projectForModal: { id: string; name: string }[];
  profilesForModal: { id: string; full_name: string }[];
}

export function CollapsibleMilestoneList({
  milestones,
  projectId,
  projectForModal,
  profilesForModal,
}: CollapsibleMilestoneListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(milestones.map((m) => m.id))
  );

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-[15px] font-semibold text-slate-900 mb-1">No tasks yet</p>
        <p className="text-[13px] text-slate-500">Click "Add Task" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((ms) => {
        const dlMs = deadlineStatus(ms.deadline);
        const msDone = (ms.tasks ?? []).filter((t: { status: string }) => t.status === "done").length;
        const msTotal = (ms.tasks ?? []).length;
        const msProgress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;
        const isExpanded = expandedIds.has(ms.id);

        return (
          <div
            key={ms.id}
            className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
          >
            {/* Task header */}
            <button
              onClick={() => toggle(ms.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
            >
              {/* Color bar */}
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ background: ms.color ?? "#1B3FEE" }}
              />

              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-slate-900">{ms.title}</div>
                {ms.description && <div className="text-[12px] text-slate-500 mt-0.5">{ms.description}</div>}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {ms.deadline && (
                  <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${
                    dlMs === "ok" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : dlMs === "warn" ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {formatDate(ms.deadline, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                <ProgressRing pct={msProgress} color={ms.color ?? "#1B3FEE"} />
                <div className="flex items-center gap-1">
                  <NewTaskButton
                    projects={projectForModal}
                    profiles={profilesForModal}
                    defaultProjectId={projectId}
                    label="+ Checkpoint"
                    variant="inline"
                  />
                  <DeleteButton
                    entityId={ms.id}
                    entityName={ms.title}
                    entityType="task"
                    deleteAction={deleteMilestoneAction}
                  />
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Checkpoints */}
            {isExpanded && (
              <div className="border-t border-slate-100">
                {(ms.tasks ?? []).length === 0 ? (
                  <div className="px-5 py-5 text-[13px] text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    No checkpoints yet for this task.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {(ms.tasks ?? []).map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/40 transition-colors group"
                      >
                        {/* Date */}
                        <div className="w-[90px] flex-shrink-0">
                          <div className="text-[12px] font-semibold text-slate-700">
                            {task.due_date ? formatDate(task.due_date, { month: "short", day: "numeric" }) : "No date"}
                          </div>
                        </div>

                        {/* Assignee */}
                        {task.assignee ? (
                          <Avatar name={task.assignee.full_name} color={getAvatarColor(task.assignee.full_name)} size="xs" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-slate-400" />
                          </div>
                        )}

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium text-slate-800">{task.title}</div>
                          <div className="text-[11px] text-slate-400">{task.assignee?.full_name ?? "Unassigned"}</div>
                        </div>

                        {/* Status */}
                        <TaskStatusBadge status={task.status} />

                        {/* Delete */}
                        <DeleteButton
                          entityId={task.id}
                          entityName={task.title}
                          entityType="checkpoint"
                          deleteAction={deleteTaskAction}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
