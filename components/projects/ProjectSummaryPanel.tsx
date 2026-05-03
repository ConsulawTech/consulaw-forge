"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { SingleProjectReportButton } from "./SingleProjectReportButton";
import { formatDate, deadlineStatus } from "@/lib/utils";
import { deleteProjectAction } from "@/app/actions/projects";

interface Milestone {
  id: string;
  title: string;
  color: string;
  deadline: string | null;
  tasks: { id: string; title: string; status: string; due_date: string | null }[];
}

interface Project {
  id: string;
  name: string;
  target_date: string | null;
  status: string;
  client?: { name: string; logo_color?: string; logo_letter?: string } | null;
  milestones: Milestone[];
}

export function ProjectSummaryPanel({ project }: { project: Project }) {
  const dlStatus = deadlineStatus(project.target_date);
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const lateTasks = allTasks.filter((t) => t.status === "late").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-sm"
              style={{ background: project.client?.logo_color ?? "#e50914" }}
            >
              {project.client?.logo_letter ?? project.client?.name?.[0]}
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold text-slate-900 leading-tight">
                {project.client?.name}
              </h2>
              <p className="text-[14px] font-medium text-slate-500 mt-0.5">{project.name}</p>
              <p className="text-[12px] text-slate-400 mt-1">
                {project.target_date
                  ? `Due ${formatDate(project.target_date, { month: "long", day: "numeric", year: "numeric" })}`
                  : "No deadline set"}
                {dlStatus === "late" && (
                  <span className="ml-2 text-red-500 font-semibold">· Overdue</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1B3FEE] text-white hover:bg-[#1535d4] transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5" /> Open
            </Link>
            <SingleProjectReportButton
              project={{
                id: project.id,
                name: project.name,
                target_date: project.target_date,
                client: project.client,
                milestones: project.milestones,
              }}
              variant="icon"
            />
            <DeleteButton
              entityId={project.id}
              entityName={project.name}
              entityType="project"
              deleteAction={deleteProjectAction}
            />
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-slate-700">Overall Progress</span>
            <span className="text-[18px] font-extrabold text-[#1B3FEE]">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: "#1B3FEE" }}
            />
          </div>
          <div className="flex items-center gap-3 mt-3">
            {doneTasks > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                {doneTasks} done
              </span>
            )}
            {inProgressTasks > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {inProgressTasks} active
              </span>
            )}
            {lateTasks > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                {lateTasks} late
              </span>
            )}
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
              {allTasks.length} checkpoint{allTasks.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
              {project.milestones.length} task{project.milestones.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-slate-900">Tasks</h3>
          <span className="text-[12px] text-slate-400">{project.milestones.length} total</span>
        </div>

        {project.milestones.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-slate-400">No tasks set up yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {project.milestones.map((ms) => {
              const msTotal = ms.tasks.length;
              const msDone = ms.tasks.filter((t) => t.status === "done").length;
              const msProgress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;
              return (
                <div
                  key={ms.id}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  {/* Color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: ms.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-slate-800 truncate">{ms.title}</div>
                    {ms.deadline && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Due {formatDate(ms.deadline, { month: "short", day: "numeric" })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${msProgress}%`, background: ms.color }}
                      />
                    </div>
                    <span className="text-[12px] font-bold text-slate-600 w-8 text-right">{msProgress}%</span>
                    <span className="text-[11px] text-slate-400">
                      {msDone}/{msTotal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
