const { randomUUID } = require("crypto");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

const { FALLBACK_ANSWER, getAppHelpAnswer } = require("./app-help");
const {
  BLIND_DATE_QUERY,
  BLIND_DATE_WORKFLOW,
  IGNORE_MATCH_SIGNAL,
  JOIN_MATCH_SIGNAL,
  REQUEST_REVEAL_SIGNAL,
  TEMPORAL_TASK_QUEUE,
  createWorkflowId,
  getTemporalClient,
} = require("./temporal");

dotenv.config();

const MATCH = {
  matchId: "match_001",
  compatibility: 87,
  anonymousLabel: "Blind Match",
  sharedIntent: "Intentional dating",
};

const REVEALED_PROFILE = {
  name: "Maya",
  age: 25,
  datingGoal: "Intentional dating",
  personality: "Curious, calm, creative",
};

const STARTING_MESSAGES = [
  {
    id: "match-1",
    sender: "match",
    text: "Glad we get to talk first.",
  },
  {
    id: "match-2",
    sender: "match",
    text: "How's your night going?",
  },
];

const AUTO_REPLIES = [
  "Same here.",
  "That sounds good to me.",
  "I'm into that.",
  "Nice. That feels easy.",
];

const sessions = new Map();

function trimText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function copyMessages() {
  return STARTING_MESSAGES.map((message) => ({ ...message }));
}

