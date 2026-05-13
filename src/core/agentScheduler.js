const runningAgents = new Set();

export function scheduleAgent({ agentName, intervalMs, run }) {
  async function safeRun() {
    if (runningAgents.has(agentName)) {
      console.log(`⏳ ${agentName} déjà en cours, cycle ignoré`);
      return;
    }

    runningAgents.add(agentName);

    try {
      await run();
    } finally {
      runningAgents.delete(agentName);
    }
  }

  safeRun();

  return setInterval(safeRun, intervalMs);
}