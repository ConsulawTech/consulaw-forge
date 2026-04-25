"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NewTaskModal } from "./NewTaskModal";

interface Project { id: string; name: string; milestones: { id: string; title: string }[] }
interface Profile { id: string; full_name: string }

interface NewTaskButtonProps {
  projects: Project[];
  profiles: Profile[];
  defaultProjectId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "inline";
}

export function NewTaskButton({ projects, profiles, defaultProjectId, label = "New Task", variant = "primary" }: NewTaskButtonProps) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] transition-all cursor-pointer"
      : variant === "secondary"
      ? "px-3.5 py-2 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] transition-colors"
      : "ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-3 py-1.5 rounded-[8px] border border-[rgba(27,63,238,0.15)] hover:bg-[rgba(27,63,238,0.14)] cursor-pointer transition-colors";

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        <Plus className="w-3.5 h-3.5" /> {label}
      </button>
      {open && (
        <NewTaskModal
          projects={projects}
          profiles={profiles}
          defaultProjectId={defaultProjectId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
