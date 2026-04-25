"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { CheckSquare, Clock, BarChart2, Calendar, Play, Pause, RotateCcw, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface ClientOption {
  id: string;
  name: string;
  logo_letter: string | null;
  logo_color: string | null;
  projects: ProjectOption[];
}

interface ProjectOption {
  id: string;
  name: string;
  created_at: string;
  target_date: string | null;
  overall_progress: number;
}

interface Phase {
  id: string;
  title: string;
  color: string;
}

interface Task {
  id: string;
  phase: string;
  label: string;
  assignee: string;
  start: number;
  end: number;
}

interface Activity {
  day: number;
  text: string;
  who: string;
  color: string;
}

interface TimelineData {
  phases: Phase[];
  tasks: Task[];
  activities: Activity[];
  startDate: Date;
  totalDays: number;
  projectName: string;
  clientName: string;
}

// ── Fallback demo data ─────────────────────────────────────────────────────

const DEMO_PHASES: Phase[] = [
  { id: "design", title: "Design Phase", color: "#1B3FEE" },
  { id: "dev", title: "Full Development", color: "#8b5cf6" },
  { id: "qa", title: "Testing & QA", color: "#f59f00" },
  { id: "launch", title: "Launch Readiness", color: "#10b981" },
];

const DEMO_TASKS: Task[] = [
  { id: "t1", phase: "design", label: "Define layout & design system", assignee: "Jamaal", start: 0, end: 10 },
  { id: "t2", phase: "design", label: "Produce responsive UI mockups", assignee: "Jamaal", start: 8, end: 22 },
  { id: "t3", phase: "design", label: "Client approval on concept", assignee: "Jamaal", start: 20, end: 26 },
  { id: "t4", phase: "dev", label: "Implement reusable layout", assignee: "Naomi", start: 24, end: 40 },
  { id: "t5", phase: "dev", label: "Mobile responsiveness", assignee: "Naomi", start: 34, end: 48 },
  { id: "t6", phase: "dev", label: "Frontend & CMS integration", assignee: "Naomi", start: 44, end: 56 },
  { id: "t7", phase: "qa", label: "Create & run test cases", assignee: "Herald", start: 54, end: 62 },
  { id: "t8", phase: "qa", label: "Log and fix bugs", assignee: "Khalil", start: 60, end: 70 },
  { id: "t9", phase: "launch", label: "Complete deployment setup", assignee: "Naomi", start: 74, end: 82 },
  { id: "t10", phase: "launch", label: "Finalize client approvals", assignee: "Jamaal", start: 80, end: 88 },
  { id: "t11", phase: "launch", label: "Push live with checklist", assignee: "Khalil", start: 86, end: 96 },
];

const DEMO_ACTIVITIES: Activity[] = [
  { day: 2, text: "Project kicked off, brief shared with team", who: "Jamaal", color: "#1B3FEE" },
  { day: 10, text: "Layout structure defined and documented", who: "Jamaal", color: "#1B3FEE" },
  { day: 22, text: "Responsive UI mockups completed", who: "Jamaal", color: "#1B3FEE" },
  { day: 27, text: "Development sprint started", who: "Naomi", color: "#8b5cf6" },
  { day: 40, text: "Reusable layout components built", who: "Naomi", color: "#8b5cf6" },
  { day: 62, text: "All test cases executed", who: "Herald", color: "#f59f00" },
  { day: 88, text: "Final client approval received", who: "Jamaal", color: "#10b981" },
  { day: 96, text: "🚀 Site pushed to production — LIVE!", who: "Team", color: "#10b981" },
];

const DEMO_START = new Date("2025-05-01");
const DEMO_DAYS = 61;

const PHASE_COLORS = ["#1B3FEE", "#8b5cf6", "#f59f00", "#10b981", "#ef4444", "#0ea5e9"];

// ── Helpers ────────────────────────────────────────────────────────────────

function taskState(task: Task, pct: number) {
  return pct >= task.end ? "done" : pct >= task.start ? "active" : "pending";
}

