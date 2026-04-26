"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/app/actions/tasks";
import type { TaskStatus } from "@/lib/types";

const OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "todo",        label: "To Do",      color: "#94a3b8" },
  { value: "in_progress", label: "In Progress", color: "#1B3FEE" },
  { value: "done",        label: "Done",        color: "#10b981" },
  { value: "late",        label: "Late",        color: "#f59f00" },
];

export function TaskStatusSelect({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as TaskStatus;
    startTransition(() => updateTaskStatus(taskId, next));
  }

  const current = OPTIONS.find((o) => o.value === status) ?? OPTIONS[0];

  return (
    <div className="relative inline-flex items-center">
      <select
        value={status}
        onChange={handleChange}
        disabled={pending}
        className="appearance-none pl-[22px] pr-5 py-1 rounded-full text-[11.5px] font-semibold border outline-none cursor-pointer transition-opacity disabled:opacity-60"
        style={{
          color: current.color,
          borderColor: `${current.color}33`,
          background: `${current.color}12`,
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span
        className="absolute left-[9px] w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: current.color }}
      />
    </div>
  );
}
