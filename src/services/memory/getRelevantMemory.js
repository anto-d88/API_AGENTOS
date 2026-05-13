import { getClients }
from "../clients.js";

function scoreMemory(
  memory,
  keywords = []
) {

  let score =
    Number(
      memory.importance || 0
    );

  const content =
    `${memory.title} ${memory.content}`
      .toLowerCase();

  for (const keyword of keywords) {

    if (
      content.includes(
        keyword.toLowerCase()
      )
    ) {
      score += 10;
    }
  }

  return score;
}

export async function
getRelevantMemory({

  agent_id = "global",

  keywords = [],

  limit = 15
}) {

  const { agentos } =
    getClients();

  const {
    data,
    error
  } = await agentos
    .from(
      "agent_operational_memory"
    )
    .select("*")
    .eq("is_active", true)
    .or(
      `agent_id.eq.${agent_id},agent_id.eq.global`
    );

  if (error) {
    throw error;
  }

  const sorted =
    (data || [])
      .map((memory) => ({
        ...memory,

        relevanceScore:
          scoreMemory(
            memory,
            keywords
          )
      }))
      .sort(
        (a, b) =>
          b.relevanceScore -
          a.relevanceScore
      );

  return sorted.slice(0, limit);
}