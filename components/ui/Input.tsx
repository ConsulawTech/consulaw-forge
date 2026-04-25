"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export function Input({ label, error, icon: Icon, rightIcon: RightIcon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#0f172a]">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={cn(
            "w-full rounded-xl py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8]",
            "bg-white/60 backdrop-blur-md border border-white/50",
            "outline-none transition-all duration-150",
            "focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10",
            error && "border-red-300 focus:ring-red-100",
            Icon ? "pl-9 pr-3" : "px-3",
            RightIcon ? "pr-9" : "",
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
