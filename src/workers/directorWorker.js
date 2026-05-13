import { autoDirectorData } from "../services/director/autoDirector.js";

export async function runDirectorWorker() {
  try {
    console.log("🧠 Director Worker lancé");

    const result = await autoDirectorData();

    console.log("✅ Director Worker terminé", result);

    return result;
  } catch (error) {
    console.error("❌ Director Worker erreur", error.message);
    return null;
  }
}