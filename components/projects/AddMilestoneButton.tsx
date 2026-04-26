"use client";

import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createMilestoneAction } from "@/app/actions/projects";

interface Project { id: string; name: string }

interface AddMilestoneButtonProps {
  projects: Project[];
  defaultProjectId?: string;
  label?: string;
}

export function AddMilestoneButton({ projects, defaultProjectId, label = "Add Task" }: AddMilestoneButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");
    try {
      await createMilestoneAction(new FormData(formRef.current));
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" /> {label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass rounded-2xl w-full max-w-[400px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/50">
              <span className="text-[15px] font-bold text-[#0f172a]">{label}</span>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5 text-[#475569]" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">{error}</div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#0f172a]">Project</label>
                <select
                  name="project_id" defaultValue={defaultProjectId ?? projects[0]?.id}
                  className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 text-[#0f172a]"
                >
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#0f172a]">Task Title</label>
                <input
                  name="title" type="text" required placeholder="e.g. UI/UX Design"
                  className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#0f172a]">Description <span className="font-normal text-[#94a3b8]">(optional)</span></label>
                <textarea
                  name="description" rows={2} placeholder="Brief description of this task"
                  className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#0f172a]">Deadline <span className="font-normal text-[#94a3b8]">(optional)</span></label>
                <input
                  name="deadline" type="date"
                  className="w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 text-[#0f172a]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={loading}>
                  {loading ? "Adding…" : label}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
