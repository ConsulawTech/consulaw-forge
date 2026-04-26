"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("tasks").update({ status }).eq("id", taskId);
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/timeline");
}
