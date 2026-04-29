const { NativeConnection, Worker } = require("@temporalio/worker");

const {
  TEMPORAL_ADDRESS,
  TEMPORAL_NAMESPACE,
  TEMPORAL_TASK_QUEUE,
} = require("./temporal");

async function runWorker() {
  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TEMPORAL_TASK_QUEUE,
    workflowsPath: require.resolve("./temporal-workflows"),
  });

  console.log(
    `Temporal worker listening on ${TEMPORAL_ADDRESS} using task queue ${TEMPORAL_TASK_QUEUE}`
  );

  await worker.run();
}

if (require.main === module) {
  runWorker().catch((error) => {
    console.error("Temporal worker failed to start");
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  runWorker,
};
