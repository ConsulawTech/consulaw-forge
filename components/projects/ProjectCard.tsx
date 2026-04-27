"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { SingleProjectReportButton } from "./SingleProjectReportButton";
import { formatDate, deadlineStatus } from "@/lib/utils";
import { deleteProjectAction } from "@/app/actions/projects";

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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  done:        { label: "Done",        color: "#10b981" },
  in_progress: { label: "In Progress", color: "#1B3FEE" },
  late:        { label: "Overdue",     color: "#ef4444" },
  todo:        { label: "To Do",       color: "#94a3b8" },
};

export function ProjectCard({ project, viewMode }: { project: Project; viewMode: "grid" | "list" }) {
  const cardId = useRef(`card-${project.id}-${Math.random().toString(36).slice(2, 8)}`);
  const [expanded, setExpanded] = useState(false);

  const dlStatus = deadlineStatus(project.target_date);
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const lateTasks = allTasks.filter((t) => t.status === "late").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const isList = viewMode === "list";

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div
      data-card-id={cardId.current}
      className={`rounded-2xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
        isList ? "p-5" : "p-5 flex flex-col"
      }`}
    >
      {/* Header */}
      <div className={`flex items-start gap-3.5 ${isList ? "" : "mb-3"}`}>
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
            onClick={handleToggle}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
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

      {/* Expanded — SUMMARY ONLY (no drag handles, no color bars, no checkpoint details) */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {project.milestones.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-4">No tasks set up yet.</p>
          ) : (
            <div className="space-y-2">
              {project.milestones.map((ms) => {
                const msTotal = ms.tasks.length;
                const msDone = ms.tasks.filter((t) => t.status === "done").length;
                const msProgress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;
                return (
                  <div
                    key={ms.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-slate-700 truncate">{ms.title}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${msProgress}%`, background: ms.color }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 w-7 text-right">{msProgress}%</span>
                      <span className="text-[10px] text-slate-400">
                        {msDone}/{msTotal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link href={`/projects/${project.id}`}>
            <Button variant="primary" size="sm" className="w-full mt-3">
              <FolderKanban className="w-3.5 h-3.5" /> Open Full Project
            </Button>
          </Link>
        </div>
      )}

      {/* CTA when collapsed */}
      {!expanded && !isList && (
        <Link href={`/projects/${project.id}`} className="mt-auto pt-4">
          <Button variant="primary" size="sm" className="w-full">
            View Project <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}
