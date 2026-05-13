import { getClients } from "../clients.js";

export async function cleanupMemory() {
  const { agentos } = getClients();

  const now = new Date().toISOString();

  const { error: deleteError } = await agentos
    .from("agent_operational_memory")
    .delete()
    .eq("memory_type", "temporary")
    .lte("importance", 2)
    .not("expires_at", "is", null)
    .lt("expires_at", now);

  if (deleteError) {
    throw deleteError;
  }

  const { data: archived, error: archiveError } = await agentos
    .from("agent_operational_memory")
    .update({
      is_active: false,
      memory_type: "archive"
    })
    .lte("importance", 3)
    .lt("last_used_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .select();

  if (archiveError) {
    throw archiveError;
  }

  return {
    success: true,
    archived: archived?.length || 0
  };
}