export type Screen =
  | "create-account"
  | "profile-setup"
  | "schedule-place"
  | "waiting"
  | "popup"
  | "chat"
  | "reveal-wait"
  | "revealed-profile";

export type MatchStatus = "idle" | "searching" | "found" | "joined";

export type RevealStatus = "idle" | "waiting" | "revealed";

export type AccountDetails = {
  name: string;
  age: string;
};

export type ProfileSetup = {
  datingGoal: string;
  preference: string;
  personalityTraits: string;
};

export type ScheduleDetails = {
  place: string;
  time: string;
};

export type MatchSummary = {
  matchId?: string;
  anonymousLabel: string;
  compatibility: number;
  sharedIntent: string;
};

export type RevealedProfile = {
  name: string;
  age: number;
  datingGoal: string;
  personality: string;
};

export type ChatMessage = {
  id: string;
  sender: "match" | "user" | "system";
  text: string;
};

export type SessionResponse = {
  sessionId: string;
  accountDetails: AccountDetails;
};

export type ProfileResponse = {
  profileSetup: ProfileSetup;
};

export type ScheduleResponse = {
  status: MatchStatus;
  scheduleDetails: ScheduleDetails;
};

export type MatchStatusResponse = {
  status: MatchStatus;
  match: MatchSummary | null;
  scheduleDetails: ScheduleDetails;
};

export type ChatStateResponse = {
  match: MatchSummary;
  scheduleDetails: ScheduleDetails;
  messages: ChatMessage[];
  isMatchRevealed: boolean;
  revealedProfile: RevealedProfile | null;
};

export type RevealStatusResponse = {
  status: RevealStatus;
  messages: ChatMessage[];
  isMatchRevealed: boolean;
  revealedProfile: RevealedProfile | null;
};

export type RevealRequestResponse = {
  status: RevealStatus;
};

export type AppHelpResponse = {
  answer?: string;
};
