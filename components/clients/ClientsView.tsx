"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DeleteClientButton } from "./DeleteClientButton";

interface Client {
  id: string;
  name: string;
  email?: string | null;
  logo_color?: string | null;
  logo_letter?: string | null;
  created_at: string;
  updated_at?: string | null;
  projects: {
    id: string;
    name: string;
    overall_progress?: number | null;
    target_date?: string | null;
  }[];
}

type ViewMode = "grid" | "list";
type SortBy = "name-asc" | "name-desc" | "created" | "updated";

function ClientCard({ client, viewMode }: { client: Client; viewMode: ViewMode }) {
  const progress = client.projects.length > 0
    ? Math.round(client.projects.reduce((s, p) => s + (p.overall_progress ?? 0), 0) / client.projects.length)
    : 0;
  const nextDeadline = client.projects
    .map((p) => p.target_date)
    .filter(Boolean)
    .sort()[0] ?? null;

  if (viewMode === "list") {
    return (
      <div className="relative group">
        <Link href={`/clients/${client.id}`}>
          <div className="glass rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 transition-all duration-150 flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
              style={{ background: client.logo_color ?? "#e50914" }}
            >
              {client.logo_letter ?? client.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-[#0f172a]">{client.name}</div>
              <div className="text-[12px] text-[#1B3FEE] font-medium mt-0.5">
                {client.projects.length > 0
                  ? `${client.projects.length} project${client.projects.length !== 1 ? "s" : ""}`
                  : "No active projects"}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <div className="text-[11px] font-semibold text-[#475569]">{progress}%</div>
                <div className="text-[10px] text-[#94a3b8]">Progress</div>
              </div>
              {nextDeadline && (
                <div className="text-right hidden sm:block">
                  <div className="text-[11px] font-semibold text-[#475569]">
                    {formatDate(nextDeadline, { month: "short", day: "numeric" })}
                  </div>
                  <div className="text-[10px] text-[#94a3b8]">Next due</div>
                </div>
              )}
            </div>
          </div>
        </Link>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DeleteClientButton clientId={client.id} clientName={client.name} variant="icon" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <Link href={`/clients/${client.id}`}>
        <div className="glass rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all duration-150">
          <div className="flex items-start gap-3.5 mb-4">
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
              style={{ background: client.logo_color ?? "#e50914" }}
            >
              {client.logo_letter ?? client.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-[#0f172a]">{client.name}</div>
              <div className="text-[12px] text-[#1B3FEE] font-medium mt-0.5 truncate">
                {client.projects.length > 0
                  ? `${client.projects.length} project${client.projects.length !== 1 ? "s" : ""}`
                  : "No active projects"}
              </div>
              {client.email && (
                <div className="text-[11px] text-[#94a3b8] truncate">{client.email}</div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-[11px] font-semibold text-[#475569] mb-1.5">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="bg-[rgba(241,245,249,0.9)] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-[#1B3FEE] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span>{client.projects.length} project{client.projects.length !== 1 ? "s" : ""}</span>
            {nextDeadline && (
              <span>Next due {formatDate(nextDeadline, { month: "short", year: "numeric" })}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DeleteClientButton clientId={client.id} clientName={client.name} variant="icon" />
      </div>
    </div>
  );
}

export function ClientsView({ clients }: { clients: Client[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name-asc");

  const sortedClients = useMemo(() => {
    const sorted = [...clients];
    switch (sortBy) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "created":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "updated":
        sorted.sort((a, b) => {
          const aDate = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
          const bDate = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
          return bDate - aDate;
        });
        break;
    }
    return sorted;
  }, [clients, sortBy]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/60 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "grid"
                  ? "bg-[#1B3FEE] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "list"
                  ? "bg-[#1B3FEE] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200/60 text-[12px] font-medium text-slate-700 outline-none focus:border-[#1B3FEE]/30 cursor-pointer h-9"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="created">Date created</option>
              <option value="updated">Date modified</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <span className="text-[12px] text-slate-400">
          {sortedClients.length} client{sortedClients.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Client list */}
      {sortedClients.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {sortedClients.map((client) => (
            <ClientCard key={client.id} client={client} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center text-[#94a3b8] text-sm">
          No clients yet. Click &quot;Add Client&quot; to get started.
        </div>
      )}
    </div>
  );
}
