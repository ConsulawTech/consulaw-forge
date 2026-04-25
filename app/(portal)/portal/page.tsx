import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatWidget } from "@/components/portal/ChatWidget";
import { formatDate } from "@/lib/utils";
import { Activity, CheckSquare, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: client } = await supabase
    .from("clients")
    .select("*, projects(*, milestones(*), project_members(*, profile:profiles(*)))")
    .eq("profile_id", user.id)
    .single() as any;

  if (!client) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center max-w-sm">
          <div className="text-[#0f172a] font-bold text-lg mb-2">No project assigned yet</div>
          <p className="text-[13px] text-[#475569]">Your team is setting things up. Check back soon!</p>
        </div>
      </div>
    );
  }

  const project = client.projects?.[0];
  const milestones = project?.milestones ?? [];
  const members = project?.project_members ?? [];

  const { data: updates } = await supabase
    .from("updates")
    .select("*")
    .eq("project_id", project?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", project?.id ?? "")
    .order("created_at")
    .limit(20);

  return (
    <div className="h-full overflow-y-auto p-6 [scrollbar-width:thin] relative z-10">

      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-7 text-white mb-4 flex items-center gap-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1a2060 60%, #1B3FEE 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div className="absolute top-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full bg-white/[0.04]" />
        <div className="absolute bottom-[-30px] right-[120px] w-[100px] h-[100px] rounded-full bg-white/[0.03]" />
        <div
          className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[22px] font-black text-white flex-shrink-0 relative z-10"
          style={{ background: client.logo_color ?? "#e50914", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
        >
          {client.logo_letter ?? client.name[0]}
        </div>
        <div className="flex-1 relative z-10">
          <div className="text-[13px] text-white/55 mb-1">Welcome back, {client.name} team 👋</div>
          <div className="text-[22px] font-extrabold tracking-tight">{project?.name ?? "Your Project"}</div>
          <div className="text-[13px] text-white/60 mt-1">Managed by Consulaw Tech · Forge</div>
        </div>
        <div className="text-right relative z-10">
          <div className="text-[40px] font-extrabold text-[#f59f00] leading-none">
            {project?.overall_progress ?? 0}%
          </div>
          <div className="text-[12px] text-white/50 mt-1">Overall Complete</div>
        </div>
      </div>

      {/* Progress + Updates */}
      <div className="grid grid-cols-2 gap-3.5 mb-3.5">
        {/* Milestones */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-white/50">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#1B3FEE]" />
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">Milestone Progress</span>
          </div>
          <div className="p-[18px] flex flex-col gap-3.5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {milestones.map((ms: any) => (
              <div key={ms.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-[#0f172a] mb-1.5">{ms.title}</div>
                  <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${ms.progress}%`, background: ms.color }}
                    />
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#475569] whitespace-nowrap">{ms.progress}%</span>
              </div>
            ))}
            {milestones.length === 0 && (
              <p className="text-[13px] text-[#94a3b8]">No milestones yet.</p>
            )}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-[18px] py-3.5 border-b border-white/50">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-[#10b981]" />
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">Recent Updates</span>
          </div>
          <div className="p-[18px] flex flex-col gap-3.5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(updates ?? []).map((u: any) => (
              <div key={u.id} className="flex gap-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: u.color }} />
                <div>
                  <div className="text-[12.5px] font-medium text-[#0f172a] leading-snug">{u.title}</div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">
                    {formatDate(u.created_at, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
            {(!updates || updates.length === 0) && (
              <p className="text-[13px] text-[#94a3b8]">No updates yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#475569]" />
          <span className="text-[13px] font-bold text-[#0f172a]">Your Dedicated Team</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {members.map((m: any) => (
            <div key={m.profile_id} className="text-center">
              <Avatar
                name={m.profile?.full_name ?? "?"}
                color={m.profile?.avatar_color ?? "#1B3FEE"}
                size="lg"
                className="mx-auto mb-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
              />
              <div className="text-[12px] font-semibold text-[#0f172a]">{m.profile?.full_name}</div>
              <div className="text-[10.5px] text-[#94a3b8] mt-0.5">{m.profile?.job_title ?? "Team Member"}</div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="col-span-4 text-[13px] text-[#94a3b8]">Team members will appear here.</p>
          )}
        </div>
      </div>

      {/* Chat widget */}
      {project && (
        <ChatWidget
          projectId={project.id}
          initialMessages={messages ?? []}
        />
      )}
    </div>
  );
}
