const { randomUUID } = require("crypto");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

const { FALLBACK_ANSWER, getAppHelpAnswer } = require("./app-help");

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

function updateSessionTimers(session) {
  const now = Date.now();

  if (
    session.matchStatus === "searching" &&
    session.matchReadyAt &&
    now >= session.matchReadyAt
  ) {
    session.matchStatus = "found";
    session.matchReadyAt = null;
  }

  if (
    session.revealStatus === "waiting" &&
    session.revealReadyAt &&
    now >= session.revealReadyAt
  ) {
    session.revealStatus = "revealed";
    session.revealReadyAt = null;

    const alreadyAdded = session.messages.some(
      (message) => message.id === "system-reveal"
    );

    if (!alreadyAdded) {
      session.messages.push({
        id: "system-reveal",
        sender: "system",
        text: "Reveal unlocked. You're chatting with Maya.",
      });
    }
  }
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
    matchStatus: "idle",
    matchReadyAt: null,
    revealStatus: "idle",
    revealReadyAt: null,
    replyIndex: 0,
  };

  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  updateSessionTimers(session);
  return session;
}

function getChatState(session) {
  updateSessionTimers(session);

  return {
    match: session.match,
    scheduleDetails: session.scheduleDetails,
    messages: session.messages,
    isMatchRevealed: session.revealStatus === "revealed",
    revealedProfile:
      session.revealStatus === "revealed" ? session.revealedProfile : null,
  };
}

function getRevealState(session) {
  updateSessionTimers(session);

  return {
    status: session.revealStatus,
    messages: session.messages,
    isMatchRevealed: session.revealStatus === "revealed",
    revealedProfile:
      session.revealStatus === "revealed" ? session.revealedProfile : null,
  };
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

  app.patch("/api/session/:sessionId/schedule", requireSession, (req, res) => {
    const scheduleDetails = req.body?.scheduleDetails || {};

    req.session.scheduleDetails = {
      place: trimText(scheduleDetails.place, req.session.scheduleDetails.place),
      time: trimText(scheduleDetails.time, req.session.scheduleDetails.time),
    };
    req.session.messages = copyMessages();
    req.session.replyIndex = 0;
    req.session.matchStatus = "searching";
    req.session.matchReadyAt = Date.now() + 2400;
    req.session.revealStatus = "idle";
    req.session.revealReadyAt = null;

    res.json({
      status: req.session.matchStatus,
      scheduleDetails: req.session.scheduleDetails,
    });
  });

  app.get("/api/session/:sessionId/match-status", requireSession, (req, res) => {
    updateSessionTimers(req.session);

    res.json({
      status: req.session.matchStatus,
      match: req.session.matchStatus === "found" ? req.session.match : null,
      scheduleDetails: req.session.scheduleDetails,
    });
  });

  app.post("/api/session/:sessionId/match/join", requireSession, (req, res) => {
    updateSessionTimers(req.session);

    if (
      req.session.matchStatus !== "found" &&
      req.session.matchStatus !== "joined"
    ) {
      res.status(409).json({ error: "Match is not ready" });
      return;
    }

    req.session.matchStatus = "joined";
    res.json(getChatState(req.session));
  });

  app.post(
    "/api/session/:sessionId/match/ignore",
    requireSession,
    (req, res) => {
      req.session.matchStatus = "idle";
      req.session.matchReadyAt = null;

      res.json({ status: "ignored" });
    }
  );

  app.post(
    "/api/session/:sessionId/chat/messages",
    requireSession,
    (req, res) => {
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
      res.json(getChatState(req.session));
    }
  );

  app.post(
    "/api/session/:sessionId/reveal-request",
    requireSession,
    (req, res) => {
      req.session.revealStatus = "waiting";
      req.session.revealReadyAt = Date.now() + 1000;

      res.json({ status: req.session.revealStatus });
    }
  );

  app.get(
    "/api/session/:sessionId/reveal-status",
    requireSession,
    (req, res) => {
      res.json(getRevealState(req.session));
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
