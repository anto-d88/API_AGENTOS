import { getClients }
from "../clients.js";

import { createLog }
from "../logger.js";

export async function
generatePlanningData() {

  const {
    agentos,
    groq
  } = getClients();

  const tomorrow =
    new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const planningDate =
    tomorrow
      .toISOString()
      .slice(0, 10);

  await agentos
    .from("agent_planning")
    .delete()
    .eq(
      "planned_date",
      planningDate
    )
    .eq(
      "generated_by_ai",
      true
    );

  const { data: tasks } =
    await agentos
      .from("agent_tasks")
      .select("*")
      .neq("status", "done")
      .order(
        "priority",
        { ascending: false }
      );

  const { data: alerts } =
    await agentos
      .from("agent_alerts")
      .select("*")
      .eq("read", false)
      .eq("deleted", false);

  const { data: memories } =
    await agentos
      .from(
        "agent_operational_memory"
      )
      .select("*")
      .eq("is_active", true);

  const tasksText =
    (tasks || [])
      .map(
        (t) =>
          `- ${t.title} (${t.priority})`
      )
      .join("\n") ||
    "Aucune tâche.";

  const alertsText =
    (alerts || [])
      .map(
        (a) =>
          `- ${a.title}: ${a.message}`
      )
      .join("\n") ||
    "Aucune alerte.";

  const memoriesText =
    (memories || [])
      .map(
        (m) =>
          `- ${m.title}: ${m.content}`
      )
      .join("\n") ||
    "";

  const prompt = `
Tu es l'Agent Planning IA de La Pause Sandwich.

MISSION :
Créer un planning intelligent et réaliste pour demain.

DATE :
${planningDate}

MÉMOIRE OPÉRATIONNELLE :
${memoriesText}

TÂCHES :
${tasksText}

ALERTES :
${alertsText}

RÈGLES :
- Respecte les créneaux livraison :
11h00
13h00
15h00

- Toujours prévoir :
préparation cuisine,
livraisons,
stock,
nettoyage,
administratif,
prospection.

- Réponse UNIQUEMENT JSON.
`;

  const completion =
    await groq.chat.completions.create({
      model:
        "llama-3.1-8b-instant",

      temperature: 0.2,

      max_tokens: 1200,

      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

  const raw =
    completion
      .choices?.[0]
      ?.message?.content || "[]";

  const match =
    raw.match(/\[[\s\S]*\]/);

  const planning =
    match
      ? JSON.parse(match[0])
      : [];

  const inserted = [];

  for (const item of planning) {

    const cleanTime =
      item.planned_time
        ? `${String(
            item.planned_time
          ).slice(0, 5)}:00`
        : null;

    const {
      data
    } = await agentos
      .from("agent_planning")
      .insert([
        {
          title:
            item.title ||
            "Action IA",

          description:
            item.description || "",

          planned_date:
            planningDate,

          planned_time:
            cleanTime,

          priority:
            item.priority ||
            "medium",

          generated_by_ai: true,

          status: "planned",

          completed: false
        }
      ])
      .select()
      .single();

    if (data) {
      inserted.push(data);
    }
  }

  await createLog({
    agent_name:
      "Agent Planning IA",

    action_type:
      "planning_generation",

    title:
      "Planning généré",

    description:
      `${inserted.length} actions générées`,

    status: "success",
    priority: "high"
  });

  return {
    planningDate,
    inserted,
    raw
  };
}