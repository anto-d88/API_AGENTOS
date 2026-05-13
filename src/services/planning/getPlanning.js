import { getClients }
from "../clients.js";

export async function getPlanningData() {

  const { agentos } =
    getClients();

  const {
    data,
    error
  } = await agentos
    .from("agent_planning")
    .select("*")
    .order(
      "planned_date",
      { ascending: true }
    )
    .order(
      "planned_time",
      { ascending: true }
    );

  if (error) {
    throw error;
  }

  return data || [];
}