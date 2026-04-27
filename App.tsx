import { ReactNode, useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { API_URL, APP_HELP_FALLBACK } from "./src/config";
import { styles, theme } from "./src/styles";

type Screen =
  | "create-account"
  | "profile-setup"
  | "schedule-place"
  | "waiting"
  | "popup"
  | "chat"
  | "reveal-wait"
  | "revealed-profile";

type AccountDetails = {
  name: string;
  age: string;
};

type ProfileSetup = {
  datingGoal: string;
  preference: string;
  personalityTraits: string;
};

type ScheduleDetails = {
  place: string;
  time: string;
};

type MatchSummary = {
  anonymousLabel: string;
  compatibility: number;
  sharedIntent: string;
};

type RevealedProfile = {
  name: string;
  age: number;
  datingGoal: string;
  personality: string;
};

type ChatMessage = {
  id: string;
  sender: "match" | "user" | "system";
  text: string;
};

const defaultAccountDetails: AccountDetails = {
  name: "Deven",
  age: "24",
};

const defaultProfileSetup: ProfileSetup = {
  datingGoal: "Intentional dating",
  preference: "Warm, grounded people who want something real",
  personalityTraits: "Curious, calm, thoughtful",
};

const defaultScheduleDetails: ScheduleDetails = {
  place: "Blue Bottle Coffee",
  time: "Tonight, 7-9 PM",
};

const matchSummary: MatchSummary = {
  anonymousLabel: "Blind Match",
  compatibility: 87,
  sharedIntent: "Intentional dating",
};

const revealedProfile: RevealedProfile = {
  name: "Maya",
  age: 25,
  datingGoal: "Intentional dating",
  personality: "Curious, calm, creative",
};

const initialMessages: ChatMessage[] = [
  {
    id: "match-1",
    sender: "match",
    text: "Glad we get to talk first.",
  },
  {
    id: "match-2",
    sender: "match",
    text: "Coffee works for me.",
  },
  {
    id: "match-3",
    sender: "match",
    text: "How's your night going?",
  },
];

const revealSystemMessage: ChatMessage = {
  id: "system-reveal",
  sender: "system",
  text: "Reveal unlocked. You're chatting with Maya.",
};

const wait = (durationMs: number) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

const createUserMessage = (text: string): ChatMessage => ({
  id: `user-${Date.now()}`,
  sender: "user",
  text,
});

export default function App() {
  const [screen, setScreen] = useState<Screen>("create-account");
  const [accountDetails, setAccountDetails] =
    useState<AccountDetails>(defaultAccountDetails);
  const [profileSetup, setProfileSetup] =
    useState<ProfileSetup>(defaultProfileSetup);
  const [scheduleDetails, setScheduleDetails] =
    useState<ScheduleDetails>(defaultScheduleDetails);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [isMatchRevealed, setIsMatchRevealed] = useState(false);

  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setMessages((current) => [...current, createUserMessage(trimmed)]);
  };

  const handleRevealAgreed = () => {
    setIsMatchRevealed(true);
    setMessages((current) => {
      if (current.some((message) => message.id === revealSystemMessage.id)) {
        return current;
      }

      return [...current, revealSystemMessage];
    });
    setScreen("revealed-profile");
  };

  const handleAskAssistant = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return APP_HELP_FALLBACK;
    }

    if (!API_URL) {
      await wait(300);
      return APP_HELP_FALLBACK;
    }

    try {
      const response = await fetch(`${API_URL}/api/app-help`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        return APP_HELP_FALLBACK;
      }

      const payload: unknown = await response.json();
      if (
        typeof payload === "object" &&
        payload !== null &&
        "answer" in payload &&
        typeof payload.answer === "string" &&
        payload.answer.trim()
      ) {
        return payload.answer.trim();
      }

      return APP_HELP_FALLBACK;
    } catch {
      return APP_HELP_FALLBACK;
    }
  };

  let content: ReactNode = null;

  if (screen === "create-account") {
    content = (
      <CreateAccountScreen
        accountDetails={accountDetails}
        onChangeName={(name) =>
          setAccountDetails((current) => ({ ...current, name }))
        }
        onChangeAge={(age) =>
          setAccountDetails((current) => ({ ...current, age }))
        }
        onContinue={() => setScreen("profile-setup")}
      />
    );
  }

  if (screen === "profile-setup") {
    content = (
      <ProfileSetupScreen
        profileSetup={profileSetup}
        onChangeDatingGoal={(datingGoal) =>
          setProfileSetup((current) => ({ ...current, datingGoal }))
        }
        onChangePreference={(preference) =>
          setProfileSetup((current) => ({ ...current, preference }))
        }
        onChangePersonalityTraits={(personalityTraits) =>
          setProfileSetup((current) => ({ ...current, personalityTraits }))
        }
        onNext={() => setScreen("schedule-place")}
      />
    );
  }

  if (screen === "schedule-place") {
    content = (
      <SchedulePlaceScreen
        accountDetails={accountDetails}
        scheduleDetails={scheduleDetails}
        onChangePlace={(place) =>
          setScheduleDetails((current) => ({ ...current, place }))
        }
        onChangeTime={(time) =>
          setScheduleDetails((current) => ({ ...current, time }))
        }
        onSaveSchedule={() => setScreen("waiting")}
      />
    );
  }

  if (screen === "waiting") {
    content = (
      <MatchmakingWaitingScreen
        scheduleDetails={scheduleDetails}
        onMatchFound={() => setScreen("popup")}
      />
    );
  }

  if (screen === "popup") {
    content = (
      <BlindDatePopupScreen
        match={matchSummary}
        scheduleDetails={scheduleDetails}
        onJoinBlindChat={() => setScreen("chat")}
        onIgnore={() => setScreen("schedule-place")}
      />
    );
  }

  if (screen === "chat") {
    content = (
      <BlindChatScreen
        match={matchSummary}
        scheduleDetails={scheduleDetails}
        revealedProfile={revealedProfile}
        isMatchRevealed={isMatchRevealed}
        messages={messages}
        onSendMessage={handleSendMessage}
        onAskAssistant={() => setAssistantVisible(true)}
        onRequestReveal={() => setScreen("reveal-wait")}
      />
    );
  }

  if (screen === "reveal-wait") {
    content = <RevealWaitingScreen onRevealAgreed={handleRevealAgreed} />;
  }

  if (screen === "revealed-profile") {
    content = (
      <RevealedProfileScreen
        profile={revealedProfile}
        onContinueChat={() => setScreen("chat")}
      />
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {content}
      <AssistantModal
        visible={assistantVisible}
        onClose={() => setAssistantVisible(false)}
        onSubmitQuestion={handleAskAssistant}
      />
    </>
  );
}

