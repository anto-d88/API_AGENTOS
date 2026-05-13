import { getClients }
from "./clients.js";

export async function createLog({
  agent_name = "Agent IA",
  action_type = "general",
  title = "Action système",
  description = "",
  status = "success",
  priority = "medium",
  metadata = {}
}) {

  try {

    const { agentos } =
      getClients();

    await agentos
      .from("agent_logs")
      .insert([
        {
          agent_name,
          action_type,
          title,
          description,
          status,
          priority,
          metadata
        }
      ]);

  } catch (error) {

    console.error(
      "Erreur création log :",
      error.message
    );

  }
}