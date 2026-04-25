import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { TimelineReplay } from "@/components/timeline/TimelineReplay";

export default async function TimelinePage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientsRaw } = await (supabase as any)
    .from("clients")
    .select("id, name, logo_letter, logo_color, projects(id, name, created_at, target_date, overall_progress)")
    .order("created_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clients = (clientsRaw ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    logo_letter: c.logo_letter as string | null,
    logo_color: c.logo_color as string | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: (c.projects ?? []).map((p: any) => ({
      id: p.id as string,
      name: p.name as string,
      created_at: p.created_at as string,
      target_date: p.target_date as string | null,
      overall_progress: p.overall_progress as number,
    })),
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="mb-5">
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Timeline Replay</h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Select a client and project to visualize its milestone timeline, then drag tasks and play the animation
          </p>
        </div>
        <TimelineReplay clients={clients} />
      </div>
    </div>
  );
}
