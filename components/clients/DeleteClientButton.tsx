"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteClientAction } from "@/app/actions/clients";
import { useRouter } from "next/navigation";

interface DeleteClientButtonProps {
  clientId: string;
  clientName: string;
  variant?: "icon" | "button";
}

export function DeleteClientButton({ clientId, clientName, variant = "icon" }: DeleteClientButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError("");
    const result = await deleteClientAction(clientId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      router.push("/clients");
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.25)] transition-colors cursor-pointer"
          title="Delete client"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#94a3b8] hover:text-[#ef4444]" />
        </button>
      ) : (
        <Button variant="danger" size="md" onClick={() => setOpen(true)}>
          Delete Client
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => !loading && setOpen(false)}>
          <div className="glass rounded-2xl w-full max-w-[400px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
                </div>
                <span className="text-[15px] font-bold text-[#0f172a]">Delete Client</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5 text-[#475569]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {error && (
                <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              <p className="text-[13px] text-[#475569] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[#0f172a]">{clientName}</span>?
                This will permanently remove all their projects, milestones, and tasks.
                This action cannot be undone.
              </p>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" loading={loading} onClick={handleDelete}>
                  {loading ? "Deleting…" : "Delete permanently"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
