import { getClients } from "../clients.js";
import { createLog } from "../logger.js";

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

export async function checkOrdersData() {
  const { agentos, sandwich } = getClients();

  const { data: orders, error } = await sandwich
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const actionableOrders = (orders || []).filter((order) => {
    const status = normalizeStatus(order.status);

    return [
      "nouvelle",
      "new",
      "payee",
      "paye",
      "en_preparation",
      "en preparation"
    ].includes(status);
  });

  let created = 0;

  for (const order of actionableOrders) {
    const title = `Commande #${order.id}`;

    const { data: existing } = await agentos
      .from("agent_tasks")
      .select("id")
      .eq("title", title)
      .eq("status", "open")
      .limit(1);

    if (!existing || existing.length === 0) {
      await agentos.from("agent_tasks").insert([
        {
          from_agent: "Surveillance Commandes",
          to_agent: "Agent Commandes",
          title,
          description:
            `Commande ${order.id} - ` +
            `${order.customer_name || "Client"} - ` +
            `${getOrderTotal(order)}€`,
          priority: "high",
          type: "order",
          status: "open",
          completed: false
        }
      ]);

      await createLog({
        agent_name: "Agent Commandes",
        action_type: "task_created",
        title: "Tâche commande créée",
        description: `Commande ${order.id} envoyée à l'équipe`,
        status: "success",
        priority: "high"
      });

      created++;
    }
  }

  return {
    orders: orders?.length || 0,
    actionableOrders: actionableOrders.length,
    tasksCreated: created
  };
}