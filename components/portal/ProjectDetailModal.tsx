"use client";

import { useState } from "react";
import { X, FolderKanban, CheckCircle2, Clock, AlertCircle, Circle, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

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

interface ProjectDetailModalProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    target_date: string | null;
    status: string;
    tasks: Task[];
  };
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  done:        { label: "Done",        color: "#10b981", bg: "rgba(16,185,129,0.1)",   icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "#1B3FEE", bg: "rgba(27,63,238,0.1)",   icon: Clock },
  late:        { label: "Overdue",     color: "#ef4444", bg: "rgba(239,68,68,0.08)",  icon: AlertCircle },
  todo:        { label: "To Do",       color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: Circle },
};

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "checkpoints">("tasks");

  const allCheckpoints = project.tasks.flatMap((t) => t.checkpoints);
  const doneCount = allCheckpoints.filter((c) => c.status === "done").length;
  const progress = allCheckpoints.length > 0 ? Math.round((doneCount / allCheckpoints.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-[640px] max-h-[85vh] flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-[#1B3FEE]" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0f172a]">{project.name}</div>
              {project.target_date && (
                <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due {formatDate(project.target_date, { month: "short", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/50 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[#475569]" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-white/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-[#475569]">Overall Progress</span>
            <span className="text-[12px] font-bold text-[#1B3FEE]">{progress}%</span>
          </div>
          <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-2">
            <div className="h-2 rounded-full bg-[#1B3FEE] transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
              activeTab === "tasks" ? "bg-[#1B3FEE] text-white" : "text-[#475569] hover:bg-white/40"
            }`}
          >
            Tasks ({project.tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("checkpoints")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
              activeTab === "checkpoints" ? "bg-[#1B3FEE] text-white" : "text-[#475569] hover:bg-white/40"
            }`}
          >
            Checkpoints ({allCheckpoints.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
          {activeTab === "tasks" ? (
            <div className="flex flex-col gap-4">
              {project.tasks.map((task) => {
                const taskDone = task.checkpoints.filter((c) => c.status === "done").length;
                const taskProgress = task.checkpoints.length > 0 ? Math.round((taskDone / task.checkpoints.length) * 100) : 0;
                return (
                  <div key={task.id} className="glass rounded-xl p-4 border border-white/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: task.color }} />
                        <span className="text-[13px] font-bold text-[#0f172a]">{task.title}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#475569]">{taskProgress}%</span>
                    </div>
                    <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-1.5 mb-2">
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${taskProgress}%`, background: task.color }} />
                    </div>
                    {task.deadline && (
                      <div className="text-[11px] text-[#94a3b8]">
                        Due {formatDate(task.deadline, { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                  </div>
                );
              })}
              {project.tasks.length === 0 && (
                <p className="text-[13px] text-[#94a3b8] text-center py-8">No tasks set up yet.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allCheckpoints.map((cp) => {
                const cfg = STATUS_CONFIG[cp.status] ?? STATUS_CONFIG.todo;
                const Icon = cfg.icon;
                return (
                  <div key={cp.id} className="flex items-center gap-3 px-4 py-3 glass rounded-xl border border-white/50">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#0f172a] truncate">{cp.title}</div>
                      {cp.assignee && (
                        <div className="text-[11px] text-[#94a3b8] flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {cp.assignee.full_name}
                        </div>
                      )}
                    </div>
                    {cp.due_date && (
                      <div className="text-[11px] text-[#94a3b8] flex-shrink-0">
                        {formatDate(cp.due_date, { month: "short", day: "numeric" })}
                      </div>
                    )}
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              {allCheckpoints.length === 0 && (
                <p className="text-[13px] text-[#94a3b8] text-center py-8">No checkpoints yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/50 flex-shrink-0">
          <Button variant="secondary" size="md" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
