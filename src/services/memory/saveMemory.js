import { getClients }
from "../clients.js";

export async function
saveMemory({

  agent_id = "global",

  title,

  content,

  importance = 3,

  memory_type = "long_term",

  expires_at = null
}) {

  if (!title || !content) {

    throw new Error(
      "title et content obligatoires"
    );
  }

  const { agentos } =
    getClients();

  const {
    data: existing
  } = await agentos
    .from(
      "agent_operational_memory"
    )
    .select("id")
    .eq("title", title)
    .eq("agent_id", agent_id)
    .limit(1);

  // Anti doublon simple
  if (
    existing &&
    existing.length > 0
  ) {

    return {
      success: false,
      reason:
        "memory_already_exists"
    };
  }

  const {
    data,
    error
  } = await agentos
    .from(
      "agent_operational_memory"
    )
    .insert([
      {
        agent_id,
        title,
        content,
        importance,
        memory_type,
        expires_at,
        is_active: true,
        last_used_at:
          new Date()
            .toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    success: true,
    memory: data
  };
}