function createSession(accountDetails = {}) {
  const sessionId = `session_${randomUUID()}`;
  const session = {
    id: sessionId,
    accountDetails: {
      name: trimText(accountDetails.name),
      age: trimText(accountDetails.age),
    },
    profileSetup: {
      datingGoal: "",
      preference: "",
      personalityTraits: "",
    },
    scheduleDetails: {
      place: "",
      time: "",
    },
    match: { ...MATCH },
    revealedProfile: { ...REVEALED_PROFILE },
    messages: copyMessages(),
    workflowId: "",
    replyIndex: 0,
  };

  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function requireSession(req, res, next) {
  const session = getSession(req.params.sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  req.session = session;
  next();
}

function getChatState(session, blindDateState) {
  return {
    match: blindDateState && blindDateState.match ? blindDateState.match : null,
    scheduleDetails: session.scheduleDetails,
    messages: session.messages,
    isMatchRevealed: blindDateState
      ? blindDateState.revealStatus === "revealed"
      : false,
    revealedProfile:
      blindDateState && blindDateState.revealStatus === "revealed"
        ? blindDateState.revealedProfile
        : null,
  };
}

function getRevealState(session, blindDateState) {
  return {
    status: blindDateState ? blindDateState.revealStatus : "idle",
    messages: session.messages,
    isMatchRevealed: blindDateState
      ? blindDateState.revealStatus === "revealed"
      : false,
    revealedProfile:
      blindDateState && blindDateState.revealStatus === "revealed"
        ? blindDateState.revealedProfile
        : null,
  };
}

async function getBlindDateState(session) {
  if (!session.workflowId) {
    return {
      status: "idle",
      match: null,
      revealStatus: "idle",
      revealedProfile: null,
    };
  }

  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(session.workflowId);

  return handle.query(BLIND_DATE_QUERY);
}

async function startBlindDateWorkflow(session) {
  const client = await getTemporalClient();

  if (session.workflowId) {
    try {
      const oldHandle = client.workflow.getHandle(session.workflowId);
      await oldHandle.signal(IGNORE_MATCH_SIGNAL);
    } catch {
      // Ignore old workflow cleanup errors when replacing a schedule.
    }
  }

  const workflowId = createWorkflowId(session.id);

  await client.workflow.start(BLIND_DATE_WORKFLOW, {
    workflowId,
    taskQueue: TEMPORAL_TASK_QUEUE,
    args: [
      {
        scheduleDetails: session.scheduleDetails,
        match: session.match,
        revealedProfile: session.revealedProfile,
      },
    ],
  });

  session.workflowId = workflowId;
}

async function signalBlindDateWorkflow(session, signalName) {
  if (!session.workflowId) {
    return;
  }

  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(session.workflowId);
  await handle.signal(signalName);
}

function sendTemporalError(res, error) {
  console.error("Temporal request failed");
  console.error(error);
  res.status(503).json({
    error: "Temporal is not available. Start the Temporal server and worker.",
  });
}

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/session", (req, res) => {
    const session = createSession(req.body?.accountDetails);

    res.status(201).json({
      sessionId: session.id,
      accountDetails: session.accountDetails,
    });
  });

  app.patch("/api/session/:sessionId/profile", requireSession, (req, res) => {
    const profileSetup = req.body?.profileSetup || {};

    req.session.profileSetup = {
      datingGoal: trimText(
        profileSetup.datingGoal,
        req.session.profileSetup.datingGoal
      ),
      preference: trimText(
        profileSetup.preference,
        req.session.profileSetup.preference
      ),
      personalityTraits: trimText(
        profileSetup.personalityTraits,
        req.session.profileSetup.personalityTraits
      ),
    };

    res.json({ profileSetup: req.session.profileSetup });
  });

  app.patch(
    "/api/session/:sessionId/schedule",
    requireSession,
    async (req, res) => {
      const scheduleDetails = req.body?.scheduleDetails || {};

      req.session.scheduleDetails = {
        place: trimText(
          scheduleDetails.place,
          req.session.scheduleDetails.place
        ),
        time: trimText(scheduleDetails.time, req.session.scheduleDetails.time),
      };
      req.session.messages = copyMessages();
      req.session.replyIndex = 0;

      try {
        await startBlindDateWorkflow(req.session);

        res.json({
          status: "searching",
          scheduleDetails: req.session.scheduleDetails,
        });
      } catch (error) {
        sendTemporalError(res, error);
      }
    }
  );

  app.get(
    "/api/session/:sessionId/match-status",
    requireSession,
    async (req, res) => {
      try {
        const blindDateState = await getBlindDateState(req.session);

        res.json({
          status: blindDateState.status,
          match: blindDateState.match,
          scheduleDetails: req.session.scheduleDetails,
        });
      } catch (error) {
        sendTemporalError(res, error);
      }
    }
  );

  app.post(
    "/api/session/:sessionId/match/join",
    requireSession,
    async (req, res) => {
      try {
        const blindDateState = await getBlindDateState(req.session);

        if (
          blindDateState.status !== "found" &&
          blindDateState.status !== "joined"
        ) {
          res.status(409).json({ error: "Match is not ready" });
          return;
        }

        await signalBlindDateWorkflow(req.session, JOIN_MATCH_SIGNAL);
        const nextBlindDateState = await getBlindDateState(req.session);

        res.json(getChatState(req.session, nextBlindDateState));
      } catch (error) {
        sendTemporalError(res, error);
      }
    }
  );

  app.post(
    "/api/session/:sessionId/match/ignore",
    requireSession,
    async (req, res) => {
      try {
        await signalBlindDateWorkflow(req.session, IGNORE_MATCH_SIGNAL);
      } catch (error) {
        sendTemporalError(res, error);
        return;
      }

      req.session.workflowId = "";
      res.json({ status: "ignored" });
    }
  );

  app.post(
    "/api/session/:sessionId/chat/messages",
    requireSession,
    async (req, res) => {
      const text = trimText(req.body?.text);

      if (!text) {
        res.status(400).json({ error: "Message text is required" });
        return;
      }

      const timestamp = Date.now();

      req.session.messages.push({
        id: `user-${timestamp}`,
        sender: "user",
        text,
      });

      req.session.messages.push({
        id: `match-${timestamp}-${req.session.replyIndex}`,
        sender: "match",
        text: AUTO_REPLIES[req.session.replyIndex % AUTO_REPLIES.length],
      });

      req.session.replyIndex += 1;

      try {
        const blindDateState = await getBlindDateState(req.session);
        res.json(getChatState(req.session, blindDateState));
      } catch (error) {
        sendTemporalError(res, error);
      }
    }
  );

  app.post(
    "/api/session/:sessionId/reveal-request",
    requireSession,
    async (req, res) => {
      try {
        const blindDateState = await getBlindDateState(req.session);

        if (blindDateState.status !== "joined") {
          res.status(409).json({ error: "Match is not ready for reveal" });
          return;
        }

        await signalBlindDateWorkflow(req.session, REQUEST_REVEAL_SIGNAL);
        res.json({ status: "waiting" });
      } catch (error) {
        sendTemporalError(res, error);
      }
    }
  );

  app.get(
    "/api/session/:sessionId/reveal-status",
    requireSession,
    async (req, res) => {
      try {
        const blindDateState = await getBlindDateState(req.session);
        res.json(getRevealState(req.session, blindDateState));
      } catch (error) {
        sendTemporalError(res, error);
      }
    }
  );

  app.post("/api/app-help", async (req, res) => {
    const message = trimText(req.body?.message);

    if (!message) {
      res.json({ answer: FALLBACK_ANSWER });
      return;
    }

    const answer = await getAppHelpAnswer(message);
    res.json({ answer });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Blindly backend listening on http://localhost:${port}`);
  });
}

module.exports = {
  app,
  createApp,
  FALLBACK_ANSWER,
};
