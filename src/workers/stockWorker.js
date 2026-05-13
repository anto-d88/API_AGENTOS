import {
  checkStockData
} from "../services/stock/checkStock.js";

export async function
runStockWorker() {

  try {

    console.log(
      "📦 Stock Worker lancé"
    );

    const result =
      await checkStockData();

    console.log(
      "✅ Stock Worker terminé",
      result
    );

    return result;

  } catch (error) {

    console.error(
      "❌ Stock Worker erreur",
      error.message
    );

    return null;
  }
}