"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { CheckSquare, Clock, BarChart2, Calendar, Play, Pause, RotateCcw, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProjectOption {
  id: string;
  name: string;
  created_at: string;
  target_date: string | null;
  overall_progress: number;
}

interface Phase { id: string; title: string; color: string; }
interface Task  { id: string; phase: string; label: string; assignee: string; start: number; end: number; }
interface Activity { day: number; text: string; who: string; color: string; }
interface TimelineData {
  phases: Phase[]; tasks: Task[]; activities: Activity[];
  startDate: Date; totalDays: number; projectName: string;
}

const PHASE_COLORS = ["#1B3FEE", "#8b5cf6", "#f59f00", "#10b981", "#ef4444", "#0ea5e9"];

function taskState(task: Task, pct: number) {
  return pct >= task.end ? "done" : pct >= task.start ? "active" : "pending";
}

function rpDate(pct: number, startDate: Date, totalDays: number) {
  const d = new Date(startDate.getTime() + (pct / 100) * totalDays * 86400000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTimelineData(project: any): TimelineData {
  const startDate = new Date(project.created_at);
  const endDate   = project.target_date ? new Date(project.target_date) : new Date(startDate.getTime() + 90 * 86400000);
  const totalMs   = Math.max(1, endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(totalMs / 86400000);

  function toPercent(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const raw = ((new Date(dateStr).getTime() - startDate.getTime()) / totalMs) * 100;
    return Math.max(0, Math.min(100, raw));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const milestones = (project.milestones ?? []) as any[];
  const msCount = milestones.length || 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phases: Phase[] = milestones.map((m: any, i: number) => ({
    id: m.id, title: m.title, color: m.color ?? PHASE_COLORS[i % PHASE_COLORS.length],
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks: Task[] = milestones.flatMap((m: any, mi: number) => {
    const slotStart    = (mi / msCount) * 100;
    const slotEnd      = ((mi + 1) / msCount) * 100;
    const msDeadlinePct = toPercent(m.deadline);
    const msEndPct     = msDeadlinePct ?? slotEnd;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((m.tasks ?? []) as any[]).map((t: any, ti: number) => {
      const taskCount    = (m.tasks ?? []).length || 1;
      const defaultStart = slotStart + (ti / taskCount) * (msEndPct - slotStart);
      const defaultEnd   = slotStart + ((ti + 1) / taskCount) * (msEndPct - slotStart);
      const rawStart     = toPercent(t.created_at) ?? defaultStart;
      const rawEnd       = toPercent(t.due_date) ?? msDeadlinePct ?? defaultEnd;
      return {
        id: t.id, phase: m.id, label: t.title,
        assignee: t.assignee?.full_name ?? "Unassigned",
        start: Math.max(0, Math.min(95, rawStart)),
        end:   Math.max(rawStart + 5, Math.min(100, rawEnd)),
      };
    });
  });

  const activities: Activity[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  milestones.forEach((m: any) => {
    if (m.deadline) activities.push({
      day: Math.round((new Date(m.deadline).getTime() - startDate.getTime()) / 86400000),
      text: `Milestone "${m.title}" deadline`, who: "Team", color: m.color ?? "#1B3FEE",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((m.tasks ?? []) as any[]).forEach((t: any) => {
      if (t.status === "done" && t.due_date) activities.push({
        day:   Math.max(0, Math.round((new Date(t.due_date).getTime() - startDate.getTime()) / 86400000)),
        text:  `"${t.title}" completed`,
        who:   t.assignee?.full_name ?? "Team",
        color: "#10b981",
      });
    });
  });
  activities.sort((a, b) => a.day - b.day);

  return { phases, tasks, activities, startDate, totalDays, projectName: project.name };
}

export function PortalTimelineReplay({ projects }: { projects: ProjectOption[] }) {
  const supabase = createClient();

  const [selectedProjectId, setSelectedProjectId] = useState(projects.length === 1 ? projects[0].id : "");
  const [loading, setLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [pct, setPct]       = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]   = useState(1);
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const rafRef   = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const phases     = timelineData?.phases ?? [];
  const activities = timelineData?.activities ?? [];
  const startDate  = timelineData?.startDate ?? new Date();
  const totalDays  = timelineData?.totalDays ?? 90;

  useEffect(() => {
    if (!selectedProjectId) { setTimelineData(null); setTasks([]); setPct(0); setPlaying(false); return; }
    (async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("projects")
          .select("*, milestones(*, tasks(*, assignee:profiles(*)))")
          .eq("id", selectedProjectId)
          .single();
        if (data) {
          const td = buildTimelineData(data);
          setTimelineData(td);
          setTasks(td.tasks);
        }
      } finally {
        setLoading(false); setPct(0); setPlaying(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => { if (timelineData) setTasks(timelineData.tasks); }, [timelineData]);

  const step = useCallback((ts: number) => {
    if (!lastTsRef.current) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;
    setPct((p) => { const next = p + dt * speed * 3.5; if (next >= 100) { setPlaying(false); return 100; } return next; });
    rafRef.current = requestAnimationFrame(step);
  }, [speed]);

  useEffect(() => {
    if (playing) { lastTsRef.current = null; rafRef.current = requestAnimationFrame(step); }
    else { if (rafRef.current) cancelAnimationFrame(rafRef.current); }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, step]);

  const togglePlay = () => { if (pct >= 100) setPct(0); setPlaying((p) => !p); };
  const reset      = () => { setPlaying(false); setPct(0); if (timelineData) setTasks(timelineData.tasks); };
  const moveTask   = (taskId: string, toPhase: string) =>
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: toPhase } : t));

  const days             = Math.round((pct / 100) * totalDays);
  const done             = tasks.filter((t) => taskState(t, pct) === "done").length;
  const active           = tasks.filter((t) => taskState(t, pct) === "active").length;
  const overallPct       = tasks.length ? Math.round(((done + active * 0.5) / tasks.length) * 100) : 0;
  const visibleActivities = activities.filter((a) => days >= a.day);
  const labelDates       = [0, 33, 66, 100].map((p) => {
    const d = new Date(startDate.getTime() + (p / 100) * totalDays * 86400000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  return (
    <div className="h-full overflow-y-auto p-6 [scrollbar-width:thin]">

      {/* Project selector */}
      {projects.length > 1 && (
        <div className="glass rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8] flex-shrink-0">Project</label>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-[10px] bg-white/70 border border-white/60 text-[13px] font-medium text-[#0f172a] outline-none focus:border-[#1B3FEE]/30 min-w-[240px] cursor-pointer"
              >
                <option value="">Select a project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {loading && <div className="w-4 h-4 border-2 border-[#1B3FEE] border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>
      )}

      {/* Empty / loading */}
      {!timelineData && !loading && (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(27,63,238,0.07)] flex items-center justify-center mb-4">
            <Play className="w-7 h-7 text-[#1B3FEE]" strokeWidth={1.6} />
          </div>
          <h3 className="text-[16px] font-bold text-[#0f172a] mb-1.5">
            {projects.length === 0 ? "No projects yet" : "Select a project above"}
          </h3>
          <p className="text-[13px] text-[#94a3b8] max-w-[300px] leading-relaxed">
            {projects.length === 0
              ? "Your team hasn't set up a project for you yet. Check back soon!"
              : "Choose a project to visualise its milestone timeline."}
          </p>
        </div>
      )}
      {loading && (
        <div className="glass rounded-2xl flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#1B3FEE] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {timelineData && !loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard icon={CheckSquare} iconColor="green"  value={done}        label="Tasks completed" tag={`${done} done`}      tagVariant="up"      />
            <StatCard icon={Clock}       iconColor="gold"   value={active}      label="In progress"     tag={`${active} active`}  tagVariant="gold"    />
            <StatCard icon={BarChart2}   iconColor="blue"   value={`${overallPct}%`} label="Overall progress" tag={`${overallPct}%`} tagVariant="info" />
            <StatCard icon={Calendar}    iconColor="purple" value={days}        label="Days elapsed"    tag={`Day ${days}`}        tagVariant="neutral" />
          </div>

          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] font-semibold text-[#475569] uppercase tracking-[0.06em]">Task board</span>
            <span className="text-[12px] text-[#94a3b8]">
              Snapshot: <strong className="text-[#0f172a]">{rpDate(pct, startDate, totalDays)}</strong>
            </span>
          </div>

          {/* Kanban */}
          {phases.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-[#94a3b8] text-[13px] mb-5">
              No milestones set up yet.
            </div>
          ) : (
            <div className="grid gap-2.5 mb-5" style={{ gridTemplateColumns: `repeat(${Math.min(phases.length, 3)}, 1fr)` }}>
              {phases.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase.id);
                return (
                  <div
                    key={phase.id}
                    className="glass rounded-2xl overflow-hidden min-h-[160px] flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (dragId) moveTask(dragId, phase.id); setDragId(null); }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/50">
                      <div className="w-2 h-2 rounded-full" style={{ background: phase.color }} />
                      <span className="text-[12px] font-semibold text-[#0f172a] flex-1 truncate">{phase.title}</span>
                      <span className="text-[11px] text-[#475569] bg-white/60 border border-white/60 px-1.5 py-0.5 rounded-full">{phaseTasks.length}</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-1.5">
                      {phaseTasks.map((task) => {
                        const state  = taskState(task, pct);
                        const bg     = state === "done" ? "rgba(16,185,129,0.08)" : state === "active" ? "rgba(27,63,238,0.06)" : "rgba(255,255,255,0.7)";
                        const border = state === "done" ? "rgba(16,185,129,0.2)"  : state === "active" ? "rgba(27,63,238,0.15)" : "rgba(255,255,255,0.6)";
                        const dot    = state === "done" ? "#10b981" : state === "active" ? "#1B3FEE" : "#94a3b8";
                        return (
                          <div key={task.id} draggable onDragStart={() => setDragId(task.id)}
                            className="rounded-[10px] p-2.5 cursor-grab active:cursor-grabbing select-none transition-all duration-200"
                            style={{ background: bg, border: `1px solid ${border}` }}
                          >
                            <div className="flex items-start gap-1.5 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: dot }} />
                              <div className="text-[12px] font-semibold text-[#0f172a] leading-snug">{task.label}</div>
                            </div>
                            <div className="text-[10px] text-[#475569] pl-3">{task.assignee}</div>
                          </div>
                        );
                      })}
                      <div className="border border-dashed border-[rgba(203,213,225,0.5)] rounded-[10px] p-2 text-center text-[11px] text-[#94a3b8] mt-1">
                        Drop here
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Milestone progress */}
          <div className="glass rounded-2xl overflow-hidden mb-3.5">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/50">
              <Play className="w-4 h-4 text-[#1B3FEE]" />
              <span className="text-[14px] font-bold text-[#0f172a]">Milestone Progress — {timelineData.projectName}</span>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {phases.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase.id);
                let prog = 0;
                phaseTasks.forEach((t) => {
                  const s = taskState(t, pct);
                  if (s === "done") prog += 1;
                  else if (s === "active") prog += (pct - t.start) / Math.max(1, t.end - t.start);
                });
                const p = phaseTasks.length ? Math.round((prog / phaseTasks.length) * 100) : 0;
                return (
                  <div key={phase.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: phase.color }} />
                      <span className="text-[13px] font-semibold text-[#0f172a] flex-1">{phase.title}</span>
                      <span className="text-[13px] font-semibold" style={{ color: phase.color }}>{p}%</span>
                    </div>
                    <div className="bg-[rgba(241,245,249,0.9)] rounded h-1.5">
                      <div className="h-1.5 rounded transition-all duration-300" style={{ width: `${p}%`, background: phase.color }} />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {phaseTasks.map((t) => {
                        const s = taskState(t, pct);
                        const bg    = s === "done" ? "rgba(16,185,129,0.1)" : s === "active" ? "rgba(27,63,238,0.08)" : "rgba(241,245,249,0.9)";
                        const color = s === "done" ? "#10b981" : s === "active" ? "#1B3FEE" : "#475569";
                        return (
                          <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full border transition-all duration-200"
                            style={{ background: bg, color, borderColor: s === "done" ? "rgba(16,185,129,0.2)" : s === "active" ? "rgba(27,63,238,0.15)" : "rgba(203,213,225,0.4)" }}>
                            {t.label}
                          </span>
                        );
                      })}
                      {phaseTasks.length === 0 && <span className="text-[10px] text-[#94a3b8]">No tasks</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity log */}
          {visibleActivities.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden mb-3.5">
              <div className="px-5 py-4 border-b border-white/50">
                <span className="text-[14px] font-bold text-[#0f172a]">Activity Log</span>
              </div>
              <div className="p-5 flex flex-col gap-2">
                {visibleActivities.slice(-5).reverse().map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px] text-[#0f172a]">
                    <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: a.color }} />
                    <span>
                      <strong className="text-[#475569] font-semibold">{a.who}</strong> — {a.text}
                      <span className="text-[#94a3b8] ml-1.5">Day {a.day}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playback controls */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <button onClick={togglePlay}
                className="w-9 h-9 rounded-full border border-[rgba(203,213,225,0.5)] bg-white/60 flex items-center justify-center cursor-pointer hover:bg-white/85 transition-colors">
                {playing ? <Pause className="w-4 h-4 text-[#0f172a]" /> : <Play className="w-4 h-4 text-[#0f172a] ml-0.5" />}
              </button>
              <div className="flex gap-1.5">
                {[0.5, 1, 2, 4].map((s) => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all ${
                      speed === s ? "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE] border-[rgba(27,63,238,0.2)]" : "bg-white/65 text-[#475569] border-white/60 hover:bg-white/85"}`}>
                    {s}×
                  </button>
                ))}
              </div>
              <button onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/65 border border-white/60 text-[11px] font-semibold text-[#475569] cursor-pointer hover:bg-white/85 transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
              <span className="ml-auto text-[13px] font-semibold text-[#0f172a]">{rpDate(pct, startDate, totalDays)}</span>
            </div>
            <input type="range" min="0" max="100" step="0.5" value={pct}
              onChange={(e) => setPct(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-[#1B3FEE]" />
            <div className="flex justify-between mt-1.5">
              {labelDates.map((l, i) => <span key={i} className="text-[10px] text-[#94a3b8]">{l}</span>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
