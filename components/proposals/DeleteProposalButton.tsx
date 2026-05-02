"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteProposalAction } from "@/app/actions/proposals";
import { useRouter } from "next/navigation";

interface DeleteProposalButtonProps {
  proposalId: string;
  proposalTitle: string;
}

export function DeleteProposalButton({ proposalId, proposalTitle }: DeleteProposalButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError("");
    const result = await deleteProposalAction(proposalId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.push("/proposals");
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="glass rounded-2xl w-full max-w-[400px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
                </div>
                <span className="text-[15px] font-bold text-[#0f172a]">Delete Proposal</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 cursor-pointer transition-colors disabled:opacity-50"
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
                Delete{" "}
                <span className="font-semibold text-[#0f172a]">{proposalTitle}</span>? The public
                URL will stop working immediately. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  loading={loading}
                  onClick={handleDelete}
                >
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
