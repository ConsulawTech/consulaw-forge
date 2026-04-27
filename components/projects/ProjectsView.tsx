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
