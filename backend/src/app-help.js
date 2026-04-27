const appConstants = require("../../shared/app-constants.json");

const FALLBACK_ANSWER = appConstants.assistantFallback;

function readAnswer(payload) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  const keys = ["answer", "text", "response", "content", "message"];

  for (const key of keys) {
    if (typeof payload[key] === "string" && payload[key].trim()) {
      return payload[key].trim();
    }
  }

  return "";
}

async function getAppHelpAnswer(message) {
  const backendUrl = process.env.LLM_BACKEND_URL;

  if (!backendUrl) {
    return FALLBACK_ANSWER;
  }

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      return FALLBACK_ANSWER;
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return readAnswer(payload) || FALLBACK_ANSWER;
  } catch {
    return FALLBACK_ANSWER;
  }
}

module.exports = {
  FALLBACK_ANSWER,
  getAppHelpAnswer,
};
