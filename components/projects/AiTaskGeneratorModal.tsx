"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Loader2, Check, Trash2, Plus, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { generateProjectTasksAction, type AiTaskSuggestion } from "@/app/actions/ai";
import { bulkCreateProjectTasksAction } from "@/app/actions/projects";

interface TeamProfile {
  id: string;
  full_name: string;
  job_title: string | null;
}

interface AiTaskGeneratorModalProps {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  teamProfiles: TeamProfile[];
  onClose: () => void;
  onDone: () => void;
}

interface EditableTask {
  title: string;
  checkpoints: { title: string; assigneeId: string | null }[];
}

export function AiTaskGeneratorModal({
  projectId,
  projectName,
  projectDescription,
  teamProfiles,
  onClose,
  onDone,
}: AiTaskGeneratorModalProps) {
  const [step, setStep] = useState<"generating" | "review" | "creating" | "done">("generating");
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<EditableTask[]>([]);
  const aborted = useRef(false);

  useEffect(() => {
    generateTasks();
    return () => { aborted.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateTasks() {
    setStep("generating");
    setError("");

    const result = await generateProjectTasksAction(projectName, projectDescription, teamProfiles);

    if (aborted.current) return;

    if (!result.success) {
      setError(result.error);
      setStep("review");
      setTasks([]);
      return;
    }

    const mapped = result.tasks.map((t: AiTaskSuggestion) => ({
      title: t.title,
      checkpoints: t.checkpoints.map((c) => ({
        title: c.title,
        assigneeId: teamProfiles.find((p) => p.id === c.assigneeRoleHint)?.id ?? null,
      })),
    }));

    setTasks(mapped);
    setStep("review");
  }

  async function handleApprove() {
    setStep("creating");
    setError("");

    const milestonesData = tasks.map((t) => ({ title: t.title, description: null }));
    const tasksData = tasks.flatMap((t, milestoneIndex) =>
      t.checkpoints.map((c) => ({
        title: c.title,
        milestoneIndex,
        assigneeId: c.assigneeId,
      }))
    );

    const result = await bulkCreateProjectTasksAction(projectId, milestonesData, tasksData);

    if (!result.success) {
      setError(result.error);
      setStep("review");
      return;
    }

    setStep("done");
  }

  function updateTaskTitle(taskIndex: number, title: string) {
    setTasks((prev) => prev.map((t, i) => (i === taskIndex ? { ...t, title } : t)));
  }

  function removeTask(taskIndex: number) {
    setTasks((prev) => prev.filter((_, i) => i !== taskIndex));
  }

  function addTask() {
    setTasks((prev) => [...prev, { title: "New Task", checkpoints: [] }]);
  }

  function updateCheckpointTitle(taskIndex: number, cpIndex: number, title: string) {
    setTasks((prev) =>
      prev.map((t, ti) =>
        ti === taskIndex
          ? {
              ...t,
              checkpoints: t.checkpoints.map((c, ci) => (ci === cpIndex ? { ...c, title } : c)),
            }
          : t
      )
    );
  }

  function removeCheckpoint(taskIndex: number, cpIndex: number) {
    setTasks((prev) =>
      prev.map((t, ti) =>
        ti === taskIndex
          ? { ...t, checkpoints: t.checkpoints.filter((_, ci) => ci !== cpIndex) }
          : t
      )
    );
  }

  function addCheckpoint(taskIndex: number) {
    setTasks((prev) =>
      prev.map((t, ti) =>
        ti === taskIndex
          ? { ...t, checkpoints: [...t.checkpoints, { title: "New Checkpoint", assigneeId: null }] }
          : t
      )
    );
  }

  function updateCheckpointAssignee(taskIndex: number, cpIndex: number, assigneeId: string | null) {
    setTasks((prev) =>
      prev.map((t, ti) =>
        ti === taskIndex
          ? {
              ...t,
              checkpoints: t.checkpoints.map((c, ci) => (ci === cpIndex ? { ...c, assigneeId } : c)),
            }
          : t
      )
    );
  }

  const headerTitle =
    step === "generating" ? "AI Task Generation" :
    step === "creating" ? "Creating Tasks…" :
    step === "done" ? "Tasks Created" : "Review AI Suggestions";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-[640px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#1B3FEE]" />
            </div>
            <span className="text-[15px] font-bold text-[#0f172a]">{headerTitle}</span>
          </div>
          <button
            onClick={() => {
              aborted.current = true;
              onClose();
            }}
            className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-[#475569]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-8 h-8 text-[#1B3FEE] animate-spin mb-4" />
              <div className="text-[15px] font-semibold text-[#0f172a]">Generating tasks with AI…</div>
              <p className="text-[13px] text-[#475569] mt-1">
                Analyzing &quot;{projectName}&quot; to create tasks and checkpoints.
              </p>
              <p className="text-[12px] text-[#94a3b8] mt-4">This usually takes 5–15 seconds.</p>
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col gap-5">
              {error && (
                <div className="flex items-start gap-2 text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Generation failed</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {tasks.length === 0 && !error && (
                <div className="text-center py-8 text-[13px] text-[#475569]">
                  No tasks were generated. You can add them manually.
                </div>
              )}

              {tasks.map((task, taskIndex) => (
                <div key={taskIndex} className="bg-white/50 border border-white/60 rounded-xl overflow-hidden">
                  {/* Task header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[rgba(241,245,249,0.6)] border-b border-white/50">
                    <input
                      value={task.title}
                      onChange={(e) => updateTaskTitle(taskIndex, e.target.value)}
                      className="flex-1 bg-transparent text-[13.5px] font-semibold text-[#0f172a] outline-none"
                    />
                    <button
                      onClick={() => removeTask(taskIndex)}
                      className="p-1 rounded-md hover:bg-[rgba(239,68,68,0.1)] text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Checkpoints */}
                  <div className="px-4 py-3 flex flex-col gap-2.5">
                    {task.checkpoints.map((cp, cpIndex) => (
                      <div key={cpIndex} className="flex items-center gap-2">
                        <input
                          value={cp.title}
                          onChange={(e) => updateCheckpointTitle(taskIndex, cpIndex, e.target.value)}
                          className="flex-1 bg-white/60 border border-white/60 rounded-lg px-3 py-1.5 text-[12.5px] text-[#0f172a] outline-none focus:border-[#1B3FEE]/30"
                        />
                        <div className="relative">
                          <select
                            value={cp.assigneeId ?? ""}
                            onChange={(e) => updateCheckpointAssignee(taskIndex, cpIndex, e.target.value || null)}
                            className="appearance-none pl-2 pr-7 py-1.5 rounded-lg bg-white/60 border border-white/60 text-[11.5px] text-[#475569] outline-none focus:border-[#1B3FEE]/30 cursor-pointer min-w-[100px]"
                          >
                            <option value="">Unassigned</option>
                            {teamProfiles.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.full_name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-[#94a3b8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => removeCheckpoint(taskIndex, cpIndex)}
                          className="p-1 rounded-md hover:bg-[rgba(239,68,68,0.1)] text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addCheckpoint(taskIndex)}
                      className="self-start flex items-center gap-1 text-[11.5px] font-medium text-[#1B3FEE] hover:text-[#1535D4] transition-colors cursor-pointer mt-1"
                    >
                      <Plus className="w-3 h-3" /> Add checkpoint
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addTask}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[rgba(27,63,238,0.3)] text-[13px] font-medium text-[#1B3FEE] hover:bg-[rgba(27,63,238,0.06)] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          )}

          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-8 h-8 text-[#1B3FEE] animate-spin mb-4" />
              <div className="text-[15px] font-semibold text-[#0f172a]">Creating tasks and checkpoints…</div>
              <p className="text-[13px] text-[#475569] mt-1">This may take a moment.</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-[#10b981]" />
              </div>
              <div className="text-[15px] font-bold text-[#0f172a]">Tasks & checkpoints created</div>
              <p className="text-[13px] text-[#475569] mt-1">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} with{" "}
                {tasks.reduce((sum, t) => sum + t.checkpoints.length, 0)} checkpoint
                {tasks.reduce((sum, t) => sum + t.checkpoints.length, 0) !== 1 ? "s" : ""} have been added to the project.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "review" && (
          <div className="px-6 py-4 border-t border-white/50 flex gap-2 flex-shrink-0">
            <Button variant="secondary" className="flex-1" onClick={() => { aborted.current = true; onClose(); onDone(); }}>
              Skip & Add Manually
            </Button>
            <Button variant="primary" className="flex-1" disabled={tasks.length === 0} onClick={handleApprove}>
              <Check className="w-3.5 h-3.5" /> Approve & Create
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="px-6 py-4 border-t border-white/50 flex-shrink-0">
            <Button variant="primary" className="w-full" onClick={() => { aborted.current = true; onClose(); onDone(); }}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
