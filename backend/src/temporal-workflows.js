const {
  condition,
  defineQuery,
  defineSignal,
  setHandler,
  sleep,
} = require("@temporalio/workflow");

const getBlindDateStateQuery = defineQuery("getBlindDateState");
const joinMatchSignal = defineSignal("joinMatch");
const ignoreMatchSignal = defineSignal("ignoreMatch");
const requestRevealSignal = defineSignal("requestReveal");

function copyState(state) {
  return JSON.parse(JSON.stringify(state));
}

async function blindDateWorkflow(input) {
  const state = {
    status: "searching",
    scheduleDetails: input.scheduleDetails,
    match: null,
    revealStatus: "idle",
    revealedProfile: null,
  };

  setHandler(getBlindDateStateQuery, () => copyState(state));

  setHandler(joinMatchSignal, () => {
    if (state.status === "found") {
      state.status = "joined";
    }
  });

  setHandler(ignoreMatchSignal, () => {
    state.status = "ignored";
  });

  setHandler(requestRevealSignal, () => {
    if (state.status === "joined" && state.revealStatus === "idle") {
      state.revealStatus = "waiting";
    }
  });

  await sleep(2400);

  if (state.status === "ignored") {
    return copyState(state);
  }

  state.status = "found";
  state.match = input.match;

  await condition(
    () => state.status === "ignored" || state.revealStatus === "waiting"
  );

  if (state.status === "ignored") {
    return copyState(state);
  }

  await sleep(1000);

  if (state.status === "ignored") {
    return copyState(state);
  }

  state.revealStatus = "revealed";
  state.revealedProfile = input.revealedProfile;

  await condition(() => state.status === "ignored");

  return copyState(state);
}

module.exports = {
  blindDateWorkflow,
};
