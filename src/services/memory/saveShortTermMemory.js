import {
  saveMemory
} from "./saveMemory.js";

export async function
saveShortTermMemory({

  agent_id = "global",

  title,

  content,

  importance = 2,

  expiresInHours = 24
}) {

  const expiresAt =
    new Date(
      Date.now() +
      expiresInHours *
      60 *
      60 *
      1000
    ).toISOString();

  return saveMemory({

    agent_id,

    title,

    content,

    importance,

    memory_type:
      "temporary",

    expires_at:
      expiresAt
  });
}