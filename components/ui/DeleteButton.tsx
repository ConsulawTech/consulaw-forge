"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
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

  const btnCls =
    size === "sm"
      ? "p-1.5 rounded-md text-[#94a3b8] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer"
      : "inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold bg-[rgba(239,68,68,0.08)] text-[#ef4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.14)] transition-all cursor-pointer";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={btnCls}
        title={`Delete ${typeLabel}`}
      >
        <Trash2 className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        {size === "md" && `Delete ${typeLabel}`}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass rounded-2xl w-full max-w-[420px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/50">
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

            <div className="p-6">
              {error && (
                <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <p className="text-[13px] text-[#475569] leading-relaxed">
                Are you sure you want to delete <strong className="text-[#0f172a]">"{entityName}"</strong>?
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
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-[10px] bg-white/65 border border-white/60 text-[13px] font-semibold text-[#475569] hover:bg-white/85 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 rounded-[10px] bg-[#ef4444] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#dc2626] disabled:opacity-60 transition-colors shadow-[0_2px_8px_rgba(239,68,68,0.25)] flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete {typeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
