"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
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
  return (
    <Link href={`/proposals/${proposal.id}`}>
      <div className="glass rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all duration-150 h-full flex flex-col gap-3">
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
    </Link>
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
