"use client";

import { LayoutDashboard, GitBranch, MessageSquare, LogOut, FileText, Settings, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";

const NAV = [
  { href: "/portal",           icon: LayoutDashboard, label: "Overview"   },
  { href: "/portal/timeline",  icon: GitBranch,        label: "Timeline"   },
  { href: "/portal/messages",  icon: MessageSquare,    label: "Messages"   },
  { href: "/portal/documents", icon: FolderOpen,       label: "Documents"  },
  { href: "/portal/settings",  icon: Settings,         label: "Settings"   },
];

interface PortalSidebarProps {
  profile: Profile;
  clientName: string;
}

export function PortalBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/50 flex">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
              active ? "text-[#1B3FEE]" : "text-[#94a3b8]"
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? "text-[#1B3FEE]" : "text-[#94a3b8]"}`} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalSidebar({ profile, clientName }: PortalSidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex w-[220px] flex-shrink-0 h-full flex-col glass border-r border-white/50 shadow-[1px_0_0_rgba(255,255,255,0.8)]">
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-white/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1B3FEE] rounded-[10px] flex items-center justify-center shadow-[0_2px_8px_rgba(27,63,238,0.3)] flex-shrink-0">
            <FileText className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold text-[#0f172a] tracking-tight">Forge</div>
            <div className="text-[11px] text-[#94a3b8] truncate">{clientName}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all ${
                active
                  ? "bg-[rgba(27,63,238,0.1)] text-[#1B3FEE]"
                  : "text-[#475569] hover:bg-white/60 hover:text-[#0f172a]"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#1B3FEE]" : "text-[#94a3b8]"}`} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="px-3 py-4 border-t border-white/50 flex flex-col gap-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Avatar name={profile.full_name} color={profile.avatar_color ?? "#1B3FEE"} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-[#0f172a] truncate">{profile.full_name}</div>
            <div className="text-[10.5px] text-[#94a3b8]">Client</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#475569] hover:bg-white/60 hover:text-[#0f172a] transition-colors cursor-pointer w-full"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
