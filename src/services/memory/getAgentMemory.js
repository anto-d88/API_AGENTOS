import { getClients } from "../clients.js";

export async function getAgentMemory(agentId) {
  const { agentos } = getClients();

  const { data, error } = await agentos
    .from("agent_operational_memory")
    .select("*")
    .eq("is_active", true)
    .or(`agent_id.eq.${agentId},agent_id.eq.global`)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return data || [];
}