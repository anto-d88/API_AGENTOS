const queues = {};

export function createQueue(
  queueName
) {

  if (!queues[queueName]) {

    queues[queueName] = {
      running: false,
      jobs: []
    };
  }

  return queues[queueName];
}

export function addJob(
  queueName,
  job
) {

  const queue =
    createQueue(queueName);

  queue.jobs.push(job);

  processQueue(queueName);
}

async function processQueue(
  queueName
) {

  const queue =
    queues[queueName];

  if (!queue) return;

  if (queue.running) return;

  queue.running = true;

  while (
    queue.jobs.length > 0
  ) {

    const job =
      queue.jobs.shift();

    try {

      await job();

    } catch (error) {

      console.error(
        `❌ Queue ${queueName}`,
        error.message
      );

    }
  }

  queue.running = false;
}