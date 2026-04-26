import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, getAvatarColor, deadlineStatus } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AddMilestoneButton } from "@/components/projects/AddMilestoneButton";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { GenerateTasksButton } from "@/components/projects/GenerateTasksButton";
import { deleteProjectAction, deleteMilestoneAction, deleteTaskAction } from "@/app/actions/projects";

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-[38px] h-[38px] flex-shrink-0">
      <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(241,245,249,0.95)" strokeWidth="4" />
        <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#0f172a]">{pct}%</div>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projectRaw }, { data: profiles }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:clients(*), milestones(*, tasks(*, assignee:profiles(*)))")
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("id, full_name, job_title").eq("role", "team"),
  ]);

  if (!projectRaw) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = projectRaw as any;
  const dlStatus = deadlineStatus(project.target_date);

  const projectForModal = [{ id: project.id, name: project.name, milestones: (project.milestones ?? []).map((m: any) => ({ id: m.id, title: m.title })) }];
  const profilesForModal = (profiles ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name }));
  const teamProfilesForAi = (profiles ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name, job_title: p.job_title }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <Link href="/projects" className="w-8 h-8 rounded-[10px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-[#475569]" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">{project.client?.name} — {project.name}</h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              {project.overall_progress}% complete · Target: {formatDate(project.target_date, { month: "short", year: "numeric" })}
              {dlStatus === "late" && <span className="ml-2 text-[#ef4444] font-semibold">· Overdue</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <GenerateTasksButton
              projectId={project.id}
              projectName={project.name}
              projectDescription={project.description}
              teamProfiles={teamProfilesForAi}
            />
            <AddMilestoneButton projects={[{ id: project.id, name: project.name }]} defaultProjectId={project.id} label="Add Task" />
            <NewTaskButton projects={projectForModal} profiles={profilesForModal} defaultProjectId={project.id} label="Add Checkpoint" variant="secondary" />
            <DeleteButton
              entityId={project.id}
              entityName={project.name}
              entityType="project"
              deleteAction={deleteProjectAction}
              redirectAfterDelete="/projects"
              size="md"
            />
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="glass rounded-2xl p-5 mb-5">
          <div className="flex justify-between text-[12px] font-semibold text-[#475569] mb-2">
            <span>Overall Progress</span>
            <span>{project.overall_progress}%</span>
          </div>
          <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-2">
            <div className="h-2 rounded-full bg-[#1B3FEE] transition-all" style={{ width: `${project.overall_progress}%` }} />
          </div>
        </div>

        {/* Tasks */}
        {(project.milestones ?? []).length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-[#94a3b8] text-sm">
            No tasks yet. Click &quot;Add Task&quot; to get started.
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (project.milestones ?? []).map((ms: any) => {
            const dlMs = deadlineStatus(ms.deadline);
            return (
              <div key={ms.id} className="glass rounded-2xl overflow-hidden mb-4">
                {/* Task header */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-white/50">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ms.color ?? "#1B3FEE" }} />
                  <div className="flex-1">
                    <div className="text-[14px] font-bold text-[#0f172a]">{ms.title}</div>
                    {ms.description && <div className="text-[12px] text-[#475569] mt-0.5">{ms.description}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    {ms.deadline && (
                      <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${
                        dlMs === "ok" ? "bg-[rgba(16,185,129,0.1)] text-[#10b981]"
                        : dlMs === "warn" ? "bg-[rgba(245,159,0,0.1)] text-[#f59f00]"
                        : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"
                      }`}>
                        {formatDate(ms.deadline, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <ProgressRing pct={ms.progress ?? 0} color={ms.color ?? "#1B3FEE"} />
                    <NewTaskButton
                      projects={projectForModal}
                      profiles={profilesForModal}
                      defaultProjectId={project.id}
                      label="+ Checkpoint"
                      variant="inline"
                    />
                    <DeleteButton
                      entityId={ms.id}
                      entityName={ms.title}
                      entityType="task"
                      deleteAction={deleteMilestoneAction}
                    />
                  </div>
                </div>

                {/* Checkpoints */}
                {(ms.tasks ?? []).length === 0 ? (
                  <div className="px-5 py-4 text-[12px] text-[#94a3b8]">No checkpoints yet for this task.</div>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (ms.tasks ?? []).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-3 border-b border-white/50 last:border-0 hover:bg-white/40 transition-colors group">
                      <div className="min-w-[96px]">
                        <div className="text-[12px] font-semibold text-[#0f172a]">
                          {task.due_date ? formatDate(task.due_date, { month: "short", day: "numeric" }) : "No date"}
                        </div>
                      </div>
                      {task.assignee ? (
                        <Avatar name={task.assignee.full_name} color={getAvatarColor(task.assignee.full_name)} size="xs" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[rgba(148,163,184,0.2)] flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-[#0f172a]">{task.title}</div>
                        <div className="text-[11px] text-[#94a3b8]">{task.assignee?.full_name ?? "Unassigned"}</div>
                      </div>
                      <TaskStatusBadge status={task.status} />
                      <DeleteButton
                        entityId={task.id}
                        entityName={task.title}
                        entityType="checkpoint"
                        deleteAction={deleteTaskAction}
                      />
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
