import { runAgentCycle } from "../core/agentCycle.js";

import {
  checkStockData
} from "../services/stock/checkStock.js";

export async function
runStockWorker() {

  return runAgentCycle({

    agentName:
      "Agent Stock",

    execute:
      async () => {

        return await checkStockData();

      }
  });
}