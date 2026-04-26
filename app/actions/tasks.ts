"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";
import { recalculateProgress } from "./progress";

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get current task to know its milestone and project
  const { data: task } = await db
    .from("tasks")
    .select("milestone_id, project_id")
    .eq("id", taskId)
    .single();

  // Update status
  await db.from("tasks").update({ status }).eq("id", taskId);

  // Cascade recalculate progress
  if (task?.project_id) {
    await recalculateProgress(task.milestone_id ?? null, task.project_id);
  }

  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/checkpoints");
}
