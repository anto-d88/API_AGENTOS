import { getClients } from "../clients.js";
import { createLog } from "../logger.js";
import { getRelevantMemory } from "../memory/getRelevantMemory.js";

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getOrderTotal(order) {
  return Number(order.total_amount || order.total_price || 0);
}

function getOrderGroups(orders = []) {
  const deliveredOrders = orders.filter((order) =>
    ["livree", "livre"].includes(normalizeStatus(order.status))
  );

  const preparingOrders = orders.filter((order) =>
    ["en_preparation", "en preparation"].includes(normalizeStatus(order.status))
  );

  const paidOrders = orders.filter((order) =>
    ["payee", "paye"].includes(normalizeStatus(order.status))
  );

  const deliveryOrders = orders.filter((order) =>
    ["en_livraison", "en livraison"].includes(normalizeStatus(order.status))
  );

  const newOrders = orders.filter((order) =>
    ["nouvelle", "new"].includes(normalizeStatus(order.status))
  );

  const canceledOrders = orders.filter((order) =>
    ["annulee", "annule", "cancelled", "canceled"].includes(normalizeStatus(order.status))
  );

  const revenueOrders = orders.filter((order) =>
    [
      "payee",
      "paye",
      "en_preparation",
      "en preparation",
      "en_livraison",
      "en livraison",
      "livree",
      "livre"
    ].includes(normalizeStatus(order.status))
  );

  const activeOrders = orders.filter((order) =>
    [
      "nouvelle",
      "new",
      "payee",
      "paye",
      "en_preparation",
      "en preparation",
      "en_livraison",
      "en livraison"
    ].includes(normalizeStatus(order.status))
  );

  return {
    deliveredOrders,
    preparingOrders,
    paidOrders,
    deliveryOrders,
    newOrders,
    canceledOrders,
    revenueOrders,
    activeOrders
  };
}

export async function autoDirectorData() {
  const { agentos, sandwich, groq } = getClients();

  const memories = await getRelevantMemory({
  agent_id: "directeur",
  keywords: [
    "urgence",
    "priorité",
    "livraison",
    "stock",
    "commande",
    "planning",
    "retard",
    "business"
  ],
  limit: 15
});

const memoryText =
  (memories || [])
    .map((m) => `- ${m.title}: ${m.content}`)
    .join("\n") || "Aucune mémoire opérationnelle.";

  if (!sandwich) {
    throw new Error("Supabase La Pause Sandwich non configuré");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq non configuré");
  }

  const { data: products, error: productsError } = await sandwich
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (productsError) throw productsError;

  const { data: orders, error: ordersError } = await sandwich
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (ordersError) throw ordersError;

  const { data: tasks, error: tasksError } = await agentos
    .from("agent_tasks")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(30);

  if (tasksError) throw tasksError;

  const { data: alerts, error: alertsError } = await agentos
    .from("agent_alerts")
    .select("*")
    .eq("read", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(30);

  if (alertsError) throw alertsError;

  const groups = getOrderGroups(orders || []);

  const lowStock = (products || []).filter((product) => {
    const stock = Number(product.stock_quantity || 0);
    const threshold = Number(product.low_stock_threshold ?? 5);
    return stock <= threshold;
  });

  const revenue = groups.revenueOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const lowStockText =
    lowStock
      .map((product) => {
        const stock = Number(product.stock_quantity || 0);
        return `- ${product.name || product.title || "Produit sans nom"} : ${stock}`;
      })
      .join("\n") || "Aucun stock faible.";

  const tasksText =
    (tasks || [])
      .map((task) => `- [${task.priority}] ${task.title} → ${task.to_agent}`)
      .join("\n") || "Aucune tâche ouverte.";

  const alertsText =
    (alerts || [])
      .map((alert) => `- [${alert.priority}] ${alert.title} : ${alert.message}`)
      .join("\n") || "Aucune alerte active.";

  const prompt = `
Tu es l'Agent Directeur IA de La Pause Sandwich.

MISSION :
Analyser la situation opérationnelle et créer uniquement les décisions vraiment utiles.

CHIFFRES :
- CA estimé commandes valides : ${revenue.toFixed(2)} €
- Commandes analysées : ${orders?.length || 0}
- Nouvelles : ${groups.newOrders.length}
- Payées : ${groups.paidOrders.length}
- En préparation : ${groups.preparingOrders.length}
- En livraison : ${groups.deliveryOrders.length}
- Livrées : ${groups.deliveredOrders.length}
- Annulées : ${groups.canceledOrders.length}
- Actives à traiter : ${groups.activeOrders.length}
- Produits en stock faible : ${lowStock.length}

STOCK FAIBLE :
${lowStockText}

TÂCHES OUVERTES :
${tasksText}

ALERTES :
${alertsText}

RÈGLES :
- Une commande livrée est terminée.
- Ne considère jamais une commande livrée comme en préparation.
- Protège toujours les livraisons 11h00, 13h00, 15h00.
- Crée seulement des décisions utiles.
- Si rien n’est nécessaire, retourne [].
- Réponse UNIQUEMENT en JSON valide.

FORMAT :
[
  {
    "title": "Action courte",
    "description": "Action concrète à faire",
    "priority": "urgent|high|medium|low",
    "agent_target": "Agent Stock|Agent Commandes|Agent Communication Client|Agent Développement Commercial|Agent Comptabilité|Agent Planning IA|Agent Directeur IA"
  }
]
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }]
  });

  const raw = completion.choices?.[0]?.message?.content || "[]";
  const match = raw.match(/\[[\s\S]*\]/);
  const decisions = match ? JSON.parse(match[0]) : [];

  const savedDecisions = [];

  for (const decision of decisions) {
    const title = decision.title || "Décision IA";
    const description = decision.description || "Action à vérifier.";
    const priority = decision.priority || "medium";
    const agentTarget = decision.agent_target || "Agent Directeur IA";

    const { data: existingTask } = await agentos
      .from("agent_tasks")
      .select("id")
      .eq("title", title)
      .eq("status", "open")
      .limit(1);

    if (existingTask && existingTask.length > 0) continue;

    const { data: insertedDecision, error: decisionError } = await agentos
      .from("ai_decisions")
      .insert([
        {
          title,
          description,
          priority,
          agent_target: agentTarget,
          status: "pending"
        }
      ])
      .select()
      .single();

    if (decisionError) throw decisionError;

    const { error: taskError } = await agentos.from("agent_tasks").insert([
      {
        from_agent: "Agent Directeur IA",
        to_agent: agentTarget,
        title,
        description,
        priority,
        type: "auto_director",
        status: "open",
        completed: false
      }
    ]);

    if (taskError) throw taskError;

    await createLog({
      agent_name: "Agent Directeur IA",
      action_type: "decision",
      title,
      description,
      status: "success",
      priority
    });

    savedDecisions.push(insertedDecision);
  }

  return {
    decisions,
    savedDecisions,
    saved: savedDecisions.length,
    raw
  };
}