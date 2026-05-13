import { getClients }
from "../clients.js";

export async function
checkAlertsData() {

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

  const lowStock =
    (products || []).filter(
      (product) => {

        const stock =
          Number(
            product.stock_quantity || 0
          );

        const threshold =
          Number(
            product.low_stock_threshold ?? 5
          );

        return stock <= threshold;
      }
    );

  const createdAlerts = [];

  for (const product of lowStock) {

    const stock =
      Number(
        product.stock_quantity || 0
      );

    const productName =
      product.name ||
      product.title ||
      "Produit sans nom";

    const alert = {
      title:
        "Stock faible",

      message:
        `${productName} presque en rupture (${stock})`,

      priority:
        stock === 0
          ? "urgent"
          : "high",

      read: false
    };

    const {
      data: existing,
      error: existingError
    } = await agentos
      .from("agent_alerts")
      .select("id")
      .eq(
        "message",
        alert.message
      )
      .eq("read", false)
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    if (
      !existing ||
      existing.length === 0
    ) {

      const {
        error: insertError
      } = await agentos
        .from("agent_alerts")
        .insert([alert]);

      if (insertError) {
        throw insertError;
      }

      createdAlerts.push(alert);
    }
  }

  return {
    lowStockDetected:
      lowStock.length,

    alertsCreated:
      createdAlerts.length,

    alerts:
      createdAlerts
  };
}