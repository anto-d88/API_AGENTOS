import {
  onEvent
} from "../core/eventBus.js";

onEvent(
  "stock.low",

  async (payload) => {

    console.log(
      "🚨 EVENT stock.low",
      payload
    );

  }
);