function rpDate(pct: number, startDate: Date, totalDays: number) {
  const d = new Date(startDate.getTime() + (pct / 100) * totalDays * 86400000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Build timeline from real project data ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTimelineData(project: any, clientName: string): TimelineData {
  const startDate = new Date(project.created_at);
  const endDate = project.target_date
    ? new Date(project.target_date)
    : new Date(startDate.getTime() + 90 * 86400000);
  const totalMs = Math.max(1, endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(totalMs / 86400000);

  function toPercent(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const raw = ((d.getTime() - startDate.getTime()) / totalMs) * 100;
    return Math.max(0, Math.min(100, raw));
  }

  const milestones = (project.milestones ?? []) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  const msCount = milestones.length || 1;

  const phases: Phase[] = milestones.map((m: any, i: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: m.id as string,
    title: m.title as string,
    color: (m.color as string) ?? PHASE_COLORS[i % PHASE_COLORS.length],
  }));

  const tasks: Task[] = milestones.flatMap((m: any, mi: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const slotStart = (mi / msCount) * 100;
    const slotEnd = ((mi + 1) / msCount) * 100;
    const msDeadlinePct = toPercent(m.deadline);
    const msEndPct = msDeadlinePct ?? slotEnd;

    return ((m.tasks ?? []) as any[]).map((t: any, ti: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const taskCount = (m.tasks ?? []).length || 1;
      const defaultStart = slotStart + (ti / taskCount) * (msEndPct - slotStart);
      const defaultEnd = slotStart + ((ti + 1) / taskCount) * (msEndPct - slotStart);

      const rawStart = toPercent(t.created_at) ?? defaultStart;
      const rawEnd = toPercent(t.due_date) ?? msDeadlinePct ?? defaultEnd;
      const start = Math.max(0, Math.min(95, rawStart));
      const end = Math.max(start + 5, Math.min(100, rawEnd));

      return {
        id: t.id as string,
        phase: m.id as string,
        label: t.title as string,
        assignee: (t.assignee?.full_name as string) ?? "Unassigned",
        start,
        end,
      };
    });
  });

  const activities: Activity[] = [];
  milestones.forEach((m: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (m.deadline) {
      const dayNum = Math.round((new Date(m.deadline).getTime() - startDate.getTime()) / 86400000);
      activities.push({
        day: dayNum,
        text: `Milestone "${m.title}" deadline`,
        who: "Team",
        color: (m.color as string) ?? "#1B3FEE",
      });
    }
    ((m.tasks ?? []) as any[]).forEach((t: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (t.status === "done" && t.due_date) {
        const dayNum = Math.round((new Date(t.due_date).getTime() - startDate.getTime()) / 86400000);
        activities.push({
          day: Math.max(0, dayNum),
          text: `"${t.title}" completed`,
          who: (t.assignee?.full_name as string) ?? "Team",
          color: "#10b981",
        });
      }
    });
  });
  activities.sort((a, b) => a.day - b.day);

  return {
    phases,
    tasks,
    activities,
    startDate,
    totalDays,
    projectName: project.name as string,
    clientName,
  };
}

// ── Select component ───────────────────────────────────────────────────────

function Select({
  value, onChange, placeholder, children, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none pl-3 pr-8 py-2 rounded-[10px] bg-white/70 border border-white/60 text-[13px] font-medium text-[#0f172a] outline-none focus:border-[#1B3FEE]/30 min-w-[200px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function TimelineReplay({ clients }: { clients: ClientOption[] }) {
  const supabase = createClient();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);

  // Playback state
  const [pct, setPct] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [dragId, setDragId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const phases = timelineData?.phases ?? DEMO_PHASES;
  const activities = timelineData?.activities ?? DEMO_ACTIVITIES;
  const startDate = timelineData?.startDate ?? DEMO_START;
  const totalDays = timelineData?.totalDays ?? DEMO_DAYS;

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientProjects = selectedClient?.projects ?? [];

  // Load project data from Supabase when project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setTimelineData(null);
      setTasks(DEMO_TASKS);
      setPct(0);
      setPlaying(false);
      return;
    }

    async function loadProject() {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("projects")
          .select("*, milestones(*, tasks(*, assignee:profiles(*)))")
          .eq("id", selectedProjectId)
          .single();

        if (data) {
          const td = buildTimelineData(data, selectedClient?.name ?? "");
          setTimelineData(td);
          setTasks(td.tasks.length > 0 ? td.tasks : DEMO_TASKS);
        }
      } finally {
        setLoading(false);
        setPct(0);
        setPlaying(false);
      }
    }
    loadProject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  // Sync tasks when timelineData changes
  useEffect(() => {
    if (timelineData) setTasks(timelineData.tasks.length > 0 ? timelineData.tasks : DEMO_TASKS);
  }, [timelineData]);

  // Playback engine
  const step = useCallback((ts: number) => {
    if (!lastTsRef.current) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;
    setPct((p) => {
      const next = p + dt * speed * 3.5;
      if (next >= 100) { setPlaying(false); return 100; }
      return next;
    });
    rafRef.current = requestAnimationFrame(step);
  }, [speed]);

  useEffect(() => {
    if (playing) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(step);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, step]);

  function togglePlay() {
    if (pct >= 100) setPct(0);
    setPlaying((p) => !p);
  }

  function reset() {
    setPlaying(false);
    setPct(0);
    if (timelineData) setTasks(timelineData.tasks.length > 0 ? timelineData.tasks : DEMO_TASKS);
    else setTasks(DEMO_TASKS);
  }

  function moveTask(taskId: string, toPhase: string) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, phase: toPhase } : t));
  }

  const days = Math.round((pct / 100) * totalDays);
  const done = tasks.filter((t) => taskState(t, pct) === "done").length;
  const active = tasks.filter((t) => taskState(t, pct) === "active").length;
  const overallPct = tasks.length ? Math.round(((done + active * 0.5) / tasks.length) * 100) : 0;
  const visibleActivities = activities.filter((a) => days >= a.day);

  const isDemo = !timelineData;

  // Slider date labels
  const labelDates = [0, 33, 66, 100].map((p) => {
    const d = new Date(startDate.getTime() + (p / 100) * totalDays * 86400000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  return (
    <div>
      {/* ── Selector bar ── */}
      <div className="glass rounded-2xl p-4 mb-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Client</label>
            <Select
              value={selectedClientId}
              onChange={(v) => { setSelectedClientId(v); setSelectedProjectId(""); setTimelineData(null); }}
              placeholder="Select a client…"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Project</label>
            <Select
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              placeholder={selectedClientId ? "Select a project…" : "Select a client first…"}
              disabled={!selectedClientId || clientProjects.length === 0}
            >
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-[13px] text-[#475569] pb-0.5">
              <div className="w-4 h-4 border-2 border-[#1B3FEE] border-t-transparent rounded-full animate-spin" />
              Loading project…
            </div>
          )}

          {timelineData && !loading && (
            <div className="ml-auto flex items-center gap-3 pb-0.5">
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-bold text-[#0f172a]">
                  {timelineData.clientName} · {timelineData.projectName}
                </span>
                <span className="text-[11px] text-[#94a3b8]">
                  {totalDays} day project · {timelineData.tasks.length} tasks across {timelineData.phases.length} milestones
                </span>
              </div>
            </div>
          )}

          {isDemo && (
            <div className="ml-auto flex items-center gap-2 pb-0.5">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(27,63,238,0.08)] text-[#1B3FEE] border border-[rgba(27,63,238,0.15)]">
                Demo Mode
              </span>
              <span className="text-[12px] text-[#94a3b8]">Select a project to view real data</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard icon={CheckSquare} iconColor="green" value={done} label="Tasks completed" tag={`${done} done`} tagVariant="up" />
        <StatCard icon={Clock} iconColor="gold" value={active} label="In progress" tag={`${active} active`} tagVariant="gold" />
        <StatCard icon={BarChart2} iconColor="blue" value={`${overallPct}%`} label="Overall progress" tag={`${overallPct}%`} tagVariant="info" />
        <StatCard icon={Calendar} iconColor="purple" value={days} label="Days elapsed" tag={`Day ${days}`} tagVariant="neutral" />
      </div>

      {/* ── Board label ── */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-semibold text-[#475569] uppercase tracking-[0.06em]">
          {isDemo ? "Demo board — drag between phases" : "Task board — drag between phases"}
        </span>
        <span className="text-[12px] text-[#94a3b8]">
          Snapshot: <strong className="text-[#0f172a]">{rpDate(pct, startDate, totalDays)}</strong>
        </span>
      </div>

      {/* ── Kanban ── */}
      {phases.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[#94a3b8] text-[13px] mb-5">
          This project has no milestones yet. Add milestones from the project detail page.
        </div>
      ) : (
        <div className="grid gap-2.5 mb-5" style={{ gridTemplateColumns: `repeat(${Math.min(phases.length, 4)}, 1fr)` }}>
          {phases.map((phase) => {
            const phaseTasks = tasks.filter((t) => t.phase === phase.id);
            return (
              <div
                key={phase.id}
                className="glass rounded-2xl overflow-hidden min-h-[180px] flex flex-col transition-all duration-150"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (dragId) moveTask(dragId, phase.id); setDragId(null); }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/50">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: phase.color }} />
                  <span className="text-[12px] font-semibold text-[#0f172a] flex-1 truncate">{phase.title}</span>
                  <span className="text-[11px] text-[#475569] bg-white/60 border border-white/60 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {phaseTasks.length}
                  </span>
                </div>
                <div className="flex-1 p-2 flex flex-col gap-1.5">
                  {phaseTasks.map((task) => {
                    const state = taskState(task, pct);
                    const bg = state === "done" ? "rgba(16,185,129,0.08)" : state === "active" ? "rgba(27,63,238,0.06)" : "rgba(255,255,255,0.7)";
                    const border = state === "done" ? "rgba(16,185,129,0.2)" : state === "active" ? "rgba(27,63,238,0.15)" : "rgba(255,255,255,0.6)";
                    const dot = state === "done" ? "#10b981" : state === "active" ? "#1B3FEE" : "#94a3b8";
                    const startD = Math.round(task.start / 100 * totalDays);
                    const endD = Math.round(task.end / 100 * totalDays);
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDragId(task.id)}
                        className="rounded-[10px] p-2.5 cursor-grab active:cursor-grabbing select-none transition-all duration-200"
                        style={{ background: bg, border: `1px solid ${border}` }}
                      >
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: dot }} />
                          <div className="text-[12px] font-semibold text-[#0f172a] leading-snug">{task.label}</div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-[#475569]">{task.assignee}</span>
                          <span className="text-[10px] text-[#94a3b8]">Day {startD}–{endD}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border border-dashed border-[rgba(203,213,225,0.5)] rounded-[10px] p-2 text-center text-[11px] text-[#94a3b8] mt-1">
                    Drop task here
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Milestone progress ── */}
      <div className="glass rounded-2xl overflow-hidden mb-3.5">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/50">
          <Play className="w-4 h-4 text-[#1B3FEE]" />
          <span className="text-[14.5px] font-bold text-[#0f172a]">Milestone Progress</span>
          {timelineData && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 text-[#475569] border border-slate-200/60">
              {timelineData.clientName} · {timelineData.projectName}
            </span>
          )}
          {isDemo && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(27,63,238,0.08)] text-[#1B3FEE] border border-[rgba(27,63,238,0.15)]">
              Demo
            </span>
          )}
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
                    const bg = s === "done" ? "rgba(16,185,129,0.1)" : s === "active" ? "rgba(27,63,238,0.08)" : "rgba(241,245,249,0.9)";
                    const color = s === "done" ? "#10b981" : s === "active" ? "#1B3FEE" : "#475569";
                    return (
                      <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full border transition-all duration-200"
                        style={{ background: bg, color, borderColor: s === "done" ? "rgba(16,185,129,0.2)" : s === "active" ? "rgba(27,63,238,0.15)" : "rgba(203,213,225,0.4)" }}>
                        {t.label}
                      </span>
                    );
                  })}
                  {phaseTasks.length === 0 && (
                    <span className="text-[10px] text-[#94a3b8]">No tasks in this phase</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Activity log ── */}
      <div className="glass rounded-2xl overflow-hidden mb-3.5">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/50">
          <span className="text-[14.5px] font-bold text-[#0f172a]">Activity Log</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100/90 text-[#475569] border border-slate-200/60">
            {visibleActivities.length} event{visibleActivities.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="p-5 min-h-[60px] flex flex-col gap-2">
          {visibleActivities.length === 0 && (
            <p className="text-[12px] text-[#94a3b8]">Move the slider forward to see activity.</p>
          )}
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

      {/* ── Playback controls ── */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full border border-[rgba(203,213,225,0.5)] bg-white/60 flex items-center justify-center cursor-pointer hover:bg-white/85 transition-colors flex-shrink-0"
          >
            {playing
              ? <Pause className="w-4 h-4 text-[#0f172a]" />
              : <Play className="w-4 h-4 text-[#0f172a] ml-0.5" />}
          </button>

          <div className="flex gap-1.5">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold border cursor-pointer transition-all ${
                  speed === s
                    ? "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE] border-[rgba(27,63,238,0.2)]"
                    : "bg-white/65 text-[#475569] border-white/60 hover:bg-white/85"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/65 border border-white/60 text-[11px] font-semibold text-[#475569] cursor-pointer hover:bg-white/85 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>

          <span className="ml-auto text-[13px] font-semibold text-[#0f172a]">
            {rpDate(pct, startDate, totalDays)}
          </span>
        </div>

        <input
          type="range" min="0" max="100" step="0.5"
          value={pct}
          onChange={(e) => setPct(parseFloat(e.target.value))}
          className="w-full cursor-pointer accent-[#1B3FEE]"
        />

        <div className="flex justify-between mt-1.5">
          {labelDates.map((l, i) => (
            <span key={i} className="text-[10px] text-[#94a3b8]">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
