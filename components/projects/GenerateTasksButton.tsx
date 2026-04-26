"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiTaskGeneratorModal } from "./AiTaskGeneratorModal";

interface TeamProfile {
  id: string;
  full_name: string;
  job_title: string | null;
}

interface GenerateTasksButtonProps {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  teamProfiles: TeamProfile[];
}

export function GenerateTasksButton({
  projectId,
  projectName,
  projectDescription,
  teamProfiles,
}: GenerateTasksButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-[rgba(139,92,246,0.1)] text-[#8b5cf6] border border-[rgba(139,92,246,0.2)] hover:bg-[rgba(139,92,246,0.18)] transition-all cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" /> Generate with AI
      </button>

      {open && (
        <AiTaskGeneratorModal
          projectId={projectId}
          projectName={projectName}
          projectDescription={projectDescription}
          teamProfiles={teamProfiles}
          onClose={() => setOpen(false)}
          onDone={() => setOpen(false)}
        />
      )}
    </>
  );
}
