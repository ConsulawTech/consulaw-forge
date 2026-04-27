"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { ProjectCard } from "./ProjectCard";

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

export function ProjectsView({ projects }: { projects: Project[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center gap-1 mb-5">
        <button
          onClick={() => setViewMode("grid")}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            viewMode === "grid"
              ? "bg-[#1B3FEE] text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          }`}
          title="Grid view"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            viewMode === "list"
              ? "bg-[#1B3FEE] text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          }`}
          title="List view"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {projects.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "flex flex-col gap-4"}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-900 mb-1">No projects yet</p>
          <p className="text-[13px] text-slate-500">Add a client and create a project to get started.</p>
        </div>
      )}
    </>
  );
}
