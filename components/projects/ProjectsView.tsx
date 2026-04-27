"use client";

import { useState } from "react";
import { ProjectSummaryPanel } from "./ProjectSummaryPanel";
import { formatDate, deadlineStatus } from "@/lib/utils";

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

function SidebarItem({
  project,
  isSelected,
  onSelect,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const dlStatus = deadlineStatus(project.target_date);
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl px-3.5 py-3 transition-all duration-200 border ${
        isSelected
          ? "bg-[#1B3FEE]/5 border-[#1B3FEE]/20 shadow-sm"
          : "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
          style={{ background: project.client?.logo_color ?? "#e50914" }}
        >
          {project.client?.logo_letter ?? project.client?.name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`text-[13px] font-bold truncate leading-tight ${
              isSelected ? "text-[#1B3FEE]" : "text-slate-900"
            }`}
          >
            {project.client?.name}
          </div>
          <div className="text-[11.5px] text-slate-500 truncate">{project.name}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={`text-[11px] font-bold ${
              isSelected ? "text-[#1B3FEE]" : "text-slate-600"
            }`}
          >
            {progress}%
          </span>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isSelected ? "#1B3FEE" : "#94a3b8",
          }}
        />
      </div>

      {/* Deadline hint */}
      {project.target_date && (
        <div className="mt-1.5 text-[10px] text-slate-400">
          {dlStatus === "late" ? (
            <span className="text-red-500 font-medium">
              Overdue · {formatDate(project.target_date, { month: "short", day: "numeric" })}
            </span>
          ) : (
            <>Due {formatDate(project.target_date, { month: "short", day: "numeric" })}</>
          )}
        </div>
      )}
    </button>
  );
}

export function ProjectsView({ projects }: { projects: Project[] }) {
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id ?? "");

  const selectedProject = projects.find((p) => p.id === selectedId);

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Sidebar */}
      <div className="w-[300px] flex-shrink-0 flex flex-col">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Projects · {projects.length}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 [scrollbar-width:thin]">
          {projects.map((project) => (
            <SidebarItem
              key={project.id}
              project={project}
              isSelected={selectedId === project.id}
              onSelect={() => setSelectedId(project.id)}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pl-1 [scrollbar-width:thin]">
        {selectedProject ? (
          <ProjectSummaryPanel project={selectedProject} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-slate-900 mb-1">Select a project</p>
              <p className="text-[13px] text-slate-500">Choose a project from the sidebar to view details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
