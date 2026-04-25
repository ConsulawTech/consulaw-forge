export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const AVATAR_COLORS = [
  "#1B3FEE",
  "#10b981",
  "#8b5cf6",
  "#f59f00",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

export function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
    late: "Late Risk",
  };
  return map[status] ?? status;
}

export function deadlineStatus(date: string | null): "ok" | "warn" | "late" {
  if (!date) return "ok";
  const d = new Date(date);
  const now = new Date();
  const diffDays = (d.getTime() - now.getTime()) / 86400000;
  if (diffDays < 0) return "late";
  if (diffDays < 7) return "warn";
  return "ok";
}
