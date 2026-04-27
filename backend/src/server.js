const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const FALLBACK_ANSWER =
  "The assistant is unavailable, but blind matches reveal only when both people agree.";

const MOCK_MATCH = {
  matchId: "match_001",
  compatibility: 87,
  anonymousLabel: "Blind Match",
  sharedIntent: "Intentional dating",
};

function extractAnswer(payload) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  const directKeys = [
    "answer",
    "text",
    "response",
    "content",
    "message",
    "output_text",
    "completion",
  ];

  for (const key of directKeys) {
    if (typeof payload[key] === "string" && payload[key].trim()) {
      return payload[key].trim();
    }
  }

  if (payload.data && typeof payload.data === "object") {
    return extractAnswer(payload.data);
  }

  return "";
}

async function getAppHelpAnswer(message) {
  const backendUrl = process.env.LLM_BACKEND_URL;

  if (!backendUrl) {
    return FALLBACK_ANSWER;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return FALLBACK_ANSWER;
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return extractAnswer(payload) || FALLBACK_ANSWER;
  } catch {
    return FALLBACK_ANSWER;
  } finally {
    clearTimeout(timeout);
  }
}

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/mock-match", (_req, res) => {
    res.json(MOCK_MATCH);
  });

  app.post("/api/app-help", async (req, res) => {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.json({ answer: FALLBACK_ANSWER });
    }

    const answer = await getAppHelpAnswer(message);
    return res.json({ answer });
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
