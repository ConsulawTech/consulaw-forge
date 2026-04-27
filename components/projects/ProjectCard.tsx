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
  FileText,
  Trash2,
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
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  ms: Milestone;
  expanded: boolean;
  onToggle: () => void;
  dragOverId: string | null;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) {
  const msTotal = ms.tasks.length;
  const msDone = ms.tasks.filter((t) => t.status === "done").length;
  const msProgress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;
  const isDragOver = dragOverId === ms.id;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative rounded-xl border transition-all duration-200 ${
        isDragOver
          ? "border-[#1B3FEE]/50 shadow-[0_0_0_3px_rgba(27,63,238,0.08)] bg-[rgba(27,63,238,0.03)]"
          : "border-slate-200/60 bg-white/50 hover:bg-white/70"
      }`}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: ms.color }}
      />

      {/* Header row */}
      <div className="flex items-center gap-3 pl-4 pr-3 py-3">
        {/* Drag handle */}
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-slate-100/80 transition-colors flex-shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 truncate">{ms.title}</div>
          {ms.deadline && (
            <div className="text-[11px] text-slate-500 mt-0.5">
              Due {formatDate(ms.deadline, { month: "short", day: "numeric" })}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 w-[80px]">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${msProgress}%`, background: ms.color }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{msProgress}%</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded checkpoints */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100/60">
          <div className="flex flex-col gap-0.5">
            {ms.tasks.map((task) => {
              const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
              const Icon = cfg.icon;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                  <span className="text-[12.5px] text-slate-800 flex-1 truncate">{task.title}</span>
                  {task.due_date && (
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {formatDate(task.due_date, { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })}
            {ms.tasks.length === 0 && (
              <p className="text-[12px] text-slate-400 px-2 py-1">No checkpoints yet.</p>
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
  const [collapsedMsIds, setCollapsedMsIds] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    // Add drag image opacity via class on the handle
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggingId(null);
    setDragOverId(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== draggingId) {
      setDragOverId(id);
    }
  }, [draggingId]);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);
      setDraggingId(null);

      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId) return;

      const milestones = project.milestones;
      const sourceIndex = milestones.findIndex((m) => m.id === sourceId);
      const targetIndex = milestones.findIndex((m) => m.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;

      // Persist to server (visual reorder happens on next data fetch)
      const newOrder = [...milestones];
      const [removed] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, removed);

      const result = await updateMilestoneOrderAction(
        project.id,
        newOrder.map((m) => m.id)
      );
      if (!result.success) {
        setReorderError(result.error);
      } else {
        setReorderError("");
      }
    },
    [project.id, project.milestones]
  );

  return (
    <div
      className={`rounded-2xl border border-slate-200/50 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
        isList ? "p-5" : "p-5 flex flex-col"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-sm"
          style={{ background: project.client?.logo_color ?? "#e50914" }}
        >
          {project.client?.logo_letter ?? project.client?.name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-slate-900 truncate leading-tight">
            {project.client?.name}
          </div>
          <div className="text-[13px] font-medium text-slate-500 truncate">{project.name}</div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <SingleProjectReportButton
            project={{
              id: project.id,
              name: project.name,
              target_date: project.target_date,
              client: project.client,
              milestones: project.milestones,
            }}
            variant="icon"
          />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100/80 flex items-center justify-center transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
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
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-slate-600">{progress}% complete</span>
          <span
            className={`text-[12px] font-medium ${
              dlStatus === "late" ? "text-red-500" : dlStatus === "warn" ? "text-amber-500" : "text-slate-400"
            }`}
          >
            {project.target_date
              ? `Due ${formatDate(project.target_date, { month: "short", day: "numeric" })}`
              : "No deadline"}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: "#1B3FEE" }}
          />
        </div>
      </div>

      {/* Task pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {doneTasks > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            {doneTasks} done
          </span>
        )}
        {inProgressTasks > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {inProgressTasks} active
          </span>
        )}
        {lateTasks > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
            {lateTasks} late
          </span>
        )}
        {project.milestones.length > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
            {project.milestones.length} task{project.milestones.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Expanded milestones */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
          {reorderError && (
            <div className="text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {reorderError}
            </div>
          )}

          {project.milestones.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
              <GripVertical className="w-3 h-3" />
              Drag the grip icon to reorder tasks
            </div>
          )}

          {project.milestones.map((ms) => (
            <MilestoneItem
              key={ms.id}
              ms={ms}
              expanded={!collapsedMsIds.has(ms.id)}
              onToggle={() => toggleMs(ms.id)}
              dragOverId={dragOverId}
              onDragStart={(e) => handleDragStart(e, ms.id)}
              onDragOver={(e) => handleDragOver(e, ms.id)}
              onDrop={(e) => handleDrop(e, ms.id)}
              onDragEnd={handleDragEnd}
            />
          ))}

          {project.milestones.length === 0 && (
            <p className="text-[13px] text-slate-400 text-center py-6">No tasks set up yet.</p>
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
        <Link href={`/projects/${project.id}`} className="mt-auto pt-4">
          <Button variant="primary" size="sm" className="w-full">
            View Project <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}

export const ProjectCard = memo(ProjectCardInner);
