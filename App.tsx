import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";

import {
  AssistantModal,
  BlindChatScreen,
  BlindDatePopupScreen,
  CreateAccountScreen,
  MatchmakingWaitingScreen,
  ProfileSetupScreen,
  RevealedProfileScreen,
  RevealWaitingScreen,
  SchedulePlaceScreen,
  SimpleLoadingScreen,
} from "./src/AppUI";
import { API_URL, APP_HELP_FALLBACK } from "./src/config";
import {
  AccountDetails,
  AppHelpResponse,
  ChatMessage,
  ChatStateResponse,
  MatchStatusResponse,
  MatchSummary,
  ProfileResponse,
  ProfileSetup,
  RevealRequestResponse,
  RevealStatusResponse,
  RevealedProfile,
  ScheduleDetails,
  ScheduleResponse,
  Screen,
  SessionResponse,
} from "./src/types";

const defaultAccountDetails: AccountDetails = {
  name: "Deven",
  age: "24",
};

const defaultProfileSetup: ProfileSetup = {
  datingGoal: "",
  preference: "",
  personalityTraits: "",
};

const defaultScheduleDetails: ScheduleDetails = {
  place: "Blue Bottle Coffee",
  time: "Tonight, 7-9 PM",
};

async function getJson(path: string) {
  if (!API_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}${path}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

async function sendJson(path: string, method: "POST" | "PATCH", body?: unknown) {
  if (!API_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("create-account");
  const [sessionId, setSessionId] = useState("");
  const [accountDetails, setAccountDetails] =
    useState<AccountDetails>(defaultAccountDetails);
  const [profileSetup, setProfileSetup] =
    useState<ProfileSetup>(defaultProfileSetup);
  const [scheduleDetails, setScheduleDetails] =
    useState<ScheduleDetails>(defaultScheduleDetails);
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [revealedProfile, setRevealedProfile] =
    useState<RevealedProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [isMatchRevealed, setIsMatchRevealed] = useState(false);

  function clearMatchState() {
    setMatch(null);
    setMessages([]);
    setIsMatchRevealed(false);
    setRevealedProfile(null);
  }

  function loadChatState(payload: ChatStateResponse) {
    setMatch(payload.match);
    setScheduleDetails(payload.scheduleDetails);
    setMessages(payload.messages);
    setIsMatchRevealed(payload.isMatchRevealed);
    setRevealedProfile(payload.revealedProfile);
  }

  function loadRevealState(payload: RevealStatusResponse) {
    setMessages(payload.messages);
    setIsMatchRevealed(payload.isMatchRevealed);
    setRevealedProfile(payload.revealedProfile);
  }

  useEffect(() => {
    if (screen !== "waiting" || !sessionId) {
      return;
    }

    let stopped = false;

    async function checkMatch() {
      const payload = (await getJson(
        `/api/session/${sessionId}/match-status`
      )) as MatchStatusResponse | null;

      if (stopped || !payload) {
        return;
      }

      setScheduleDetails(payload.scheduleDetails);

      if (payload.status === "found" && payload.match) {
        setMatch(payload.match);
        setScreen("popup");
      }
    }

    checkMatch();
    const timerId = setInterval(checkMatch, 800);

    return () => {
      stopped = true;
      clearInterval(timerId);
    };
  }, [screen, sessionId]);

  useEffect(() => {
    if (screen !== "reveal-wait" || !sessionId) {
      return;
    }

    let stopped = false;

    async function checkReveal() {
      const payload = (await getJson(
        `/api/session/${sessionId}/reveal-status`
      )) as RevealStatusResponse | null;

      if (stopped || !payload) {
        return;
      }

      loadRevealState(payload);

      if (payload.status === "revealed") {
        setScreen("revealed-profile");
      }
    }

    checkReveal();
    const timerId = setInterval(checkReveal, 400);

    return () => {
      stopped = true;
      clearInterval(timerId);
    };
  }, [screen, sessionId]);

  function updateAccountName(name: string) {
    setAccountDetails((current) => ({ ...current, name }));
  }

  function updateAccountAge(age: string) {
    setAccountDetails((current) => ({ ...current, age }));
  }

  function updateDatingGoal(datingGoal: string) {
    setProfileSetup((current) => ({ ...current, datingGoal }));
  }

  function updatePreference(preference: string) {
    setProfileSetup((current) => ({ ...current, preference }));
  }

  function updatePersonalityTraits(personalityTraits: string) {
    setProfileSetup((current) => ({ ...current, personalityTraits }));
  }

  function updateSchedulePlace(place: string) {
    setScheduleDetails((current) => ({ ...current, place }));
  }

  function updateScheduleTime(time: string) {
    setScheduleDetails((current) => ({ ...current, time }));
  }

  async function createAccount() {
    const payload = (await sendJson("/api/session", "POST", {
      accountDetails,
    })) as SessionResponse | null;

    if (!payload) {
      return;
    }

    setSessionId(payload.sessionId);
    setAccountDetails(payload.accountDetails);
    setScreen("profile-setup");
  }

  async function saveProfile() {
    if (!sessionId) {
      return;
    }

    const payload = (await sendJson(
      `/api/session/${sessionId}/profile`,
      "PATCH",
      { profileSetup }
    )) as ProfileResponse | null;

    if (!payload) {
      return;
    }

    setProfileSetup(payload.profileSetup);
    setScreen("schedule-place");
  }

  async function saveSchedule() {
    if (!sessionId) {
      return;
    }

    const payload = (await sendJson(
      `/api/session/${sessionId}/schedule`,
      "PATCH",
      { scheduleDetails }
    )) as ScheduleResponse | null;

    if (!payload) {
      return;
    }

    setScheduleDetails(payload.scheduleDetails);
    clearMatchState();
    setScreen("waiting");
  }

  async function ignoreMatch() {
    if (sessionId) {
      await sendJson(`/api/session/${sessionId}/match/ignore`, "POST");
    }

    clearMatchState();
    setScreen("schedule-place");
  }

  async function joinBlindChat() {
    if (!sessionId) {
      return;
    }

    const payload = (await sendJson(
      `/api/session/${sessionId}/match/join`,
      "POST"
    )) as ChatStateResponse | null;

    if (!payload) {
      return;
    }

    loadChatState(payload);
    setScreen("chat");
  }

  async function sendMessage(text: string) {
    if (!sessionId) {
      return;
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return;
    }

    const payload = (await sendJson(
      `/api/session/${sessionId}/chat/messages`,
      "POST",
      { text: cleanText }
    )) as ChatStateResponse | null;

    if (!payload) {
      return;
    }

    loadChatState(payload);
  }

  async function requestReveal() {
    if (!sessionId) {
      return;
    }

    const payload = (await sendJson(
      `/api/session/${sessionId}/reveal-request`,
      "POST"
    )) as RevealRequestResponse | null;

    if (payload?.status === "waiting") {
      setScreen("reveal-wait");
    }
  }

  async function askAssistant(question: string) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) {
      return APP_HELP_FALLBACK;
    }

    const payload = (await sendJson("/api/app-help", "POST", {
      message: cleanQuestion,
    })) as AppHelpResponse | null;

    if (!payload?.answer?.trim()) {
      return APP_HELP_FALLBACK;
    }

    return payload.answer.trim();
  }

  function renderScreen() {
    switch (screen) {
      case "create-account":
        return (
          <CreateAccountScreen
            accountDetails={accountDetails}
            onChangeName={updateAccountName}
            onChangeAge={updateAccountAge}
            onContinue={createAccount}
          />
        );
      case "profile-setup":
        return (
          <ProfileSetupScreen
            profileSetup={profileSetup}
            onChangeDatingGoal={updateDatingGoal}
            onChangePreference={updatePreference}
            onChangePersonalityTraits={updatePersonalityTraits}
            onNext={saveProfile}
          />
        );
      case "schedule-place":
        return (
          <SchedulePlaceScreen
            scheduleDetails={scheduleDetails}
            onChangePlace={updateSchedulePlace}
            onChangeTime={updateScheduleTime}
            onSaveSchedule={saveSchedule}
          />
        );
      case "waiting":
        return <MatchmakingWaitingScreen scheduleDetails={scheduleDetails} />;
      case "popup":
        return match ? (
          <BlindDatePopupScreen
            match={match}
            scheduleDetails={scheduleDetails}
            onJoinBlindChat={joinBlindChat}
            onIgnore={ignoreMatch}
          />
        ) : (
          <SimpleLoadingScreen label="Loading match" />
        );
      case "chat":
        return match ? (
          <BlindChatScreen
            match={match}
            scheduleDetails={scheduleDetails}
            revealedProfile={revealedProfile}
            isMatchRevealed={isMatchRevealed}
            messages={messages}
            onSendMessage={sendMessage}
            onAskAssistant={() => setAssistantVisible(true)}
            onRequestReveal={requestReveal}
          />
        ) : (
          <SimpleLoadingScreen label="Loading chat" />
        );
      case "reveal-wait":
        return <RevealWaitingScreen />;
      case "revealed-profile":
        return revealedProfile ? (
          <RevealedProfileScreen
            profile={revealedProfile}
            onContinueChat={() => setScreen("chat")}
          />
        ) : (
          <SimpleLoadingScreen label="Loading profile" />
        );
      default:
        return null;
    }
  }

  return (
    <>
      <StatusBar style="dark" />
      {renderScreen()}
      <AssistantModal
        visible={assistantVisible}
        onClose={() => setAssistantVisible(false)}
        onSubmitQuestion={askAssistant}
      />
    </>
  );
}
