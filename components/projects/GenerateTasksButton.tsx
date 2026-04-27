"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  targetDate?: string | null;
  teamProfiles: TeamProfile[];
}

export function GenerateTasksButton({
  projectId,
  projectName,
  projectDescription,
  targetDate,
  teamProfiles,
}: GenerateTasksButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="accent" size="md" onClick={() => setOpen(true)}>
        <Sparkles className="w-3.5 h-3.5" /> Generate with AI
      </Button>

      {open && (
        <AiTaskGeneratorModal
          projectId={projectId}
          projectName={projectName}
          projectDescription={projectDescription}
          targetDate={targetDate}
          teamProfiles={teamProfiles}
          onClose={() => setOpen(false)}
          onDone={() => setOpen(false)}
        />
      )}
    </>
  );
}
