import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { formatDate, deadlineStatus } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AddMilestoneButton } from "@/components/projects/AddMilestoneButton";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { GenerateTasksButton } from "@/components/projects/GenerateTasksButton";
import { CollapsibleMilestoneList } from "@/components/projects/CollapsibleMilestoneList";
import { deleteProjectAction } from "@/app/actions/projects";

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

  // Compute progress from checkpoint statuses (stored fields may be stale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCheckpoints = (project.milestones ?? []).flatMap((m: any) => m.tasks ?? []);
  const doneCheckpoints = allCheckpoints.filter((t: { status: string }) => t.status === "done").length;
  const overallProgress = allCheckpoints.length > 0 ? Math.round((doneCheckpoints / allCheckpoints.length) * 100) : 0;

  const projectForModal = [{ id: project.id, name: project.name }];
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
              {overallProgress}% complete · Target: {formatDate(project.target_date, { month: "short", year: "numeric" })}
              {dlStatus === "late" && <span className="ml-2 text-[#ef4444] font-semibold">· Overdue</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <GenerateTasksButton
              projectId={project.id}
              projectName={project.name}
              projectDescription={project.description}
              targetDate={project.target_date}
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
            <span>{overallProgress}%</span>
          </div>
          <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-2">
            <div className="h-2 rounded-full bg-[#1B3FEE] transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        {/* Tasks */}
        <CollapsibleMilestoneList
          milestones={project.milestones ?? []}
          projectId={project.id}
          projectForModal={projectForModal}
          profilesForModal={profilesForModal}
        />
      </div>
    </div>
  );
}
