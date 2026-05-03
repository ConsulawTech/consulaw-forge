"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { deleteProposalAction } from "@/app/actions/proposals";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { ProposalStatus } from "@/lib/types";

interface ProposalSummary {
  id: string;
  title: string;
  slug: string;
  status: ProposalStatus;
  view_count: number;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  client: {
    name: string;
    logo_color?: string | null;
    logo_letter?: string | null;
  } | null;
}

const STATUS_STYLES: Record<ProposalStatus, string> = {
  draft:  "bg-[rgba(148,163,184,0.15)] text-[#475569]",
  sent:   "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]",
  viewed: "bg-[rgba(16,185,129,0.1)] text-[#10b981]",
};

function ProposalCard({ proposal }: { proposal: ProposalSummary }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await deleteProposalAction(proposal.id);
    // revalidatePath in action refreshes the list automatically
  }

  return (
    <div className="glass rounded-2xl flex flex-col h-full">
      {/* Clickable body */}
      <div
        className="flex-1 p-5 flex flex-col gap-3 cursor-pointer hover:bg-white/20 transition-colors rounded-t-2xl"
        onClick={() => router.push(`/proposals/${proposal.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-[#0f172a] truncate">{proposal.title}</div>
            <div className="text-[11px] text-[#94a3b8] font-mono mt-0.5 truncate">{proposal.slug}</div>
          </div>
          <span
            className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[proposal.status]}`}
          >
            {proposal.status}
          </span>
        </div>

        {proposal.client && (
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
              style={{ background: proposal.client.logo_color ?? "#e50914" }}
            >
              {proposal.client.logo_letter ?? proposal.client.name[0]}
            </div>
            <span className="text-[12px] text-[#475569] font-medium truncate">{proposal.client.name}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-[11px] text-[#94a3b8]">
          <span>{formatDate(proposal.created_at)}</span>
          <span>{proposal.view_count} view{proposal.view_count !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-t border-white/40">
        {/* Edit */}
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/proposals/${proposal.id}/edit`); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold text-[#475569] hover:bg-white/60 hover:text-[#0f172a] transition-all cursor-pointer"
          title="Edit proposal"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>

        <div className="flex-1" />

        {/* Delete — two-step inline confirm */}
        {!confirmDelete ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold text-[#94a3b8] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#ef4444] transition-all cursor-pointer"
            title="Delete proposal"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1 animate-in fade-in duration-150">
            <span className="text-[11px] text-[#ef4444] font-medium mr-1">Sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-6 h-6 rounded-lg bg-[#ef4444] flex items-center justify-center hover:bg-[#dc2626] transition-colors cursor-pointer disabled:opacity-50"
              title="Confirm delete"
            >
              {deleting
                ? <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                : <Check className="w-3 h-3 text-white" />
              }
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
              className="w-6 h-6 rounded-lg bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer"
              title="Cancel"
            >
              <X className="w-3 h-3 text-[#475569]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProposalsView({ proposals }: { proposals: ProposalSummary[] }) {
  if (proposals.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center text-[#94a3b8] text-sm">
        No proposals yet. Click &quot;+ New Proposal&quot; to create your first one.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {proposals.map((p) => (
        <ProposalCard key={p.id} proposal={p} />
      ))}
    </div>
  );
}
