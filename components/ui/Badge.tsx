import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "purple"
  | "gold";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100/90 text-slate-600 border border-slate-200/60",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
  accent: "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE]",
  purple: "bg-purple-50 text-purple-700",
  gold: "bg-amber-50 text-amber-600",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-[1.4]",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    todo: { variant: "default", label: "To Do" },
    in_progress: { variant: "accent", label: "In Progress" },
    done: { variant: "success", label: "Done" },
    late: { variant: "danger", label: "Late Risk" },
  };
  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
