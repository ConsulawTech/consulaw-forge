import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalMessages } from "@/components/portal/PortalMessages";

export default async function PortalMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientRaw } = await supabase
    .from("clients")
    .select("*, projects(id, name)")
    .eq("profile_id", user.id)
    .single() as any;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: { id: string; name: string }[] = ((clientRaw?.projects ?? []) as any[]).map((p: any) => ({
    id: p.id as string,
    name: p.name as string,
  }));

  const firstProjectId = projects[0]?.id ?? "";

  // Fetch initial messages for the first project
  const { data: initialMessages } = firstProjectId
    ? await supabase
        .from("messages")
        .select("*")
        .eq("project_id", firstProjectId)
        .order("created_at")
        .limit(50)
    : { data: [] };

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center max-w-sm border border-white/50">
          <div className="text-[#0f172a] font-bold text-[16px] mb-1.5">No projects yet</div>
          <p className="text-[13px] text-[#475569]">Once your team sets up a project, you can message them here.</p>
        </div>
      </div>
    );
  }

  return (
    <PortalMessages
      projects={projects}
      initialProjectId={firstProjectId}
      initialMessages={initialMessages ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      senderName={(profile as any)?.full_name ?? clientRaw?.name ?? "Client"}
    />
  );
}
