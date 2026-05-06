/**
 * Base tips: 8 categories × 6 tips = 48.
 * Unlockable sets: Advanced (5) + Calm (3) → 56 tips total when fully unlocked.
 */

const BASE_TIPS = [
  {
    category: "Starting Conversations",
    icon: "bubble",
    tips: [
      {
        title: "Open with something tiny",
        body: "You don't need a clever opener. Example: 'Hi — mind if I ask what you're reading?' keeps it light.",
      },
      {
        title: "Name one shared detail",
        body: "Point at something simple you share — same queue, same talk, same weather. Example: 'Wild queue — have you been waiting long?'",
      },
      {
        title: "Permission-seeking reduces pressure",
        body: "Try 'Quick question…' or 'Small thing — is now okay?' Example: 'Quick question — do you know where registration is?'",
      },
      {
        title: "Honesty beats performance",
        body: "If you're nervous, that's okay to say briefly. Example: 'I'm not great at small talk — hi though!'",
      },
      {
        title: "One observation + one question",
        body: "Pattern: notice something neutral, then ask something easy. Example: 'Nice jacket — did you get it locally?'",
      },
      {
        title: "Don't rush your opener",
        body: "A half-second pause reads as thoughtful, not rude. Example: smile, breathe, then speak.",
      },
    ],
  },
  {
    category: "Keeping It Going",
    icon: "bubbles",
    tips: [
      {
        title: "Swap yes/no for open prompts",
        body: "Instead of 'Was it good?', try 'What was the best bit?' Example: 'How did you find the event?'",
      },
      {
        title: "Add one concrete detail",
        body: "Give them something to bounce off. Example: 'Busy week — I mainly slept and reset.'",
      },
      {
        title: "Reflect back in one phrase",
        body: "Shows listening without interrogating. Example: 'Sounds exhausting — was it mostly meetings?'",
      },
      {
        title: "Gentle curiosity beats cleverness",
        body: "Ask what surprised them or what they'd repeat. Example: 'Would you go again?'",
      },
      {
        title: "Bridge topics smoothly",
        body: "Use 'That reminds me…' lightly. Example: 'That reminds me — have you tried the café downstairs?'",
      },
      {
        title: "Pauses are allowed",
        body: "Silence feels worse inside your head than outside. Example: nod, then respond — it's normal.",
      },
    ],
  },
  {
    category: "Ending Politely",
    icon: "hand",
    tips: [
      {
        title: "Signal early you're winding down",
        body: "Try 'Right…' or 'Anyway…' Example: 'Anyway — I've got to get back, but it was nice chatting.'",
      },
      {
        title: "Compliment the conversation",
        body: "Example: 'Really nice talking — let's do this again sometime.'",
      },
      {
        title: "No justification needed",
        body: "You don't owe a full excuse. Example: 'I'd better head off — take care!'",
      },
      {
        title: "Offer a soft future hook",
        body: "Low pressure. Example: 'Drop me a message if you're ever free for coffee.'",
      },
      {
        title: "Escape hatch line",
        body: "Example: 'I'm going to grab water — chat later?'",
      },
      {
        title: "Exit warmly even if awkward",
        body: "A small nod + smile counts. Example: 'Thanks for your time!'",
      },
    ],
  },
  {
    category: "Tone & Delivery",
    icon: "spark",
    tips: [
      {
        title: "Match pace and volume loosely",
        body: "If they're calm, mirror calm. Example: speak slightly softer if they speak softly.",
      },
      {
        title: "Separate facts from feelings",
        body: "Use 'I noticed…' instead of 'You always…'. Example: 'I noticed I've been quiet in meetings — I'd like to contribute more.'",
      },
      {
        title: "Slow down your last sentence",
        body: "Ending slower reads confident and kind. Example: lower pace on 'Does that work for you?'",
      },
      {
        title: "Ask permission before heavy topics",
        body: "Example: 'Can I share something a bit tricky?'",
      },
      {
        title: "Replace sarcasm with clarity when stakes are high",
        body: "Clear beats clever under stress. Example: 'I'm worried about the deadline — can we adjust?'",
      },
      {
        title: "Short sentences read clearer",
        body: "Especially when anxious. Example: break long paragraphs into two sentences.",
      },
    ],
  },
  {
    category: "Difficult Moments",
    icon: "shield",
    tips: [
      {
        title: "Name your emotion without accusing",
        body: "Example: 'I'm feeling rushed — can we slow down?'",
      },
      {
        title: "Repair beats perfection",
        body: "If you stumble: 'Sorry — let me say that more clearly.'",
      },
      {
        title: "Ask for a pause",
        body: "Example: 'Can we take ten seconds? I want to respond properly.'",
      },
      {
        title: "Don't debate tone mid-conflict",
        body: "First stabilise: 'I want to solve this — can we stick to what happened?'",
      },
      {
        title: "Summarise their view before yours",
        body: "Example: 'If I'm hearing you right, you're frustrated because…'",
      },
      {
        title: "Offer two options when stuck",
        body: "Example: 'Would it help to reschedule, or shorten the agenda?'",
      },
    ],
  },
  {
    category: "Body Language & Non-Verbal Cues",
    icon: "heart",
    tips: [
      {
        title: "Orient your shoulders slightly toward them",
        body: "Reads engaged without staring. Example: angle body toward someone when listening.",
      },
      {
        title: "Hands visible when neutral matters",
        body: "Relaxed hands near midline reads calm in tense chats.",
      },
      {
        title: "Break eye contact naturally",
        body: "Brief looks away every few seconds is normal — not rude.",
      },
      {
        title: "Nods replace interruptions",
        body: "Small nods show listening while they finish.",
      },
      {
        title: "Give personal space first",
        body: "Half a step back can reduce mutual tension.",
      },
      {
        title: "Don't mirror tension aggressively",
        body: "If they lean in sharply, soften your posture slightly — not performatively.",
      },
    ],
  },
  {
    category: "Digital Communication",
    icon: "question",
    tips: [
      {
        title: "Lead with purpose in emails",
        body: "First line: what you need + deadline. Example: 'Quick ask — can you approve X by Tuesday?'",
      },
      {
        title: "Assume generous interpretation in texts",
        body: "If ambiguous, ask once calmly before catastrophising.",
      },
      {
        title: "Separate threads from chats",
        body: "Complex topics deserve calls — avoid long fights over SMS.",
      },
      {
        title: "Use labels when forwarding context",
        body: "Example: 'Summary — Next steps — Question:' keeps replies faster.",
      },
      {
        title: "Emoji sparingly for warmth",
        body: "One smile can soften — ten feels chaotic.",
      },
      {
        title: "Delay sends when heated",
        body: "Draft first — send after a breath.",
      },
    ],
  },
  {
    category: "Self-Advocacy & Boundaries",
    icon: "shield",
    tips: [
      {
        title: "Script one sentence requests",
        body: "Example: 'I need captions enabled so I can follow — can we switch that on?'",
      },
      {
        title: "Boundary + alternative",
        body: "Example: 'I can't tonight — Thursday works?'",
      },
      {
        title: "Ask what paperwork exists",
        body: "Example: 'Is there a formal accommodations route I should follow?'",
      },
      {
        title: "Bring bullet facts to medical chats",
        body: "Example: 'Started X weeks ago — affects sleep and focus.'",
      },
      {
        title: "Repeat calmly once",
        body: "If brushed off: 'I still need clarity on X — what's possible?'",
      },
      {
        title: "Thank someone who adjusts",
        body: "Reinforces collaboration — humans respond well.",
      },
    ],
  },
];

