import { getClients }
from "../clients.js";

export async function
getOpenTasks({
  to_agent = null,
  priority = null
} = {}) {

  const { agentos } =
    getClients();

  let query =
    agentos
      .from("agent_tasks")
      .select("*")
      .eq("status", "open")
      .order(
        "created_at",
        { ascending: false }
      );

  if (to_agent) {
    query =
      query.eq(
        "to_agent",
        to_agent
      );
  }

  if (priority) {
    query =
      query.eq(
        "priority",
        priority
      );
  }

  const {
    data,
    error
  } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}