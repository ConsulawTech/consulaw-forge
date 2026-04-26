"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddClientModal } from "./AddClientModal";

export function AddClientButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" /> Add Client
      </Button>
      {open && <AddClientModal onClose={() => setOpen(false)} />}
    </>
  );
}
