"use client";

import { useState, useRef } from "react";
import { X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createTaskAction } from "@/app/actions/projects";

interface Project { id: string; name: string }
interface Profile { id: string; full_name: string }
interface MilestoneOption { id: string; title: string; projectId: string }

interface NewTaskModalProps {
  projects: Project[];
  profiles: Profile[];
  milestones?: MilestoneOption[];
  defaultProjectId?: string;
  onClose: () => void;
}

export function NewTaskModal({ projects, profiles, milestones, defaultProjectId, onClose }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  const projectMilestones = milestones?.filter((m) => m.projectId === selectedProject) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");
    try {
      await createTaskAction(new FormData(formRef.current));
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-[440px] mx-4 flex flex-col max-h-[90vh] shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 flex-shrink-0">
          <span className="text-[15px] font-bold text-[#0f172a]">New Checkpoint</span>
          <button onClick={onClose} className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 cursor-pointer transition-colors">
            <X className="w-3.5 h-3.5 text-[#475569]" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">{error}</div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[#0f172a]">Checkpoint Title</label>
            <input
              name="title" type="text" required placeholder="e.g. Design landing page"
              className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[#0f172a]">Project</label>
            <select
              name="project_id"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 text-[#0f172a]"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {milestones && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#0f172a]">
                Task <span className="font-normal text-[#94a3b8]">(optional)</span>
              </label>
              <select
                name="milestone_id"
                className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 text-[#0f172a]"
              >
                <option value="">— No task —</option>
                {projectMilestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#0f172a]">Assignee</label>
              <select
                name="assignee_id"
                className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 text-[#0f172a]"
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#0f172a]">Status</label>
              <select
                name="status" defaultValue="todo"
                className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 text-[#0f172a]"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[#0f172a]">Due Date <span className="font-normal text-[#94a3b8]">(optional)</span></label>
            <input
              name="due_date" type="datetime-local"
              className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 text-[#0f172a]"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={loading}>
              <CheckSquare className="w-3.5 h-3.5" />
              {loading ? "Creating…" : "Create Checkpoint"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