function CreateAccountScreen({
  accountDetails,
  onChangeName,
  onChangeAge,
  onContinue,
}: {
  accountDetails: AccountDetails;
  onChangeName: (value: string) => void;
  onChangeAge: (value: string) => void;
  onContinue: () => void;
}) {
  const canContinue =
    accountDetails.name.trim().length > 0 &&
    accountDetails.age.trim().length > 0;

  return (
    <ScreenFrame>
      <SectionBadge label="Create Account" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Create your profile.</Text>
      </View>

      <GlassCard style={styles.formCard}>
        <TextField
          label="Name"
          placeholder="Deven"
          value={accountDetails.name}
          onChangeText={onChangeName}
        />
        <TextField
          label="Age"
          placeholder="24"
          keyboardType="number-pad"
          value={accountDetails.age}
          onChangeText={onChangeAge}
          hint="Local state only for demo flow."
        />
      </GlassCard>

      <PrimaryButton
        label="Continue"
        onPress={onContinue}
        disabled={!canContinue}
      />
    </ScreenFrame>
  );
}

function ProfileSetupScreen({
  profileSetup,
  onChangeDatingGoal,
  onChangePreference,
  onChangePersonalityTraits,
  onNext,
}: {
  profileSetup: ProfileSetup;
  onChangeDatingGoal: (value: string) => void;
  onChangePreference: (value: string) => void;
  onChangePersonalityTraits: (value: string) => void;
  onNext: () => void;
}) {
  const canContinue =
    profileSetup.datingGoal.trim().length > 0 &&
    profileSetup.preference.trim().length > 0 &&
    profileSetup.personalityTraits.trim().length > 0;

  return (
    <ScreenFrame>
      <SectionBadge label="Profile Setup" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Add a few details.</Text>
      </View>

      <GlassCard style={styles.formCard}>
        <TextField
          label="Dating goal"
          placeholder="Intentional dating"
          value={profileSetup.datingGoal}
          onChangeText={onChangeDatingGoal}
        />
        <TextField
          label="Preference"
          placeholder="Kind, emotionally available people"
          value={profileSetup.preference}
          onChangeText={onChangePreference}
        />
        <TextField
          label="Personality traits"
          placeholder="Curious, calm, creative"
          value={profileSetup.personalityTraits}
          onChangeText={onChangePersonalityTraits}
        />
      </GlassCard>

      <PrimaryButton label="Next" onPress={onNext} disabled={!canContinue} />
    </ScreenFrame>
  );
}

