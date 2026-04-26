import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalSidebar, PortalBottomNav } from "@/components/layout/PortalSidebar";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as Profile | null;
  if (!profile || profile.role !== "client") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("profile_id", user.id)
    .single() as any;

  return (
    <div className="flex h-screen overflow-hidden relative z-10">
      <PortalSidebar profile={profile} clientName={client?.name ?? "Client"} />
      <div className="flex-1 overflow-hidden pb-[60px] md:pb-0">{children}</div>
      <PortalBottomNav />
    </div>
  );
}
