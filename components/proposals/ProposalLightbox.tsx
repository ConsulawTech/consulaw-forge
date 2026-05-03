"use client";

import { useState } from "react";
import { FileText, X, ExternalLink } from "lucide-react";

interface ProposalRef {
  id: string;
  title: string;
  slug: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft:  "bg-slate-100 text-slate-500",
  sent:   "bg-blue-50 text-[#1B3FEE]",
  viewed: "bg-emerald-50 text-emerald-600",
};

export function ProposalLightbox({ proposals }: { proposals: ProposalRef[] }) {
  const [active, setActive] = useState<ProposalRef | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://forge.consulawtech.com";

  if (proposals.length === 0) return null;

  return (
    <>
      {/* Trigger chips */}
      <div className="flex flex-wrap gap-2">
        {proposals.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#1B3FEE]/30 hover:bg-[rgba(27,63,238,0.03)] transition-all text-left group"
          >
            <FileText className="w-3.5 h-3.5 text-[#1B3FEE] flex-shrink-0" />
            <span className="text-[12.5px] font-semibold text-slate-700 group-hover:text-[#1B3FEE] transition-colors truncate max-w-[200px]">
              {p.title}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-500"}`}>
              {p.status}
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
          {/* Lightbox header */}
          <div className="flex items-center justify-between px-5 py-3 bg-white/95 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#1B3FEE]" />
              <span className="text-[14px] font-bold text-slate-900 truncate max-w-[400px]">{active.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[active.status] ?? ""}`}>
                {active.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`${appUrl}/${active.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#475569] hover:bg-slate-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in tab
              </a>
              <button
                onClick={() => setActive(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* iframe */}
          <iframe
            src={`${appUrl}/${active.slug}`}
            className="flex-1 w-full border-0"
            title={active.title}
          />
        </div>
      )}
    </>
  );
}