function SchedulePlaceScreen({
  accountDetails,
  scheduleDetails,
  onChangePlace,
  onChangeTime,
  onSaveSchedule,
}: {
  accountDetails: AccountDetails;
  scheduleDetails: ScheduleDetails;
  onChangePlace: (value: string) => void;
  onChangeTime: (value: string) => void;
  onSaveSchedule: () => void;
}) {
  const canContinue =
    scheduleDetails.place.trim().length > 0 &&
    scheduleDetails.time.trim().length > 0;

  return (
    <ScreenFrame>
      <SectionBadge label="Schedule / Place" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Set a time and place.</Text>
        <Text style={styles.heroCopy}>Used for the demo match.</Text>
      </View>

      <GlassCard style={styles.formCard}>
        <TextField
          label="Place"
          placeholder="Blue Bottle Coffee"
          value={scheduleDetails.place}
          onChangeText={onChangePlace}
        />
        <TextField
          label="Time"
          placeholder="Tonight, 7-9 PM"
          value={scheduleDetails.time}
          onChangeText={onChangeTime}
          hint="Used for the mock match."
        />
      </GlassCard>

      <PrimaryButton
        label="Save Schedule"
        onPress={onSaveSchedule}
        disabled={!canContinue}
      />
    </ScreenFrame>
  );
}

function MatchmakingWaitingScreen({
  scheduleDetails,
  onMatchFound,
}: {
  scheduleDetails: ScheduleDetails;
  onMatchFound: () => void;
}) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onMatchFound();
    }, 2400);

    return () => clearTimeout(timeoutId);
  }, [onMatchFound]);

  return (
    <ScreenFrame>
      <SectionBadge label="Matchmaking" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Checking for a match.</Text>
      </View>

      <GlassCard style={styles.centeredCard}>
        <ActivityIndicator size="large" color={theme.colors.accentDeep} />
        <Text style={styles.cardTitle}>Looking now</Text>
        <View style={styles.statRow}>
          <StatPill label="Place" value={scheduleDetails.place} />
          <StatPill label="Time" value={scheduleDetails.time} />
        </View>
      </GlassCard>
    </ScreenFrame>
  );
}

