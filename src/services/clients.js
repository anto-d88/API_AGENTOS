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

  return {
    agentos,
    sandwich,
    groq
  };
}