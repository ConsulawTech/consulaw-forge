import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function GlassCard({ children, className, padding = "none", hover }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl overflow-hidden",
        hover && "transition-transform duration-150 hover:-translate-y-0.5",
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
