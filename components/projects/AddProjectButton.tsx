"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddProjectModal } from "./AddProjectModal";

interface Client {
  id: string;
  name: string;
}

interface TeamProfile {
  id: string;
  full_name: string;
  job_title: string | null;
}

interface AddProjectButtonProps {
  clients: Client[];
  teamProfiles: TeamProfile[];
  preselectedClientId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
}

export function AddProjectButton({
  clients,
  teamProfiles,
  preselectedClientId,
  label = "New Project",
  variant = "primary",
}: AddProjectButtonProps) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] transition-all cursor-pointer"
      : variant === "secondary"
      ? "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-white/65 border border-white/60 text-[#475569] hover:bg-white/85 transition-all cursor-pointer"
      : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] border border-[rgba(27,63,238,0.15)] hover:bg-[rgba(27,63,238,0.14)] transition-all cursor-pointer";

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        <Plus className="w-3.5 h-3.5" />
        {label}
      </button>

      {open && (
        <AddProjectModal
          clients={clients}
          teamProfiles={teamProfiles}
          preselectedClientId={preselectedClientId}
          onClose={() => setOpen(false)}
          onDone={() => setOpen(false)}
        />
      )}
    </>
  );
}
