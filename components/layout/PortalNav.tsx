"use client";

import { LogOut, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";

interface PortalNavProps {
  profile: Profile;
  clientName: string;
}

export function PortalNav({ profile, clientName }: PortalNavProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-[58px] flex-shrink-0 glass border-b border-white/50 flex items-center px-6 gap-4 shadow-[0_1px_0_rgba(255,255,255,0.8)]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#1B3FEE] rounded-[8px] flex items-center justify-center shadow-[0_2px_8px_rgba(27,63,238,0.25)]">
          <FileText className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
        </div>
        <span className="text-sm font-bold text-[#0f172a]">Forge</span>
        <span className="text-[#94a3b8] text-sm">/</span>
        <span className="text-sm font-medium text-[#475569]">{clientName}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={profile.full_name} color={profile.avatar_color ?? "#1B3FEE"} size="sm" />
          <span className="text-sm font-semibold text-[#0f172a]">{profile.full_name}</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
