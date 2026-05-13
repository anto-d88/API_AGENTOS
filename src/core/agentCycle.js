export async function
runAgentCycle({
  agentName,
  execute
}) {

  const startedAt =
    Date.now();

  console.log(
    `🤖 ${agentName} cycle démarré`
  );

  try {

    const result =
      await execute();

    const duration =
      Date.now() - startedAt;

    console.log(
      `✅ ${agentName} terminé (${duration}ms)`
    );

    return {
      success: true,
      duration,
      result
    };

  } catch (error) {

    console.error(
      `❌ ${agentName} erreur`,
      error.message
    );

    return {
      success: false,
      error:
        error.message
    };
  }
}
