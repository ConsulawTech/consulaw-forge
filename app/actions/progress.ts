"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Recalculate milestone.progress and project.overall_progress
 * based on checkpoint (task) completion status.
 *
 * Scoring: only "done" counts as complete (100%).
 * All other statuses (todo, in_progress, late) count as 0%.
 */
export async function recalculateProgress(
  milestoneId: string | null,
  projectId: string
) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Update milestone progress
  if (milestoneId) {
    const { data: mTasks } = await db
      .from("tasks")
      .select("status")
      .eq("milestone_id", milestoneId);

    const total = mTasks?.length ?? 0;
    const done = mTasks?.filter((t: { status: string }) => t.status === "done").length ?? 0;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    await db.from("milestones").update({ progress }).eq("id", milestoneId);
  }

  // 2. Update project overall progress (weighted by checkpoint count)
  const { data: pTasks } = await db
    .from("tasks")
    .select("status")
    .eq("project_id", projectId);

  const total = pTasks?.length ?? 0;
  const done = pTasks?.filter((t: { status: string }) => t.status === "done").length ?? 0;
  const overall_progress = total > 0 ? Math.round((done / total) * 100) : 0;

  await db.from("projects").update({ overall_progress }).eq("id", projectId);
}
