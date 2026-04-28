import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const CONVERSATION_ENDPOINT = "/api/conversation";
const FEEDBACK_ENDPOINT = "/api/feedback";
const PROGRESS_ENDPOINT = "/api/progress/update";
const SAVE_SESSION_ENDPOINT = "/api/sessions/save";
const STORAGE_KEY = "neurochat_guest_state_v2";

const SCENARIOS = [
  {
    id: "work-intro",
    title: "Introducing Yourself at Work",
    icon: "👋",
    description: "You've just started a new job and a colleague approaches you.",
    opener: "Hi, I don't think we've met before. What's your name?",
    category: "Work",
  },
  {
    id: "job-interview",
    title: "Job Interview",
    icon: "💼",
    description: "You're meeting an interviewer for the first time.",
    opener: "Welcome! Thanks for coming in. So, tell me a bit about yourself.",
    category: "Work",
  },
  {
    id: "small-talk",
    title: "Small Talk at Work",
    icon: "☕",
    description: "A colleague starts chatting by the kettle.",
    opener: "Morning! Did you have a good weekend?",
    category: "Work",
  },
  {
    id: "meeting-new",
    title: "Meeting Someone New",
    icon: "🤝",
    description: "You're at a social event and someone introduces themselves.",
    opener: "Hey! I'm Alex. I think we know some of the same people — how do you know the host?",
    category: "Social",
  },
  {
    id: "asking-help",
    title: "Asking for Help",
    icon: "🙋",
    description: "You need to ask a colleague or teacher for help with something.",
    opener: "Hey, you look like you've got a question. What's up?",
    category: "Everyday",
  },
  {
    id: "handling-conflict",
    title: "Handling Conflict",
    icon: "⚡",
    description: "Someone is upset with you about something. You need to respond calmly.",
    opener: "I'm a bit frustrated because I feel like my message wasn't heard earlier. Can we talk about it?",
    category: "Difficult",
  },
  {
    id: "phone-call",
    title: "Making a Phone Call",
    icon: "📞",
    description: "You need to call to make an appointment or ask a question.",
    opener: "Hello, you're through to the reception desk. How can I help you?",
    category: "Everyday",
  },
  {
    id: "ending-convo",
    title: "Ending a Conversation Politely",
    icon: "👋",
    description: "You want to leave a conversation without being rude.",
    opener: "So yeah, that's basically what happened! Anyway, what are you up to later?",
    category: "Social",
  },
];

const SUGGESTED_REPLIES = {
  "work-intro": [
    "Hi! I'm [name], I just started this week. Nice to meet you!",
    "Hey, I'm [name] — I'm new here. What team are you on?",
    "Hi, nice to meet you! I'm [name]. Still finding my way around!",
  ],
  "job-interview": [
    "Thanks for having me. I'm [name], and I've been working in [field] for [time]...",
    "Well, I'd describe myself as someone who really enjoys [interest] and that's what drew me to this role...",
    "Sure! I've got a background in [area] and I'm really keen to bring that experience here.",
  ],
  "small-talk": [
    "Yeah, it was really nice actually — just had a quiet one. How about you?",
    "Not bad! Didn't do much but it was good to rest. You?",
    "It was good, thanks! Went for a walk and caught up on some reading. Yours?",
  ],
  "meeting-new": [
    "I went to uni with them actually! We've stayed in touch since. How about you?",
    "We work together — they invited me along tonight. This is a great place!",
    "We're neighbours actually! I'm [name], nice to meet you.",
  ],
  "asking-help": [
    "Yeah, I'm a bit stuck with [topic]. Would you mind explaining how [specific thing] works?",
    "I was wondering if you could show me how to do [task]? I've tried but I'm not sure I'm doing it right.",
    "If you've got a minute, could I ask you something about [topic]? No rush if you're busy.",
  ],
  "handling-conflict": [
    "I hear you, and I'm sorry you felt that way. Can you tell me more about what happened from your side?",
    "I didn't realise it came across like that — I'd like to sort it out. What would help?",
    "Thanks for telling me. I think there might have been a misunderstanding — can we go through it?",
  ],
  "phone-call": [
    "Hi, I'm calling to make an appointment please. My name is [name].",
    "Hello, I was wondering if you could help me with [reason for calling]?",
    "Hi there, I need to [book/ask about something]. Is now a good time?",
  ],
  "ending-convo": [
    "Not much planned! Anyway, it's been really nice chatting — I should probably head off though.",
    "I'm not sure yet! Right, I'd better get going, but let's catch up again soon.",
    "Good question! I'll figure it out. Anyway, I'll let you go — take care!",
  ],
};

