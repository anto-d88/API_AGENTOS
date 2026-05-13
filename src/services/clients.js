import OpenAI from "openai";
import { createClient }
from "@supabase/supabase-js";

export function getClients() {

  const agentos =
    createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

  let sandwich = null;

  if (
    process.env.SANDWICH_SUPABASE_URL &&
    process.env.SANDWICH_SUPABASE_SERVICE_ROLE_KEY
  ) {

    sandwich =
      createClient(
        process.env.SANDWICH_SUPABASE_URL,
        process.env.SANDWICH_SUPABASE_SERVICE_ROLE_KEY
      );

  }

  const groq =
    new OpenAI({
      apiKey:
        process.env.GROQ_API_KEY || "missing",

      baseURL:
        "https://api.groq.com/openai/v1"
    });
console.log("SANDWICH URL:", process.env.SANDWICH_SUPABASE_URL);
console.log("SANDWICH KEY EXISTS:", !!process.env.SANDWICH_SUPABASE_SERVICE_ROLE_KEY);
console.log("SANDWICH CLIENT EXISTS:", !!sandwich);
  return {
    agentos,
    sandwich,
    groq
  };
}