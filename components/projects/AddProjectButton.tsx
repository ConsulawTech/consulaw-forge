"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
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

  const btnVariant = variant === "ghost" ? "outline" : variant;

  return (
    <>
      <Button variant={btnVariant} size="md" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" />
        {label}
      </Button>

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
