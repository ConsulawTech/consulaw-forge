"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface Props {
  proposalId: string;
  initialViewCount: number;
  initialSentAt: string | null;
  initialViewedAt: string | null;
}

export function ProposalStats({
  proposalId,
  initialViewCount,
  initialSentAt,
  initialViewedAt,
}: Props) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [viewedAt, setViewedAt] = useState(initialViewedAt);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`proposal-stats-${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "proposals",
          filter: `id=eq.${proposalId}`,
        },
        (payload) => {
          const row = payload.new as { view_count: number; viewed_at: string | null };
          setViewCount(row.view_count);
          setViewedAt(row.viewed_at);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId]);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-[rgba(241,245,249,0.7)] rounded-xl p-3 text-center">
        <div className="text-[22px] font-extrabold text-[#0f172a] tabular-nums">
          {viewCount}
        </div>
        <div className="text-[11px] text-[#94a3b8] mt-0.5">Views</div>
      </div>
      <div className="bg-[rgba(241,245,249,0.7)] rounded-xl p-3 text-center">
        <div className="text-[13px] font-bold text-[#0f172a]">
          {initialSentAt ? formatDate(initialSentAt) : "—"}
        </div>
        <div className="text-[11px] text-[#94a3b8] mt-0.5">Sent</div>
      </div>
      <div className="bg-[rgba(241,245,249,0.7)] rounded-xl p-3 text-center">
        <div className="text-[13px] font-bold text-[#0f172a]">
          {viewedAt ? formatDate(viewedAt) : "—"}
        </div>
        <div className="text-[11px] text-[#94a3b8] mt-0.5">Last viewed</div>
      </div>
    </div>
  );
}
