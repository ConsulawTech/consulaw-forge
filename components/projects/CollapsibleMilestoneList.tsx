"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDate, getAvatarColor, deadlineStatus } from "@/lib/utils";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { deleteMilestoneAction, deleteTaskAction } from "@/app/actions/projects";

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-[38px] h-[38px] flex-shrink-0">
      <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(241,245,249,0.95)" strokeWidth="4" />
        <circle
          cx="19" cy="19" r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#0f172a]">{pct}%</div>
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
      <div className="glass rounded-2xl p-12 text-center text-[#94a3b8] text-sm">
        No tasks yet. Click &quot;Add Task&quot; to get started.
      </div>
    );
  }

  return (
    <>
      {milestones.map((ms) => {
        const dlMs = deadlineStatus(ms.deadline);
        const msDone = (ms.tasks ?? []).filter((t: { status: string }) => t.status === "done").length;
        const msTotal = (ms.tasks ?? []).length;
        const msProgress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;
        const isExpanded = expandedIds.has(ms.id);

        return (
          <div key={ms.id} className="glass rounded-2xl overflow-hidden mb-4">
            {/* Task header — clickable to toggle */}
            <button
              onClick={() => toggle(ms.id)}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-white/50 hover:bg-white/30 transition-colors text-left"
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ms.color ?? "#1B3FEE" }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-[#0f172a]">{ms.title}</div>
                {ms.description && <div className="text-[12px] text-[#475569] mt-0.5">{ms.description}</div>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {ms.deadline && (
                  <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${
                    dlMs === "ok" ? "bg-[rgba(16,185,129,0.1)] text-[#10b981]"
                    : dlMs === "warn" ? "bg-[rgba(245,159,0,0.1)] text-[#f59f00]"
                    : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"
                  }`}>
                    {formatDate(ms.deadline, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                <ProgressRing pct={msProgress} color={ms.color ?? "#1B3FEE"} />
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
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
                )}
              </div>
            </button>

            {/* Checkpoints — only show when expanded */}
            {isExpanded && (
              <>
                {(ms.tasks ?? []).length === 0 ? (
                  <div className="px-5 py-4 text-[12px] text-[#94a3b8]">No checkpoints yet for this task.</div>
                ) : (
                  (ms.tasks ?? []).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-3 border-b border-white/50 last:border-0 hover:bg-white/40 transition-colors group">
                      <div className="min-w-[96px]">
                        <div className="text-[12px] font-semibold text-[#0f172a]">
                          {task.due_date ? formatDate(task.due_date, { month: "short", day: "numeric" }) : "No date"}
                        </div>
                      </div>
                      {task.assignee ? (
                        <Avatar name={task.assignee.full_name} color={getAvatarColor(task.assignee.full_name)} size="xs" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[rgba(148,163,184,0.2)] flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-[#0f172a]">{task.title}</div>
                        <div className="text-[11px] text-[#94a3b8]">{task.assignee?.full_name ?? "Unassigned"}</div>
                      </div>
                      <TaskStatusBadge status={task.status} />
                      <DeleteButton
                        entityId={task.id}
                        entityName={task.title}
                        entityType="checkpoint"
                        deleteAction={deleteTaskAction}
                      />
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
