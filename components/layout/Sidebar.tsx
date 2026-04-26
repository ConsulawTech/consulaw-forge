"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Play,
  Users,
  MessageSquare,
  Plus,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile, Client, Project } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";

interface SidebarProps {
  profile: Profile;
  clients: (Client & { projects: Project[] })[];
}

const NAV_WORKSPACE = [
  { href: "/dashboard", label: "Dashboard",       icon: LayoutDashboard },
  { href: "/projects",  label: "Projects",         icon: FolderKanban },
  { href: "/tasks",     label: "Tasks",            icon: CheckSquare },
  { href: "/messages",  label: "Messages",         icon: MessageSquare },
  { href: "/clients",   label: "Clients",          icon: Users },
  { href: "/timeline",  label: "Timeline Replay",  icon: Play, badge: "New", badgeVariant: "blue" as const },
];

export function Sidebar({ profile, clients }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="hidden lg:flex w-[232px] min-w-[232px] flex-col h-screen glass border-r border-white/50 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.04)]">
      {/* Logo */}
      <div className="px-[18px] py-5 flex items-center gap-3 border-b border-white/40">
        <div className="w-[34px] h-[34px] bg-[#1B3FEE] rounded-[9px] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(27,63,238,0.3)]">
          <FileText className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold text-[#0f172a] tracking-tight">Forge</span>
          <span className="text-[10px] text-[#94a3b8] font-medium tracking-wide">consulawtech.com</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3.5 overflow-y-auto [scrollbar-width:none]">
        <NavGroup label="Workspace" items={NAV_WORKSPACE} isActive={isActive} />
      </nav>

      {/* Clients */}
      <div className="px-2.5 pb-3.5">
        <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-[#94a3b8] px-2 mb-2">
          Clients
        </span>
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] cursor-pointer transition-all duration-150 mb-0.5",
              isActive(`/clients/${client.id}`)
                ? "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]"
                : "hover:bg-white/60"
            )}
          >
            <div
              className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
              style={{ background: client.logo_color ?? "#e50914" }}
            >
              {client.logo_letter ?? client.name[0]}
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-[#0f172a] leading-tight">{client.name}</div>
              <div className="text-[11px] text-[#94a3b8] leading-tight">
                {client.projects[0]?.name ?? "No project"}
              </div>
            </div>
          </Link>
        ))}
        <Link href="/clients" className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-[10px] text-[#1B3FEE] text-xs font-semibold border border-dashed border-[rgba(27,63,238,0.3)] mt-1.5 transition-colors hover:bg-[rgba(27,63,238,0.08)] cursor-pointer">
          <Plus className="w-3 h-3" />
          Add New Client
        </Link>
      </div>

      {/* User */}
      <div className="px-2.5 pb-3 border-t border-white/40">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 mt-2 rounded-[12px] bg-white/50 border border-white/60 cursor-pointer hover:bg-white/70 transition-colors">
          <Avatar name={profile.full_name} color={profile.avatar_color ?? "#1B3FEE"} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#0f172a] truncate">{profile.full_name}</div>
            <div className="text-[11px] text-[#94a3b8]">{profile.job_title ?? "Project Lead"}</div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-[#94a3b8]" />
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; badge?: string; badgeVariant?: "red" | "blue" }[];
  isActive: (href: string) => boolean;
}) {
  return (
    <div className="mb-5">
      <span className="block text-[10px] font-bold tracking-[0.1em] uppercase text-[#94a3b8] px-2 mb-1.5">
        {label}
      </span>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-150 mb-0.5 select-none",
              active
                ? "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE] font-semibold"
                : "text-[#475569] hover:bg-white/60 hover:text-[#0f172a]"
            )}
          >
            {active && (
              <span className="absolute left-[-1px] top-[20%] h-[60%] w-[3px] bg-[#1B3FEE] rounded-r-[3px]" />
            )}
            <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-[1.4]",
                  item.badgeVariant === "red"
                    ? "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"
                    : "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
