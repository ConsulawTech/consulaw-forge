import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalTimelineReplay } from "@/components/portal/PortalTimelineReplay";

export default async function PortalTimelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: client } = await supabase
    .from("clients")
    .select("id, projects(id, name, created_at, target_date, overall_progress)")
    .eq("profile_id", user.id)
    .single() as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = ((client?.projects ?? []) as any[]).map((p: any) => ({
    id:               p.id               as string,
    name:             p.name             as string,
    created_at:       p.created_at       as string,
    target_date:      p.target_date      as string | null,
    overall_progress: p.overall_progress as number,
  }));

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="px-6 pt-6 pb-2 flex-shrink-0">
        <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Timeline Replay</h1>
        <p className="text-[13px] text-[#475569] mt-0.5">
          Visualise your project milestones — drag tasks and play the animation
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <PortalTimelineReplay projects={projects} />
      </div>
    </div>
  );
}