const TIPS_DATA = [
  {
    category: "Starting Conversations",
    icon: "💬",
    tips: [
      { title: "Use a simple opener", body: "You don't need to be clever. 'Hi, how's it going?' works perfectly." },
      { title: "Comment on something shared", body: "Mention something you both have in common — the weather, the event, the queue you're standing in." },
      { title: "It's okay to say you're nervous", body: "Most people find honesty disarming. 'I'm not great at small talk but I wanted to say hi' is completely fine." },
    ],
  },
  {
    category: "Keeping It Going",
    icon: "🔄",
    tips: [
      { title: "Ask open questions", body: "Instead of 'Did you have a good weekend?' try 'What did you get up to this weekend?' — it gives them more to work with." },
      { title: "Add a little detail", body: "Instead of just 'Fine', try 'Yeah, good thanks — I tried a new café and it was really nice.' It gives the other person something to respond to." },
      { title: "Mirror what they said", body: "If they mention something, ask a follow-up. 'Oh you went hiking? Where did you go?' shows you're listening." },
    ],
  },
  {
    category: "Ending Politely",
    icon: "👋",
    tips: [
      { title: "Signal before you go", body: "Say something like 'Right, I should probably...' or 'Anyway, I'll let you get on' before wrapping up." },
      { title: "End with warmth", body: "A small closer like 'It was really nice chatting' or 'Let's do this again' leaves a good impression." },
      { title: "You don't need a reason", body: "You don't have to explain why you're leaving. A simple 'I'd better head off' is enough." },
    ],
  },
  {
    category: "Tone & Delivery",
    icon: "🎯",
    tips: [
      { title: "Match their energy", body: "If someone's casual, be casual. If they're more formal, follow their lead. You don't have to guess — just mirror them slightly." },
      { title: "Pauses are okay", body: "Silence feels longer to you than it does to them. A brief pause before responding is totally normal." },
      { title: "Check your volume", body: "If you're unsure, slightly quieter is usually better than too loud. You can always ask 'Can you hear me alright?'" },
    ],
  },
  {
    category: "Difficult Moments",
    icon: "⚡",
    tips: [
      { title: "It's okay to not know what to say", body: "Try: 'I'm not sure what to say right now, but I hear you.' Honesty is always better than forcing a response." },
      { title: "Take a breath first", body: "If you feel overwhelmed, pause. One slow breath before speaking can completely change your response." },
      { title: "You can ask for time", body: "Saying 'Can I think about that and get back to you?' is a completely valid response." },
    ],
  },
];

