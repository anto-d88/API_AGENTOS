import { getClients }
from "../clients.js";

import { createLog }
from "../logger.js";

export async function
completeTask(taskId) {

  if (!taskId) {
    throw new Error(
      "taskId obligatoire"
    );
  }

  const { agentos } =
    getClients();

  const {
    data,
    error
  } = await agentos
    .from("agent_tasks")
    .update({
      completed: true,
      status: "done",
      completed_at:
        new Date().toISOString()
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  await createLog({
    agent_name:
      data.to_agent ||
      "Agent IA",

    action_type:
      "task_completed",

    title:
      "Tâche terminée",

    description:
      data.title,

    status: "success",

    priority:
      data.priority ||
      "medium"
  });

  return data;
}