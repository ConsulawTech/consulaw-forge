"use client";

import { useState, useCallback, useOptimistic, useTransition } from "react";
import { ChevronDown, ChevronRight, Calendar, User, ArrowUp, ArrowDown, Link2, X } from "lucide-react";
import { formatDate, getAvatarColor, deadlineStatus } from "@/lib/utils";
import { TaskStatusSelect } from "@/components/tasks/TaskStatusSelect";
import { Avatar } from "@/components/ui/Avatar";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { deleteMilestoneAction, deleteTaskAction, updateMilestoneOrderAction } from "@/app/actions/projects";
import { addTaskDependency, removeTaskDependency } from "@/app/actions/tasks";
import type { TaskStatus } from "@/lib/types";

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-[36px] h-[36px] flex-shrink-0">
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">{pct}%</div>
    </div>
  );
}

interface Dependency {
  task_id: string;
  depends_on_task_id: string;
}

interface CollapsibleMilestoneListProps {
  milestones: any[];
  projectId: string;
  projectForModal: { id: string; name: string }[];
  profilesForModal: { id: string; full_name: string }[];
  initialDependencies?: Dependency[];
}

function DependencyPickerButton({
  taskId,
  allTasks,
  existingDepIds,
  onAdd,
}: {
  taskId: string;
  allTasks: any[];
  existingDepIds: string[];
  onAdd: (depId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = allTasks.filter((t) => t.id !== taskId && !existingDepIds.includes(t.id));

  if (available.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-[#1B3FEE] hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
        title="Add dependency"
      >
        <Link2 className="w-3 h-3" />
      </button>
    );
  }

  return (
    <select
      autoFocus
      defaultValue=""
      className="text-[11.5px] rounded-lg border border-slate-200 px-2 py-1 outline-none bg-white text-slate-700 cursor-pointer max-w-[160px]"
      onChange={(e) => {
        if (e.target.value) onAdd(e.target.value);
        setOpen(false);
      }}
      onBlur={() => setOpen(false)}
    >
      <option value="">Add dependency…</option>
      {available.map((t) => (
        <option key={t.id} value={t.id}>{t.title}</option>
      ))}
    </select>
  );
}

export function CollapsibleMilestoneList({
  milestones: initialMilestones,
  projectId,
  projectForModal,
  profilesForModal,
  initialDependencies = [],
}: CollapsibleMilestoneListProps) {
  const [optimisticMilestones, setOptimisticMilestones] = useOptimistic(initialMilestones);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(initialMilestones.map((m) => m.id))
  );
  const [dependencies, setDependencies] = useState<Dependency[]>(initialDependencies);
  const [, startTransition] = useTransition();

  const allTasks: any[] = optimisticMilestones.flatMap((m: any) => m.tasks ?? []);
  const taskById = Object.fromEntries(allTasks.map((t: any) => [t.id, t]));

  const depsForTask = (taskId: string) =>
    dependencies
      .filter((d) => d.task_id === taskId)
      .map((d) => ({ ...d, dep_task: taskById[d.depends_on_task_id] }))
      .filter((d) => d.dep_task);

  const existingDepIds = (taskId: string) =>
    dependencies.filter((d) => d.task_id === taskId).map((d) => d.depends_on_task_id);

  function handleAddDep(taskId: string, depId: string) {
    setDependencies((prev) => [...prev, { task_id: taskId, depends_on_task_id: depId }]);
    startTransition(() => addTaskDependency(taskId, depId));
  }

  function handleRemoveDep(taskId: string, depId: string) {
    setDependencies((prev) =>
      prev.filter((d) => !(d.task_id === taskId && d.depends_on_task_id === depId))
    );
    startTransition(() => removeTaskDependency(taskId, depId));
  }

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleMove = useCallback(
    async (index: number, direction: "up" | "down") => {
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= optimisticMilestones.length) return;

      const newMilestones = [...optimisticMilestones];
      [newMilestones[index], newMilestones[swapIndex]] = [
        newMilestones[swapIndex],
        newMilestones[index],
      ];
      setOptimisticMilestones(newMilestones);
      await updateMilestoneOrderAction(projectId, newMilestones.map((m) => m.id));
    },
    [optimisticMilestones, projectId, setOptimisticMilestones]
  );

  if (optimisticMilestones.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-[15px] font-semibold text-slate-900 mb-1">No tasks yet</p>
        <p className="text-[13px] text-slate-500">Click &quot;Add Task&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {optimisticMilestones.map((ms, index) => {
        const dlMs = deadlineStatus(ms.deadline);
        const msDone = (ms.tasks ?? []).filter((t: { status: string }) => t.status === "done").length;
        const msTotal = (ms.tasks ?? []).length;
        const msProgress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;
        const isExpanded = expandedIds.has(ms.id);

        return (
          <div
            key={ms.id}
            className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
          >
            {/* Task header */}
            <div className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left">
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ background: ms.color ?? "#1B3FEE" }}
              />

              <button onClick={() => toggle(ms.id)} className="flex-1 min-w-0 text-left">
                <div className="text-[15px] font-bold text-slate-900">{ms.title}</div>
                {ms.description && <div className="text-[12px] text-slate-500 mt-0.5">{ms.description}</div>}
              </button>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex flex-col gap-0.5 mr-1">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === optimisticMilestones.length - 1}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                {ms.deadline && (
                  <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${
                    dlMs === "ok" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : dlMs === "warn" ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {formatDate(ms.deadline, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                <ProgressRing pct={msProgress} color={ms.color ?? "#1B3FEE"} />
                <div className="flex items-center gap-1">
                  <NewTaskButton
                    projects={projectForModal}
                    profiles={profilesForModal}
                    defaultProjectId={projectId}
                    label="+ Checkpoint"
                    variant="inline"
                  />
                  <DeleteButton
                    entityId={ms.id}
                    entityName={ms.title}
                    entityType="task"
                    deleteAction={deleteMilestoneAction}
                  />
                </div>
                <button onClick={() => toggle(ms.id)} className="hover:bg-slate-100 rounded-lg p-1 transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Checkpoints */}
            {isExpanded && (
              <div className="border-t border-slate-100">
                {(ms.tasks ?? []).length === 0 ? (
                  <div className="px-5 py-5 text-[13px] text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    No checkpoints yet for this task.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {(ms.tasks ?? []).map((task: any) => {
                      const taskDeps = depsForTask(task.id);
                      const isBlocked = taskDeps.some((d) => d.dep_task?.status !== "done");

                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50/40 transition-colors group"
                        >
                          {/* Date */}
                          <div className="w-[90px] flex-shrink-0 pt-0.5">
                            <div className="text-[12px] font-semibold text-slate-700">
                              {task.due_date ? formatDate(task.due_date, { month: "short", day: "numeric" }) : "No date"}
                            </div>
                          </div>

                          {/* Assignee */}
                          <div className="flex-shrink-0 pt-0.5">
                            {task.assignee ? (
                              <Avatar name={task.assignee.full_name} color={getAvatarColor(task.assignee.full_name)} size="xs" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-slate-400" />
                              </div>
                            )}
                          </div>

                          {/* Title + dependencies */}
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-medium text-slate-800">{task.title}</div>
                            <div className="text-[11px] text-slate-400">{task.assignee?.full_name ?? "Unassigned"}</div>
                            {taskDeps.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                {taskDeps.map((dep) => (
                                  <span
                                    key={dep.depends_on_task_id}
                                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                      dep.dep_task.status === "done"
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : "bg-orange-50 text-orange-600 border-orange-100"
                                    }`}
                                  >
                                    {dep.dep_task.title}
                                    <button
                                      onClick={() => handleRemoveDep(task.id, dep.depends_on_task_id)}
                                      className="hover:opacity-70 transition-opacity ml-0.5"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Blocked badge */}
                          {isBlocked && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full flex-shrink-0 self-center whitespace-nowrap">
                              Blocked
                            </span>
                          )}

                          {/* Status select */}
                          <div className="flex-shrink-0 self-center">
                            <TaskStatusSelect taskId={task.id} status={task.status as TaskStatus} />
                          </div>

                          {/* Add dependency */}
                          <div className="flex-shrink-0 self-center">
                            <DependencyPickerButton
                              taskId={task.id}
                              allTasks={allTasks}
                              existingDepIds={existingDepIds(task.id)}
                              onAdd={(depId) => handleAddDep(task.id, depId)}
                            />
                          </div>

                          {/* Delete */}
                          <div className="flex-shrink-0 self-center">
                            <DeleteButton
                              entityId={task.id}
                              entityName={task.title}
                              entityType="checkpoint"
                              deleteAction={deleteTaskAction}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