const BADGES = [
  { id: "first-chat", icon: "✅", name: "First Conversation", desc: "Completed your first practice" },
  { id: "three-done", icon: "🌟", name: "3 Scenarios Done", desc: "Practised 3 different scenarios" },
  { id: "five-done", icon: "🏆", name: "5 Scenarios Done", desc: "Practised 5 different scenarios" },
  { id: "listener", icon: "👂", name: "Good Listener", desc: "Added detail in your responses" },
  { id: "followup", icon: "🗨️", name: "Asked a Follow-Up", desc: "Asked a question back in conversation" },
  { id: "all-cats", icon: "🎯", name: "Explorer", desc: "Tried scenarios from every category" },
];

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
  const [selectedTipCategory, setSelectedTipCategory] = useState(null);
  const [mood, setMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [hasChosenGuest, setHasChosenGuest] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [sessionSaving, setSessionSaving] = useState(false);
  const chatEndRef = useRef(null);
  const maxTurns = 4;

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
      setEarnedBadges(Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : []);
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
      ...overrides,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const syncProgressToSupabase = async ({ updatedCompleted, updatedBadges, updatedMood, updatedMoodHistory, onboarded }) => {
    if (!authUser?.id) return;
    try {
      await fetch(PROGRESS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser.id,
          completedScenarios: updatedCompleted,
          earnedBadges: updatedBadges,
          totalSessions: updatedCompleted.length,
          mood: updatedMood,
          moodHistory: updatedMoodHistory,
          hasOnboarded: onboarded,
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
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [completedScenarios, earnedBadges, mood, moodHistory, hasOnboarded, hasChosenGuest, isGuest]);

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
        supabase.from("profiles").select("has_onboarded,mood_history,last_mood").eq("id", sessionUser.id).maybeSingle(),
        supabase.from("progress").select("completed_scenarios,earned_badges").eq("user_id", sessionUser.id).maybeSingle(),
      ]);

      const profile = profileResult.data;
      const progress = progressResult.data;

      setHasOnboarded(Boolean(profile?.has_onboarded));
      setMood(profile?.last_mood ?? null);
      setMoodHistory(Array.isArray(profile?.mood_history) ? profile.mood_history : []);
      setCompletedScenarios(Array.isArray(progress?.completed_scenarios) ? progress.completed_scenarios : []);
      setEarnedBadges(Array.isArray(progress?.earned_badges) ? progress.earned_badges : []);
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

  const startScenario = (scenario) => {
    setSelectedScenario(scenario);
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
        const fallbackExamples = (SUGGESTED_REPLIES[selectedScenario?.id] || []).slice(0, 2);
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
        setCompletedScenarios(updatedCompleted);
        const earnedFromSignals = [];
        if (userMsgs.length >= 1) earnedFromSignals.push("first-chat");
        if (hasQuestion) earnedFromSignals.push("followup");
        if (hasDetail) earnedFromSignals.push("listener");
        const newBadges = [...new Set([...earnedBadges, ...earnedFromSignals])];
        const completedCount = updatedCompleted.length;
        if (completedCount >= 3 && !newBadges.includes("three-done")) newBadges.push("three-done");
        if (completedCount >= 5 && !newBadges.includes("five-done")) newBadges.push("five-done");
        const cats = new Set(SCENARIOS.filter((s) => updatedCompleted.includes(s.id)).map((s) => s.category));
        if (cats.size >= 4 && !newBadges.includes("all-cats")) newBadges.push("all-cats");
        setEarnedBadges(newBadges);

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
    setCompletedScenarios([]);
    setEarnedBadges([]);
    setMood(null);
    setMoodHistory([]);
    setHasOnboarded(false);
    setScreen("auth-choice");
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
            {authSending ? "Sending…" : "Sign up with email"}
          </button>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          <button
            onClick={() => setScreen("scenarios")}
            style={{ ...baseBtn, background: colors.primary, color: "#fff", padding: "18px 24px", fontSize: 17, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 22 }}>💬</span> Practise a Conversation
          </button>
          <button
            onClick={() => setScreen("progress")}
            style={{ ...baseBtn, background: colors.accentLight, color: colors.text, padding: "16px 24px", fontSize: 16, border: `2px solid ${colors.accent}`, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 20 }}>📊</span> See My Progress
          </button>
          <button
            onClick={() => { setSelectedTipCategory(null); setScreen("tips"); }}
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
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, margin: "0 0 24px 0" }}>Pick a situation you'd like to practise. There's no wrong choice.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SCENARIOS.map((s) => (
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
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, color: colors.text }}>{s.title}</div>
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
    const suggestions = SUGGESTED_REPLIES[selectedScenario?.id] || [];
    const currentSuggestion = suggestions[Math.min(turnCount, suggestions.length - 1)];

    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column", padding: "0 20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}>
            <button onClick={() => setScreen("scenarios")} style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}>← Back</button>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.textMuted, fontWeight: 600 }}>
              {turnCount}/{maxTurns} turns
            </span>
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.primary, background: colors.primaryLight, borderRadius: 10, padding: "8px 14px", margin: "12px 0", textAlign: "center", fontWeight: 600 }}>
            {selectedScenario?.icon} {selectedScenario?.title}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
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
            {!showSuggestion && (
              <button
                onClick={() => setShowSuggestion(true)}
                style={{ ...baseBtn, background: "transparent", color: colors.primary, fontSize: 13, padding: "6px 0", marginBottom: 8, fontWeight: 600 }}
              >
                💡 Feeling stuck? Tap for a suggestion
              </button>
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
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, margin: "0 0 24px 0" }}>Every conversation you practise is a step forward.</p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, background: colors.primaryLight, borderRadius: 16, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 32, fontWeight: 800, color: colors.primary }}>{completedScenarios.length}</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: colors.primaryDark, marginTop: 2 }}>Practised</div>
          </div>
          <div style={{ flex: 1, background: colors.accentLight, borderRadius: 16, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 32, fontWeight: 800, color: colors.amber }}>{earnedBadges.length}</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#975A16", marginTop: 2 }}>Badges</div>
          </div>
        </div>

        {/* Badges */}
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: colors.primaryDark, marginBottom: 14 }}>Badges</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {BADGES.map((b) => {
            const earned = earnedBadges.includes(b.id);
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

        {/* Completed scenarios */}
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
      </div>
    </div>
  );

  const renderTips = () => (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 20, paddingBottom: 20 }}>
          <button
            onClick={() => selectedTipCategory !== null ? setSelectedTipCategory(null) : setScreen("home")}
            style={{ ...baseBtn, background: "transparent", color: colors.primary, padding: "8px 0", fontSize: 15 }}
          >
            ← {selectedTipCategory !== null ? "Categories" : "Back"}
          </button>
        </div>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: colors.primaryDark, margin: "0 0 4px 0" }}>Tips Library</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, margin: "0 0 24px 0" }}>Quick, practical advice you can use anytime.</p>

        {selectedTipCategory === null ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TIPS_DATA.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedTipCategory(i)}
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
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, color: colors.primaryDark, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 10 }}>
              <span>{TIPS_DATA[selectedTipCategory].icon}</span>
              {TIPS_DATA[selectedTipCategory].category}
            </h3>
            {TIPS_DATA[selectedTipCategory].tips.map((tip, i) => (
              <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: colors.shadow }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 6 }}>{tip.title}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>{tip.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

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
      {screen === "tips" && renderTips()}
      {screen === "howto" && renderHowTo()}
    </div>
  );
}
