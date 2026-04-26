import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { InternalMessages } from "@/components/messages/InternalMessages";

export default async function MessagesPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: projectsRaw } = await db
    .from("projects")
    .select("id, name, client:clients(name)")
    .order("created_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = ((projectsRaw ?? []) as any[]).map((p: any) => ({
    id: p.id as string,
    name: p.name as string,
    clientName: (p.client?.name as string) ?? "Unknown Client",
  }));

  const firstProjectId = projects[0]?.id ?? "";

  const { data: initialMessages } = firstProjectId
    ? await db
        .from("messages")
        .select("*")
        .eq("project_id", firstProjectId)
        .order("created_at")
        .limit(50)
    : { data: [] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  if (projects.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="glass rounded-2xl p-10 text-center max-w-sm border border-white/50">
            <div className="text-[#0f172a] font-bold text-[16px] mb-1.5">No projects yet</div>
            <p className="text-[13px] text-[#475569]">Add a client and create a project to enable messaging.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-hidden">
        <InternalMessages
          projects={projects}
          initialProjectId={firstProjectId}
          initialMessages={initialMessages ?? []}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          senderName={(profile as any)?.full_name ?? "Team"}
        />
      </div>
    </div>
  );
}
