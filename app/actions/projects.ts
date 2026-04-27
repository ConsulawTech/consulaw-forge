"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { recalculateProgress } from "./progress";

export async function createProjectAction(formData: FormData): Promise<{ success: true; projectId: string } | { success: false; error: string }> {
  const client_id = (formData.get("client_id") as string | null)?.trim();
  const name = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const target_date = (formData.get("target_date") as string | null) || null;

  if (!client_id || !name) return { success: false, error: "Client and project name are required." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("projects")
    .insert({ client_id, name, description, target_date, status: "active", overall_progress: 0 })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath(`/clients/${client_id}`);
  return { success: true, projectId: data.id };
}

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const title = formData.get("title") as string;
  const projectId = formData.get("project_id") as string;
  const milestoneId = (formData.get("milestone_id") as string) || null;
  const assigneeId = (formData.get("assignee_id") as string) || null;
  const dueDate = (formData.get("due_date") as string) || null;
  const status = (formData.get("status") as string) || "todo";

  const { error } = await db.from("tasks").insert({
    title,
    project_id: projectId,
    milestone_id: milestoneId || null,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
    status,
  });

  if (error) throw new Error(error.message);

  // Cascade recalculate progress
  await recalculateProgress(milestoneId || null, projectId);

  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/checkpoints");
  return { success: true };
}

export async function updateMilestoneOrderAction(
  projectId: string,
  milestoneIds: string[]
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Update each milestone's order_index based on its position in the array
  const updates = milestoneIds.map((id, index) =>
    db.from("milestones").update({ order_index: index }).eq("id", id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r: any) => r.error);

  if (errors.length > 0) {
    return { success: false, error: errors[0].error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/timeline");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function createMilestoneAction(formData: FormData) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const projectId = formData.get("project_id") as string;
  const deadline = (formData.get("deadline") as string) || null;

  const colors = ["#1B3FEE", "#10b981", "#f59f00", "#8b5cf6", "#ef4444"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const { data: last } = await db
    .from("milestones")
    .select("order_index")
    .eq("project_id", projectId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("milestones").insert({
    title,
    description,
    project_id: projectId,
    deadline,
    color,
    order_index: (last?.order_index ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get current task to know its milestone and project
  const { data: task } = await db
    .from("tasks")
    .select("milestone_id, project_id")
    .eq("id", taskId)
    .single();

  const { error } = await db
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  // Cascade recalculate progress
  if (task?.project_id) {
    await recalculateProgress(task.milestone_id ?? null, task.project_id);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/checkpoints");
  return { success: true };
}

export async function deleteProjectAction(projectId: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db.from("projects").delete().eq("id", projectId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/checkpoints");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteMilestoneAction(milestoneId: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get project_id before deleting
  const { data: milestone } = await db
    .from("milestones")
    .select("project_id")
    .eq("id", milestoneId)
    .single();

  const { error } = await db.from("milestones").delete().eq("id", milestoneId);

  if (error) return { success: false, error: error.message };

  // Cascade recalculate project progress (milestones cascade to tasks via SET NULL)
  if (milestone?.project_id) {
    await recalculateProgress(null, milestone.project_id);
  }

  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/checkpoints");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get task info before deleting for recalculation
  const { data: task } = await db
    .from("tasks")
    .select("milestone_id, project_id")
    .eq("id", taskId)
    .single();

  const { error } = await db.from("tasks").delete().eq("id", taskId);

  if (error) return { success: false, error: error.message };

  // Cascade recalculate progress
  if (task?.project_id) {
    await recalculateProgress(task.milestone_id ?? null, task.project_id);
  }

  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/checkpoints");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkCreateProjectTasksAction(
  projectId: string,
  milestonesData: { title: string; description?: string | null; dueDate?: string | null }[],
  tasksData: { title: string; milestoneIndex: number; assigneeId: string | null; dueDate?: string | null }[]
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const colors = ["#1B3FEE", "#10b981", "#f59f00", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];

  // Get current max order_index for this project
  const { data: last } = await db
    .from("milestones")
    .select("order_index")
    .eq("project_id", projectId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  let startOrder = (last?.order_index ?? 0) + 1;

  // Insert milestones
  const milestoneInserts = milestonesData.map((m, i) => ({
    title: m.title,
    description: m.description ?? null,
    project_id: projectId,
    color: colors[i % colors.length],
    order_index: startOrder + i,
    due_date: m.dueDate || null,
  }));

  const { data: insertedMilestones, error: milestoneError } = await db
    .from("milestones")
    .insert(milestoneInserts)
    .select("id, order_index");

  if (milestoneError) return { success: false, error: milestoneError.message };

  // Map order_index to inserted milestone id
  const milestoneIdMap = new Map<number, string>();
  for (const ms of insertedMilestones ?? []) {
    milestoneIdMap.set(ms.order_index, ms.id);
  }

  // Insert tasks
  const taskInserts = tasksData.map((t) => {
    const actualOrderIndex = startOrder + t.milestoneIndex;
    return {
      title: t.title,
      project_id: projectId,
      milestone_id: milestoneIdMap.get(actualOrderIndex) ?? null,
      assignee_id: t.assigneeId,
      status: "todo",
      due_date: t.dueDate || null,
    };
  });

  const { error: taskError } = await db.from("tasks").insert(taskInserts);

  if (taskError) return { success: false, error: taskError.message };

  // Recalculate progress for the newly created tasks
  await recalculateProgress(null, projectId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/checkpoints");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");

  return { success: true };
}
