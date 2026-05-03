"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  entityId: string;
  entityName: string;
  entityType: "project" | "task" | "checkpoint";
  deleteAction: (id: string) => Promise<{ success: true } | { success: false; error: string }>;
  redirectAfterDelete?: string;
  size?: "sm" | "md";
}

export function DeleteButton({
  entityId,
  entityName,
  entityType,
  deleteAction,
  redirectAfterDelete,
  size = "sm",
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const typeLabel = entityType === "project" ? "Project" : entityType === "task" ? "Task" : "Checkpoint";

  async function handleDelete() {
    setLoading(true);
    setError("");
    const result = await deleteAction(entityId);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    if (redirectAfterDelete) {
      router.push(redirectAfterDelete);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      {size === "sm" ? (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer"
          title={`Delete ${typeLabel}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <Button variant="danger" size="md" onClick={() => setOpen(true)}>
          <Trash2 className="w-4 h-4" /> Delete {typeLabel}
        </Button>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass rounded-2xl w-full max-w-[420px] mx-4 flex flex-col max-h-[90vh] shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
                </div>
                <span className="text-[15px] font-bold text-[#0f172a]">Delete {typeLabel}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-[#475569]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <p className="text-[13px] text-[#475569] leading-relaxed">
                Are you sure you want to delete <strong className="text-[#0f172a]">&quot;{entityName}&quot;</strong>?
              </p>
              <p className="text-[12.5px] text-[#94a3b8] mt-2">
                {entityType === "project"
                  ? "This will permanently delete the project and all associated tasks, checkpoints, messages, and timeline data."
                  : entityType === "task"
                  ? "This will permanently delete the task and all its associated checkpoints."
                  : "This checkpoint will be permanently removed."}
              </p>
            </div>

            <div className="px-6 py-4 border-t border-white/50 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" loading={loading} onClick={handleDelete}>
                {loading ? "Deleting…" : `Delete ${typeLabel}`}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
