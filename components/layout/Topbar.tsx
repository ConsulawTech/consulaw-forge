"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Settings, Plus, Search, LogOut, X, CheckSquare, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "task" | "client";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface TopbarProps {
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Topbar({ tabs, activeTab, onTabChange }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allItems, setAllItems] = useState<SearchResult[]>([]);

  const [bellOpen, setBellOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [taskOpen, setTaskOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalProjects, setModalProjects] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalProfiles, setModalProfiles] = useState<any[]>([]);
  const [modalReady, setModalReady] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build search index on mount
  useEffect(() => {
    async function loadIndex() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [{ data: tasks }, { data: clients }] = await Promise.all([
        db.from("tasks").select("id, title, status, project:projects(name)").limit(100),
        db.from("clients").select("id, name, projects(name)").limit(50),
      ]);
      const items: SearchResult[] = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(tasks ?? []).map((t: any) => ({
          type: "task" as const,
          id: t.id,
          title: t.title,
          subtitle: t.project?.name ?? "",
          href: `/tasks`,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(clients ?? []).map((c: any) => ({
          type: "client" as const,
          id: c.id,
          title: c.name,
          subtitle: c.projects?.[0]?.name ?? "No project",
          href: `/clients/${c.id}`,
        })),
      ];
      setAllItems(items);
    }
    loadIndex();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter search results as user types
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSearchResults([]); return; }
    const filtered = allItems
      .filter((i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q))
      .slice(0, 7);
    setSearchResults(filtered);
  }, [searchQuery, allItems]);

  async function loadNotifications() {
    if (notifLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("tasks")
      .select("id, title, status, due_date, project:projects(name)")
      .in("status", ["late", "in_progress"])
      .order("due_date")
      .limit(5);
    const notifs = data ?? [];
    setNotifications(notifs);
    setNotifLoaded(true);
    if (notifs.length === 0) setHasUnread(false);
  }

  function openBell() {
    setBellOpen((p) => !p);
    if (!bellOpen) {
      setHasUnread(false);
      loadNotifications();
    }
  }

  async function openNewTask() {
    if (!modalReady) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [{ data: projs }, { data: profs }] = await Promise.all([
        db.from("projects").select("id, name, milestones(id, title)").order("created_at"),
        db.from("profiles").select("id, full_name").eq("role", "team"),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setModalProjects((projs ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        milestones: (p.milestones ?? []).map((m: any) => ({ id: m.id, title: m.title })),
      })));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setModalProfiles((profs ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name })));
      setModalReady(true);
    }
    setTaskOpen(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-[58px] flex-shrink-0 glass border-b border-white/50 flex items-center px-6 gap-3 shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-40">
      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <>
          <div className="flex gap-px bg-[rgba(241,245,249,0.8)] rounded-[10px] p-[3px] border border-white/50">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                className={
                  tab === activeTab
                    ? "px-3 py-[5px] rounded-lg text-[12.5px] font-semibold text-[#0f172a] bg-white/90 shadow-[0_1px_4px_rgba(0,0,0,0.08)] cursor-pointer"
                    : "px-3 py-[5px] rounded-lg text-[12.5px] font-medium text-[#475569] cursor-pointer hover:text-[#0f172a] transition-colors"
                }
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="w-px h-[22px] bg-[rgba(203,213,225,0.4)] mx-1" />
        </>
      )}

      {/* Search */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center gap-2 bg-white/60 border border-white/60 rounded-[10px] px-3 py-[7px] w-[220px] backdrop-blur-sm focus-within:border-[#1B3FEE]/30 transition-colors">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                router.push(`/tasks?q=${encodeURIComponent(searchQuery.trim())}`);
                setSearchOpen(false);
              }
              if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
            }}
            placeholder="Search tasks, clients…"
            className="bg-transparent border-none outline-none text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] w-full font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
              className="text-[#94a3b8] hover:text-[#475569] cursor-pointer flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 w-[320px] glass rounded-xl overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-white/60 z-50">
            {searchResults.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.href}
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/60 transition-colors border-b border-white/40 last:border-0"
              >
                <div className={cn(
                  "w-6 h-6 rounded-[7px] flex items-center justify-center flex-shrink-0",
                  r.type === "task" ? "bg-[rgba(27,63,238,0.08)]" : "bg-[rgba(16,185,129,0.08)]"
                )}>
                  {r.type === "task"
                    ? <CheckSquare className="w-3.5 h-3.5 text-[#1B3FEE]" />
                    : <Users className="w-3.5 h-3.5 text-[#10b981]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0f172a] truncate">{r.title}</div>
                  <div className="text-[11px] text-[#94a3b8] truncate">{r.subtitle}</div>
                </div>
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-wide flex-shrink-0">
                  {r.type}
                </span>
              </Link>
            ))}
            <div className="px-3.5 py-2 bg-[rgba(241,245,249,0.5)] border-t border-white/40">
              <button
                onClick={() => { router.push(`/tasks?q=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); }}
                className="text-[12px] font-semibold text-[#1B3FEE] hover:underline cursor-pointer"
              >
                See all results for &quot;{searchQuery}&quot; →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={openBell}
            className="relative w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white/60 border border-white/60 backdrop-blur-sm hover:bg-white/85 transition-colors cursor-pointer"
          >
            <Bell className="w-[15px] h-[15px] text-[#475569]" strokeWidth={1.8} />
            {hasUnread && (
              <span className="absolute top-[7px] right-[7px] w-1.5 h-1.5 rounded-full bg-[#ef4444] border border-white" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-[320px] glass rounded-xl overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-white/60 z-50">
              <div className="px-4 py-3 border-b border-white/50 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0f172a]">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] text-[#ef4444]">
                    {notifications.length} active
                  </span>
                )}
              </div>

              {!notifLoaded ? (
                <div className="px-4 py-6 text-center text-[13px] text-[#94a3b8]">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">All caught up!</div>
                  <div className="text-[12px] text-[#94a3b8] mt-0.5">No overdue or in-progress tasks</div>
                </div>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                notifications.map((n: any) => (
                  <div key={n.id} className="px-4 py-3 border-b border-white/40 last:border-0 hover:bg-white/40 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0",
                        n.status === "late" ? "bg-[#ef4444]" : "bg-[#1B3FEE]"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-[#0f172a] truncate">{n.title}</div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5 flex items-center gap-1">
                          <span className={cn(
                            "font-semibold",
                            n.status === "late" ? "text-[#ef4444]" : "text-[#1B3FEE]"
                          )}>
                            {n.status === "late" ? "Overdue" : "In Progress"}
                          </span>
                          {n.project?.name && <> · {n.project.name}</>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="px-4 py-2.5 border-t border-white/50 bg-[rgba(241,245,249,0.3)]">
                <Link
                  href="/tasks"
                  onClick={() => setBellOpen(false)}
                  className="text-[12px] font-semibold text-[#1B3FEE] hover:underline"
                >
                  View all tasks →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => setSettingsOpen((p) => !p)}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white/60 border border-white/60 backdrop-blur-sm hover:bg-white/85 transition-colors cursor-pointer"
          >
            <Settings className="w-[15px] h-[15px] text-[#475569]" strokeWidth={1.8} />
          </button>

          {settingsOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-[210px] glass rounded-xl overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-white/60 z-50">
              <Link
                href="/settings"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/60 transition-colors border-b border-white/40 text-[13px] text-[#475569] font-medium"
              >
                Profile &amp; Preferences
              </Link>
              <Link
                href="/clients"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/60 transition-colors border-b border-white/40 text-[13px] text-[#475569] font-medium"
              >
                Manage Clients
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/60 transition-colors w-full text-left text-[13px] text-[#ef4444] font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>

        {/* New Task */}
        <button
          onClick={openNewTask}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] hover:-translate-y-px transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
      </div>

      {/* New Task Modal */}
      {taskOpen && modalReady && (
        <NewTaskModal
          projects={modalProjects}
          profiles={modalProfiles}
          onClose={() => setTaskOpen(false)}
        />
      )}
    </header>
  );
}
