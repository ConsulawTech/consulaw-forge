"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
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

interface Project {
  id: string;
  name: string;
  target_date: string | null;
  status: string;
  client?: { name: string; logo_color?: string; logo_letter?: string } | null;
  milestones: {
    id: string;
    title: string;
    color: string;
    deadline: string | null;
    tasks: { id: string; title: string; status: string; due_date: string | null }[];
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  done:        { label: "Done",        color: "#10b981", bg: "rgba(16,185,129,0.1)",   icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "#1B3FEE", bg: "rgba(27,63,238,0.1)",   icon: Circle },
  late:        { label: "Overdue",     color: "#ef4444", bg: "rgba(239,68,68,0.08)",  icon: AlertCircle },
  todo:        { label: "To Do",       color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: Clock },
};

function MilestoneCard({
  ms,
  expanded,
  onToggle,
  dragOverId,
}: {
  ms: Project["milestones"][0];
  expanded: boolean;
  onToggle: () => void;
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
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/20 transition-colors rounded-xl"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-[#94a3b8] flex-shrink-0" />
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ms.color }} />
          <span className="text-[12.5px] font-semibold text-[#0f172a]">{ms.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#475569]">{msProgress}%</span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8]" />
          )}
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

function ProjectCard({
  project,
  viewMode,
}: {
  project: Project;
  viewMode: "grid" | "list";
}) {
  const dlStatus = deadlineStatus(project.target_date);
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const lateTasks = allTasks.filter((t) => t.status === "late").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  // Each card manages its own expand state independently
  const [expanded, setExpanded] = useState(false);
  const [milestones, setMilestones] = useState(project.milestones);
  const [collapsedMsIds, setCollapsedMsIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState("");

  // Sync milestones with prop changes (e.g. after server revalidation)
  useEffect(() => {
    setMilestones(project.milestones);
  }, [project.milestones]);

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
      setDragOverId(null);
      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId) {
        setDraggingId(null);
        return;
      }

      const sourceIndex = milestones.findIndex((m) => m.id === sourceId);
      const targetIndex = milestones.findIndex((m) => m.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        setDraggingId(null);
        return;
      }

      // Reorder locally
      const newMilestones = [...milestones];
      const [removed] = newMilestones.splice(sourceIndex, 1);
      newMilestones.splice(targetIndex, 0, removed);
      setMilestones(newMilestones);
      setDraggingId(null);

      // Persist to server
      const result = await updateMilestoneOrderAction(
        project.id,
        newMilestones.map((m) => m.id)
      );
      if (!result.success) {
        setReorderError(result.error);
        setMilestones(project.milestones);
      } else {
        setReorderError("");
      }
    },
    [milestones, project.id, project.milestones]
  );

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
              <GripVertical className="w-3 h-3" /> Drag to reorder tasks
            </div>
          )}
          {milestones.map((ms) => (
            <div
              key={ms.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ms.id)}
              onDragOver={(e) => handleDragOver(e, ms.id)}
              onDrop={(e) => handleDrop(e, ms.id)}
              onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
            >
              <MilestoneCard
                ms={ms}
                expanded={!collapsedMsIds.has(ms.id)}
                onToggle={() => toggleMs(ms.id)}
                dragOverId={dragOverId}
              />
            </div>
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

export function ProjectsView({ projects }: { projects: Project[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setViewMode("grid")}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            viewMode === "grid" ? "bg-[#1B3FEE] text-white" : "text-[#475569] hover:bg-white/50"
          }`}
          title="Grid view"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            viewMode === "list" ? "bg-[#1B3FEE] text-white" : "text-[#475569] hover:bg-white/50"
          }`}
          title="List view"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {projects.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#1B3FEE]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#0f172a] mb-1">No projects yet</p>
          <p className="text-[13px] text-[#94a3b8]">Add a client and create a project to get started.</p>
        </div>
      )}
    </>
  );
}
