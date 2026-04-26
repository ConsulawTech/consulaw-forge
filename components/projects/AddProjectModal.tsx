"use client";

import { useState, useRef } from "react";
import { X, FolderKanban, Check, Loader2, Sparkles } from "lucide-react";
import { createProjectAction } from "@/app/actions/projects";
import { AiTaskGeneratorModal } from "./AiTaskGeneratorModal";

interface Client {
  id: string;
  name: string;
}

interface TeamProfile {
  id: string;
  full_name: string;
  job_title: string | null;
}

interface AddProjectModalProps {
  clients: Client[];
  preselectedClientId?: string;
  teamProfiles: TeamProfile[];
  onClose: () => void;
  onDone: () => void;
}

export function AddProjectModal({ clients, preselectedClientId, teamProfiles, onClose, onDone }: AddProjectModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");
    const formData = new FormData(formRef.current);
    const result = await createProjectAction(formData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      const name = (formData.get("name") as string)?.trim() ?? "";
      const desc = (formData.get("description") as string)?.trim() ?? null;
      setProjectName(name);
      setProjectDescription(desc ?? "");
      setCreatedProjectId(result.projectId);
      setStep("success");
    }
  }

  const inputCls =
    "w-full bg-white/70 border border-white/60 rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 transition-all";
  const labelCls = "block text-[12px] font-semibold text-[#475569] mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-[480px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5 text-[#1B3FEE]" />
            </div>
            <span className="text-[15px] font-bold text-[#0f172a]">
              {step === "form" ? "New Project" : "Project Created"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-[#475569]" />
          </button>
        </div>

        {step === "form" ? (
          <form ref={formRef} onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {error && (
              <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className={labelCls}>Client</label>
              <select
                name="client_id"
                required
                defaultValue={preselectedClientId ?? ""}
                className={inputCls}
              >
                <option value="" disabled>Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Project Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Brand Refresh, Website Redesign"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Description <span className="font-normal text-[#94a3b8]">(optional)</span></label>
              <textarea
                name="description"
                rows={2}
                placeholder="Brief overview of what this project covers"
                className={inputCls + " resize-none"}
              />
            </div>

            <div>
              <label className={labelCls}>Target Date <span className="font-normal text-[#94a3b8]">(optional)</span></label>
              <input
                name="target_date"
                type="date"
                className={inputCls}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-[10px] bg-white/65 border border-white/60 text-[13px] font-semibold text-[#475569] hover:bg-white/85 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] disabled:opacity-60 transition-colors shadow-[0_2px_8px_rgba(27,63,238,0.25)] flex items-center justify-center gap-1.5"
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</> : "Create Project"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
              <Check className="w-7 h-7 text-[#10b981]" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0f172a]">Project created</div>
              <div className="text-[13px] text-[#475569] mt-1">
                Use AI to generate tasks and checkpoints, or add them manually.
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setShowAiModal(true)}
                className="w-full py-2.5 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] transition-colors shadow-[0_2px_8px_rgba(27,63,238,0.25)] flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate with AI
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-[10px] bg-white/65 border border-white/60 text-[13px] font-semibold text-[#475569] hover:bg-white/85 cursor-pointer transition-colors"
              >
                Add Manually
              </button>
            </div>
          </div>
        )}
      </div>

      {showAiModal && createdProjectId && (
        <AiTaskGeneratorModal
          projectId={createdProjectId}
          projectName={projectName}
          projectDescription={projectDescription}
          teamProfiles={teamProfiles}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </div>
  );
}