const ADVANCED_CONVERSATION = {
  category: "Advanced Conversation Techniques",
  icon: "trophy",
  unlockId: "tips-advanced-convo",
  tips: [
    {
      title: "Spot-check assumptions",
      body: "Ask 'What would convince you either way?' — lowers defensive loops.",
    },
    {
      title: "Use tenths instead of absolutes",
      body: "Example: 'I'm about 70% sure…' invites calibration.",
    },
    {
      title: "Thread themes across turns",
      body: "Reference earlier detail — shows continuity.",
    },
    {
      title: "Invite correction early",
      body: "Example: 'Tell me if I've misunderstood.'",
    },
    {
      title: "Close loops explicitly",
      body: "Example: 'So next step is X — sound right?'",
    },
  ],
};

const CALM_UNDER_PRESSURE = {
  category: "Staying Calm Under Pressure",
  icon: "cloud",
  unlockId: "tips-calm-pressure",
  tips: [
    {
      title: "Name one bodily anchor",
      body: "Feet on floor / shoulders down — tiny grounding during rush.",
    },
    {
      title: "Two sentences maximum first reply",
      body: "Prevents spiralling — expand after breathing.",
    },
    {
      title: "Ask for the outcome",
      body: "Example: 'What would make this feel resolved for you?'",
    },
  ],
};

/** @param {string[]} unlockedContent */
export function getTipsCategories(unlockedContent = []) {
  const unlocked = new Set(unlockedContent || []);
  const out = [...BASE_TIPS];
  if (unlocked.has(ADVANCED_CONVERSATION.unlockId)) {
    const { unlockId: _, ...rest } = ADVANCED_CONVERSATION;
    out.push(rest);
  }
  if (unlocked.has(CALM_UNDER_PRESSURE.unlockId)) {
    const { unlockId: _, ...rest } = CALM_UNDER_PRESSURE;
    out.push(rest);
  }
  return out;
}
