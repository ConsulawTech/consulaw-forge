import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Profile, Client, Project } from "@/lib/types";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as Profile | null;
  if (!profile || profile.role !== "team") redirect("/portal");

  const { data: clientsRaw } = await supabase
    .from("clients")
    .select("*, projects(*)")
    .order("created_at");

  const clients = (clientsRaw ?? []) as (Client & { projects: Project[] })[];

  return (
    <div className="flex h-screen relative z-10 overflow-hidden">
      <Sidebar profile={profile} clients={clients} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
