import {
  addJob
} from "./queue.js";

const listeners = {};

export function onEvent(
  eventName,
  callback
) {

  if (!listeners[eventName]) {

    listeners[eventName] = [];
  }

  listeners[eventName]
    .push(callback);
}

export async function emitEvent(
  eventName,
  payload = {}
) {

  console.log(
    `📡 Event emitted: ${eventName}`
  );

  const eventListeners =
    listeners[eventName] || [];

  for (const listener of eventListeners) {

    addJob(

      `event:${eventName}`,

      async () => {

        try {

          await listener(payload);

        } catch (error) {

          console.error(
            `❌ Event listener error (${eventName})`,
            error.message
          );

        }
      }
    );
  }
}