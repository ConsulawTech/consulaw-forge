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
import { ProjectDocuments } from "@/components/documents/ProjectDocuments";
import { deleteProjectAction } from "@/app/actions/projects";
import { ProposalLightbox } from "@/components/proposals/ProposalLightbox";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projectRaw }, { data: profiles }, { data: documentsRaw }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:clients(*), milestones(*, tasks(*, assignee:profiles(*)))")
      .eq("id", id)
      .order("order_index", { referencedTable: "milestones", ascending: true })
      .single(),
    supabase.from("profiles").select("id, full_name, job_title").eq("role", "team"),
    supabase.from("documents").select("*").eq("project_id", id).order("created_at", { ascending: false }),
  ]);

  if (!projectRaw) notFound();

  // Fetch task dependencies for all checkpoints in this project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTaskIds = ((projectRaw as any).milestones ?? []).flatMap((m: any) => (m.tasks ?? []).map((t: any) => t.id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const depsRaw: any[] = allTaskIds.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? ((await (supabase as any).from("task_dependencies").select("task_id, depends_on_task_id").in("task_id", allTaskIds)).data ?? [])
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientId = (projectRaw as any).client_id as string | null;
  const { data: proposalsRaw } = clientId
    ? await supabase
        .from("proposals")
        .select("id, title, slug, status")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
    : { data: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = projectRaw as any;
  const dlStatus = deadlineStatus(project.target_date);

  // Compute progress from checkpoint statuses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCheckpoints = (project.milestones ?? []).flatMap((m: any) => m.tasks ?? []);
  const doneCheckpoints = allCheckpoints.filter((t: { status: string }) => t.status === "done").length;
  const overallProgress = allCheckpoints.length > 0 ? Math.round((doneCheckpoints / allCheckpoints.length) * 100) : 0;

  const projectForModal = [{ id: project.id, name: project.name }];
  const profilesForModal = (profiles ?? []).map((p: { id: string; full_name: string }) => ({ id: p.id, full_name: p.full_name }));
  const milestonesForModal = (project.milestones ?? []).map((m: { id: string; title: string }) => ({
    id: m.id,
    title: m.title,
    projectId: project.id,
  }));
  const teamProfilesForAi = (profiles ?? []).map((p: { id: string; full_name: string; job_title: string }) => ({ id: p.id, full_name: p.full_name, job_title: p.job_title }));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 [scrollbar-width:thin]">
        {/* Back + header */}
        <div className="flex items-start gap-3 mb-6 flex-wrap">
          <Link
            href="/projects"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-slate-300 hover:bg-slate-50 transition-colors mt-1"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-sm"
                style={{ background: project.client?.logo_color ?? "#e50914" }}
              >
                {project.client?.logo_letter ?? project.client?.name?.[0]}
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">
                  {project.client?.name} <span className="text-slate-300">/</span> {project.name}
                </h1>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {overallProgress}% complete · Target: {formatDate(project.target_date, { month: "short", year: "numeric" })}
                  {dlStatus === "late" && <span className="ml-2 text-red-500 font-semibold">· Overdue</span>}
                </p>
              </div>
            </div>
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
            <NewTaskButton projects={projectForModal} profiles={profilesForModal} milestones={milestonesForModal} defaultProjectId={project.id} label="Add Checkpoint" variant="secondary" />
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
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] font-semibold text-slate-700">Overall Progress</span>
            <span className="text-[20px] font-extrabold text-[#1B3FEE]">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#1B3FEE] transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-[12px] text-slate-500">
            <span>{allCheckpoints.length} checkpoints total</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-emerald-600 font-medium">{doneCheckpoints} done</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>{allCheckpoints.length - doneCheckpoints} remaining</span>
          </div>
        </div>

        {/* Documents */}
        <div className="mb-6">
          <ProjectDocuments projectId={project.id} initialDocuments={documentsRaw ?? []} />
        </div>

        {/* Linked proposals */}
        {proposalsRaw && proposalsRaw.length > 0 && (
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm p-5 mb-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-3">
              Linked Proposals
            </p>
            <ProposalLightbox proposals={proposalsRaw} />
          </div>
        )}

        {/* Tasks */}
        <CollapsibleMilestoneList
          milestones={project.milestones ?? []}
          projectId={project.id}
          projectForModal={projectForModal}
          profilesForModal={profilesForModal}
          initialDependencies={depsRaw}
        />
      </div>
    </div>
  );
}