function BlindDatePopupScreen({
  match,
  scheduleDetails,
  onJoinBlindChat,
  onIgnore,
}: {
  match: MatchSummary;
  scheduleDetails: ScheduleDetails;
  onJoinBlindChat: () => void;
  onIgnore: () => void;
}) {
  return (
    <ScreenFrame scroll={false} contentContainerStyle={styles.popupContent}>
      <SectionBadge label="Blind Date Popup" />
      <GlassCard style={styles.centeredCard}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.popupTitle}>Blind match available.</Text>
        <Text style={styles.cardCopy}>Join now or skip.</Text>
        <View style={styles.statRow}>
          <StatPill label="Compatibility" value={`${match.compatibility}%`} />
          <StatPill label="Scheduled time" value={scheduleDetails.time} />
        </View>
        <PrimaryButton label="Join Blind Chat" onPress={onJoinBlindChat} />
        <PrimaryButton
          label="Ignore"
          onPress={onIgnore}
          variant="secondary"
        />
      </GlassCard>
    </ScreenFrame>
  );
}

function BlindChatScreen({
  match,
  scheduleDetails,
  revealedProfile,
  isMatchRevealed,
  messages,
  onSendMessage,
  onAskAssistant,
  onRequestReveal,
}: {
  match: MatchSummary;
  scheduleDetails: ScheduleDetails;
  revealedProfile: RevealedProfile;
  isMatchRevealed: boolean;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAskAssistant: () => void;
  onRequestReveal: () => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardView}
    >
      <ScreenFrame scroll={false} contentContainerStyle={styles.chatScreen}>
        <View style={styles.chatHeader}>
          <SectionBadge label={isMatchRevealed ? "Revealed" : "Blind Chat"} />
          <Text style={styles.chatTitle}>
            {isMatchRevealed
              ? `${revealedProfile.name}, ${revealedProfile.age}`
              : match.anonymousLabel}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <MetaTag label="Match" value={`${match.compatibility}%`} />
          <MetaTag label="Place" value={scheduleDetails.place} />
          <MetaTag
            label={isMatchRevealed ? "Goal" : "Time"}
            value={
              isMatchRevealed
                ? revealedProfile.datingGoal
                : scheduleDetails.time
            }
          />
        </View>

        <GlassCard style={styles.chatCard}>
          <Text style={styles.chatLabel}>
            {isMatchRevealed ? "Chatting with Maya" : "Anonymous chat"}
          </Text>
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </ScrollView>
        </GlassCard>

        <View style={styles.chatFooter}>
          <ChatComposer onSendMessage={onSendMessage} />
        </View>

        <View style={styles.buttonRow}>
          <PrimaryButton
            label="App Help"
            onPress={onAskAssistant}
            variant="secondary"
            style={styles.buttonHalf}
          />
          <PrimaryButton
            label={isMatchRevealed ? "Reveal Complete" : "Request Reveal"}
            onPress={onRequestReveal}
            disabled={isMatchRevealed}
            style={styles.buttonHalf}
          />
        </View>
      </ScreenFrame>
    </KeyboardAvoidingView>
  );
}

function RevealWaitingScreen({
  onRevealAgreed,
}: {
  onRevealAgreed: () => void;
}) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onRevealAgreed();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [onRevealAgreed]);

  return (
    <ScreenFrame>
      <SectionBadge label="Reveal Request" />
      <GlassCard style={styles.centeredCard}>
        <ActivityIndicator size="large" color={theme.colors.accentDeep} />
        <Text style={styles.cardTitle}>Waiting for reveal</Text>
      </GlassCard>
    </ScreenFrame>
  );
}

function RevealedProfileScreen({
  profile,
  onContinueChat,
}: {
  profile: RevealedProfile;
  onContinueChat: () => void;
}) {
  return (
    <ScreenFrame>
      <SectionBadge label="Profile Revealed" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>It&apos;s Maya.</Text>
      </View>

      <GlassCard style={styles.centeredCard}>
        <View style={[styles.avatar, styles.revealedAvatar]}>
          <Text style={[styles.avatarText, styles.revealedAvatarText]}>
            {profile.name[0]}
          </Text>
        </View>
        <Text style={styles.cardTitle}>
          {profile.name}, {profile.age}
        </Text>
        <Text style={styles.summaryCopy}>{profile.personality}</Text>
        <View style={styles.statRow}>
          <StatPill label="Dating goal" value={profile.datingGoal} />
          <StatPill label="Personality" value={profile.personality} />
        </View>
      </GlassCard>

      <PrimaryButton label="Continue Chat" onPress={onContinueChat} />
    </ScreenFrame>
  );
}

