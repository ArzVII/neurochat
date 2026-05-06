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
import { NC, NC_CAT, categoryToNcKey, catColor } from "./theme/tokens";
import { NCIcon } from "./components/nc/NCIcon";
import { NCMark, NCThread, ConversationThreadLine } from "./components/nc/Brand";
import {
  Paper,
  ScreenColumn,
  TopBar,
  Eyebrow,
  H1,
  H2,
  Body,
  PrimaryButton,
  GhostButton,
  Card,
  Chip,
  Toggle,
} from "./components/nc/ui";
import { ScenarioCard } from "./components/nc/ScenarioCard";
import {
  SecondaryTile,
  FilterPill,
  MoodOptionCard,
  OnboardingDot,
  FeedbackCard,
  FBPoint,
  StatCard,
  BadgeTile,
  RecentRow,
  TipRow,
  SettingsGroup,
  SettingsRow,
  TurnDot,
} from "./components/nc/blocks";

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

export default function NeuroChat() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSending, setAuthSending] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [screen, setScreen] = useState("home");
  const [scenarioCategoryFilter, setScenarioCategoryFilter] = useState(null);
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
        icon: "spark",
        savedCustomId: row.id,
      })),
    [customLibrary],
  );

  const practiceScenarioList = useMemo(
    () => [...visibleScenarios, ...customAsScenarios],
    [visibleScenarios, customAsScenarios],
  );

  const filteredPracticeList = useMemo(() => {
    if (!scenarioCategoryFilter) return practiceScenarioList;
    return practiceScenarioList.filter((s) => categoryToNcKey(s.category) === scenarioCategoryFilter);
  }, [practiceScenarioList, scenarioCategoryFilter]);

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
    {
      id: "good",
      iconKey: "sun",
      label: "Feeling good",
      bg: NC.sageSoft,
      border: NC.sage,
      text: NC.sage,
      hint: "Want to try something new today?",
      subtle: "Energy is steady.",
    },
    {
      id: "okay",
      iconKey: "cloud",
      label: "Doing okay",
      bg: NC.butterSoft,
      border: NC.butter,
      text: "#8A6A1F",
      hint: "Maybe a familiar scenario?",
      subtle: "A little in-between.",
    },
    {
      id: "low",
      iconKey: "moon",
      label: "A bit low",
      bg: NC.mauveSoft,
      border: NC.mauve,
      text: "#5F4F70",
      hint: "Go easy on yourself today. Something short?",
      subtle: "Be gentle with yourself.",
    },
  ];

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
            "You've unlocked 3 bonus scenarios — find them in the scenario list.",
          );
        }
        if (uniq >= 5) {
          addUnlock(
            "tips-advanced-convo",
            "You've unlocked Advanced Conversation Techniques — open Tips Library.",
          );
        }
        const hadPriorDifficult = priorCompleted.some((sid) => scenarioById(sid)?.category === "Difficult");
        if (selectedScenario.category === "Difficult" && !hadPriorDifficult) {
          addUnlock(
            "tips-calm-pressure",
            "You've unlocked Staying Calm Under Pressure — open Tips Library.",
          );
        }
        const coreCatsCovered = CORE_CATEGORIES.every((cat) =>
          updatedCompleted.some((sid) => scenarioById(sid)?.category === cat),
        );
        if (coreCatsCovered) {
          addUnlock(
            "feature-custom-scenarios",
            "You've unlocked Custom Scenario Builder — create situations from your real life under Choose a Scenario.",
          );
        }
        if (nextTotalSessions >= 10) {
          addUnlock(
            "feature-conversation-review",
            "You've unlocked Conversation History — review past sessions under Progress → History.",
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
        icon: gen.icon || "bubble",
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
      icon: "replay",
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

    ctx.fillStyle = NC.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = NC.ink;
    ctx.font = "600 56px Fraunces, Georgia, serif";
    ctx.fillText("NeuroChat progress", 80, 130);
    ctx.font = "400 30px Geist, system-ui, sans-serif";
    ctx.fillStyle = NC.inkSoft;
    ctx.fillText("Small steps count. Keep going.", 80, 185);

    const cards = [
      { label: "Scenarios", value: String(completedScenarios.length), color: NC.teal },
      { label: "Sessions", value: String(totalSessions), color: NC.sage },
      { label: "Badges", value: String(earnedBadges.length), color: NC.butter },
    ];
    cards.forEach((item, i) => {
      const x = 80 + i * 320;
      ctx.fillStyle = NC.card;
      ctx.strokeStyle = NC.cardEdge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, 260, 280, 220, 24);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = item.color;
      ctx.font = "400 72px Fraunces, Georgia, serif";
      ctx.fillText(item.value, x + 32, 360);
      ctx.fillStyle = NC.inkMute;
      ctx.font = "600 26px Geist Mono, monospace";
      ctx.fillText(item.label.toUpperCase(), x + 32, 420);
    });

    const daysPractised = Math.max(1, moodHistory.length);
    ctx.fillStyle = NC.ink;
    ctx.font = "600 38px Fraunces, Georgia, serif";
    ctx.fillText(`Days practised: ${daysPractised}`, 80, 590);
    ctx.font = "500 28px Geist, system-ui, sans-serif";
    ctx.fillStyle = NC.inkSoft;
    ctx.fillText(`Badges earned: ${earnedBadges.length}`, 80, 640);

    const topScenarioIds = completedScenarios.slice(0, 3);
    ctx.fillStyle = NC.ink;
    ctx.font = "600 32px Fraunces, Georgia, serif";
    ctx.fillText("Recently completed", 80, 740);
    ctx.font = "500 26px Geist, system-ui, sans-serif";
    ctx.fillStyle = NC.inkSoft;
    topScenarioIds.forEach((sid, idx) => {
      const title = scenarioById(sid)?.title || sid;
      ctx.fillText(`• ${title}`, 100, 790 + idx * 48);
    });

    ctx.fillStyle = NC.inkMute;
    ctx.font = "500 22px Geist, system-ui, sans-serif";
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
    <Paper style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenColumn style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 }}>
        <NCMark size={56} />
        <div style={{ fontFamily: NC.serif, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", color: NC.ink, marginTop: 18 }}>
          neurochat
        </div>
        <Body size={15} color={NC.inkMute} style={{ marginTop: 6 }}>
          practise conversations · safely
        </Body>
        <div style={{ width: "100%", marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
          {!isSupabaseConfigured() && (
            <div style={{ fontSize: 13, color: NC.terracotta, background: NC.terracottaSoft, border: `1px solid ${NC.cardEdge}`, borderRadius: 12, padding: "10px 12px" }}>
              Supabase env vars are missing or invalid. Add SUPABASE_URL and SUPABASE_ANON_KEY to{" "}
              <code style={{ fontFamily: NC.mono, fontSize: 12 }}>.env</code>, then restart the dev server.
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
            style={{
              background: NC.card,
              border: `1px solid ${NC.cardEdge}`,
              borderRadius: 16,
              padding: "16px 16px",
              fontFamily: NC.sans,
              fontSize: 15,
              color: NC.ink,
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <PrimaryButton kind="ink" disabled={authSending} onClick={sendMagicLink}>
            {authSending ? "Sending…" : "Continue with email"}
          </PrimaryButton>
          <Body size={12} color={NC.inkMute} style={{ textAlign: "center", padding: "0 12px" }}>
            We&apos;ll send a magic link. Works for new and existing accounts.
          </Body>
          {authError ? (
            <p role="alert" style={{ fontSize: 13, color: NC.terracotta, background: NC.terracottaSoft, borderRadius: 12, padding: "10px 12px", margin: 0 }}>
              {authError}
            </p>
          ) : null}
          {authNotice && !authError ? (
            <p style={{ fontSize: 13, color: NC.sage, margin: 0 }}>{authNotice}</p>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
            <div style={{ flex: 1, height: 1, background: NC.cardEdge }} />
            <div style={{ fontFamily: NC.mono, fontSize: 11, color: NC.inkMute, textTransform: "uppercase", letterSpacing: "0.12em" }}>or</div>
            <div style={{ flex: 1, height: 1, background: NC.cardEdge }} />
          </div>
          <GhostButton onClick={enterGuestMode}>Continue as guest</GhostButton>
        </div>
      </ScreenColumn>
      <ScreenColumn style={{ textAlign: "center", paddingBottom: 24 }}>
        <Body size={11} color={NC.inkFaint}>
          By continuing you agree to our gentle terms.
        </Body>
      </ScreenColumn>
    </Paper>
  );

  const renderOnboarding = () => {
    const pages = [
      {
        title: "Welcome to NeuroChat",
        body1: "This is a safe space to practise conversations. No one is watching. No one is scoring you.",
      },
      {
        title: "How it works",
        body1: "You'll chat with an AI partner who plays the other person. Afterwards, you'll get gentle feedback — strengths first, always.",
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
      <Paper style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ScreenColumn style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 16 }}>
          <TopBar
            left={
              <button
                type="button"
                onClick={finishOnboarding}
                style={{ background: "transparent", border: "none", color: NC.inkMute, fontFamily: NC.mono, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
              >
                skip
              </button>
            }
            center={`Step ${onboardingStep + 1} of 3`}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 8 }}>
            {onboardingStep === 0 ? (
              <>
                <NCMark size={56} />
                <H1 style={{ fontSize: 44, marginTop: 28, lineHeight: 1.02 }}>
                  A quiet room
                  <br />
                  for the words
                  <br />
                  <span style={{ fontStyle: "italic", color: NC.teal }}>you&apos;re rehearsing.</span>
                </H1>
                <div style={{ margin: "20px 0 24px" }}>
                  <NCThread width={280} height={36} opacity={0.25} />
                </div>
              </>
            ) : (
              <>
                <H1 style={{ fontSize: 30, marginBottom: 14 }}>{page.title}</H1>
              </>
            )}
            <Body size={17} style={{ maxWidth: 320 }}>
              {page.body1}
            </Body>
            {page.body2 ? (
              <Body size={15} color={NC.inkMute} style={{ marginTop: 12, maxWidth: 320 }}>
                {page.body2}
              </Body>
            ) : null}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 0 16px" }}>
            <OnboardingDot active={onboardingStep === 0} />
            <OnboardingDot active={onboardingStep === 1} />
            <OnboardingDot active={onboardingStep === 2} />
          </div>
          <PrimaryButton
            kind="ink"
            onClick={() => {
              if (isLast) {
                finishOnboarding();
                return;
              }
              setOnboardingStep(onboardingStep + 1);
            }}
          >
            {isLast ? "Let's go" : "Continue"}
          </PrimaryButton>
        </ScreenColumn>
      </Paper>
    );
  };

  const renderMoodCheckIn = () => (
    <Paper style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenColumn style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar
          center="Before we begin"
          right={
            <button
              type="button"
              onClick={() => setScreen("home")}
              style={{ background: "transparent", border: "none", color: NC.inkMute, fontFamily: NC.mono, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
            >
              skip
            </button>
          }
        />
        <div style={{ paddingTop: 28, paddingBottom: 14 }}>
          <H1>
            How are you
            <br />
            feeling, right now?
          </H1>
          <Body style={{ marginTop: 14 }}>Pick anything that fits. You can change it later.</Body>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, paddingTop: 8 }}>
          {moodOptions.map((option) => (
            <MoodOptionCard
              key={option.id}
              icon={NCIcon[option.iconKey](28)}
              label={option.label}
              sub={option.subtle}
              color={option.border}
              bg={option.bg}
              selected={mood === option.id}
              onClick={() => chooseMood(option.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setScreen("home")}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            color: NC.inkMute,
            fontFamily: NC.sans,
            fontSize: 14,
            cursor: "pointer",
            padding: "12px 0",
          }}
        >
          Skip for now
        </button>
      </ScreenColumn>
    </Paper>
  );

  // ─── RENDER SCREENS ───

  const renderHome = () => {
    const homeTime = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const moodPhrase =
      mood === "good" ? "feeling good" : mood === "okay" ? "doing okay" : mood === "low" ? "a bit low" : null;
    const tipCount = tipsData.reduce((n, c) => n + (c.tips?.length || 0), 0);
    const scenarioCount = practiceScenarioList.length;

    return (
      <Paper style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ScreenColumn style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <NCMark size={32} />
              <div style={{ fontFamily: NC.serif, fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em", color: NC.ink }}>neurochat</div>
            </div>
            <button
              type="button"
              onClick={() => setScreen("settings")}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: `1px solid ${NC.cardEdge}`,
                background: NC.card,
                color: NC.inkSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Settings"
            >
              {NCIcon.gear(18)}
            </button>
          </div>

          {moodPhrase ? (
            <div style={{ paddingTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: NC.sageSoft,
                  borderRadius: 999,
                  border: `1px solid ${NC.sage}30`,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 999, background: NC.sage }} />
                <Body size={13} color={NC.ink} style={{ flex: 1, fontWeight: 500 }}>
                  Today you&apos;re{" "}
                  <span style={{ fontFamily: NC.serif, fontStyle: "italic" }}>{moodPhrase}</span>
                </Body>
                <button
                  type="button"
                  onClick={() => setScreen("mood-checkin")}
                  style={{
                    fontFamily: NC.mono,
                    fontSize: 11,
                    color: NC.inkMute,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  change
                </button>
              </div>
            </div>
          ) : null}

          <div style={{ paddingTop: 28, paddingBottom: 18 }}>
            <Eyebrow>
              A safe space · {homeTime}
            </Eyebrow>
            <H1 style={{ marginTop: 8, fontSize: 38 }}>
              Take your time,
              <br />
              <span style={{ fontStyle: "italic", color: NC.teal }}>practise</span> at your pace.
            </H1>
          </div>

          <div style={{ position: "relative", marginBottom: 14 }}>
            <div
              style={{
                position: "relative",
                background: NC.ink,
                color: NC.paper,
                borderRadius: 24,
                padding: "20px 22px 22px",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", right: -20, top: -10, opacity: 0.16 }}>
                <NCThread width={260} height={120} stroke={NC.butter} opacity={0.9} />
              </div>
              <Eyebrow color={NC.butter} style={{ opacity: 0.9 }}>
                Begin
              </Eyebrow>
              <div
                style={{
                  fontFamily: NC.serif,
                  fontWeight: 400,
                  fontSize: 26,
                  lineHeight: 1.15,
                  letterSpacing: "-0.015em",
                  marginTop: 6,
                  marginBottom: 16,
                }}
              >
                Practise a conversation
              </div>
              <button
                type="button"
                onClick={() => setScreen("scenarios")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: NC.butter,
                  color: NC.ink,
                  padding: "12px 18px",
                  borderRadius: 14,
                  width: "fit-content",
                  fontWeight: 600,
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: NC.sans,
                }}
              >
                {scenarioCount} scenarios ready {NCIcon.send(16)}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <SecondaryTile
              icon={NCIcon.calendar(20)}
              title="Prepare for tomorrow"
              desc="Plan a real event"
              tone={NC.tealSoft}
              ink="#3D6A72"
              onClick={() => setScreen("prepare-tomorrow")}
            />
            <SecondaryTile
              icon={NCIcon.chart(20)}
              title="My progress"
              desc="Streaks & badges"
              tone={NC.butterSoft}
              ink="#8A6A1F"
              onClick={() => setScreen("progress")}
            />
            <SecondaryTile
              icon={NCIcon.bulb(20)}
              title="Tips library"
              desc={`${tipCount} quick reads`}
              tone={NC.sageSoft}
              ink="#5A7155"
              onClick={() => {
                setSelectedTipCategoryKey(null);
                setScreen("tips");
              }}
            />
            <SecondaryTile
              icon={NCIcon.question(20)}
              title="How this works"
              desc="Short walkthrough"
              tone={NC.mauveSoft}
              ink="#5F4F70"
              onClick={() => setScreen("howto")}
            />
          </div>

          {preparePlan && !preparePlan.reflection && !isPrepareReflectionDue(preparePlan) ? (
            <Card style={{ padding: 16, marginBottom: 12, background: NC.tealSoft, border: `1px dashed ${NC.teal}80` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ color: NC.teal, display: "flex", paddingTop: 2 }}>{NCIcon.calendar(20)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: NC.serif, fontSize: 15, fontWeight: 500, color: NC.ink, marginBottom: 4 }}>Coming up: {preparePlan.eventTitle}</div>
                  <Body size={14} color={NC.inkSoft}>
                    {preparePlan.headline}
                  </Body>
                  {preparePlan.tip ? (
                    <Body size={12} color={NC.inkMute} style={{ marginTop: 6 }}>
                      {preparePlan.tip}
                    </Body>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setScreen("scenarios")}
                    style={{
                      marginTop: 10,
                      padding: "8px 14px",
                      borderRadius: 12,
                      border: "none",
                      background: NC.ink,
                      color: NC.paper,
                      fontFamily: NC.sans,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Go to suggested scenarios
                  </button>
                </div>
              </div>
            </Card>
          ) : null}

          {preparePlan && isPrepareReflectionDue(preparePlan) ? (
            <Card style={{ padding: 16, marginBottom: 12, background: NC.butterSoft, border: `1px solid ${NC.butter}60` }}>
              <Body size={14} color={NC.ink} style={{ fontWeight: 600, marginBottom: 8 }}>
                How did &ldquo;{preparePlan.eventTitle}&rdquo; go?
              </Body>
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
                      padding: "8px 12px",
                      borderRadius: 12,
                      border: `1px solid ${NC.cardEdge}`,
                      background: NC.card,
                      fontFamily: NC.sans,
                      fontSize: 13,
                      color: NC.ink,
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => clearPreparePlan()} style={{ marginTop: 10, background: "none", border: "none", color: NC.inkMute, fontSize: 12, cursor: "pointer" }}>
                Dismiss without saving
              </button>
            </Card>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, alignItems: "center" }}>
            <Body size={12} color={NC.inkMute} style={{ textAlign: "center", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              {NCIcon.user(14)}
              {authUser ? "Signed in" : "Guest mode"}
            </Body>
            {!authUser ? (
              <GhostButton onClick={() => setScreen("auth-choice")} style={{ maxWidth: 280 }}>
                Create free account
              </GhostButton>
            ) : (
              <GhostButton onClick={handleSignOut} style={{ maxWidth: 280 }}>
                Sign out
              </GhostButton>
            )}
          </div>

          <div style={{ marginTop: "auto", paddingTop: 16, textAlign: "center" }}>
            <Body size={12} color={NC.inkFaint}>
              Everything here is private · You can&apos;t get this wrong
            </Body>
          </div>
        </ScreenColumn>
      </Paper>
    );
  };

  const renderScenarios = () => (
    <Paper style={{ minHeight: "100vh" }}>
      <ScreenColumn style={{ paddingBottom: 32 }}>
        <TopBar
          left={
            <button
              type="button"
              onClick={() => setScreen("home")}
              style={{ background: "none", border: "none", color: NC.ink, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: 0, fontFamily: NC.sans, fontSize: 15 }}
            >
              {NCIcon.back(18)}
            </button>
          }
          center="Library"
        />
        <div style={{ paddingTop: 8, paddingBottom: 16 }}>
          <H1>
            Choose what to
            <br />
            practise today.
          </H1>
          <Body size={15} style={{ marginTop: 10 }}>
            {practiceScenarioList.length} scenarios. There&apos;s no wrong choice.
          </Body>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14, marginInline: -6, paddingInline: 6 }}>
          <FilterPill active={scenarioCategoryFilter === null} onClick={() => setScenarioCategoryFilter(null)}>
            All
          </FilterPill>
          {(["work", "social", "everyday", "difficult", "relationships", "selfadvocacy"] ).map((k) => (
            <FilterPill key={k} catKey={k} active={scenarioCategoryFilter === k} onClick={() => setScenarioCategoryFilter(k)}>
              {NC_CAT[k].name}
            </FilterPill>
          ))}
        </div>

        {preparePlan?.eventTitle ? (
          <button
            type="button"
            onClick={() => setScreen("prepare-tomorrow")}
            style={{
              width: "100%",
              marginBottom: 12,
              background: NC.tealSoft,
              border: `1px dashed ${NC.teal}80`,
              borderRadius: 16,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              font: "inherit",
              textAlign: "left",
            }}
          >
            <div style={{ color: NC.teal, display: "flex" }}>{NCIcon.spark(20)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: NC.serif, fontSize: 14, fontWeight: 500, color: NC.ink }}>Prepare for tomorrow</div>
              <Body size={12} color={NC.inkMute}>
                {preparePlan.eventTitle}
              </Body>
            </div>
            <div style={{ color: NC.teal }}>{NCIcon.send(16)}</div>
          </button>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <GhostButton onClick={() => setScreen("prepare-tomorrow")} style={{ minHeight: 48, fontSize: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {NCIcon.calendar(18)} Prepare for Tomorrow — plan a real event
            </span>
          </GhostButton>
          {hasCustomScenariosUnlock ? (
            <PrimaryButton kind="butter" onClick={() => setScreen("custom-build")} style={{ minHeight: 48, fontSize: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {NCIcon.spark(18)} Create Custom Scenario
              </span>
            </PrimaryButton>
          ) : (
            <Body size={12} color={NC.inkMute} style={{ padding: "4px 2px" }}>
              Complete one scenario in each core category to unlock Custom Scenarios.
            </Body>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredPracticeList.map((s) => (
            <ScenarioCard
              key={s.id}
              category={s.category}
              iconKey={s.icon}
              title={s.title}
              desc={s.description}
              difficultyLabel={s.difficulty ? DIFFICULTY_LABEL[s.difficulty] : ""}
              done={completedScenarios.includes(s.id)}
              onClick={() => startScenario(s)}
            />
          ))}
        </div>
      </ScreenColumn>
    </Paper>
  );

  const renderChat = () => {
    const suggestionSource =
      Array.isArray(selectedScenario?.suggested_replies) && selectedScenario.suggested_replies.length > 0
        ? selectedScenario.suggested_replies
        : SUGGESTED_REPLIES[selectedScenario?.id] || [];
    const suggestions = suggestionSource;
    const currentSuggestion =
      suggestions.length > 0 ? suggestions[Math.min(turnCount, suggestions.length - 1)] : null;
    const cat = selectedScenario ? catColor(selectedScenario.category) : NC_CAT.work;

    return (
      <Paper style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ScreenColumn style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingBottom: 8 }}>
          <TopBar
            left={
              <button
                type="button"
                onClick={() => setScreen("scenarios")}
                style={{
                  background: "none",
                  border: "none",
                  color: NC.ink,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: NC.sans,
                  fontSize: 14,
                }}
              >
                {NCIcon.back(18)} Back
              </button>
            }
            center={
              <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 500, color: NC.inkSoft }}>
                {selectedScenario?.title}
              </span>
            }
            right={
              !pacingMode ? (
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: maxTurns }, (_, i) => (
                    <TurnDot key={i} done={i < turnCount} />
                  ))}
                </div>
              ) : (
                <span />
              )
            }
          />

          {replaySourceSession ? (
            <div
              style={{
                fontSize: 12,
                color: NC.inkSoft,
                background: NC.butterSoft,
                borderRadius: 10,
                padding: "8px 10px",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {NCIcon.replay(16)}
              Replay mode: different choices from {replaySourceSession.title}
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8, marginBottom: 4 }}>
            <Eyebrow style={{ letterSpacing: "0.08em" }}>Social cue hints</Eyebrow>
            <Toggle checked={showHintsInChat} onChange={(v) => persistHintsPreference(v)} />
          </div>

          <div style={{ padding: "0 0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Chip color={cat.ink} soft={cat.soft}>
                {selectedScenario?.category || "Scenario"}
              </Chip>
              {selectedScenario?.difficulty ? (
                <Body size={12} color={NC.inkMute}>
                  {DIFFICULTY_LABEL[selectedScenario.difficulty]}
                </Body>
              ) : null}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0", display: "flex", flexDirection: "column", gap: 14, position: "relative", minHeight: 120 }}>
            <ConversationThreadLine />
            {messages.map((msg, i) => (
              <div key={i} style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Bubble side={msg.sender === "user" ? "user" : "ai"}>{msg.text}</Bubble>
                  {msg.sender === "ai" && showHintsInChat ? (
                    <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 4, marginTop: -4 }}>
                      <button
                        type="button"
                        title="What might this mean socially?"
                        onClick={() => fetchAiExplanation(msg.text, i)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          background: NC.butterSoft,
                          color: "#8A6A1F",
                          border: `1px solid ${NC.butter}80`,
                          borderRadius: 999,
                          fontFamily: NC.mono,
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        {NCIcon.question(12)} what just happened?
                      </button>
                    </div>
                  ) : null}
                  {msg.sender === "ai" && explainIdx === i ? (
                    <div
                      style={{
                        marginTop: 4,
                        padding: "10px 12px",
                        background: NC.tealSoft,
                        border: `1px solid ${NC.cardEdge}`,
                        borderRadius: 12,
                        fontSize: 13,
                        color: NC.ink,
                        lineHeight: 1.55,
                        maxWidth: "95%",
                      }}
                    >
                      {explainLoading ? "Thinking…" : explainText}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {typing ? (
              <div style={{ display: "flex", justifyContent: "flex-start", alignSelf: "flex-start", marginBottom: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: NC.card,
                    border: `1px solid ${NC.cardEdge}`,
                    borderRadius: 18,
                  }}
                >
                  {[0, 1, 2].map((j) => (
                    <span key={j} className="nc-typing-dot" style={{ width: 6, height: 6, borderRadius: 999, background: NC.inkMute }} />
                  ))}
                </div>
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          {chatError ? (
            <div style={{ fontSize: 13, color: NC.terracotta, background: NC.terracottaSoft, borderRadius: 12, padding: "8px 12px", marginBottom: 10 }}>{chatError}</div>
          ) : null}

          {showSuggestion && currentSuggestion ? (
            <Card style={{ padding: 14, marginBottom: 10 }}>
              <Eyebrow style={{ marginBottom: 6, color: NC.teal }}>Suggested reply</Eyebrow>
              <button
                type="button"
                onClick={() => {
                  setUserInput(currentSuggestion);
                  setShowSuggestion(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  fontFamily: NC.sans,
                  fontSize: 14,
                  color: NC.ink,
                  cursor: "pointer",
                  lineHeight: 1.5,
                  padding: "8px 10px",
                  background: NC.tealSoft,
                  borderRadius: 10,
                  border: `1px solid ${NC.cardEdge}`,
                }}
              >
                {currentSuggestion}
              </button>
              <Body size={11} color={NC.inkMute} style={{ marginTop: 6 }}>
                Tap to use this, or write your own
              </Body>
            </Card>
          ) : null}

          <div style={{ paddingTop: 8, borderTop: `1px solid ${NC.cardEdge}` }}>
            {!showSuggestion && !pacingMode ? (
              <button
                type="button"
                onClick={() => setShowSuggestion(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  marginBottom: 8,
                  background: "transparent",
                  border: `1.5px dashed ${NC.butter}`,
                  color: "#8A6A1F",
                  borderRadius: 14,
                  fontFamily: NC.sans,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {NCIcon.bulb(16)} Feeling stuck? Tap for a gentle suggestion
              </button>
            ) : null}
            {pacingMode && currentSuggestion ? (
              <button
                type="button"
                onClick={() => setUserInput(currentSuggestion)}
                style={{
                  width: "100%",
                  marginBottom: 8,
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: `1px solid ${NC.cardEdge}`,
                  background: NC.tealSoft,
                  color: NC.ink,
                  fontFamily: NC.sans,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {NCIcon.bulb(16)} Use a suggested reply
              </button>
            ) : null}
            <div style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 12 }}>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply…"
                rows={2}
                disabled={feedbackLoading}
                style={{
                  flex: 1,
                  fontFamily: NC.sans,
                  fontSize: 15,
                  padding: "12px 18px",
                  borderRadius: 22,
                  border: `1px solid ${NC.cardEdge}`,
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.4,
                  background: NC.card,
                  color: NC.ink,
                }}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!userInput.trim() || feedbackLoading}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  background: userInput.trim() && !feedbackLoading ? NC.ink : NC.cardEdge,
                  color: NC.paper,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: userInput.trim() && !feedbackLoading ? "pointer" : "not-allowed",
                  flexShrink: 0,
                }}
                aria-label="Send"
              >
                {NCIcon.send(18)}
              </button>
            </div>
            {feedbackLoading ? (
              <Body size={13} color={NC.inkMute}>
                Generating your feedback...
              </Body>
            ) : null}
            {sessionSaving ? (
              <Body size={13} color={NC.inkMute} style={{ marginTop: 4 }}>
                Saving your session...
              </Body>
            ) : null}
          </div>
        </ScreenColumn>
      </Paper>
    );
  };

  const renderFeedback = () => {
    if (!feedback) return null;
    return (
      <Paper style={{ minHeight: "100vh", overflow: "hidden" }}>
        <ScreenColumn style={{ paddingBottom: 24 }}>
          <TopBar
            left={
              <button type="button" onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: NC.ink, cursor: "pointer", padding: 0 }}>
                {NCIcon.back(18)}
              </button>
            }
            center="Reflection"
          />
          <div style={{ paddingTop: 8, paddingBottom: 18 }}>
            <Eyebrow color={NC.sage}>Well done</Eyebrow>
            <H1 style={{ marginTop: 6, fontSize: 28 }}>
              You stayed open
              <br />
              and curious.
            </H1>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflow: "auto", paddingBottom: 8 }}>
            <FeedbackCard tone={NC.sageSoft} ink="#5A7155" border={NC.sage} title="Strengths" eyebrow="What went well">
              {feedback.strengths.map((s, i) => (
                <FBPoint key={i}>{s}</FBPoint>
              ))}
            </FeedbackCard>

            {feedback.explore.length > 0 ? (
              <FeedbackCard tone={NC.butterSoft} ink="#8A6A1F" border={NC.butter} title="Things to explore" eyebrow="One small step">
                {feedback.explore.map((s, i) => (
                  <FBPoint key={i}>{s}</FBPoint>
                ))}
              </FeedbackCard>
            ) : null}

            {feedback.examples.length > 0 ? (
              <FeedbackCard tone={NC.tealSoft} ink="#3D6A72" border={NC.teal} title="Other ways to say it" eyebrow="Phrasing" compact>
                {feedback.examples.map((s, i) => (
                  <div key={i} style={{ fontFamily: NC.serif, fontStyle: "italic", fontSize: 14, color: NC.ink, lineHeight: 1.4 }}>
                    &ldquo;{s}&rdquo;
                  </div>
                ))}
              </FeedbackCard>
            ) : null}
          </div>

          {!authUser && completedScenarios.length === 1 ? (
            <Card style={{ padding: 14, marginBottom: 12, background: NC.tealSoft }}>
              <Body size={13} color={NC.ink} style={{ lineHeight: 1.5 }}>
                Want to save your progress?{" "}
                <button type="button" onClick={() => setScreen("auth-choice")} style={{ background: "none", border: "none", color: NC.teal, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  Sign up
                </button>
              </Body>
            </Card>
          ) : null}

          <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
            <GhostButton
              style={{ flex: 1, fontSize: 14, minHeight: 52 }}
              onClick={() =>
                startReplayFromSession({
                  id: `latest-${Date.now()}`,
                  scenario_id: selectedScenario?.id,
                  scenario_title: selectedScenario?.title,
                  messages,
                  created_at: new Date().toISOString(),
                })
              }
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {NCIcon.replay(16)} Replay
              </span>
            </GhostButton>
            <PrimaryButton kind="ink" style={{ flex: 1.4, fontSize: 14, minHeight: 52 }} onClick={() => setScreen("scenarios")}>
              Try something different
            </PrimaryButton>
          </div>
          <PrimaryButton kind="sage" style={{ marginTop: 10, fontSize: 14 }} onClick={() => startScenario(selectedScenario)}>
            Try this scenario again
          </PrimaryButton>
        </ScreenColumn>
      </Paper>
    );
  };

  const renderProgress = () => {
    const daysLabel = Math.max(1, moodHistory?.length || 1);
    const badgeAccent = (iconKey) => {
      if (iconKey === "leaf" || iconKey === "heart") return NC.sage;
      if (iconKey === "shield") return NC.teal;
      if (iconKey === "trophy" || iconKey === "chart") return NC.butter;
      return NC.teal;
    };

    return (
      <Paper style={{ minHeight: "100vh" }}>
        <ScreenColumn style={{ paddingBottom: 32 }}>
          <TopBar
            left={
              <button type="button" onClick={() => setScreen("home")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: NC.ink }}>
                {NCIcon.back(18)}
              </button>
            }
            center="Your garden"
            right={
              <button
                type="button"
                onClick={() => {
                  generateShareCard();
                  setScreen("share-card");
                }}
                style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: NC.inkSoft }}
                aria-label="Share progress"
              >
                {NCIcon.share(18)}
              </button>
            }
          />

          <div style={{ paddingTop: 8, paddingBottom: 14 }}>
            <Eyebrow>Since you began · {daysLabel} days ago</Eyebrow>
            <H1 style={{ marginTop: 6, fontSize: 28 }}>
              Every conversation
              <br />
              is a step <span style={{ fontStyle: "italic", color: NC.sage }}>forward.</span>
            </H1>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setProgressTab("overview")}
              style={{
                flex: 1,
                padding: "10px 12px",
                fontSize: 14,
                borderRadius: 12,
                fontFamily: NC.sans,
                fontWeight: 500,
                cursor: "pointer",
                border: `1px solid ${progressTab === "overview" ? NC.ink : NC.cardEdge}`,
                background: progressTab === "overview" ? NC.ink : NC.card,
                color: progressTab === "overview" ? NC.paper : NC.ink,
              }}
            >
              Overview
            </button>
            {hasConversationReview ? (
              <button
                type="button"
                onClick={() => setProgressTab("history")}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: 14,
                  borderRadius: 12,
                  fontFamily: NC.sans,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: `1px solid ${progressTab === "history" ? NC.ink : NC.cardEdge}`,
                  background: progressTab === "history" ? NC.ink : NC.card,
                  color: progressTab === "history" ? NC.paper : NC.ink,
                }}
              >
                History
              </button>
            ) : (
              <div style={{ flex: 1, fontSize: 11, color: NC.inkMute, alignSelf: "center", paddingLeft: 6 }} title="Complete 10 sessions to unlock conversation history.">
                History locks after 10 sessions
              </div>
            )}
          </div>

          {progressTab === "overview" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                <StatCard n={String(totalSessions)} label="Sessions" color={NC.teal} />
                <StatCard n={String(completedScenarios.length)} label="Scenarios" color={NC.sage} />
                <StatCard n={String(earnedBadges.length)} label="Badges" color={NC.butter} />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <H2 style={{ fontSize: 18 }}>Your badges</H2>
                <Body size={12} color={NC.inkMute}>
                  {migrateEarnedBadges(earnedBadges).length} of {BADGES.length}
                </Body>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 18 }}>
                {BADGES.map((b) => {
                  const earned = migrateEarnedBadges(earnedBadges).includes(b.id);
                  const col = badgeAccent(b.icon);
                  return (
                    <BadgeTile key={b.id} icon={NCIcon[b.icon] ? NCIcon[b.icon](22) : NCIcon.leaf(22)} label={b.name} unlocked={earned} color={col} />
                  );
                })}
              </div>

              <H2 style={{ fontSize: 18, marginBottom: 10 }}>Recent practice</H2>
              {completedScenarios.length === 0 ? (
                <Card style={{ padding: 20, textAlign: "center" }}>
                  <Body size={14} color={NC.inkMute}>
                    No scenarios completed yet. Start practising to see your progress here.
                  </Body>
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {completedScenarios.slice(0, 6).map((sid) => {
                    const s = scenarioById(sid);
                    return s ? (
                      <RecentRow key={sid} categoryLabel={s.category} title={s.title} when="Completed" />
                    ) : null;
                  })}
                </div>
              )}
            </>
          ) : (
            <div>
              <Body size={14} color={NC.inkMute} style={{ marginBottom: 14 }}>
                Open a past session to re-read the transcript and coaching feedback.
              </Body>
              {combinedHistoryRows.length === 0 ? (
                <Card style={{ padding: 20, textAlign: "center" }}>
                  <Body size={14} color={NC.inkMute}>
                    No saved sessions yet. Finish a conversation to see it here.
                  </Body>
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {combinedHistoryRows.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: NC.card,
                        borderRadius: 14,
                        padding: "14px 16px",
                        border: `1px solid ${NC.cardEdge}`,
                        boxShadow: NC.shadow,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: NC.sans, fontSize: 15, fontWeight: 600, color: NC.ink }}>{sessionRowTitle(row)}</div>
                        <Body size={12} color={NC.inkMute} style={{ marginTop: 4 }}>
                          {formatSessionWhen(row.created_at)}
                        </Body>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryReview(row);
                          setScreen("history-review");
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 12,
                          border: `1px solid ${NC.cardEdge}`,
                          background: NC.tealSoft,
                          color: NC.ink,
                          fontFamily: NC.sans,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScreenColumn>
      </Paper>
    );
  };

  const renderHistoryReview = () => {
    const row = historyReview;
    if (!row) return null;
    const fb = row.feedback;
    return (
      <Paper style={{ minHeight: "100vh" }}>
        <ScreenColumn style={{ paddingBottom: 32 }}>
          <div style={{ paddingTop: 12, paddingBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                setHistoryReview(null);
                setScreen("progress");
                setProgressTab("history");
              }}
              style={{ background: "none", border: "none", color: NC.teal, fontFamily: NC.sans, fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}
            >
              {NCIcon.back(18)} History
            </button>
          </div>
          <H2 style={{ fontSize: 22, marginBottom: 4 }}>{sessionRowTitle(row)}</H2>
          <Body size={13} color={NC.inkMute} style={{ marginBottom: 16 }}>
            {formatSessionWhen(row.created_at)}
          </Body>

          <H2 style={{ fontSize: 16, marginBottom: 10 }}>Transcript</H2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            {(row.messages || []).map((msg, i) => (
              <Bubble key={i} side={msg.sender === "user" ? "user" : "ai"}>
                <span style={{ fontSize: 11, fontWeight: 700, color: msg.sender === "user" ? NC.paper : NC.inkMute, display: "block", marginBottom: 4, opacity: 0.85 }}>
                  {msg.sender === "user" ? "You" : "Partner"}
                </span>
                {msg.text}
              </Bubble>
            ))}
          </div>

          {fb ? (
            <>
              <H2 style={{ fontSize: 16, marginBottom: 10 }}>Saved feedback</H2>
              <FeedbackCard tone={NC.sageSoft} ink="#5A7155" border={NC.sage} title="Strengths" eyebrow="Saved">
                {(fb.strengths || []).map((s, i) => (
                  <FBPoint key={i}>{s}</FBPoint>
                ))}
              </FeedbackCard>
              {(fb.explore || []).length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <FeedbackCard tone={NC.butterSoft} ink="#8A6A1F" border={NC.butter} title="Things to explore" eyebrow="Notes">
                    {(fb.explore || []).map((s, i) => (
                      <FBPoint key={i}>{s}</FBPoint>
                    ))}
                  </FeedbackCard>
                </div>
              ) : null}
            </>
          ) : null}

          <GhostButton style={{ marginTop: 12 }} onClick={() => startReplayFromSession(row)}>
            Replay with different choices
          </GhostButton>

          <GhostButton
            style={{ marginTop: 8, color: NC.terracotta, borderColor: `${NC.terracotta}55` }}
            onClick={() => deleteSessionRecord(row)}
          >
            Delete this session
          </GhostButton>
        </ScreenColumn>
      </Paper>
    );
  };

  const renderPrepareTomorrow = () => (
    <Paper style={{ minHeight: "100vh" }}>
      <ScreenColumn style={{ paddingBottom: 32 }}>
        <div style={{ paddingTop: 12, paddingBottom: 16 }}>
          <button type="button" onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: NC.teal, cursor: "pointer", fontFamily: NC.sans, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}>
            {NCIcon.back(18)} Back
          </button>
        </div>
        <H1 style={{ fontSize: 26, marginBottom: 8 }}>Prepare for Tomorrow</H1>
        <Body size={14} color={NC.inkSoft} style={{ marginBottom: 20, lineHeight: 1.6 }}>
          Describe something coming up — a meeting, appointment, or social situation. We&apos;ll suggest a few matching practice scenarios and a short coaching tip.
        </Body>
        <label style={{ fontFamily: NC.sans, fontSize: 13, fontWeight: 600, color: NC.ink }}>What&apos;s coming up?</label>
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
            fontFamily: NC.sans,
            fontSize: 15,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${NC.cardEdge}`,
            background: NC.card,
          }}
        />
        <label style={{ fontFamily: NC.sans, fontSize: 13, fontWeight: 600, color: NC.ink }}>Date (optional)</label>
        <input
          type="date"
          value={prepareDraft.eventDate}
          onChange={(e) => setPrepareDraft((d) => ({ ...d, eventDate: e.target.value }))}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 8,
            marginBottom: 18,
            fontFamily: NC.sans,
            fontSize: 15,
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${NC.cardEdge}`,
            background: NC.card,
          }}
        />
        <PrimaryButton kind="ink" disabled={prepareBusy || !prepareDraft.eventTitle.trim()} onClick={() => runPreparePlan()}>
          {prepareBusy ? "Building your plan…" : "Save plan & go home"}
        </PrimaryButton>
        {preparePlan?.headline ? (
          <Card style={{ marginTop: 20, padding: 14, background: NC.tealSoft }}>
            <Body size={13} color={NC.ink}>
              <strong>Current plan:</strong> {preparePlan.headline}
            </Body>
            <button type="button" onClick={() => clearPreparePlan()} style={{ display: "block", marginTop: 10, background: "transparent", border: "none", color: NC.teal, fontSize: 13, cursor: "pointer", padding: 0 }}>
              Clear saved plan
            </button>
          </Card>
        ) : null}
      </ScreenColumn>
    </Paper>
  );

  const renderCustomBuild = () => (
    <Paper style={{ minHeight: "100vh" }}>
      <ScreenColumn style={{ paddingBottom: 32 }}>
        <div style={{ paddingTop: 12, paddingBottom: 16 }}>
          <button
            type="button"
            onClick={() => {
              setScreen("scenarios");
              setGeneratedCustomScenario(null);
            }}
            style={{ background: "none", border: "none", color: NC.teal, cursor: "pointer", fontFamily: NC.sans, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}
          >
            {NCIcon.back(18)} Scenarios
          </button>
        </div>
        <H1 style={{ fontSize: 26, marginBottom: 8 }}>Custom Scenario</H1>
        <Body size={14} color={NC.inkSoft} style={{ marginBottom: 16, lineHeight: 1.6 }}>
          Describe the situation in your own words. We&apos;ll generate a short scenario you can practise immediately and optionally save to reuse later.
        </Body>
        <textarea
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          placeholder="Who is there? What worries you? What do you want to say?"
          rows={5}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: NC.sans,
            fontSize: 15,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${NC.cardEdge}`,
            marginBottom: 12,
            background: NC.card,
          }}
        />
        <PrimaryButton kind="ink" disabled={customBusy || !customDraft.trim()} onClick={() => generateCustomScenario()} style={{ marginBottom: 18 }}>
          {customBusy ? "Generating…" : "Generate scenario"}
        </PrimaryButton>

        {generatedCustomScenario ? (
          <Card style={{ padding: "18px 18px", border: `1px solid ${NC.sage}40` }}>
            <div style={{ marginBottom: 8, color: NC.teal }}>{NCIcon[generatedCustomScenario.icon] ? NCIcon[generatedCustomScenario.icon](28) : NCIcon.bubble(28)}</div>
            <div style={{ fontFamily: NC.serif, fontSize: 18, fontWeight: 600, color: NC.ink }}>{generatedCustomScenario.title}</div>
            <Body size={14} color={NC.inkSoft} style={{ marginTop: 8, lineHeight: 1.55 }}>
              {generatedCustomScenario.description}
            </Body>
            <Body size={13} color={NC.ink} style={{ fontStyle: "italic", marginTop: 10 }}>
              Opens with: &ldquo;{generatedCustomScenario.opener}&rdquo;
            </Body>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              <PrimaryButton kind="ink" onClick={() => startScenario(generatedCustomScenario)}>
                Start this practice chat
              </PrimaryButton>
              <GhostButton onClick={() => saveGeneratedToLibrary()}>Save to my scenarios &amp; browse list</GhostButton>
            </div>
          </Card>
        ) : null}
      </ScreenColumn>
    </Paper>
  );

  const renderSettings = () => (
    <Paper style={{ minHeight: "100vh" }}>
      <ScreenColumn style={{ paddingBottom: 32 }}>
        <TopBar
          left={
            <button type="button" onClick={() => setScreen("home")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: NC.ink }}>
              {NCIcon.back(18)}
            </button>
          }
          center="Settings"
        />
        <div style={{ paddingTop: 8, paddingBottom: 18 }}>
          <H1 style={{ fontSize: 28 }}>
            Make it
            <br />
            yours.
          </H1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <SettingsGroup title="Comfort">
            <SettingsRow label="Give me more time to think" hint="Hides the turn dots, keeps suggestions visible." isFirst>
              <Toggle checked={pacingMode} onChange={(v) => persistPacingMode(v)} />
            </SettingsRow>
            <SettingsRow label="Show social cue hints" hint="Adds a small ‘what just happened?’ under AI replies.">
              <Toggle checked={showHintsInChat} onChange={(v) => persistHintsPreference(v)} />
            </SettingsRow>
            <SettingsRow label="Larger text" hint="Coming soon — increases body text by 2px.">
              <span style={{ fontFamily: NC.mono, fontSize: 10, color: NC.inkMute, textTransform: "uppercase", letterSpacing: "0.1em" }}>soon</span>
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup title="Account">
            <SettingsRow label="Signed in as" hint={authUser?.email || "Guest"} isFirst>
              {authUser?.email ? (
                <span style={{ fontFamily: NC.mono, fontSize: 11, color: NC.sage, textTransform: "uppercase", letterSpacing: "0.1em" }}>active</span>
              ) : (
                <span style={{ fontFamily: NC.mono, fontSize: 11, color: NC.inkMute, textTransform: "uppercase", letterSpacing: "0.1em" }}>guest</span>
              )}
            </SettingsRow>
            <SettingsRow label="Member since" hint={authUser?.created_at ? formatDateShort(authUser.created_at) : "—"} />
          </SettingsGroup>

          <div>
            <Eyebrow style={{ marginBottom: 8 }}>Institution</Eyebrow>
            <Card style={{ padding: 16 }}>
              <Body size={15} color={NC.ink} style={{ fontWeight: 600, marginBottom: 4 }}>
                Admin dashboard (MVP)
              </Body>
              <Body size={12} color={NC.inkMute} style={{ marginBottom: 10 }}>
                Enter your organisation ID to load aggregated anonymised stats.
              </Body>
              <input
                value={adminOrgIdInput}
                onChange={(e) => {
                  setAdminOrgIdInput(e.target.value);
                  setAdminError("");
                }}
                placeholder="Organisation UUID"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: NC.sans,
                  fontSize: 14,
                  borderRadius: 10,
                  border: `1px solid ${NC.cardEdge}`,
                  padding: "10px 12px",
                  marginBottom: 10,
                  background: NC.paper,
                }}
              />
              <PrimaryButton kind="ink" disabled={adminLoading || !adminOrgIdInput.trim()} onClick={loadAdminDashboard} style={{ minHeight: 48, fontSize: 14 }}>
                {adminLoading ? "Loading dashboard…" : "Open admin dashboard"}
              </PrimaryButton>
              {adminError ? (
                <Body size={12} color={NC.terracotta} style={{ marginTop: 8 }}>
                  {adminError}
                </Body>
              ) : null}
            </Card>
          </div>
        </div>
      </ScreenColumn>
    </Paper>
  );

  const renderShareCard = () => (
    <Paper style={{ minHeight: "100vh" }}>
      <ScreenColumn style={{ paddingBottom: 32 }}>
        <div style={{ paddingTop: 12, paddingBottom: 16 }}>
          <button type="button" onClick={() => setScreen("progress")} style={{ background: "none", border: "none", color: NC.teal, cursor: "pointer", fontFamily: NC.sans, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}>
            {NCIcon.back(18)} Progress
          </button>
        </div>
        <H1 style={{ fontSize: 26, marginBottom: 8 }}>Share your progress</H1>
        <Body size={14} color={NC.inkMute} style={{ marginBottom: 12 }}>
          This card contains only progress stats. No conversation text is included.
        </Body>
        {shareCardUrl ? (
          <img src={shareCardUrl} alt="NeuroChat progress card" style={{ width: "100%", borderRadius: NC.rMd, border: `1px solid ${NC.cardEdge}`, boxShadow: NC.shadow }} />
        ) : (
          <Card style={{ padding: 20, textAlign: "center" }}>
            <Body size={14} color={NC.inkMute}>
              No card yet. Generate one from Progress.
            </Body>
          </Card>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <PrimaryButton kind="ink" onClick={generateShareCard}>
            Regenerate card
          </PrimaryButton>
          {shareCardUrl ? (
            <a
              href={shareCardUrl}
              download="neurochat-progress-card.png"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
                padding: "0 22px",
                borderRadius: 16,
                background: "transparent",
                color: NC.ink,
                border: `1.5px solid ${NC.cardEdge}`,
                fontFamily: NC.sans,
                fontSize: 16,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Download PNG
            </a>
          ) : null}
        </div>
      </ScreenColumn>
    </Paper>
  );

  const renderAdminDashboard = () => (
    <Paper style={{ minHeight: "100vh" }}>
      <ScreenColumn style={{ paddingBottom: 32 }}>
        <div style={{ paddingTop: 12, paddingBottom: 16 }}>
          <button type="button" onClick={() => setScreen("settings")} style={{ background: "none", border: "none", color: NC.teal, cursor: "pointer", fontFamily: NC.sans, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}>
            {NCIcon.back(18)} Settings
          </button>
        </div>
        <H1 style={{ fontSize: 24, marginBottom: 8 }}>{adminData?.organisation?.name || "Institution Dashboard"}</H1>
        <Body size={13} color={NC.inkMute} style={{ marginBottom: 14 }}>
          Anonymised aggregate data only. No transcripts or mood data shown.
        </Body>
        {adminData ? (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { label: "Users", value: adminData.totals?.users ?? 0 },
                { label: "Total sessions", value: adminData.totals?.totalSessions ?? 0 },
                { label: "Active (7d)", value: adminData.totals?.activeLast7Days ?? 0 },
              ].map((kpi) => (
                <div key={kpi.label} style={{ flex: "1 1 110px", background: NC.card, border: `1px solid ${NC.cardEdge}`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: NC.serif, fontSize: 24, fontWeight: 600, color: NC.ink }}>{kpi.value}</div>
                  <div style={{ fontFamily: NC.sans, fontSize: 12, color: NC.inkMute }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            <H2 style={{ fontSize: 16, marginBottom: 8 }}>Most popular scenarios</H2>
            <Card style={{ padding: "10px 12px", marginBottom: 14 }}>
              {(adminData.topScenarios || []).length === 0 ? (
                <Body size={13} color={NC.inkMute}>
                  No sessions yet.
                </Body>
              ) : (
                (adminData.topScenarios || []).map((row) => (
                  <div key={row.scenarioId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: NC.ink, padding: "5px 0" }}>
                    <span>{scenarioById(row.scenarioId)?.title || row.scenarioId}</span>
                    <strong>{row.count}</strong>
                  </div>
                ))
              )}
            </Card>

            <H2 style={{ fontSize: 16, marginBottom: 8 }}>User progress snapshot</H2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(adminData.userStats || []).map((u) => (
                <Card key={u.userId} style={{ padding: "10px 12px" }}>
                  <Body size={12} color={NC.inkMute}>
                    {u.role} · {u.userId.slice(0, 8)}…
                  </Body>
                  <Body size={13} color={NC.ink} style={{ marginTop: 4 }}>
                    {u.totalSessions} sessions · {u.completedScenarios} scenarios · {u.badgesEarned} badges
                  </Body>
                  <Body size={11} color={NC.inkMute} style={{ marginTop: 2 }}>
                    Last active: {formatDateShort(u.lastActive) || "—"}
                  </Body>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Body size={14} color={NC.inkMute}>
            No admin data loaded yet.
          </Body>
        )}
      </ScreenColumn>
    </Paper>
  );

  const renderTips = () => {
    const selectedCat = tipsData.find((c) => c.category === selectedTipCategoryKey);
    const tipRowCat = {
      "Starting Conversations": "social",
      "Keeping It Going": "social",
      "Ending Politely": "everyday",
      "Tone & Delivery": "work",
      "Difficult Moments": "difficult",
      "Body Language & Non-Verbal Cues": "relationships",
      "Digital Communication": "work",
      "Self-Advocacy & Boundaries": "selfadvocacy",
      "Advanced Conversation Techniques": "work",
      "Staying Calm Under Pressure": "difficult",
    };
    const totalTips = tipsData.reduce((n, c) => n + (c.tips?.length || 0), 0);
    const collections = tipsData.length;

    return (
      <Paper style={{ minHeight: "100vh" }}>
        <ScreenColumn style={{ paddingBottom: 32 }}>
          <TopBar
            left={
              <button
                type="button"
                onClick={() => (selectedTipCategoryKey !== null ? setSelectedTipCategoryKey(null) : setScreen("home"))}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: NC.ink }}
              >
                {NCIcon.back(18)}
              </button>
            }
            center="Tips library"
          />
          <div style={{ paddingTop: 8, paddingBottom: 18 }}>
            <Eyebrow>
              {totalTips} tips · {collections} collections
            </Eyebrow>
            <H1 style={{ marginTop: 6 }}>
              Quick reads
              <br />
              for the moment.
            </H1>
          </div>

          {selectedTipCategoryKey === null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tipsData.map((cat) => (
                <TipRow
                  key={cat.category}
                  icon={NCIcon[cat.icon] ? NCIcon[cat.icon](20) : NCIcon.bubble(20)}
                  title={cat.category}
                  count={cat.tips.length}
                  catKey={tipRowCat[cat.category] || "social"}
                  onClick={() => setSelectedTipCategoryKey(cat.category)}
                />
              ))}
            </div>
          ) : selectedCat ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ color: NC.teal }}>{NCIcon[selectedCat.icon] ? NCIcon[selectedCat.icon](24) : NCIcon.bubble(24)}</div>
                <H2 style={{ fontSize: 20, margin: 0 }}>{selectedCat.category}</H2>
              </div>
              {selectedCat.tips.map((tip, i) => (
                <Card key={i} style={{ padding: "16px 18px" }}>
                  <Body size={15} color={NC.ink} style={{ fontWeight: 600, marginBottom: 6 }}>
                    {tip.title}
                  </Body>
                  <Body size={14} color={NC.inkSoft} style={{ lineHeight: 1.6 }}>
                    {tip.body}
                  </Body>
                </Card>
              ))}
            </div>
          ) : null}
        </ScreenColumn>
      </Paper>
    );
  };

  const renderHowTo = () => (
    <Paper style={{ minHeight: "100vh" }}>
      <ScreenColumn style={{ paddingBottom: 32 }}>
        <div style={{ paddingTop: 12, paddingBottom: 16 }}>
          <button type="button" onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: NC.teal, cursor: "pointer", fontFamily: NC.sans, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}>
            {NCIcon.back(18)} Back
          </button>
        </div>
        <H1 style={{ fontSize: 26, marginBottom: 16 }}>How NeuroChat Works</H1>

        <Body size={17} color={NC.teal} style={{ fontWeight: 600, marginBottom: 8 }}>
          You can&apos;t get this wrong.
        </Body>
        <Body size={15} color={NC.inkSoft} style={{ marginBottom: 28, lineHeight: 1.7 }}>
          NeuroChat is a safe space to practise conversations before you have them in real life. There&apos;s no scoring, no timer, and no one watching. Just you, practising at your own pace.
        </Body>

        {[
          { step: "1", title: "Pick a scenario", desc: "Choose a situation you'd like to practise — like introducing yourself, making small talk, or handling a tricky conversation." },
          { step: "2", title: "Have a conversation", desc: "The app plays the other person. You type your replies naturally. If you get stuck, tap for a suggested response." },
          { step: "3", title: "Get gentle feedback", desc: "After the conversation, you'll see what went well and one or two things you could try differently. Strengths are always shown first." },
          { step: "4", title: "Learn and grow", desc: "Visit the Tips Library anytime for practical advice. Track your progress and earn badges as you practise." },
        ].map((item) => (
          <div key={item.step} style={{ display: "flex", gap: 16, marginBottom: 22, alignItems: "flex-start" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: NC.tealSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: NC.serif,
                fontSize: 18,
                fontWeight: 600,
                color: NC.teal,
                flexShrink: 0,
              }}
            >
              {item.step}
            </div>
            <div>
              <Body size={16} color={NC.ink} style={{ fontWeight: 600, marginBottom: 4 }}>
                {item.title}
              </Body>
              <Body size={14} color={NC.inkMute} style={{ lineHeight: 1.6 }}>
                {item.desc}
              </Body>
            </div>
          </div>
        ))}

        <Card style={{ marginTop: 16, background: NC.butterSoft, border: `1px solid ${NC.butter}55` }}>
          <Body size={15} color={NC.ink} style={{ fontWeight: 600, marginBottom: 6 }}>
            Remember
          </Body>
          <Body size={14} color={NC.inkSoft} style={{ lineHeight: 1.6 }}>
            This isn&apos;t a test. There are no wrong answers. The goal is simply to practise — and every time you do, you&apos;re building confidence.
          </Body>
        </Card>
      </ScreenColumn>
    </Paper>
  );

  return (
    <div style={{ minHeight: "100vh", background: NC.paper }}>
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
      {toastMessage ? (
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
            background: NC.card,
            border: `1px solid ${NC.cardEdge}`,
            borderRadius: 14,
            padding: "12px 16px",
            boxShadow: NC.shadowLg,
            fontFamily: NC.sans,
            fontSize: 14,
            color: NC.ink,
            zIndex: 9999,
          }}
        >
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
