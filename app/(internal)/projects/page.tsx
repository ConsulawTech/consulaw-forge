import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate, deadlineStatus } from "@/lib/utils";
import Link from "next/link";
import { AddMilestoneButton } from "@/components/projects/AddMilestoneButton";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { AddProjectButton } from "@/components/projects/AddProjectButton";
import { CheckCircle2, Circle, AlertCircle, Clock, ChevronRight } from "lucide-react";

function ProgressRing({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(241,245,249,0.95)" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
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

function TaskStatusDot({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0" />;
  if (status === "in_progress") return <Circle className="w-3.5 h-3.5 text-[#1B3FEE] flex-shrink-0" />;
  if (status === "late") return <AlertCircle className="w-3.5 h-3.5 text-[#f59f00] flex-shrink-0" />;
  return <Clock className="w-3.5 h-3.5 text-[#94a3b8] flex-shrink-0" />;
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: profiles }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:clients(*), milestones(*, tasks(*))")
      .order("created_at"),
    supabase.from("profiles").select("id, full_name").eq("role", "team"),
    supabase.from("clients").select("id, name").order("created_at"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectsForModal = (projects ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    milestones: (p.milestones ?? []).map((m: any) => ({ id: m.id, title: m.title })),
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesForModal = (profiles ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        <div className="flex items-start sm:items-end justify-between mb-5 gap-3">
          <div>
            <h1 className="text-[20px] md:text-[22px] font-extrabold text-[#0f172a] tracking-tight">Projects</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">All milestones across active projects</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <NewTaskButton projects={projectsForModal} profiles={profilesForModal} label="Schedule Task" variant="secondary" />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <AddMilestoneButton projects={(projects ?? []).map((p: any) => ({ id: p.id, name: p.name }))} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <AddProjectButton clients={(clients ?? []).map((c: any) => ({ id: c.id, name: c.name }))} />
          </div>
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(projects ?? []).map((project: any) => {
          const dlStatus = deadlineStatus(project.target_date);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allTasks = (project.milestones ?? []).flatMap((m: any) => m.tasks ?? []);
          const doneTasks = allTasks.filter((t: { status: string }) => t.status === "done").length;
          const inProgressTasks = allTasks.filter((t: { status: string }) => t.status === "in_progress").length;
          const lateTasks = allTasks.filter((t: { status: string }) => t.status === "late").length;

          return (
            <div key={project.id} className="mb-8">
              {/* Project header card */}
              <div className="glass rounded-2xl p-4 md:p-5 mb-4">
                <div className="flex items-start md:items-center gap-4 flex-wrap">
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    style={{ background: project.client?.logo_color ?? "#e50914" }}
                  >
                    {project.client?.logo_letter ?? project.client?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] md:text-[17px] font-bold text-[#0f172a] truncate">
                      {project.client?.name} — {project.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[12px] md:text-[13px] text-[#1B3FEE] font-medium">
                        {project.overall_progress}% complete
                      </span>
                      {project.target_date && (
                        <span className={`text-[12px] font-medium ${
                          dlStatus === "late" ? "text-[#ef4444]" : dlStatus === "warn" ? "text-[#f59f00]" : "text-[#475569]"
                        }`}>
                          Due {formatDate(project.target_date, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    {/* Task summary pills */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doneTasks > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10b981]">
                          {doneTasks} done
                        </span>
                      )}
                      {inProgressTasks > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]">
                          {inProgressTasks} in progress
                        </span>
                      )}
                      {lateTasks > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(245,159,0,0.1)] text-[#f59f00]">
                          {lateTasks} late
                        </span>
                      )}
                      {dlStatus === "late" && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] text-[#ef4444]">
                          Deadline overdue
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link href={`/projects/${project.id}`} className="flex-1 sm:flex-none">
                      <button className="w-full px-4 py-2 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] transition-colors flex items-center justify-center gap-1.5">
                        View Project <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Overall progress bar */}
                <div className="mt-3.5">
                  <div className="h-1.5 bg-[rgba(241,245,249,0.8)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${project.overall_progress}%`, background: "#1B3FEE" }}
                    />
                  </div>
                </div>
              </div>

              {/* Milestones — desktop table / mobile cards */}
              <div className="glass rounded-2xl overflow-hidden">
                {/* Desktop table header */}
                <div className="hidden md:grid grid-cols-[minmax(160px,1.5fr)_minmax(180px,2fr)_120px_72px_90px] bg-[rgba(241,245,249,0.8)] border-b border-white/50">
                  {["Milestone", "Tasks", "Deadline", "Progress", "Actions"].map((h) => (
                    <div key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">{h}</div>
                  ))}
                </div>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(project.milestones ?? []).map((ms: any) => {
                  const dlMs = deadlineStatus(ms.deadline);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const msDone = (ms.tasks ?? []).filter((t: any) => t.status === "done").length;
                  const msTotal = (ms.tasks ?? []).length;

                  return (
                    <div key={ms.id} className="border-b border-white/50 last:border-0">
                      {/* Desktop row */}
                      <div className="hidden md:grid grid-cols-[minmax(160px,1.5fr)_minmax(180px,2fr)_120px_72px_90px] hover:bg-white/40 transition-colors">
                        <div className="px-4 py-3.5 flex flex-col justify-center">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: ms.color ?? "#1B3FEE" }}
                            />
                            <div className="text-[13px] font-semibold text-[#0f172a] line-clamp-1">{ms.title}</div>
                          </div>
                          {ms.description && (
                            <div className="text-[11.5px] text-[#94a3b8] leading-snug line-clamp-2 mt-0.5 pl-[18px]">{ms.description}</div>
                          )}
                        </div>
                        <div className="px-4 py-3.5 flex flex-col justify-center gap-1">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(ms.tasks ?? []).slice(0, 3).map((t: any) => (
                            <div key={t.id} className={`text-[11.5px] text-[#475569] flex items-center gap-1.5 ${t.status === "done" ? "line-through text-[#94a3b8]" : ""}`}>
                              <TaskStatusDot status={t.status} />
                              <span className="truncate">{t.title}</span>
                            </div>
                          ))}
                          {(ms.tasks ?? []).length > 3 && (
                            <span className="text-[11px] text-[#94a3b8] pl-5">+{(ms.tasks ?? []).length - 3} more</span>
                          )}
                          {msTotal === 0 && (
                            <span className="text-[11px] text-[#94a3b8] italic">No tasks yet</span>
                          )}
                        </div>
                        <div className="px-4 py-3.5 flex items-center">
                          <span className={`inline-flex items-center text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${
                            dlMs === "ok" ? "bg-[rgba(16,185,129,0.1)] text-[#10b981]" :
                            dlMs === "warn" ? "bg-[rgba(245,159,0,0.1)] text-[#f59f00]" :
                            dlMs === "late" ? "bg-[rgba(239,68,68,0.1)] text-[#ef4444]" :
                            "bg-[rgba(148,163,184,0.1)] text-[#94a3b8]"
                          }`}>
                            {ms.deadline ? formatDate(ms.deadline, { month: "short", day: "numeric" }) : "—"}
                          </span>
                        </div>
                        <div className="px-4 py-3.5 flex items-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <ProgressRing pct={ms.progress} color={ms.color ?? "#1B3FEE"} size={38} />
                            <span className="text-[9px] text-[#94a3b8]">{msDone}/{msTotal}</span>
                          </div>
                        </div>
                        <div className="px-4 py-3.5 flex items-center">
                          <Link href={`/projects/${project.id}`}>
                            <button className="text-[11px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-2.5 py-1 rounded-[7px] border border-[rgba(27,63,238,0.15)] cursor-pointer hover:bg-[rgba(27,63,238,0.14)] transition-colors whitespace-nowrap">
                              Open →
                            </button>
                          </Link>
                        </div>
                      </div>

                      {/* Mobile card */}
                      <div className="md:hidden p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: ms.color ?? "#1B3FEE" }}
                            />
                            <div className="text-[13px] font-semibold text-[#0f172a]">{ms.title}</div>
                          </div>
                          <ProgressRing pct={ms.progress} color={ms.color ?? "#1B3FEE"} size={38} />
                        </div>
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            dlMs === "ok" ? "bg-[rgba(16,185,129,0.1)] text-[#10b981]" :
                            dlMs === "warn" ? "bg-[rgba(245,159,0,0.1)] text-[#f59f00]" :
                            dlMs === "late" ? "bg-[rgba(239,68,68,0.1)] text-[#ef4444]" :
                            "bg-[rgba(148,163,184,0.1)] text-[#94a3b8]"
                          }`}>
                            {ms.deadline ? formatDate(ms.deadline, { month: "short", day: "numeric" }) : "No deadline"}
                          </span>
                          {msTotal > 0 && (
                            <span className="text-[11px] text-[#475569]">{msDone}/{msTotal} tasks done</span>
                          )}
                        </div>
                        {(ms.tasks ?? []).length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(ms.tasks ?? []).slice(0, 4).map((t: any) => (
                              <div key={t.id} className={`text-[12px] flex items-center gap-2 ${t.status === "done" ? "line-through text-[#94a3b8]" : "text-[#475569]"}`}>
                                <TaskStatusDot status={t.status} />
                                {t.title}
                              </div>
                            ))}
                            {(ms.tasks ?? []).length > 4 && (
                              <span className="text-[11px] text-[#94a3b8] pl-6">+{(ms.tasks ?? []).length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(project.milestones ?? []).length === 0 && (
                  <div className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">
                    No milestones yet.{" "}
                    <Link href={`/projects/${project.id}`} className="text-[#1B3FEE] font-semibold hover:underline">Open project →</Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {(!projects || projects.length === 0) && (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#1B3FEE]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-[#0f172a] mb-1">No projects yet</p>
            <p className="text-[13px] text-[#94a3b8]">Add a client and create a project to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
