import { runAgentCycle }
from "../core/agentCycle.js";

import {
  cleanupMemory
} from "../services/memory/cleanupMemory.js";

export async function
runMemoryWorker() {

  return runAgentCycle({

    agentName:
      "Memory Worker",

    execute:
      async () => {

        return await cleanupMemory();

      }
  });
}