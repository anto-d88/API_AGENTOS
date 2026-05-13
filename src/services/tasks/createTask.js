import { getClients }
from "../clients.js";

import { createLog }
from "../logger.js";

export async function
createTask({
  from_agent = "System",
  to_agent = "Agent Directeur IA",
  title,
  description = "",
  priority = "medium",
  type = "general"
}) {

  if (!title) {
    throw new Error(
      "Titre tâche obligatoire"
    );
  }

  const { agentos } =
    getClients();

  const {
    data: existing
  } = await agentos
    .from("agent_tasks")
    .select("id")
    .eq("title", title)
    .eq("status", "open")
    .limit(1);

  if (
    existing &&
    existing.length > 0
  ) {

    return {
      success: false,
      reason:
        "task_already_exists"
    };
  }

  const {
    data,
    error
  } = await agentos
    .from("agent_tasks")
    .insert([
      {
        from_agent,
        to_agent,
        title,
        description,
        priority,
        type,
        status: "open",
        completed: false
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  await createLog({
    agent_name:
      from_agent,

    action_type:
      "task_created",

    title:
      "Nouvelle tâche créée",

    description:
      `${title} → ${to_agent}`,

    status: "success",

    priority
  });

  return {
    success: true,
    task: data
  };
}