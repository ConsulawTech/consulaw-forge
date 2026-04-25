"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddClientModal } from "./AddClientModal";

export function AddClientButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] transition-all cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Add Client
      </button>
      {open && <AddClientModal onClose={() => setOpen(false)} />}
    </>
  );
}
