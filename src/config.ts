import appConstants from "../shared/app-constants.json";

type RuntimeEnv = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const runtimeEnv =
  typeof globalThis === "object"
    ? (globalThis as typeof globalThis & RuntimeEnv).process?.env
    : undefined;

const normalizeApiUrl = (value: string | undefined) => {
  if (!value) {
    return "";
  }

  return value.replace(/\/+$/, "");
};

export const API_URL = normalizeApiUrl(runtimeEnv?.EXPO_PUBLIC_API_URL);

export const APP_HELP_FALLBACK = appConstants.assistantFallback;
