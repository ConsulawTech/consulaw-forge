"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NewTaskModal } from "./NewTaskModal";

interface Project { id: string; name: string }
interface Profile { id: string; full_name: string }

interface MilestoneOption { id: string; title: string; projectId: string }

interface NewTaskButtonProps {
  projects: Project[];
  profiles: Profile[];
  milestones?: MilestoneOption[];
  defaultProjectId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "inline";
}

export function NewTaskButton({ projects, profiles, milestones, defaultProjectId, label = "New Task", variant = "primary" }: NewTaskButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "inline") {
    return (
      <>
        <button onClick={() => setOpen(true)} className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-3 py-1.5 rounded-[8px] border border-[rgba(27,63,238,0.15)] hover:bg-[rgba(27,63,238,0.14)] cursor-pointer transition-colors">
          <Plus className="w-3.5 h-3.5" /> {label}
        </button>
        {open && (
          <NewTaskModal projects={projects} profiles={profiles} milestones={milestones} defaultProjectId={defaultProjectId} onClose={() => setOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <Button variant={variant === "secondary" ? "secondary" : "primary"} size="md" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" /> {label}
      </Button>
      {open && (
        <NewTaskModal projects={projects} profiles={profiles} milestones={milestones} defaultProjectId={defaultProjectId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
