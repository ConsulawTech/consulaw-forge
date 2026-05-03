import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { AddMilestoneButton } from "@/components/projects/AddMilestoneButton";
import { TasksPageView } from "@/components/tasks/TasksPageView";
import { FolderKanban } from "lucide-react";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ q?: string; project?: string }> }) {
  const { q, project: projectFilter } = await searchParams;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("milestones")
    .select("*, project:projects(id, name, client:clients(name, logo_color, logo_letter)), tasks(id, title, status, due_date, assignee:profiles(id, full_name))")
    .order("order_index");

  if (q) query = query.ilike("title", `%${q}%`);
  if (projectFilter) query = query.eq("project_id", projectFilter);

  const [{ data: milestones }, { data: projectsRaw }] = await Promise.all([
    query,
    supabase.from("projects").select("id, name").order("created_at"),
  ]);

  // Group milestones by project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: Record<string, { project: any; milestones: any[] }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ms of (milestones ?? []) as any[]) {
    const pid = ms.project?.id ?? "unassigned";
    if (!grouped[pid]) grouped[pid] = { project: ms.project, milestones: [] };
    grouped[pid].milestones.push(ms);
  }
  const groups = Object.values(grouped);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">
              {q ? `Results for "${q}"` : "All Tasks"}
            </h1>
            <p className="text-[14px] text-slate-500 mt-1">
              {milestones?.length ?? 0} task{milestones?.length !== 1 ? "s" : ""}{" "}
              {q ? "matching your search" : "across all projects"}
            </p>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AddMilestoneButton projects={(projectsRaw ?? []).map((p: any) => ({ id: p.id, name: p.name }))} label="Add Task" />
        </div>

        <TasksPageView groups={groups} q={q} />
      </div>
    </div>
  );
}
