import { useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import {
  BADGES,
  DIFFICULTY_LABEL,
  migrateEarnedBadges,
  scenarioById,
  SCENARIOS,
  SUGGESTED_REPLIES,
} from "./data/scenarios";
import { getTipsCategories } from "./data/tips";

const CONVERSATION_ENDPOINT = "/api/conversation";
const FEEDBACK_ENDPOINT = "/api/feedback";
const PROGRESS_ENDPOINT = "/api/progress/update";
const SAVE_SESSION_ENDPOINT = "/api/sessions/save";
const SESSIONS_LIST_ENDPOINT = "/api/sessions/list";
const SESSION_DELETE_ENDPOINT = "/api/sessions/delete";
const CUSTOM_SCENARIO_GEN_ENDPOINT = "/api/scenarios/custom";
const CUSTOM_SCENARIOS_LIST_ENDPOINT = "/api/custom-scenarios/list";
const CUSTOM_SCENARIOS_SAVE_ENDPOINT = "/api/custom-scenarios/save";
const PREPARE_ENDPOINT = "/api/prepare";
const EXPLAIN_ENDPOINT = "/api/explain";
const ADMIN_ORG_ENDPOINT = "/api/admin/org";
const STORAGE_KEY = "neurochat_guest_state_v2";

const CORE_CATEGORIES = ["Work", "Social", "Everyday", "Difficult", "Relationships", "Self-Advocacy"];

function sessionRowTitle(row) {
  const sid = row?.scenario_id ?? "";
  const meta = scenarioById(sid);
  if (meta?.title) return meta.title;
  if (row?.scenario_title) return row.scenario_title;
  if (sid.startsWith("saved-custom-") || sid.startsWith("custom-")) return "Custom scenario";
  return sid || "Practice session";
}

function formatSessionWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function isPrepareReflectionDue(plan) {
  if (!plan?.eventDate || plan?.reflection) return false;
  const d = new Date(`${plan.eventDate}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

function formatDateShort(isoLike) {
  if (!isoLike) return "";
  try {
    return new Date(isoLike).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "";
  }
}

function derivePracticeSignals(messages) {
  const userMsgs = messages.filter((m) => m.sender === "user");
  const avgLen = userMsgs.reduce((a, m) => a + m.text.length, 0) / (userMsgs.length || 1);
  const hasQuestion = userMsgs.some((m) => m.text.includes("?"));
  const hasDetail = avgLen > 40;
  return { userMsgs, hasQuestion, hasDetail };
}

// ─── STYLES ───
const colors = {
  bg: "#F5F7FA",
  card: "#FFFFFF",
  primary: "#2B6CB0",
  primaryLight: "#EBF4FF",
  primaryDark: "#1A4971",
  accent: "#F6C94E",
  accentLight: "#FEF9E7",
  green: "#48BB78",
  greenLight: "#F0FFF4",
  greenBorder: "#C6F6D5",
  amber: "#ED8936",
  amberLight: "#FFFAF0",
  amberBorder: "#FEEBC8",
  text: "#1A202C",
  textMuted: "#718096",
  border: "#E2E8F0",
  chatBubbleAI: "#EBF4FF",
  chatBubbleUser: "#FEF9E7",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 14px rgba(0,0,0,0.08)",
};

const baseBtn = {
  border: "none",
  borderRadius: 14,
  cursor: "pointer",
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 700,
  transition: "all 0.2s ease",
  outline: "none",
};

export default function NeuroChat() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSending, setAuthSending] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [screen, setScreen] = useState("home");
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [completedScenarios, setCompletedScenarios] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [typing, setTyping] = useState(false);
  const [chatError, setChatError] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [selectedTipCategoryKey, setSelectedTipCategoryKey] = useState(null);
  const [mood, setMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [hasChosenGuest, setHasChosenGuest] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [unlockedContent, setUnlockedContent] = useState([]);
  const [progressTab, setProgressTab] = useState("overview");
  const [sessionRecords, setSessionRecords] = useState([]);
  const [guestSessions, setGuestSessions] = useState([]);
  const [customLibrary, setCustomLibrary] = useState([]);
  const [historyReview, setHistoryReview] = useState(null);
  const [prepareDraft, setPrepareDraft] = useState({ eventTitle: "", eventDate: "" });
  const [preparePlan, setPreparePlan] = useState(null);
  const [prepareBusy, setPrepareBusy] = useState(false);
  const [customBusy, setCustomBusy] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [generatedCustomScenario, setGeneratedCustomScenario] = useState(null);
  const [showHintsInChat, setShowHintsInChat] = useState(true);
  const [pacingMode, setPacingMode] = useState(false);
  const [replaySourceSession, setReplaySourceSession] = useState(null);
  const [shareCardUrl, setShareCardUrl] = useState("");
  const [adminOrgIdInput, setAdminOrgIdInput] = useState("");
  const [adminData, setAdminData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [explainIdx, setExplainIdx] = useState(null);
  const [explainText, setExplainText] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimersRef = useRef([]);
  const chatEndRef = useRef(null);
  const maxTurns = 4;

  const tipsData = useMemo(() => getTipsCategories(unlockedContent), [unlockedContent]);

  const visibleScenarios = useMemo(
    () => SCENARIOS.filter((s) => !s.requiresUnlock || unlockedContent.includes(s.requiresUnlock)),
    [unlockedContent],
  );

  const customAsScenarios = useMemo(
    () =>
      customLibrary.map((row) => ({
        id: `saved-custom-${row.id}`,
        title: row.title,
        description: row.description || "",
        opener: row.opener,
        category: "My scenarios",
        difficulty: "medium",
        partnerBrief: row.ai_personality || "",
        suggested_replies: Array.isArray(row.suggested_replies) ? row.suggested_replies : [],
        icon: "✨",
        savedCustomId: row.id,
      })),
    [customLibrary],
  );

  const practiceScenarioList = useMemo(
    () => [...visibleScenarios, ...customAsScenarios],
    [visibleScenarios, customAsScenarios],
  );

  const combinedHistoryRows = useMemo(() => {
    const guest = guestSessions.map((g) => ({
      ...g,
      _source: "guest",
    }));
    const server = sessionRecords.map((s) => ({ ...s, _source: "server" }));
    return [...guest, ...server].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    });
  }, [guestSessions, sessionRecords]);

  const hasConversationReview = unlockedContent.includes("feature-conversation-review");
  const hasCustomScenariosUnlock = unlockedContent.includes("feature-custom-scenarios");

  const queueToasts = (messages) => {
    if (!messages?.length) return;
    toastTimersRef.current.forEach(clearTimeout);
    toastTimersRef.current = [];
    messages.forEach((msg, i) => {
      const id = setTimeout(() => setToastMessage(msg), i * 3800);
      toastTimersRef.current.push(id);
    });
    const clearId = setTimeout(() => {
      setToastMessage(null);
      toastTimersRef.current = [];
    }, messages.length * 3800 + 3500);
    toastTimersRef.current.push(clearId);
  };

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const moodOptions = [
    { id: "good", emoji: "😊", label: "Feeling good", bg: "#F0FFF4", border: "#9AE6B4", text: colors.green, hint: "Want to try something new today?" },
    { id: "okay", emoji: "😐", label: "Doing okay", bg: "#FFFAF0", border: "#FBD38D", text: "#B7791F", hint: "Maybe a familiar scenario?" },
    { id: "low", emoji: "😔", label: "Bit low", bg: "#FAF5FF", border: "#D6BCFA", text: "#6B46C1", hint: "Go easy on yourself today. Something short?" },
  ];

  const moodConfig = moodOptions.find((option) => option.id === mood);

  const loadGuestState = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      setCompletedScenarios(Array.isArray(parsed.completedScenarios) ? parsed.completedScenarios : []);
      setEarnedBadges(migrateEarnedBadges(Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : []));
      setTotalSessions(typeof parsed.totalSessions === "number" ? parsed.totalSessions : 0);
      setUnlockedContent(Array.isArray(parsed.unlockedContent) ? parsed.unlockedContent : []);
      setGuestSessions(Array.isArray(parsed.guestSessions) ? parsed.guestSessions : []);
      setCustomLibrary(Array.isArray(parsed.guestCustomLibrary) ? parsed.guestCustomLibrary : []);
      setPreparePlan(parsed.guestPreparePlan ?? null);
      setShowHintsInChat(parsed.guestShowHints !== false);
      setPacingMode(parsed.guestPacingMode === true);
      setMood(parsed.mood ?? null);
      setMoodHistory(Array.isArray(parsed.moodHistory) ? parsed.moodHistory : []);
      setHasOnboarded(Boolean(parsed.hasOnboarded));
      setHasChosenGuest(Boolean(parsed.hasChosenGuest));
      return parsed;
    } catch (error) {
      console.error("Failed to load guest state:", error);
      return null;
    }
  };

  const saveGuestState = (overrides = {}) => {
    if (!isGuest) return;
    const state = {
      completedScenarios,
      earnedBadges,
      mood,
      moodHistory,
      hasOnboarded,
      hasChosenGuest,
      totalSessions,
      unlockedContent,
      guestSessions,
      guestCustomLibrary: customLibrary,
      guestPreparePlan: preparePlan,
      guestShowHints: showHintsInChat,
      guestPacingMode: pacingMode,
      ...overrides,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const syncProgressToSupabase = async ({
    updatedCompleted,
    updatedBadges,
    updatedMood,
    updatedMoodHistory,
    onboarded,
    updatedTotalSessions,
    updatedUnlockedContent,
    preparePlan: preparePlanArg,
    showHints: showHintsArg,
    pacingMode: pacingModeArg,
  }) => {
    if (!authUser?.id) return;
    try {
      await fetch(PROGRESS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser.id,
          completedScenarios: updatedCompleted,
          earnedBadges: updatedBadges,
          totalSessions: updatedTotalSessions ?? totalSessions,
          unlockedContent: updatedUnlockedContent ?? unlockedContent,
          mood: updatedMood,
          moodHistory: updatedMoodHistory,
          hasOnboarded: onboarded,
          preparePlan: preparePlanArg !== undefined ? preparePlanArg : preparePlan,
          showHints: showHintsArg !== undefined ? showHintsArg : showHintsInChat,
          pacingMode: pacingModeArg !== undefined ? pacingModeArg : pacingMode,
        }),
      });
    } catch (error) {
      console.error("Failed to sync progress:", error);
    }
  };

  useEffect(() => {
    if (!isGuest) return;
    const state = {
      completedScenarios,
      earnedBadges,
      mood,
      moodHistory,
      hasOnboarded,
      hasChosenGuest,
      totalSessions,
      unlockedContent,
      guestSessions,
      guestCustomLibrary: customLibrary,
      guestPreparePlan: preparePlan,
      guestShowHints: showHintsInChat,
      guestPacingMode: pacingMode,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    completedScenarios,
    earnedBadges,
    mood,
    moodHistory,
    hasOnboarded,
    hasChosenGuest,
    totalSessions,
    unlockedContent,
    guestSessions,
    customLibrary,
    preparePlan,
    showHintsInChat,
    pacingMode,
    isGuest,
  ]);

  useEffect(() => {
    if (!authUser?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(CUSTOM_SCENARIOS_LIST_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authUser.id }),
        });
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setCustomLibrary(Array.isArray(data.scenarios) ? data.scenarios : []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const guestState = loadGuestState();
      if (!guestState?.hasOnboarded) {
        setScreen("onboarding");
      } else if (guestState?.hasChosenGuest) {
        setScreen("mood-checkin");
      } else {
        setScreen("auth-choice");
      }
      setIsBootstrapping(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const sessionUser = data.session?.user ?? null;
      if (!sessionUser) {
        const guestState = loadGuestState();
        setIsGuest(true);
        if (!guestState?.hasOnboarded) {
          setScreen("onboarding");
        } else if (guestState?.hasChosenGuest) {
          setScreen("mood-checkin");
        } else {
          setScreen("auth-choice");
        }
        setIsBootstrapping(false);
        return;
      }

      setAuthUser(sessionUser);
      setIsGuest(false);

      const [profileResult, progressResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("has_onboarded,mood_history,last_mood,prepare_plan,show_hints,pacing_mode")
          .eq("id", sessionUser.id)
          .maybeSingle(),
        supabase
          .from("progress")
          .select("completed_scenarios,earned_badges,total_sessions,unlocked_content")
          .eq("user_id", sessionUser.id)
          .maybeSingle(),
      ]);

      const profile = profileResult.data;
      const progress = progressResult.data;

      setHasOnboarded(Boolean(profile?.has_onboarded));
      setPreparePlan(profile?.prepare_plan ?? null);
      setShowHintsInChat(profile?.show_hints !== false);
      setPacingMode(profile?.pacing_mode === true);
      setMood(profile?.last_mood ?? null);
      setMoodHistory(Array.isArray(profile?.mood_history) ? profile.mood_history : []);
      setCompletedScenarios(Array.isArray(progress?.completed_scenarios) ? progress.completed_scenarios : []);
      setEarnedBadges(migrateEarnedBadges(Array.isArray(progress?.earned_badges) ? progress.earned_badges : []));
      setTotalSessions(typeof progress?.total_sessions === "number" ? progress.total_sessions : 0);
      setUnlockedContent(Array.isArray(progress?.unlocked_content) ? progress.unlocked_content : []);
      setScreen(profile?.has_onboarded ? "mood-checkin" : "onboarding");
      setIsBootstrapping(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser?.id || screen !== "progress" || progressTab !== "history") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(SESSIONS_LIST_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authUser.id }),
        });
        if (!r.ok || cancelled) return;
        const data = await r.json();
        if (!cancelled) setSessionRecords(Array.isArray(data.sessions) ? data.sessions : []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, screen, progressTab]);

  useEffect(() => {
    if (!hasConversationReview && progressTab === "history") {
      setProgressTab("overview");
    }
  }, [hasConversationReview, progressTab]);

  useEffect(() => {
    if (screen !== "chat") {
      setExplainIdx(null);
      setExplainText("");
    }
  }, [screen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const enterGuestMode = () => {
    setIsGuest(true);
    setHasChosenGuest(true);
    const guestState = loadGuestState();
    const onboarded = guestState?.hasOnboarded ?? hasOnboarded;
    setScreen(onboarded ? "mood-checkin" : "onboarding");
    saveGuestState({ hasChosenGuest: true, hasOnboarded: onboarded });
  };

  const sendMagicLink = async () => {
    setAuthError("");
    setAuthNotice("");
    const trimmed = emailInput.trim();
    if (!trimmed) {
      setAuthError("Please enter your email address.");
      return;
    }
    if (!supabase) {
      setAuthError(
        "Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) to .env and restart npm run dev.",
      );
      return;
    }
    setAuthSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) {
        setAuthError(error.message || String(error));
        return;
      }
      setAuthNotice("Magic link sent. Check your email to continue.");
    } catch (err) {
      setAuthError(err?.message ?? "Network error — could not reach Supabase.");
    } finally {
      setAuthSending(false);
    }
  };

  const chooseMood = async (selectedMood) => {
    const updatedMoodHistory = [...moodHistory, selectedMood].slice(-50);
    setMood(selectedMood);
    setMoodHistory(updatedMoodHistory);
    setScreen("home");
    if (isGuest) {
      saveGuestState({ mood: selectedMood, moodHistory: updatedMoodHistory });
    } else {
      await syncProgressToSupabase({
        updatedCompleted: completedScenarios,
        updatedBadges: earnedBadges,
        updatedMood: selectedMood,
        updatedMoodHistory,
        onboarded: hasOnboarded,
      });
    }
  };

  const startScenario = (scenario, options = {}) => {
    setSelectedScenario(scenario);
    if (!options.keepReplayContext) {
      setReplaySourceSession(null);
    }
    setMessages([{ sender: "ai", text: scenario.opener }]);
    setTurnCount(0);
    setShowSuggestion(false);
    setFeedback(null);
    setChatError("");
    setFeedbackLoading(false);
    setScreen("chat");
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages = [...messages, { sender: "user", text: userInput.trim() }];
    setMessages(newMessages);
    setUserInput("");
    setShowSuggestion(false);
    setChatError("");
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);

    if (newTurn >= maxTurns) {
      setFeedbackLoading(true);
      let resolvedFeedback = null;
      try {
        const response = await fetch(FEEDBACK_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scenario: selectedScenario,
            messages: newMessages,
          }),
        });

        if (!response.ok) {
          throw new Error("Feedback API request failed");
        }

        const aiFeedback = await response.json();
        resolvedFeedback = {
          strengths: Array.isArray(aiFeedback.strengths) ? aiFeedback.strengths : [],
          explore: Array.isArray(aiFeedback.explore) ? aiFeedback.explore : [],
          examples: Array.isArray(aiFeedback.examples) ? aiFeedback.examples : [],
        };
        setFeedback(resolvedFeedback);
      } catch (error) {
        console.error(error);
        const fbSrc =
          Array.isArray(selectedScenario?.suggested_replies) && selectedScenario.suggested_replies.length > 0
            ? selectedScenario.suggested_replies
            : SUGGESTED_REPLIES[selectedScenario?.id] || [];
        const fallbackExamples = fbSrc.slice(0, 2);
        resolvedFeedback = {
          strengths: ["You showed up and practised a real conversation - that is meaningful progress."],
          explore: ["Feedback is temporarily unavailable. Try again in a moment for detailed coaching insights."],
          examples: fallbackExamples,
        };
        setFeedback(resolvedFeedback);
      } finally {
        const { userMsgs, hasQuestion, hasDetail } = derivePracticeSignals(newMessages);
        const updatedCompleted = completedScenarios.includes(selectedScenario.id)
          ? completedScenarios
          : [...completedScenarios, selectedScenario.id];

        const nextTotalSessions = totalSessions + 1;
        const uniq = updatedCompleted.length;
        const priorCompleted = completedScenarios;

        let nextUnlocked = [...unlockedContent];
        const unlockToasts = [];

        const addUnlock = (id, msg) => {
          if (!nextUnlocked.includes(id)) {
            nextUnlocked.push(id);
            unlockToasts.push(msg);
          }
        };

        if (uniq >= 3) {
          addUnlock(
            "bonus-pack-1",
            "🎁 You've unlocked 3 bonus scenarios — find them in the scenario list.",
          );
        }
        if (uniq >= 5) {
          addUnlock(
            "tips-advanced-convo",
            "📚 You've unlocked Advanced Conversation Techniques — open Tips Library.",
          );
        }
        const hadPriorDifficult = priorCompleted.some((sid) => scenarioById(sid)?.category === "Difficult");
        if (selectedScenario.category === "Difficult" && !hadPriorDifficult) {
          addUnlock(
            "tips-calm-pressure",
            "🌊 You've unlocked Staying Calm Under Pressure — open Tips Library.",
          );
        }
        const coreCatsCovered = CORE_CATEGORIES.every((cat) =>
          updatedCompleted.some((sid) => scenarioById(sid)?.category === cat),
        );
        if (coreCatsCovered) {
          addUnlock(
            "feature-custom-scenarios",
            "🛠️ You've unlocked Custom Scenario Builder — create situations from your real life under Choose a Scenario.",
          );
        }
        if (nextTotalSessions >= 10) {
          addUnlock(
            "feature-conversation-review",
            "📜 You've unlocked Conversation History — review past sessions under Progress → History.",
          );
        }

        const earnedSignals = [];
        if (userMsgs.length >= 1) earnedSignals.push("first-steps");
        if (hasQuestion) earnedSignals.push("curious");
        if (hasDetail) earnedSignals.push("thoughtful");
        if (uniq >= 3) earnedSignals.push("growing");
        if (uniq >= 5) earnedSignals.push("rooted");
        if (
          CORE_CATEGORIES.every((cat) =>
            updatedCompleted.some((sid) => scenarioById(sid)?.category === cat),
          )
        ) {
          earnedSignals.push("explorer");
        }
        if (updatedCompleted.some((sid) => scenarioById(sid)?.category === "Difficult")) {
          earnedSignals.push("brave");
        }
        if (nextTotalSessions >= 10) earnedSignals.push("dedicated");

        const diffTags = new Set(
          updatedCompleted.map((sid) => scenarioById(sid)?.difficulty).filter(Boolean),
        );
        if (diffTags.has("easy") && diffTags.has("medium") && diffTags.has("hard")) {
          earnedSignals.push("all-rounder");
        }
        if (uniq >= 20) earnedSignals.push("summit");

        const prevBadgeSet = new Set(migrateEarnedBadges(earnedBadges));
        const newBadges = migrateEarnedBadges([
          ...new Set([...earnedBadges, ...earnedSignals]),
        ]);

        const badgeToasts = [];
        for (const bid of newBadges) {
          if (!prevBadgeSet.has(bid)) {
            const meta = BADGES.find((b) => b.id === bid);
            if (meta?.toast) badgeToasts.push(meta.toast);
          }
        }

        setCompletedScenarios(updatedCompleted);
        setTotalSessions(nextTotalSessions);
        setUnlockedContent(nextUnlocked);
        setEarnedBadges(newBadges);
        queueToasts([...unlockToasts, ...badgeToasts]);

        if (isGuest) {
          const guestEntry = {
            id: `guest-${crypto.randomUUID()}`,
            scenario_id: selectedScenario.id,
            scenario_title: selectedScenario.title,
            scenario_category: selectedScenario.category,
            messages: newMessages,
            feedback: resolvedFeedback,
            mood,
            created_at: new Date().toISOString(),
          };
          setGuestSessions((prev) => [guestEntry, ...prev]);
        }

        if (authUser?.id) {
          setSessionSaving(true);
          try {
            await fetch(SAVE_SESSION_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: authUser.id,
                scenarioId: selectedScenario.id,
                messages: newMessages,
                feedback: resolvedFeedback,
                mood,
              }),
            });
            await syncProgressToSupabase({
              updatedCompleted,
              updatedBadges: newBadges,
              updatedMood: mood,
              updatedMoodHistory: moodHistory,
              onboarded: hasOnboarded,
              updatedTotalSessions: nextTotalSessions,
              updatedUnlockedContent: nextUnlocked,
            });
          } catch (saveError) {
            console.error("Saving session failed:", saveError);
          } finally {
            setSessionSaving(false);
          }
        }

        setFeedbackLoading(false);
        setScreen("feedback");
      }
    } else {
      setTyping(true);
      try {
        const response = await fetch(CONVERSATION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scenario: selectedScenario,
            messages: newMessages,
          }),
        });

        if (!response.ok) {
          throw new Error("Conversation API request failed");
        }

        const data = await response.json();
        const aiReply = data.reply?.trim();
        if (!aiReply) {
          throw new Error("Conversation API returned empty response");
        }
        if (pacingMode) {
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
        }
        setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
      } catch (error) {
        console.error(error);
        setChatError("I couldn't reply just now. Please try sending your message again.");
      } finally {
        setTyping(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const finishOnboarding = async () => {
    setHasOnboarded(true);
    setOnboardingStep(0);
    if (isGuest) {
      saveGuestState({ hasOnboarded: true });
    } else {
      await syncProgressToSupabase({
        updatedCompleted: completedScenarios,
        updatedBadges: earnedBadges,
        updatedMood: mood,
        updatedMoodHistory: moodHistory,
        onboarded: true,
      });
    }
    if (authUser) {
      setScreen("mood-checkin");
      return;
    }
    setScreen("auth-choice");
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthUser(null);
    setIsGuest(true);
    setHasChosenGuest(false);
    setSessionRecords([]);
    setHistoryReview(null);
    setExplainIdx(null);
    setExplainText("");
    setProgressTab("overview");
    setPrepareDraft({ eventTitle: "", eventDate: "" });
    setGeneratedCustomScenario(null);
    setCustomDraft("");
    loadGuestState();
    setScreen("auth-choice");
  };

  const persistHintsPreference = async (next) => {
    setShowHintsInChat(next);
    if (isGuest) {
      saveGuestState({ guestShowHints: next });
    } else if (authUser?.id) {
      await syncProgressToSupabase({
        updatedCompleted: completedScenarios,
        updatedBadges: earnedBadges,
        updatedMood: mood,
        updatedMoodHistory: moodHistory,
        onboarded: hasOnboarded,
        showHints: next,
      });
    }
  };

  const persistPacingMode = async (next) => {
    setPacingMode(next);
    if (isGuest) {
      saveGuestState({ guestPacingMode: next });
    } else if (authUser?.id) {
      await syncProgressToSupabase({
        updatedCompleted: completedScenarios,
        updatedBadges: earnedBadges,
        updatedMood: mood,
        updatedMoodHistory: moodHistory,
        onboarded: hasOnboarded,
        pacingMode: next,
      });
    }
  };

  const persistPreparePlan = async (plan) => {
    setPreparePlan(plan);
    if (isGuest) {
      saveGuestState({ guestPreparePlan: plan });
    } else if (authUser?.id) {
      await syncProgressToSupabase({
        updatedCompleted: completedScenarios,
        updatedBadges: earnedBadges,
        updatedMood: mood,
        updatedMoodHistory: moodHistory,
        onboarded: hasOnboarded,
        preparePlan: plan,
      });
    }
  };

  const submitPrepareReflection = async (label) => {
    const nextPlan = preparePlan ? { ...preparePlan, reflection: label } : null;
    await persistPreparePlan(nextPlan);
  };

  const clearPreparePlan = async () => {
    await persistPreparePlan(null);
    setPrepareDraft({ eventTitle: "", eventDate: "" });
  };

  const runPreparePlan = async () => {
    if (!prepareDraft.eventTitle.trim()) return;
    setPrepareBusy(true);
    try {
      const summaries = practiceScenarioList.map((s) => `${s.id}: ${s.title} (${s.category})`);
      const r = await fetch(PREPARE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDescription: prepareDraft.eventTitle.trim(),
          eventDate: prepareDraft.eventDate || undefined,
          availableScenarioIds: practiceScenarioList.map((s) => s.id),
          availableScenarioSummaries: summaries,
        }),
      });
      if (!r.ok) throw new Error("Prepare failed");
      const data = await r.json();
      const plan = {
        headline: data.headline,
        suggestedScenarioIds: data.suggestedScenarioIds || [],
        tip: data.tip,
        eventTitle: prepareDraft.eventTitle.trim(),
        eventDate: prepareDraft.eventDate || null,
      };
      await persistPreparePlan(plan);
      setScreen("home");
    } catch (e) {
      console.error(e);
    } finally {
      setPrepareBusy(false);
    }
  };

  const generateCustomScenario = async () => {
    if (!customDraft.trim()) return;
    setCustomBusy(true);
    try {
      const r = await fetch(CUSTOM_SCENARIO_GEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: customDraft.trim() }),
      });
      if (!r.ok) throw new Error("Generation failed");
      const data = await r.json();
      const gen = data.scenario;
      setGeneratedCustomScenario({
        id: `custom-${crypto.randomUUID()}`,
        title: gen.title,
        description: gen.description,
        opener: gen.opener,
        category: "My scenarios",
        difficulty: "medium",
        partnerBrief: gen.partnerBrief,
        suggested_replies: gen.suggested_replies,
        icon: gen.icon || "💬",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCustomBusy(false);
    }
  };

  const saveGeneratedToLibrary = async () => {
    if (!generatedCustomScenario) return;
    try {
      if (authUser?.id) {
        const r = await fetch(CUSTOM_SCENARIOS_SAVE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authUser.id,
            title: generatedCustomScenario.title,
            description: generatedCustomScenario.description,
            opener: generatedCustomScenario.opener,
            ai_personality: generatedCustomScenario.partnerBrief,
            suggested_replies: generatedCustomScenario.suggested_replies,
          }),
        });
        if (!r.ok) throw new Error("Save failed");
        const data = await r.json();
        if (data.id) {
          setCustomLibrary((prev) => [
            {
              id: data.id,
              title: generatedCustomScenario.title,
              description: generatedCustomScenario.description,
              opener: generatedCustomScenario.opener,
              ai_personality: generatedCustomScenario.partnerBrief,
              suggested_replies: generatedCustomScenario.suggested_replies,
            },
            ...prev,
          ]);
        }
      } else {
        const id = crypto.randomUUID();
        setCustomLibrary((prev) => [
          {
            id,
            title: generatedCustomScenario.title,
            description: generatedCustomScenario.description,
            opener: generatedCustomScenario.opener,
            ai_personality: generatedCustomScenario.partnerBrief,
            suggested_replies: generatedCustomScenario.suggested_replies,
          },
          ...prev,
        ]);
      }
      setScreen("scenarios");
      setGeneratedCustomScenario(null);
      setCustomDraft("");
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSessionRecord = async (row) => {
    try {
      const id = row?.id;
      if (authUser?.id && id && String(id).startsWith("guest-") === false) {
        await fetch(SESSION_DELETE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authUser.id, sessionId: id }),
        });
        setSessionRecords((prev) => prev.filter((s) => s.id !== id));
      } else {
        setGuestSessions((prev) => prev.filter((s) => s.id !== id));
      }
      if (historyReview?.id === row?.id) {
        setHistoryReview(null);
        setScreen("progress");
        setProgressTab("history");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startReplayFromSession = (sessionLike) => {
    const sid = sessionLike?.scenario_id || "";
    const baseScenario = practiceScenarioList.find((s) => s.id === sid) || scenarioById(sid);
    const fallbackScenario = {
      id: sid || `replay-${crypto.randomUUID()}`,
      title: sessionRowTitle(sessionLike),
      description: "Replay this conversation with different choices.",
      opener: sessionLike?.messages?.find((m) => m.sender === "ai")?.text || "Hi, let's continue.",
      category: "Replay",
      difficulty: "medium",
      partnerBrief: "Respond naturally and supportively.",
      suggested_replies: [],
      icon: "🔁",
    };
    setReplaySourceSession({
      id: sessionLike?.id || null,
      title: sessionRowTitle(sessionLike),
      originalMessages: Array.isArray(sessionLike?.messages) ? sessionLike.messages : [],
      when: sessionLike?.created_at || null,
    });
    startScenario(baseScenario || fallbackScenario, { keepReplayContext: true });
  };

  const generateShareCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#EBF4FF");
    grad.addColorStop(1, "#FEF9E7");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1A4971";
    ctx.font = "700 58px Nunito, sans-serif";
    ctx.fillText("NeuroChat Progress", 80, 130);
    ctx.font = "400 34px Nunito, sans-serif";
    ctx.fillStyle = "#4A5568";
    ctx.fillText("Small steps count. Keep going.", 80, 185);

    const cards = [
      { label: "Scenarios", value: String(completedScenarios.length), color: "#2B6CB0" },
      { label: "Sessions", value: String(totalSessions), color: "#48BB78" },
      { label: "Badges", value: String(earnedBadges.length), color: "#D69E2E" },
    ];
    cards.forEach((item, i) => {
      const x = 80 + i * 320;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, 260, 280, 220, 24);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = item.color;
      ctx.font = "800 70px Nunito, sans-serif";
      ctx.fillText(item.value, x + 32, 360);
      ctx.fillStyle = "#4A5568";
      ctx.font = "600 30px Nunito, sans-serif";
      ctx.fillText(item.label, x + 32, 420);
    });

    const daysPractised = Math.max(1, moodHistory.length);
    ctx.fillStyle = "#1A202C";
    ctx.font = "700 42px Nunito, sans-serif";
    ctx.fillText(`Days Practised: ${daysPractised}`, 80, 590);
    ctx.font = "600 30px Nunito, sans-serif";
    ctx.fillStyle = "#4A5568";
    ctx.fillText(`Top badge count: ${earnedBadges.length}`, 80, 640);

    const topScenarioIds = completedScenarios.slice(0, 3);
    ctx.fillStyle = "#1A202C";
    ctx.font = "700 34px Nunito, sans-serif";
    ctx.fillText("Recently completed", 80, 740);
    ctx.font = "500 28px Nunito, sans-serif";
    topScenarioIds.forEach((sid, idx) => {
      const title = scenarioById(sid)?.title || sid;
      ctx.fillText(`• ${title}`, 100, 790 + idx * 48);
    });

    ctx.fillStyle = "#718096";
    ctx.font = "500 24px Nunito, sans-serif";
    ctx.fillText(`Generated ${new Date().toLocaleDateString()}`, 80, 1230);
    ctx.fillText("No conversation text is included.", 80, 1270);

    const url = canvas.toDataURL("image/png");
    setShareCardUrl(url);
  };

  const loadAdminDashboard = async () => {
    if (!adminOrgIdInput.trim()) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const r = await fetch(`${ADMIN_ORG_ENDPOINT}/${encodeURIComponent(adminOrgIdInput.trim())}`);
      if (!r.ok) {
        const payload = await r.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load dashboard");
      }
      const data = await r.json();
      setAdminData(data);
      setScreen("admin-dashboard");
    } catch (e) {
      setAdminError(e.message || "Failed to load dashboard");
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAiExplanation = async (aiLine, idx) => {
    if (explainIdx === idx) {
      setExplainIdx(null);
      setExplainText("");
      return;
    }
    setExplainLoading(true);
    setExplainIdx(idx);
    setExplainText("");
    try {
      const r = await fetch(EXPLAIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiLine,
          scenarioTitle: selectedScenario?.title,
          scenarioCategory: selectedScenario?.category,
        }),
      });
      if (!r.ok) throw new Error("Explain failed");
      const data = await r.json();
      setExplainText(data.explanation || "");
    } catch (e) {
      console.error(e);
      setExplainText("Couldn't load an explanation right now. Try again in a moment.");
    } finally {
      setExplainLoading(false);
    }
  };

  const renderAuthChoice = () => (
    <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "48px 20px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧠</div>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 32, color: colors.primaryDark, margin: 0 }}>NeuroChat</h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: colors.textMuted, marginTop: 8 }}>Choose how you want to continue.</p>
        </div>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20 }}>
          {!isSupabaseConfigured() && (
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#9C4221", background: colors.amberLight, border: `1px solid ${colors.amberBorder}`, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              Supabase env vars are missing or invalid. Add SUPABASE_URL and SUPABASE_ANON_KEY to <code style={{ fontFamily: "monospace", fontSize: 12 }}>.env</code>, then restart the dev server.
            </div>
          )}
          <input
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setAuthError("");
            }}
            placeholder="you@example.com"
            disabled={authSending}
            style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Nunito', sans-serif", fontSize: 15, borderRadius: 12, border: `1px solid ${colors.border}`, padding: "12px 14px", marginBottom: 10 }}
          />
          <button
            onClick={sendMagicLink}
            disabled={authSending}
            style={{ ...baseBtn, width: "100%", background: authSending ? colors.border : colors.primary, color: "#fff", padding: "14px 16px", fontSize: 15 }}
          >
            {authSending ? "Sending…" : "Continue with email"}
          </button>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
            We'll send you a link. It works for new and existing accounts.
          </p>
          {authError && (
            <p role="alert" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#9C4221", background: colors.amberLight, border: `1px solid ${colors.amberBorder}`, borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>
              {authError}
            </p>
          )}
          {authNotice && !authError && (
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#276749", marginTop: 10 }}>{authNotice}</p>
          )}
          <button onClick={enterGuestMode} style={{ ...baseBtn, width: "100%", marginTop: 10, background: colors.primaryLight, color: colors.primaryDark, padding: "14px 16px", fontSize: 15, border: `1px solid ${colors.border}` }}>Continue as guest</button>
        </div>
      </div>
    </div>
  );

  const renderOnboarding = () => {
    const pages = [
      {
        title: "Welcome to NeuroChat",
        body1: "This is a safe space to practise conversations. No one is watching. No one is scoring you.",
      },
      {
        title: "How it works",
        body1: "You'll chat with an AI partner who plays the other person. Afterwards, you'll get gentle feedback - strengths first, always.",
        body2: "If you get stuck, tap for a suggestion. There are no wrong answers.",
      },
      {
        title: "Set your pace",
        body1: "You control everything. Practise as much or as little as you want. We'll never pressure you.",
        body2: "Ready to try your first conversation?",
      },
    ];

    const page = pages[onboardingStep];
    const isLast = onboardingStep === pages.length - 1;

    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 420, padding: "56px 20px 40px" }}>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 24, boxShadow: colors.shadow }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>Step {onboardingStep + 1} of 3</p>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 26, margin: "0 0 12px 0", color: colors.primaryDark }}>{page.title}</h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: colors.text, lineHeight: 1.7 }}>{page.body1}</p>
            {page.body2 && <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: colors.textMuted, lineHeight: 1.7, marginTop: 8 }}>{page.body2}</p>}
            <button
              onClick={() => {
                if (isLast) {
                  finishOnboarding();
                  return;
                }
                setOnboardingStep(onboardingStep + 1);
              }}
              style={{ ...baseBtn, marginTop: 20, width: "100%", background: colors.primary, color: "#fff", padding: "14px 16px", fontSize: 16 }}
            >
              {isLast ? "Let's go" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMoodCheckIn = () => (
    <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "52px 20px 40px" }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, color: colors.primaryDark, margin: "0 0 8px 0" }}>How are you feeling?</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>Pick anything that fits right now. You can change it later.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {moodOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => chooseMood(option.id)}
              style={{ ...baseBtn, background: option.bg, color: option.text, border: `1px solid ${option.border}`, borderRadius: 16, textAlign: "left", padding: "14px 16px", fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}
            >
              <span style={{ fontSize: 22 }}>{option.emoji}</span> {option.label}
            </button>
          ))}
        </div>
        <button onClick={() => setScreen("home")} style={{ ...baseBtn, background: "transparent", color: colors.textMuted, fontSize: 14, marginTop: 14 }}>Skip for now</button>
      </div>
    </div>
  );

  // ─── RENDER SCREENS ───

  const renderHome = () => (
    <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px", paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "6px 10px", background: colors.card }}>
            👤 {authUser ? "Signed in" : "Guest"}
          </div>
        </div>
        <div style={{ textAlign: "center", paddingTop: 26, paddingBottom: 10 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧠</div>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 32, fontWeight: 800, color: colors.primaryDark, margin: 0, letterSpacing: -0.5 }}>
            NeuroChat
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, color: colors.textMuted, marginTop: 8, lineHeight: 1.5 }}>
            Practise conversations safely.<br />No pressure. No judgement.
          </p>
        </div>

        {/* Main buttons */}
        {moodConfig && (
          <div style={{ background: moodConfig.bg, border: `1px solid ${moodConfig.border}`, borderRadius: 14, padding: "10px 12px", marginTop: 20 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: moodConfig.text }}>
              {moodConfig.emoji} {moodConfig.label} - {moodConfig.hint} <button onClick={() => setScreen("mood-checkin")} style={{ ...baseBtn, background: "transparent", color: moodConfig.text, fontSize: 13, textDecoration: "underline", padding: 0 }}>change</button>
            </div>
          </div>
        )}
        {preparePlan && !preparePlan.reflection && !isPrepareReflectionDue(preparePlan) && (
          <div
            style={{
              background: colors.primaryLight,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: "14px 16px",
              marginTop: 16,
              textAlign: "left",
            }}
          >
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: colors.primaryDark, marginBottom: 6 }}>
              📅 Coming up: {preparePlan.eventTitle}
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.text, lineHeight: 1.55 }}>{preparePlan.headline}</div>
            {preparePlan.tip ? (
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, marginTop: 8 }}>{preparePlan.tip}</div>
            ) : null}
            <button
              type="button"
              onClick={() => setScreen("scenarios")}
              style={{ ...baseBtn, marginTop: 10, background: colors.primary, color: "#fff", padding: "10px 14px", fontSize: 13 }}
            >
              Go to suggested scenarios
            </button>
          </div>
        )}
        {preparePlan && isPrepareReflectionDue(preparePlan) && (
          <div
            style={{
              background: colors.accentLight,
              border: `2px solid ${colors.accent}`,
              borderRadius: 14,
              padding: "14px 16px",
              marginTop: 16,
              textAlign: "left",
            }}
          >
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
              How did “{preparePlan.eventTitle}” go?
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { id: "well", label: "It went okay or well" },
                { id: "mixed", label: "Mixed" },
                { id: "hard", label: "It was hard" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => submitPrepareReflection(opt.id)}
                  style={{
                    ...baseBtn,
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: colors.text,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => clearPreparePlan()} style={{ ...baseBtn, marginTop: 10, background: "transparent", color: colors.textMuted, fontSize: 12 }}>
              Dismiss without saving
            </button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          <button
            onClick={() => setScreen("scenarios")}
            style={{ ...baseBtn, background: colors.primary, color: "#fff", padding: "18px 24px", fontSize: 17, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 22 }}>💬</span> Practise a Conversation
          </button>
          <button
            onClick={() => setScreen("prepare-tomorrow")}
            style={{ ...baseBtn, background: colors.card, color: colors.primaryDark, padding: "16px 24px", fontSize: 16, border: `2px solid ${colors.primary}`, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 20 }}>📅</span> Prepare for Tomorrow
          </button>
          <button
            onClick={() => setScreen("progress")}
            style={{ ...baseBtn, background: colors.accentLight, color: colors.text, padding: "16px 24px", fontSize: 16, border: `2px solid ${colors.accent}`, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 20 }}>📊</span> See My Progress
          </button>
          <button
            onClick={() => { setSelectedTipCategoryKey(null); setScreen("tips"); }}
            style={{ ...baseBtn, background: colors.greenLight, color: colors.text, padding: "16px 24px", fontSize: 16, border: `2px solid ${colors.greenBorder}`, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 20 }}>💡</span> Tips Library
          </button>
          <button
            onClick={() => setScreen("howto")}
            style={{ ...baseBtn, background: colors.card, color: colors.textMuted, padding: "16px 24px", fontSize: 15, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 20 }}>❓</span> How This Works
          </button>
          <button
            onClick={() => setScreen("settings")}
            style={{ ...baseBtn, background: colors.card, color: colors.textMuted, padding: "14px 24px", fontSize: 14, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 18 }}>⚙️</span> Settings
          </button>
          {authUser ? (
            <button
              onClick={handleSignOut}
              style={{ ...baseBtn, background: colors.card, color: colors.textMuted, padding: "14px 24px", fontSize: 14, border: `1px solid ${colors.border}` }}
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => setScreen("auth-choice")}
              style={{ ...baseBtn, background: colors.card, color: colors.textMuted, padding: "14px 24px", fontSize: 14, border: `1px solid ${colors.border}` }}
            >
              Create free account
            </button>
          )}
        </div>

        {/* Reassurance */}
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 36, lineHeight: 1.6 }}>
          Everything here is private. You can't get this wrong.<br />This is your space to practise and learn.
        </p>
      </div>
    </div>
  );

  const renderScenarios = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 20 }}>
          <button onClick={() => setScreen("home")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>← Back</button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 6px 0" }}>Choose a Scenario</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, margin: "0 0 16px 0" }}>Pick a situation you'd like to practise. There's no wrong choice.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setScreen("prepare-tomorrow")}
            style={{
              ...baseBtn,
              background: colors.primaryLight,
              color: colors.primaryDark,
              padding: "12px 14px",
              fontSize: 14,
              border: `1px solid ${colors.border}`,
              textAlign: "left",
            }}
          >
            📅 Prepare for Tomorrow — get a focused plan for an upcoming event
          </button>
          {hasCustomScenariosUnlock ? (
            <button
              type="button"
              onClick={() => setScreen("custom-build")}
              style={{
                ...baseBtn,
                background: colors.accentLight,
                color: colors.text,
                padding: "12px 14px",
                fontSize: 14,
                border: `1px solid ${colors.accent}`,
                textAlign: "left",
              }}
            >
              ✨ Create Custom Scenario — describe a real situation and we&apos;ll tailor a practice chat
            </button>
          ) : (
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted, padding: "4px 2px" }}>
              Complete one scenario in each core category to unlock Custom Scenarios.
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {practiceScenarioList.map((s) => (
            <button
              key={s.id}
              onClick={() => startScenario(s)}
              style={{
                ...baseBtn,
                background: colors.card,
                border: completedScenarios.includes(s.id) ? `2px solid ${colors.green}` : `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: "16px 18px",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: colors.shadow,
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, color: colors.text }}>{s.title}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.primaryDark, marginTop: 4 }}>
                  {s.category}
                  {s.difficulty && (
                    <span style={{ marginLeft: 8, color: colors.textMuted, fontWeight: 600 }}>
                      · {DIFFICULTY_LABEL[s.difficulty]}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{s.description}</div>
              </div>
              {completedScenarios.includes(s.id) && <span style={{ marginLeft: "auto", fontSize: 18, flexShrink: 0 }}>✅</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => {
    const suggestionSource =
      Array.isArray(selectedScenario?.suggested_replies) && selectedScenario.suggested_replies.length > 0
        ? selectedScenario.suggested_replies
        : SUGGESTED_REPLIES[selectedScenario?.id] || [];
    const suggestions = suggestionSource;
    const currentSuggestion =
      suggestions.length > 0 ? suggestions[Math.min(turnCount, suggestions.length - 1)] : null;

    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column", padding: "0 20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 12, borderBottom: `1px solid ${colors.border}`, flexWrap: "wrap", gap: 8 }}>
            <button onClick={() => setScreen("scenarios")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>← Back</button>
            {!pacingMode && (
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, fontWeight: 600 }}>
                {turnCount}/{maxTurns} turns
              </span>
            )}
          </div>
          {replaySourceSession && (
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.primaryDark, background: colors.accentLight, borderRadius: 10, padding: "8px 10px", marginTop: 8 }}>
              🔁 Replay mode: trying different choices from {replaySourceSession.title}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>Social cue hints (?)</span>
            <button
              type="button"
              role="switch"
              aria-checked={showHintsInChat}
              onClick={() => persistHintsPreference(!showHintsInChat)}
              style={{
                ...baseBtn,
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 999,
                background: showHintsInChat ? colors.green : colors.border,
                color: showHintsInChat ? "#fff" : colors.textMuted,
              }}
            >
              {showHintsInChat ? "On" : "Off"}
            </button>
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.primary, background: colors.primaryLight, borderRadius: 10, padding: "8px 14px", margin: "12px 0", textAlign: "center", fontWeight: 600 }}>
            {selectedScenario?.icon} {selectedScenario?.title}
            {selectedScenario?.difficulty && (
              <span style={{ display: "block", fontWeight: 500, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                {selectedScenario.category} · {DIFFICULTY_LABEL[selectedScenario.difficulty]}
              </span>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16, display: "flex", flexDirection: "column" }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: 12,
                  maxWidth: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: msg.sender === "user" ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      background: msg.sender === "user" ? colors.chatBubbleUser : colors.chatBubbleAI,
                      border: msg.sender === "user" ? `1.5px solid ${colors.accent}` : `1.5px solid ${colors.border}`,
                      borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding: "12px 16px",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: colors.text,
                    }}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === "ai" && showHintsInChat && (
                    <button
                      type="button"
                      title="What might this mean socially?"
                      onClick={() => fetchAiExplanation(msg.text, i)}
                      style={{
                        ...baseBtn,
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: colors.accentLight,
                        color: colors.primaryDark,
                        fontWeight: 800,
                        fontSize: 14,
                        border: `1px solid ${colors.accent}`,
                        lineHeight: 1,
                      }}
                    >
                      ?
                    </button>
                  )}
                </div>
                {msg.sender === "ai" && explainIdx === i && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 12px",
                      background: colors.accentLight,
                      border: `1px solid ${colors.amberBorder}`,
                      borderRadius: 12,
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 13,
                      color: colors.text,
                      lineHeight: 1.55,
                      maxWidth: "95%",
                    }}
                  >
                    {explainLoading ? "Thinking…" : explainText}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div style={{ background: colors.chatBubbleAI, border: `1.5px solid ${colors.border}`, borderRadius: "18px 18px 18px 4px", padding: "12px 20px", fontFamily: "'Nunito', sans-serif", fontSize: 15, color: colors.textMuted }}>
                  typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {chatError && (
            <div
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13,
                color: "#9C4221",
                background: colors.amberLight,
                border: `1px solid ${colors.amberBorder}`,
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 10,
              }}
            >
              {chatError}
            </div>
          )}

          {/* Suggestion */}
          {showSuggestion && currentSuggestion && (
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 10, boxShadow: colors.shadow }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: colors.primary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Suggested reply</div>
              <div
                onClick={() => { setUserInput(currentSuggestion); setShowSuggestion(false); }}
                style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.text, cursor: "pointer", lineHeight: 1.5, padding: "6px 10px", background: colors.primaryLight, borderRadius: 10 }}
              >
                {currentSuggestion}
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: colors.textMuted, marginTop: 6 }}>Tap to use this, or write your own</div>
            </div>
          )}

          {/* Input area */}
          <div style={{ paddingBottom: 20, paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
            {!showSuggestion && !pacingMode && (
              <button
                onClick={() => setShowSuggestion(true)}
                style={{ ...baseBtn, background: "transparent", color: colors.primary, fontSize: 13, padding: "6px 0", marginBottom: 8, fontWeight: 600 }}
              >
                💡 Feeling stuck? Tap for a suggestion
              </button>
            )}
            {pacingMode && currentSuggestion && (
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setUserInput(currentSuggestion)}
                  style={{ ...baseBtn, background: colors.primaryLight, color: colors.primaryDark, fontSize: 13, padding: "8px 12px", border: `1px solid ${colors.border}` }}
                >
                  💡 Use a suggested reply
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply..."
                rows={2}
                disabled={feedbackLoading}
                style={{
                  flex: 1,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 15,
                  padding: "12px 16px",
                  borderRadius: 16,
                  border: `2px solid ${colors.border}`,
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.4,
                  background: colors.card,
                  color: colors.text,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!userInput.trim() || feedbackLoading}
                style={{
                  ...baseBtn,
                  background: userInput.trim() && !feedbackLoading ? colors.primary : colors.border,
                  color: "#fff",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ▶
              </button>
            </div>
            {feedbackLoading && (
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
                Generating your feedback...
              </div>
            )}
            {sessionSaving && (
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                Saving your session...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    if (!feedback) return null;
    return (
      <div style={{ minHeight: "100vh", background: colors.bg }}>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 20 }}>
            <button onClick={() => setScreen("home")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>← Home</button>
          </div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 4px 0" }}>Your Conversation Feedback</h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, margin: "0 0 24px 0" }}>
            Well done for practising — that's the hardest part!
          </p>

          {/* Strengths */}
          <div style={{ background: colors.greenLight, border: `1.5px solid ${colors.greenBorder}`, borderRadius: 18, padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: "#276749", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>✅</span> Strengths
            </div>
            {feedback.strengths.map((s, i) => (
              <div key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: "#276749", lineHeight: 1.6, marginBottom: 6, paddingLeft: 8 }}>
                • {s}
              </div>
            ))}
          </div>

          {/* Things to Explore */}
          {feedback.explore.length > 0 && (
            <div style={{ background: colors.amberLight, border: `1.5px solid ${colors.amberBorder}`, borderRadius: 18, padding: "18px 20px", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: "#9C4221", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🔍</span> Things to Explore
              </div>
              {feedback.explore.map((s, i) => (
                <div key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: "#9C4221", lineHeight: 1.6, marginBottom: 6, paddingLeft: 8 }}>
                  • {s}
                </div>
              ))}
            </div>
          )}

          {/* Example Responses */}
          {feedback.examples.length > 0 && (
            <div style={{ background: colors.primaryLight, border: `1.5px solid #BEE3F8`, borderRadius: 18, padding: "18px 20px", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: colors.primaryDark, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span>💡</span> Example Responses That Work Well
              </div>
              {feedback.examples.map((s, i) => (
                <div key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.primaryDark, lineHeight: 1.6, marginBottom: 8, paddingLeft: 8, fontStyle: "italic" }}>
                  "{s}"
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!authUser && completedScenarios.length === 1 && (
            <div style={{ background: colors.primaryLight, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.primaryDark, lineHeight: 1.5 }}>
                Want to save your progress? Create a free account.
                <button onClick={() => setScreen("auth-choice")} style={{ ...baseBtn, background: "transparent", color: colors.primary, fontSize: 13, textDecoration: "underline", padding: 0, marginLeft: 6 }}>
                  Sign up
                </button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() =>
                startReplayFromSession({
                  id: `latest-${Date.now()}`,
                  scenario_id: selectedScenario?.id,
                  scenario_title: selectedScenario?.title,
                  messages,
                  created_at: new Date().toISOString(),
                })
              }
              style={{ ...baseBtn, background: colors.accentLight, color: colors.text, padding: "16px 24px", fontSize: 15, border: `1px solid ${colors.accent}` }}
            >
              🔁 Replay with Different Choices
            </button>
            <button onClick={() => startScenario(selectedScenario)} style={{ ...baseBtn, background: colors.primary, color: "#fff", padding: "16px 24px", fontSize: 16 }}>
              🔄 Try This Scenario Again
            </button>
            <button onClick={() => setScreen("scenarios")} style={{ ...baseBtn, background: colors.card, color: colors.primary, padding: "14px 24px", fontSize: 15, border: `2px solid ${colors.primary}` }}>
              Try a Different Scenario
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProgress = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 20 }}>
          <button onClick={() => setScreen("home")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>← Back</button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 4px 0" }}>Your Progress</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, margin: "0 0 16px 0" }}>Every conversation you practise is a step forward.</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setProgressTab("overview")}
            style={{
              ...baseBtn,
              flex: 1,
              padding: "10px 12px",
              fontSize: 14,
              background: progressTab === "overview" ? colors.primary : colors.card,
              color: progressTab === "overview" ? "#fff" : colors.text,
              border: `1px solid ${progressTab === "overview" ? colors.primary : colors.border}`,
            }}
          >
            Overview
          </button>
          {hasConversationReview ? (
            <button
              type="button"
              onClick={() => setProgressTab("history")}
              style={{
                ...baseBtn,
                flex: 1,
                padding: "10px 12px",
                fontSize: 14,
                background: progressTab === "history" ? colors.primary : colors.card,
                color: progressTab === "history" ? "#fff" : colors.text,
                border: `1px solid ${progressTab === "history" ? colors.primary : colors.border}`,
              }}
            >
              History
            </button>
          ) : (
            <div
              style={{
                flex: 1,
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12,
                color: colors.textMuted,
                alignSelf: "center",
                paddingLeft: 6,
              }}
              title="Complete 10 sessions to unlock conversation history."
            >
              History locks after 10 sessions
            </div>
          )}
        </div>

        {progressTab === "overview" ? (
          <>
            <button
              type="button"
              onClick={() => {
                generateShareCard();
                setScreen("share-card");
              }}
              style={{ ...baseBtn, width: "100%", marginBottom: 14, background: colors.primaryLight, color: colors.primaryDark, padding: "12px 14px", fontSize: 14, border: `1px solid ${colors.border}` }}
            >
              🖼️ Share your progress card
            </button>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 110px", background: colors.primaryLight, borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 800, color: colors.primary }}>{completedScenarios.length}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.primaryDark, marginTop: 2 }}>Different scenarios</div>
              </div>
              <div style={{ flex: "1 1 110px", background: colors.greenLight, borderRadius: 16, padding: "16px 12px", textAlign: "center", border: `1px solid ${colors.greenBorder}` }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 800, color: colors.green }}>{totalSessions}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#276749", marginTop: 2 }}>Sessions</div>
              </div>
              <div style={{ flex: "1 1 110px", background: colors.accentLight, borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 800, color: colors.amber }}>{earnedBadges.length}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#975A16", marginTop: 2 }}>Badges</div>
              </div>
            </div>

            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: colors.primaryDark, marginBottom: 14 }}>Badges</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {BADGES.map((b) => {
                const earned = migrateEarnedBadges(earnedBadges).includes(b.id);
                return (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: earned ? colors.card : colors.bg,
                      border: earned ? `2px solid ${colors.green}` : `1px dashed ${colors.border}`,
                      borderRadius: 14,
                      padding: "14px 16px",
                      opacity: earned ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{earned ? b.icon : "🔒"}</span>
                    <div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: earned ? colors.text : colors.textMuted }}>{b.name}</div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted }}>{b.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: colors.primaryDark, marginBottom: 14 }}>Completed Scenarios</h3>
            {completedScenarios.length === 0 ? (
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, background: colors.card, borderRadius: 14, padding: "20px", textAlign: "center", border: `1px solid ${colors.border}` }}>
                No scenarios completed yet. Start practising to see your progress here!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {completedScenarios.map((sid) => {
                  const s = SCENARIOS.find((sc) => sc.id === sid);
                  return s ? (
                    <div key={sid} style={{ display: "flex", alignItems: "center", gap: 12, background: colors.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${colors.greenBorder}` }}>
                      <span style={{ fontSize: 20 }}>{s.icon}</span>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600, color: colors.text }}>{s.title}</span>
                      <span style={{ marginLeft: "auto", fontSize: 14 }}>✅</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </>
        ) : (
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, marginBottom: 14 }}>
              Open a past session to re-read the transcript and coaching feedback.
            </p>
            {combinedHistoryRows.length === 0 ? (
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, background: colors.card, borderRadius: 14, padding: "20px", textAlign: "center", border: `1px solid ${colors.border}` }}>
                No saved sessions yet. Finish a conversation to see it here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {combinedHistoryRows.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: colors.card,
                      borderRadius: 14,
                      padding: "14px 16px",
                      border: `1px solid ${colors.border}`,
                      boxShadow: colors.shadow,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: colors.text }}>{sessionRowTitle(row)}</div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{formatSessionWhen(row.created_at)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryReview(row);
                        setScreen("history-review");
                      }}
                      style={{ ...baseBtn, background: colors.primaryLight, color: colors.primaryDark, padding: "8px 12px", fontSize: 13 }}
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoryReview = () => {
    const row = historyReview;
    if (!row) return null;
    const fb = row.feedback;
    return (
      <div style={{ minHeight: "100vh", background: colors.bg }}>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
            <button
              onClick={() => {
                setHistoryReview(null);
                setScreen("progress");
                setProgressTab("history");
              }}
              style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}
            >
              ← History
            </button>
          </div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: colors.primaryDark, margin: "0 0 4px 0" }}>{sessionRowTitle(row)}</h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>{formatSessionWhen(row.created_at)}</p>

          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, color: colors.primaryDark, marginBottom: 10 }}>Transcript</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            {(row.messages || []).map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "90%",
                  background: msg.sender === "user" ? colors.chatBubbleUser : colors.chatBubbleAI,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: colors.text,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: colors.textMuted, display: "block", marginBottom: 4 }}>
                  {msg.sender === "user" ? "You" : "Partner"}
                </span>
                {msg.text}
              </div>
            ))}
          </div>

          {fb && (
            <>
              <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, color: colors.primaryDark, marginBottom: 10 }}>Saved feedback</h3>
              <div style={{ background: colors.greenLight, border: `1.5px solid ${colors.greenBorder}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: "#276749", marginBottom: 8 }}>Strengths</div>
                {(fb.strengths || []).map((s, i) => (
                  <div key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#276749", marginBottom: 4 }}>
                    • {s}
                  </div>
                ))}
              </div>
              {(fb.explore || []).length > 0 ? (
                <div style={{ background: colors.amberLight, border: `1.5px solid ${colors.amberBorder}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: "#9C4221", marginBottom: 8 }}>Things to explore</div>
                  {(fb.explore || []).map((s, i) => (
                    <div key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#9C4221", marginBottom: 4 }}>
                      • {s}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}

          <button
            type="button"
            onClick={() => startReplayFromSession(row)}
            style={{
              ...baseBtn,
              width: "100%",
              marginTop: 8,
              background: colors.primaryLight,
              color: colors.primaryDark,
              padding: "14px 16px",
              fontSize: 15,
              border: `1px solid ${colors.border}`,
            }}
          >
            Replay with different choices
          </button>

          <button
            type="button"
            onClick={() => deleteSessionRecord(row)}
            style={{
              ...baseBtn,
              width: "100%",
              marginTop: 8,
              background: colors.card,
              color: "#9B2C2C",
              padding: "14px 16px",
              fontSize: 15,
              border: `1px solid ${colors.border}`,
            }}
          >
            Delete this session
          </button>
        </div>
      </div>
    );
  };

  const renderPrepareTomorrow = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
          <button onClick={() => setScreen("home")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>
            ← Back
          </button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 8px 0" }}>Prepare for Tomorrow</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
          Describe something coming up — a meeting, appointment, or social situation. We&apos;ll suggest a few matching practice scenarios and a short coaching tip.
        </p>
        <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: colors.text }}>What&apos;s coming up?</label>
        <textarea
          value={prepareDraft.eventTitle}
          onChange={(e) => setPrepareDraft((d) => ({ ...d, eventTitle: e.target.value }))}
          placeholder="e.g. Dentist appointment Tuesday morning"
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 8,
            marginBottom: 14,
            fontFamily: "'Nunito', sans-serif",
            fontSize: 15,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
          }}
        />
        <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: colors.text }}>Date (optional)</label>
        <input
          type="date"
          value={prepareDraft.eventDate}
          onChange={(e) => setPrepareDraft((d) => ({ ...d, eventDate: e.target.value }))}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 8,
            marginBottom: 18,
            fontFamily: "'Nunito', sans-serif",
            fontSize: 15,
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
          }}
        />
        <button
          type="button"
          disabled={prepareBusy || !prepareDraft.eventTitle.trim()}
          onClick={() => runPreparePlan()}
          style={{
            ...baseBtn,
            width: "100%",
            background: prepareBusy || !prepareDraft.eventTitle.trim() ? colors.border : colors.primary,
            color: "#fff",
            padding: "16px 20px",
            fontSize: 16,
          }}
        >
          {prepareBusy ? "Building your plan…" : "Save plan & go home"}
        </button>
        {preparePlan?.headline && (
          <div style={{ marginTop: 20, padding: 14, background: colors.primaryLight, borderRadius: 12, fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.text }}>
            <strong>Current plan:</strong> {preparePlan.headline}
            <button type="button" onClick={() => clearPreparePlan()} style={{ ...baseBtn, display: "block", marginTop: 10, background: "transparent", color: colors.primary, fontSize: 13 }}>
              Clear saved plan
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomBuild = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
          <button onClick={() => { setScreen("scenarios"); setGeneratedCustomScenario(null); }} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>
            ← Scenarios
          </button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 8px 0" }}>Custom Scenario</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
          Describe the situation in your own words. We&apos;ll generate a short scenario you can practise immediately and optionally save to reuse later.
        </p>
        <textarea
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          placeholder="Who is there? What worries you? What do you want to say?"
          rows={5}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "'Nunito', sans-serif",
            fontSize: 15,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            marginBottom: 12,
          }}
        />
        <button
          type="button"
          disabled={customBusy || !customDraft.trim()}
          onClick={() => generateCustomScenario()}
          style={{
            ...baseBtn,
            width: "100%",
            background: customBusy || !customDraft.trim() ? colors.border : colors.primary,
            color: "#fff",
            padding: "14px 18px",
            fontSize: 15,
            marginBottom: 18,
          }}
        >
          {customBusy ? "Generating…" : "Generate scenario"}
        </button>

        {generatedCustomScenario && (
          <div style={{ background: colors.card, border: `1px solid ${colors.greenBorder}`, borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{generatedCustomScenario.icon}</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: colors.text }}>{generatedCustomScenario.title}</div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, lineHeight: 1.55 }}>{generatedCustomScenario.description}</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.text, fontStyle: "italic", marginTop: 10 }}>
              Opens with: &ldquo;{generatedCustomScenario.opener}&rdquo;
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => startScenario(generatedCustomScenario)} style={{ ...baseBtn, background: colors.primary, color: "#fff", padding: "14px 18px", fontSize: 15 }}>
                Start this practice chat
              </button>
              <button type="button" onClick={() => saveGeneratedToLibrary()} style={{ ...baseBtn, background: colors.accentLight, color: colors.text, padding: "14px 18px", fontSize: 15, border: `1px solid ${colors.accent}` }}>
                Save to my scenarios &amp; browse list
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
          <button onClick={() => setScreen("home")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>
            ← Back
          </button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 10px 0" }}>Settings</h2>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Conversation pacing</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
            Give me more time to think: waits 2 extra seconds before AI replies, hides the turn counter, and keeps suggestions always available.
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pacingMode}
            onClick={() => persistPacingMode(!pacingMode)}
            style={{ ...baseBtn, background: pacingMode ? colors.green : colors.border, color: pacingMode ? "#fff" : colors.textMuted, fontSize: 13, padding: "8px 14px", borderRadius: 999 }}
          >
            {pacingMode ? "Pacing mode: On" : "Pacing mode: Off"}
          </button>
        </div>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Institution admin dashboard (MVP)</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
            Enter your organisation ID to load aggregated anonymised stats.
          </div>
          <input
            value={adminOrgIdInput}
            onChange={(e) => {
              setAdminOrgIdInput(e.target.value);
              setAdminError("");
            }}
            placeholder="Organisation UUID"
            style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Nunito', sans-serif", fontSize: 14, borderRadius: 10, border: `1px solid ${colors.border}`, padding: "10px 12px", marginBottom: 10 }}
          />
          <button onClick={loadAdminDashboard} disabled={adminLoading || !adminOrgIdInput.trim()} style={{ ...baseBtn, width: "100%", background: adminLoading || !adminOrgIdInput.trim() ? colors.border : colors.primary, color: "#fff", padding: "12px 14px", fontSize: 14 }}>
            {adminLoading ? "Loading dashboard…" : "Open admin dashboard"}
          </button>
          {adminError && <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#9C4221", marginTop: 8 }}>{adminError}</div>}
        </div>
      </div>
    </div>
  );

  const renderShareCard = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
          <button onClick={() => setScreen("progress")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>
            ← Progress
          </button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 8px 0" }}>Share your progress</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, marginBottom: 12 }}>
          This card contains only progress stats. No conversation text is included.
        </p>
        {shareCardUrl ? (
          <img src={shareCardUrl} alt="NeuroChat progress card" style={{ width: "100%", borderRadius: 14, border: `1px solid ${colors.border}`, boxShadow: colors.shadow }} />
        ) : (
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "20px", fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, textAlign: "center" }}>
            No card yet. Generate one from Progress.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <button onClick={generateShareCard} style={{ ...baseBtn, width: "100%", background: colors.primary, color: "#fff", padding: "14px 16px", fontSize: 15 }}>
            Regenerate card
          </button>
          {shareCardUrl && (
            <a href={shareCardUrl} download="neurochat-progress-card.png" style={{ ...baseBtn, width: "100%", background: colors.card, color: colors.primaryDark, padding: "14px 16px", fontSize: 15, border: `1px solid ${colors.border}`, textAlign: "center", textDecoration: "none" }}>
              Download PNG
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
          <button onClick={() => setScreen("settings")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>
            ← Settings
          </button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 8px 0" }}>
          {adminData?.organisation?.name || "Institution Dashboard"}
        </h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, marginBottom: 14 }}>
          Anonymised aggregate data only. No transcripts or mood data shown.
        </p>
        {adminData ? (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { label: "Users", value: adminData.totals?.users ?? 0 },
                { label: "Total sessions", value: adminData.totals?.totalSessions ?? 0 },
                { label: "Active (7d)", value: adminData.totals?.activeLast7Days ?? 0 },
              ].map((kpi) => (
                <div key={kpi.label} style={{ flex: "1 1 110px", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark }}>{kpi.value}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: colors.primaryDark, marginBottom: 8 }}>Most popular scenarios</h3>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
              {(adminData.topScenarios || []).length === 0 ? (
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted }}>No sessions yet.</div>
              ) : (
                (adminData.topScenarios || []).map((row) => (
                  <div key={row.scenarioId} style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.text, padding: "5px 0" }}>
                    <span>{scenarioById(row.scenarioId)?.title || row.scenarioId}</span>
                    <strong>{row.count}</strong>
                  </div>
                ))
              )}
            </div>

            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: colors.primaryDark, marginBottom: 8 }}>User progress snapshot</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(adminData.userStats || []).map((u) => (
                <div key={u.userId} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: colors.textMuted }}>{u.role} · {u.userId.slice(0, 8)}…</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.text, marginTop: 4 }}>
                    {u.totalSessions} sessions · {u.completedScenarios} scenarios · {u.badgesEarned} badges
                  </div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    Last active: {formatDateShort(u.lastActive) || "—"}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted }}>No admin data loaded yet.</div>
        )}
      </div>
    </div>
  );

  const renderTips = () => {
    const selectedCat = tipsData.find((c) => c.category === selectedTipCategoryKey);
    return (
      <div style={{ minHeight: "100vh", background: colors.bg }}>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 20 }}>
            <button
              onClick={() => (selectedTipCategoryKey !== null ? setSelectedTipCategoryKey(null) : setScreen("home"))}
              style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}
            >
              ← {selectedTipCategoryKey !== null ? "Categories" : "Back"}
            </button>
          </div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 4px 0" }}>Tips Library</h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, margin: "0 0 24px 0" }}>Quick, practical advice you can use anytime.</p>

          {selectedTipCategoryKey === null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tipsData.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedTipCategoryKey(cat.category)}
                  style={{
                    ...baseBtn,
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 16,
                    padding: "18px 20px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: colors.shadow,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, color: colors.text }}>{cat.category}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted }}>{cat.tips.length} tips</div>
                  </div>
                </button>
              ))}
            </div>
          ) : selectedCat ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, color: colors.primaryDark, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <span>{selectedCat.icon}</span>
                {selectedCat.category}
              </h3>
              {selectedCat.tips.map((tip, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: colors.shadow }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 6 }}>{tip.title}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>{tip.body}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderHowTo = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 20 }}>
          <button onClick={() => setScreen("home")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>← Back</button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 16px 0" }}>How NeuroChat Works</h2>

        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: colors.primary, marginBottom: 8 }}>You can't get this wrong.</div>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: colors.text, lineHeight: 1.7, marginBottom: 28 }}>
          NeuroChat is a safe space to practise conversations before you have them in real life. There's no scoring, no timer, and no one watching. Just you, practising at your own pace.
        </p>

        {[
          { step: "1", title: "Pick a scenario", desc: "Choose a situation you'd like to practise — like introducing yourself, making small talk, or handling a tricky conversation." },
          { step: "2", title: "Have a conversation", desc: "The app plays the other person. You type (or speak) your replies naturally. If you get stuck, tap for a suggested response." },
          { step: "3", title: "Get gentle feedback", desc: "After the conversation, you'll see what went well and one or two things you could try differently. Strengths are always shown first." },
          { step: "4", title: "Learn and grow", desc: "Visit the Tips Library anytime for practical advice. Track your progress and earn badges as you practise." },
        ].map((item) => (
          <div key={item.step} style={{ display: "flex", gap: 16, marginBottom: 22, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: colors.primary, flexShrink: 0 }}>
              {item.step}
            </div>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ background: colors.accentLight, border: `2px solid ${colors.accent}`, borderRadius: 16, padding: "18px 20px", marginTop: 16 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Remember</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.text, lineHeight: 1.6 }}>
            This isn't a test. There are no wrong answers. The goal is simply to practise — and every time you do, you're building confidence.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      {isBootstrapping && renderHome()}
      {!isBootstrapping && screen === "onboarding" && renderOnboarding()}
      {!isBootstrapping && screen === "auth-choice" && renderAuthChoice()}
      {!isBootstrapping && screen === "mood-checkin" && renderMoodCheckIn()}
      {!isBootstrapping && screen === "home" && renderHome()}
      {screen === "scenarios" && renderScenarios()}
      {screen === "chat" && renderChat()}
      {screen === "feedback" && renderFeedback()}
      {screen === "progress" && renderProgress()}
      {screen === "history-review" && historyReview && renderHistoryReview()}
      {screen === "prepare-tomorrow" && renderPrepareTomorrow()}
      {screen === "custom-build" && renderCustomBuild()}
      {screen === "settings" && renderSettings()}
      {screen === "share-card" && renderShareCard()}
      {screen === "admin-dashboard" && renderAdminDashboard()}
      {screen === "tips" && renderTips()}
      {screen === "howto" && renderHowTo()}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: 400,
            width: "calc(100% - 40px)",
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            padding: "12px 16px",
            boxShadow: colors.shadowLg,
            fontFamily: "'Nunito', sans-serif",
            fontSize: 14,
            color: colors.text,
            zIndex: 9999,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
