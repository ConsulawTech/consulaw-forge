import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate, deadlineStatus } from "@/lib/utils";
import { Edit, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-[38px] h-[38px] flex-shrink-0">
      <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(241,245,249,0.95)" strokeWidth="4" />
        <circle
          cx="19" cy="19" r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#0f172a]">
        {pct}%
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*, client:clients(*), milestones(*, tasks(*))")
    .order("created_at");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Projects</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">All milestones across active projects</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white/65 border border-white/60 text-[#475569] hover:bg-white/85 transition-all cursor-pointer">
              Filter
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Milestone
            </button>
          </div>
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(projects ?? []).map((project: any) => {
          const dlStatus = deadlineStatus(project.target_date);
          return (
            <div key={project.id} className="mb-6">
              {/* Project header */}
              <div className="glass rounded-2xl p-5 mb-4 flex items-center gap-5">
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                  style={{ background: project.client?.logo_color ?? "#e50914" }}
                >
                  {project.client?.logo_letter ?? project.client?.name?.[0]}
                </div>
                <div className="flex-1">
                  <div className="text-[17px] font-bold text-[#0f172a]">
                    {project.client?.name} — {project.name}
                  </div>
                  <div className="text-[13px] text-[#1B3FEE] font-medium mt-0.5">
                    Overall Progress: {project.overall_progress}% complete · Target: {formatDate(project.target_date, { month: "short", year: "numeric" })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]">Design Phase active</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10b981]">Internal team</span>
                    {dlStatus === "late" && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.1)] text-[#ef4444]">Overdue</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3.5 py-1.5 rounded-[10px] bg-white/65 border border-white/60 text-[13px] font-semibold text-[#475569] hover:bg-white/85 cursor-pointer transition-colors">View Brief</button>
                  <Link href={`/projects/${project.id}`}>
                    <button className="px-3.5 py-1.5 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] transition-colors">+ Schedule Task</button>
                  </Link>
                </div>
              </div>

              {/* Milestones table */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[200px_1fr_110px_80px_160px_90px] bg-[rgba(241,245,249,0.8)] border-b border-white/50">
                  {["Milestone", "Tasks", "Deadline", "Progress", "Suggestion", "Actions"].map((h) => (
                    <div key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">{h}</div>
                  ))}
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(project.milestones ?? []).map((ms: any) => {
                  const dlMs = deadlineStatus(ms.deadline);
                  return (
                    <div key={ms.id} className="grid grid-cols-[200px_1fr_110px_80px_160px_90px] border-b border-white/50 last:border-0 hover:bg-white/40 cursor-pointer transition-colors">
                      <div className="px-4 py-3.5 flex flex-col justify-center">
                        <div className="text-[13px] font-semibold text-[#0f172a] mb-0.5">{ms.title}</div>
                        <div className="text-[11.5px] text-[#94a3b8] leading-snug line-clamp-2">{ms.description}</div>
                      </div>
                      <div className="px-4 py-3.5 flex flex-col justify-center gap-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(ms.tasks ?? []).slice(0, 3).map((t: any) => (
                          <div key={t.id} className={`text-[11.5px] text-[#475569] flex items-center gap-1.5 ${t.status === "done" ? "line-through text-[#94a3b8]" : ""}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === "done" ? "bg-[#10b981]" : "bg-[rgba(27,63,238,0.25)]"}`} />
                            {t.title}
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3.5 flex items-center">
                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${
                          dlMs === "ok" ? "bg-[rgba(16,185,129,0.1)] text-[#10b981]" :
                          dlMs === "warn" ? "bg-[rgba(245,159,0,0.1)] text-[#f59f00]" :
                          "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"
                        }`}>
                          {formatDate(ms.deadline, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center">
                        <ProgressRing pct={ms.progress} color={ms.color} />
                      </div>
                      <div className="px-4 py-3.5 flex items-center">
                        <span className="text-[11px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-2.5 py-1 rounded-[7px] border border-[rgba(27,63,238,0.15)] cursor-pointer hover:bg-[rgba(27,63,238,0.14)] transition-colors">
                          View suggestions
                        </span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center gap-1.5">
                        <button className="w-[26px] h-[26px] rounded-[7px] border border-[rgba(203,213,225,0.5)] bg-white/50 flex items-center justify-center hover:bg-[rgba(27,63,238,0.08)] hover:border-[rgba(27,63,238,0.2)] cursor-pointer transition-all">
                          <Edit className="w-3 h-3 text-[#475569]" />
                        </button>
                        <button className="w-[26px] h-[26px] rounded-[7px] border border-[rgba(203,213,225,0.5)] bg-white/50 flex items-center justify-center hover:bg-[rgba(27,63,238,0.08)] hover:border-[rgba(27,63,238,0.2)] cursor-pointer transition-all">
                          <MoreHorizontal className="w-3 h-3 text-[#475569]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {(!projects || projects.length === 0) && (
          <div className="glass rounded-2xl p-12 text-center">
            <FolderIcon />
            <p className="text-[#94a3b8] text-sm mt-3">No projects yet. Add a client to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FolderIcon() {
  return (
    <div className="w-12 h-12 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto">
      <svg className="w-6 h-6 text-[#1B3FEE]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  );
}
