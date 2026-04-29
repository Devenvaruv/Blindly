const { Client, Connection } = require("@temporalio/client");

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || "127.0.0.1:7233";
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || "default";
const TEMPORAL_TASK_QUEUE =
  process.env.TEMPORAL_TASK_QUEUE || "blind-date-task-queue";

const BLIND_DATE_WORKFLOW = "blindDateWorkflow";
const BLIND_DATE_QUERY = "getBlindDateState";
const JOIN_MATCH_SIGNAL = "joinMatch";
const IGNORE_MATCH_SIGNAL = "ignoreMatch";
const REQUEST_REVEAL_SIGNAL = "requestReveal";

let clientPromise;

async function getTemporalClient() {
  if (!clientPromise) {
    clientPromise = Connection.connect({ address: TEMPORAL_ADDRESS }).then(
      (connection) =>
        new Client({
          connection,
          namespace: TEMPORAL_NAMESPACE,
        })
    );
  }

  return clientPromise;
}

function createWorkflowId(sessionId) {
  return `blind-date-${sessionId}-${Date.now()}`;
}

module.exports = {
  BLIND_DATE_QUERY,
  BLIND_DATE_WORKFLOW,
  IGNORE_MATCH_SIGNAL,
  JOIN_MATCH_SIGNAL,
  REQUEST_REVEAL_SIGNAL,
  TEMPORAL_ADDRESS,
  TEMPORAL_NAMESPACE,
  TEMPORAL_TASK_QUEUE,
  createWorkflowId,
  getTemporalClient,
};
