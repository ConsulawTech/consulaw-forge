"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  revalidatePath("/tasks");
  revalidatePath("/projects");
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
  const { error } = await db
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkCreateProjectTasksAction(
  projectId: string,
  milestonesData: { title: string; description?: string | null }[],
  tasksData: { title: string; milestoneIndex: number; assigneeId: string | null }[]
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
    };
  });

  const { error: taskError } = await db.from("tasks").insert(taskInserts);

  if (taskError) return { success: false, error: taskError.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/checkpoints");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");

  return { success: true };
}
