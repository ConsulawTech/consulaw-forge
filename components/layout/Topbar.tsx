"use client";

import { Bell, Settings, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TopbarProps {
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onNewTask?: () => void;
}

export function Topbar({ tabs, activeTab, onTabChange, onNewTask }: TopbarProps) {
  return (
    <header className="h-[58px] flex-shrink-0 glass border-b border-white/50 flex items-center px-6 gap-3 shadow-[0_1px_0_rgba(255,255,255,0.8)]">
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

      <div className="flex items-center gap-2 bg-white/60 border border-white/60 rounded-[10px] px-3 py-[7px] w-[210px] backdrop-blur-sm">
        <Search className="w-3.5 h-3.5 text-[#94a3b8] flex-shrink-0" />
        <input
          type="text"
          placeholder="Search tasks, clients…"
          className="bg-transparent border-none outline-none text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] w-full font-sans"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="relative w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white/60 border border-white/60 backdrop-blur-sm hover:bg-white/85 transition-colors cursor-pointer">
          <Bell className="w-[15px] h-[15px] text-[#475569]" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#ef4444] border-2 border-[#f8faff]" />
        </button>
        <button className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white/60 border border-white/60 backdrop-blur-sm hover:bg-white/85 transition-colors cursor-pointer">
          <Settings className="w-[15px] h-[15px] text-[#475569]" strokeWidth={1.8} />
        </button>
        <Button onClick={onNewTask} size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          New Task
        </Button>
      </div>
    </header>
  );
}
