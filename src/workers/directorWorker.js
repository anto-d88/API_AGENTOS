import { runAgentCycle }
from "../core/agentCycle.js";

import {
  autoDirectorData
} from "../services/director/autoDirector.js";

export async function
runDirectorWorker() {

  return runAgentCycle({

    agentName:
      "Agent Directeur IA",

    execute:
      async () => {

        return await autoDirectorData();

      }
  });
}