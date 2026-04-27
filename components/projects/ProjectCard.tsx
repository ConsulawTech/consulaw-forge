"use client";

import { useState, useCallback, memo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  FolderKanban,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { SingleProjectReportButton } from "./SingleProjectReportButton";
import { formatDate, deadlineStatus } from "@/lib/utils";
import { deleteProjectAction, updateMilestoneOrderAction } from "@/app/actions/projects";

interface Milestone {
  id: string;
  title: string;
  color: string;
  deadline: string | null;
  tasks: { id: string; title: string; status: string; due_date: string | null }[];
}

interface Project {
  id: string;
  name: string;
  target_date: string | null;
  status: string;
  client?: { name: string; logo_color?: string; logo_letter?: string } | null;
  milestones: Milestone[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  done:        { label: "Done",        color: "#10b981", bg: "rgba(16,185,129,0.1)",   icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "#1B3FEE", bg: "rgba(27,63,238,0.1)",   icon: Circle },
  late:        { label: "Overdue",     color: "#ef4444", bg: "rgba(239,68,68,0.08)",  icon: AlertCircle },
  todo:        { label: "To Do",       color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: Clock },
};

function MilestoneItem({
  ms,
  expanded,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragOverId,
}: {
  ms: Milestone;
  expanded: boolean;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  dragOverId: string | null;
}) {
  const msTotal = ms.tasks.length;
  const msDone = ms.tasks.filter((t) => t.status === "done").length;
  const msProgress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  return (
    <div
      className={`glass rounded-xl border transition-all ${
        dragOverId === ms.id ? "border-[#1B3FEE]/40 shadow-[0_0_0_2px_rgba(27,63,238,0.1)]" : "border-white/40"
      }`}
    >
      {/* Milestone header */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag handle */}
          <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className="cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 rounded hover:bg-white/40"
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5 text-[#94a3b8]" />
          </div>
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ms.color }} />
          <span className="text-[12.5px] font-semibold text-[#0f172a] truncate">{ms.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-[#475569]">{msProgress}%</span>
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded-md hover:bg-white/40 flex items-center justify-center transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8]" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded checkpoint list */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/30">
          <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-1.5 mb-2">
            <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${msProgress}%`, background: ms.color }} />
          </div>
          {ms.deadline && (
            <div className="text-[11px] text-[#94a3b8] mb-2">
              Due {formatDate(ms.deadline, { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}
          <div className="flex flex-col gap-1">
            {ms.tasks.map((task) => {
              const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
              const Icon = cfg.icon;
              return (
                <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                  <span className="text-[12px] text-[#0f172a] flex-1 truncate">{task.title}</span>
                  {task.due_date && (
                    <span className="text-[10px] text-[#94a3b8] flex-shrink-0">
                      {formatDate(task.due_date, { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
            {ms.tasks.length === 0 && (
              <p className="text-[11px] text-[#94a3b8] px-2">No checkpoints yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCardInner({ project, viewMode }: { project: Project; viewMode: "grid" | "list" }) {
  const dlStatus = deadlineStatus(project.target_date);
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const lateTasks = allTasks.filter((t) => t.status === "late").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const [expanded, setExpanded] = useState(false);
  const [milestones] = useState(project.milestones);
  const [collapsedMsIds, setCollapsedMsIds] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState("");

  const isList = viewMode === "list";

  function toggleMs(id: string) {
    setCollapsedMsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);
      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId) return;

      const sourceIndex = milestones.findIndex((m) => m.id === sourceId);
      const targetIndex = milestones.findIndex((m) => m.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;

      // Reorder locally
      const newMilestones = [...milestones];
      const [removed] = newMilestones.splice(sourceIndex, 1);
      newMilestones.splice(targetIndex, 0, removed);

      // Persist to server
      const result = await updateMilestoneOrderAction(
        project.id,
        newMilestones.map((m) => m.id)
      );
      if (!result.success) {
        setReorderError(result.error);
      } else {
        setReorderError("");
      }
    },
    [milestones, project.id]
  );

  const handleDragEnd = useCallback(() => {
    setDragOverId(null);
  }, []);

  return (
    <div
      className={`glass rounded-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all overflow-hidden ${
        isList ? "p-4" : "p-5 flex flex-col"
      }`}
    >
      {/* Header */}
      <div className={`flex items-start gap-3 ${isList ? "" : "mb-3"}`}>
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          style={{ background: project.client?.logo_color ?? "#e50914" }}
        >
          {project.client?.logo_letter ?? project.client?.name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-[#0f172a] truncate leading-tight">
            {project.client?.name}
          </div>
          <div className="text-[12.5px] font-semibold text-[#475569] truncate">{project.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <SingleProjectReportButton
            project={{
              id: project.id,
              name: project.name,
              target_date: project.target_date,
              client: project.client,
              milestones: milestones,
            }}
            variant="icon"
          />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-lg hover:bg-white/50 flex items-center justify-center transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-[#475569]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#475569]" />
            )}
          </button>
          <DeleteButton
            entityId={project.id}
            entityName={project.name}
            entityType="project"
            deleteAction={deleteProjectAction}
          />
        </div>
      </div>

      {/* Progress */}
      <div className={`${isList ? "mt-3" : "mb-3 mt-3"}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-[#475569]">{progress}% complete</span>
          <span
            className={`text-[11px] font-medium ${
              dlStatus === "late" ? "text-[#ef4444]" : dlStatus === "warn" ? "text-[#f59f00]" : "text-[#94a3b8]"
            }`}
          >
            {project.target_date
              ? `Due ${formatDate(project.target_date, { month: "short", day: "numeric" })}`
              : "No deadline"}
          </span>
        </div>
        <div className="h-1.5 bg-[rgba(241,245,249,0.8)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: "#1B3FEE" }} />
        </div>
      </div>

      {/* Task pills */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {doneTasks > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10b981]">
            {doneTasks} done
          </span>
        )}
        {inProgressTasks > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]">
            {inProgressTasks} active
          </span>
        )}
        {lateTasks > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] text-[#ef4444]">
            {lateTasks} late
          </span>
        )}
        {milestones.length > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/80 text-[#94a3b8]">
            {milestones.length} task{milestones.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Expanded inline tasks/checkpoints */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/50 space-y-2">
          {reorderError && (
            <div className="text-[11px] text-red-500 bg-red-50/80 rounded-lg px-3 py-1.5 border border-red-100">
              {reorderError}
            </div>
          )}
          {milestones.length > 0 && (
            <div className="text-[11px] text-[#94a3b8] flex items-center gap-1 mb-1">
              <GripVertical className="w-3 h-3" /> Drag handle to reorder tasks
            </div>
          )}
          {milestones.map((ms) => (
            <MilestoneItem
              key={ms.id}
              ms={ms}
              expanded={!collapsedMsIds.has(ms.id)}
              onToggle={() => toggleMs(ms.id)}
              onDragStart={(e) => handleDragStart(e, ms.id)}
              onDragOver={(e) => handleDragOver(e, ms.id)}
              onDrop={(e) => handleDrop(e, ms.id)}
              onDragEnd={handleDragEnd}
              dragOverId={dragOverId}
            />
          ))}
          {milestones.length === 0 && (
            <p className="text-[13px] text-[#94a3b8] text-center py-4">No tasks set up yet.</p>
          )}

          <Link href={`/projects/${project.id}`}>
            <Button variant="primary" size="sm" className="w-full mt-2">
              <FolderKanban className="w-3.5 h-3.5" /> Open Full Project
            </Button>
          </Link>
        </div>
      )}

      {/* CTA when collapsed */}
      {!expanded && !isList && (
        <Link href={`/projects/${project.id}`} className="mt-auto pt-3">
          <Button variant="primary" size="sm" className="w-full">
            View Project <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}

export const ProjectCard = memo(ProjectCardInner);
