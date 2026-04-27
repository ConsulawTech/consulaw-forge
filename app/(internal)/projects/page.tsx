"use server";

import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { AddProjectButton } from "@/components/projects/AddProjectButton";
import { ProjectsView } from "@/components/projects/ProjectsView";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const [{ data: projectsRaw }, { data: profiles }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:clients(*), milestones(*, tasks(*))")
      .order("created_at"),
    supabase.from("profiles").select("id, full_name, job_title").eq("role", "team"),
    supabase.from("clients").select("id, name").order("created_at"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (projectsRaw ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    target_date: p.target_date,
    status: p.status,
    client: p.client ? { name: p.client.name, logo_color: p.client.logo_color, logo_letter: p.client.logo_letter } : null,
    milestones: (p.milestones ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      color: m.color ?? "#1B3FEE",
      deadline: m.deadline ?? null,
      tasks: (m.tasks ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        due_date: t.due_date ?? null,
      })),
    })),
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-5 md:p-8 [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-[14px] text-slate-500 mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""} across your workspace
            </p>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AddProjectButton
            clients={(clients ?? []).map((c: any) => ({ id: c.id, name: c.name }))}
            teamProfiles={(profiles ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name, job_title: p.job_title }))}
          />
        </div>

        <ProjectsView projects={projects} />
      </div>
    </div>
  );
}
