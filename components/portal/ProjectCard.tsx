"use client";

import { useState } from "react";
import { FolderKanban, Activity, CheckSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ProjectDetailModal } from "./ProjectDetailModal";

interface Checkpoint {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assignee?: { full_name: string; avatar_color?: string } | null;
}

interface Task {
  id: string;
  title: string;
  color: string;
  deadline: string | null;
  checkpoints: Checkpoint[];
}

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    target_date: string | null;
    status: string;
    tasks: Task[];
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const allCheckpoints = project.tasks.flatMap((t) => t.checkpoints);
  const doneCount = allCheckpoints.filter((c) => c.status === "done").length;
  const donePct = allCheckpoints.length > 0 ? Math.round((doneCount / allCheckpoints.length) * 100) : 0;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="glass rounded-2xl p-5 border border-white/50 cursor-pointer hover:shadow-lg hover:border-[#1B3FEE]/20 transition-all group"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-[10px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center group-hover:bg-[rgba(27,63,238,0.15)] transition-colors">
            <FolderKanban className="w-4 h-4 text-[#1B3FEE]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-[#0f172a] truncate">{project.name}</div>
            {project.target_date && (
              <div className="text-[11px] text-[#94a3b8]">
                Due {formatDate(project.target_date, { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
          <span className="text-[12px] font-bold text-[#1B3FEE]">{donePct}%</span>
        </div>

        {/* Progress */}
        <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-2 mb-4">
          <div className="h-2 rounded-full bg-[#1B3FEE] transition-all duration-700" style={{ width: `${donePct}%` }} />
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span className="text-[11px] text-[#475569]">{project.tasks.length} tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span className="text-[11px] text-[#475569]">{allCheckpoints.length} checkpoints</span>
          </div>
        </div>
      </div>

      {modalOpen && <ProjectDetailModal project={project} onClose={() => setModalOpen(false)} />}
    </>
  );
}
