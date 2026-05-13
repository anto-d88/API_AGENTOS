import { getClients }
from "../clients.js";

import { createLog }
from "../logger.js";

import {
  sendTelegramMessage
} from "../telegram.js";

export async function
checkStockData() {

  const {
    agentos,
    sandwich
  } = getClients();

  const {
    data: products,
    error
  } = await sandwich
    .from("products")
    .select("*")
    .order(
      "name",
      { ascending: true }
    );

  if (error) {
    throw error;
  }

  let lowStockProducts = 0;
  let tasksCreated = 0;
  let alertsCreated = 0;
  let telegramSent = 0;
  let resetProducts = 0;

  for (const product of products || []) {

    const stock =
      Number(
        product.stock_quantity || 0
      );

    const threshold =
      Number(
        product.low_stock_threshold ?? 5
      );

    const productName =
      product.name ||
      product.title ||
      "Produit sans nom";

    const alertSent =
      Boolean(
        product.stock_alert_sent
      );

    if (stock <= threshold) {
      lowStockProducts++;
    }

    if (
      stock <= threshold &&
      !alertSent
    ) {

      const title =
        `Réapprovisionnement ${productName}`;

      const alertMessage =
        `${productName} presque en rupture (stock : ${stock})`;

      await agentos
        .from("agent_tasks")
        .insert([
          {
            title,

            description:
              `Stock faible détecté : ${productName}`,

            type: "stock_alert",

            priority:
              stock === 0
                ? "urgent"
                : "high",

            status: "open",

            completed: false,

            from_agent:
              "Agent Stock",

            to_agent:
              "Agent Directeur IA"
          }
        ]);

      tasksCreated++;

      await agentos
        .from("agent_alerts")
        .insert([
          {
            title:
              "Stock faible",

            message:
              alertMessage,

            priority:
              stock === 0
                ? "urgent"
                : "high",

            read: false
          }
        ]);

      alertsCreated++;

      const telegramResult =
        await sendTelegramMessage(
          `🚨 STOCK FAIBLE\n\n📦 ${productName}\n📉 Stock : ${stock}`
        );

      if (
        telegramResult?.ok
      ) {
        telegramSent++;
      }

      await createLog({
        agent_name:
          "Agent Stock",

        action_type:
          "stock_alert",

        title:
          "Alerte stock créée",

        description:
          `${productName} faible (${stock})`,

        status: "warning",

        priority:
          stock === 0
            ? "urgent"
            : "high"
      });

      await sandwich
        .from("products")
        .update({
          stock_alert_sent: true,

          stock_alert_sent_at:
            new Date().toISOString(),

          last_stock_alert_level:
            stock
        })
        .eq("id", product.id);

    }

    if (
      stock > threshold &&
      alertSent
    ) {

      await sandwich
        .from("products")
        .update({
          stock_alert_sent: false,

          stock_alert_sent_at: null,

          last_stock_alert_level: null
        })
        .eq("id", product.id);

      resetProducts++;
    }
  }

  return {
    productsChecked:
      products?.length || 0,

    lowStockProducts,

    tasksCreated,

    alertsCreated,

    telegramSent,

    resetProducts
  };
}