function ScreenFrame({
  children,
  scroll = true,
  contentContainerStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fixedScreenContent, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.screenRoot}>
      <LinearGradient
        colors={[
          theme.colors.backgroundTop,
          "#FFEAE7",
          theme.colors.backgroundBottom,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <View style={[styles.blob, styles.blobOne]} />
      <View style={[styles.blob, styles.blobTwo]} />
      <View style={[styles.blob, styles.blobThree]} />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        {body}
      </SafeAreaView>
    </View>
  );
}

function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

function SectionBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.buttonShell,
        style,
        disabled ? styles.buttonDisabled : undefined,
        pressed ? styles.buttonPressed : undefined,
      ]}
    >
      {variant === "secondary" ? (
        <Text style={styles.secondaryButtonLabel}>{label}</Text>
      ) : (
        <LinearGradient
          colors={[theme.colors.accent, theme.colors.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryButtonFill}
        >
          <Text style={styles.primaryButtonLabel}>{label}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

function TextField({
  label,
  hint,
  style,
  ...inputProps
}: TextInputProps & {
  label: string;
  hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.muted}
        style={[styles.fieldInput, style]}
        {...inputProps}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MetaTag({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaTag}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metaValue}>
        {value}
      </Text>
    </View>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  return (
    <View
      style={[
        styles.chatRow,
        isUser ? styles.chatRowUser : undefined,
        isSystem ? styles.chatRowSystem : undefined,
      ]}
    >
      <View
        style={[
          styles.chatBubble,
          isUser ? styles.chatBubbleUser : styles.chatBubbleMatch,
          isSystem ? styles.chatBubbleSystem : undefined,
        ]}
      >
        <Text
          style={[
            styles.chatBubbleText,
            isUser ? styles.chatBubbleTextUser : undefined,
            isSystem ? styles.chatBubbleTextSystem : undefined,
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function ChatComposer({
  onSendMessage,
}: {
  onSendMessage: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    onSendMessage(trimmed);
    setDraft("");
  };

  return (
    <View style={styles.composer}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Write your next message..."
        placeholderTextColor={theme.colors.muted}
        style={styles.composerInput}
      />
      <Pressable onPress={handleSend} style={styles.composerSend}>
        <Text style={styles.composerSendLabel}>Send</Text>
      </Pressable>
    </View>
  );
}

function AssistantModal({
  visible,
  onClose,
  onSubmitQuestion,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmitQuestion: (question: string) => Promise<string>;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    const nextAnswer = await onSubmitQuestion(question);
    setAnswer(nextAnswer);
    setIsLoading(false);
  };

  const handleClose = () => {
    setQuestion("");
    setAnswer("");
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalScrim} onPress={handleClose} />
        <GlassCard style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.badgeLabel}>Help</Text>
              <Text style={styles.modalTitle}>App help</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>

          <Text style={styles.heroCopy}>
            Ask about chat or reveal.
          </Text>

          <TextInput
            multiline
            numberOfLines={3}
            placeholder="How does reveal work?"
            placeholderTextColor={theme.colors.muted}
            style={styles.modalInput}
            value={question}
            onChangeText={setQuestion}
            textAlignVertical="top"
          />

          <PrimaryButton
            label={isLoading ? "Thinking..." : "Ask"}
            onPress={handleAsk}
            disabled={isLoading}
          />

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.accentDeep} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : null}

          {answer ? (
            <View style={styles.answerCard}>
              <Text style={styles.badgeLabel}>Answer</Text>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          ) : null}
        </GlassCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}


