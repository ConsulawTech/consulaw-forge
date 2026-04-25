import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: "blue" | "green" | "gold" | "red" | "purple";
  value: string | number;
  label: string;
  tag?: string;
  tagVariant?: "up" | "warn" | "info" | "gold" | "neutral";
}

const iconColors = {
  blue: "bg-[rgba(27,63,238,0.1)] text-[#1B3FEE]",
  green: "bg-[rgba(16,185,129,0.1)] text-[#10b981]",
  gold: "bg-[rgba(245,159,0,0.1)] text-[#f59f00]",
  red: "bg-[rgba(239,68,68,0.1)] text-[#ef4444]",
  purple: "bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]",
};

const tagColors = {
  up: "bg-[rgba(16,185,129,0.1)] text-[#10b981]",
  warn: "bg-[rgba(239,68,68,0.1)] text-[#ef4444]",
  info: "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]",
  gold: "bg-[rgba(245,159,0,0.1)] text-[#f59f00]",
  neutral: "bg-slate-100/90 text-slate-600",
};

export function StatCard({ icon: Icon, iconColor, value, label, tag, tagVariant = "neutral" }: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-4 transition-transform duration-150 hover:-translate-y-0.5 cursor-default">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0", iconColors[iconColor])}>
          <Icon className="w-4 h-4" />
        </div>
        {tag && (
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", tagColors[tagVariant])}>
            {tag}
          </span>
        )}
      </div>
      <div className="text-[30px] font-extrabold text-[#0f172a] leading-none tracking-tight">
        {value}
      </div>
      <div className="text-xs text-[#475569] mt-1">{label}</div>
    </div>
  );
}
