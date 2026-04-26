"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent" | "success" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-all duration-150 cursor-pointer select-none whitespace-nowrap font-sans disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#1B3FEE] text-white shadow-[0_2px_8px_rgba(27,63,238,0.25)] hover:bg-[#1535D4] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(27,63,238,0.35)] active:scale-[0.98]",
    secondary:
      "bg-white/65 backdrop-blur-[20px] border border-white/60 text-[#475569] hover:bg-white/85 hover:text-[#0f172a] active:scale-[0.98]",
    ghost:
      "bg-transparent text-[#475569] hover:bg-white/60 hover:text-[#0f172a] active:scale-[0.98]",
    danger:
      "bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-[0_2px_8px_rgba(239,68,68,0.25)] active:scale-[0.98]",
    accent:
      "bg-[#8b5cf6] text-white shadow-[0_2px_8px_rgba(139,92,246,0.25)] hover:bg-[#7c3aed] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(139,92,246,0.35)] active:scale-[0.98]",
    success:
      "bg-[#10b981] text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)] hover:bg-[#059669] active:scale-[0.98]",
    outline:
      "bg-transparent border border-dashed border-[rgba(27,63,238,0.3)] text-[#1B3FEE] hover:bg-[rgba(27,63,238,0.06)] active:scale-[0.98]",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-[13px] px-4 py-2 gap-1.5",
    lg: "text-base px-6 py-3",
    icon: "p-2 gap-0",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
