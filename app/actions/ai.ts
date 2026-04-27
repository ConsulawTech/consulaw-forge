"use server";

import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export interface AiTaskSuggestion {
  title: string;
  checkpoints: { title: string; assigneeRoleHint: string; dueDate?: string }[];
  dueDate?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function generateProjectTasksAction(
  projectName: string,
  projectDescription: string | null,
  teamProfiles: { id: string; full_name: string; job_title: string | null }[],
  targetDate?: string | null
): Promise<{ success: true; tasks: AiTaskSuggestion[] } | { success: false; error: string }> {
  if (!process.env.DEEPSEEK_API_KEY) {
    return { success: false, error: "DeepSeek API key not configured." };
  }

  const teamContext = teamProfiles
    .map((p) => `- ${p.full_name}${p.job_title ? ` (${p.job_title})` : ""} [id:${p.id}]`)
    .join("\n");

  const targetDateContext = targetDate
    ? `Project Delivery/Target Date: ${targetDate}. All tasks and checkpoints should be scheduled to complete BEFORE this date. Assign realistic deadlines to each task and checkpoint, working backwards from the target date.`
    : "No target date provided. Assign realistic relative timelines (e.g., 'Week 1', 'Week 2') but do not include dueDate fields.";

  const prompt = `You are a project management AI assistant. Given a project name, description, and delivery date, generate a comprehensive breakdown of high-level tasks and their checkpoints with realistic deadlines.

Project Name: ${projectName}
Project Description: ${projectDescription || "No description provided."}
${targetDateContext}

Available team members:
${teamContext || "No team members available yet."}

Instructions:
1. Generate 3-8 high-level tasks (e.g., UI/UX Design, Frontend Development, Backend Development, API Integration, Testing, Deployment).
2. For each task, generate 3-10 specific checkpoints (deliverables or sub-tasks).
3. For each checkpoint, suggest the most appropriate team member by matching their job title to the work. Use their exact ID from the list above in the assigneeRoleHint field.
4. ${targetDate ? "Each task and checkpoint MUST include a dueDate in ISO 8601 format (YYYY-MM-DD). Schedule them so the final checkpoint completes at least 2-3 days before the target date to allow buffer time." : "Do not include dueDate fields."}
5. Respond ONLY with valid JSON in this exact format:
[
  {
    "title": "Task name",
    ${targetDate ? `"dueDate": "YYYY-MM-DD",` : ""}
    "checkpoints": [
      { "title": "Checkpoint name", "assigneeRoleHint": "exact-profile-id-from-list"${targetDate ? `, "dueDate": "YYYY-MM-DD"` : ""} }
    ]
  }
]

If no team members are available, use empty string for assigneeRoleHint.`;

  try {
    const response = await withTimeout(
      deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful project management assistant that outputs only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      30000,
      "DeepSeek API call"
    );

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    if (!content) {
      return { success: false, error: "AI returned empty response." };
    }

    // Extract JSON from possible markdown code block
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content;

    const parsed = JSON.parse(jsonStr) as AiTaskSuggestion[];

    // Validate structure
    if (!Array.isArray(parsed)) {
      return { success: false, error: "AI response was not an array." };
    }

    const validated = parsed
      .filter((t) => t.title && Array.isArray(t.checkpoints))
      .map((t) => ({
        title: t.title,
        dueDate: t.dueDate || undefined,
        checkpoints: t.checkpoints
          .filter((c) => c.title)
          .map((c) => ({
            title: c.title,
            assigneeRoleHint: c.assigneeRoleHint || "",
            dueDate: c.dueDate || undefined,
          })),
      }))
      .filter((t) => t.checkpoints.length > 0);

    return { success: true, tasks: validated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: `AI generation failed: ${message}` };
  }
}
