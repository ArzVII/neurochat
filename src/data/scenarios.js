/** @typedef {"easy" | "medium" | "hard"} ScenarioDifficulty */

export const DIFFICULTY_LABEL = {
  easy: "Quick & easy",
  medium: "Takes a bit more thought",
  hard: "Challenging",
};

/** Full scenario list (29 core + 3 bonus). Bonus rows use requiresUnlock. */
export const SCENARIOS = [
  // Work (6)
  {
    id: "work-intro",
    title: "Introducing Yourself at Work",
    icon: "hand",
    description: "You've just started a new job and a colleague approaches you.",
    opener: "Hi, I don't think we've met before. What's your name?",
    category: "Work",
    difficulty: "easy",
    partnerBrief:
      "You are a friendly colleague welcoming someone new. Keep the tone warm and low-pressure.",
  },
  {
    id: "job-interview",
    title: "Job Interview",
    icon: "briefcase",
    description: "You're meeting an interviewer for the first time.",
    opener: "Welcome! Thanks for coming in. So, tell me a bit about yourself.",
    category: "Work",
    difficulty: "medium",
    partnerBrief:
      "You are a professional interviewer: structured but fair, listening carefully without being harsh.",
  },
  {
    id: "small-talk",
    title: "Small Talk at Work",
    icon: "cup",
    description: "A colleague starts chatting by the kettle.",
    opener: "Morning! Did you have a good weekend?",
    category: "Work",
    difficulty: "easy",
    partnerBrief:
      "You are a relaxed coworker making casual chat — brief, friendly, not intrusive.",
  },
  {
    id: "boss-help",
    title: "Asking Your Boss for Help",
    icon: "hand",
    description: "You need clarity or support on a task and want to ask without seeming incapable.",
    opener: "Hey — got a minute? I'm a bit stuck on something and wanted your take.",
    category: "Work",
    difficulty: "medium",
    partnerBrief:
      "You are a supportive manager who prefers clarity and reasonable timelines — patient, not dismissive.",
  },
  {
    id: "criticism-manager",
    title: "Receiving Criticism from a Manager",
    icon: "shield",
    description: "Your manager brings up something they want you to improve.",
    opener: "I wanted to chat through one thing — last week's report missed a couple of details we talked about.",
    category: "Work",
    difficulty: "hard",
    partnerBrief:
      "You are a manager giving constructive criticism — direct but respectful, open to their perspective.",
  },
  {
    id: "meeting-speakup",
    title: "Speaking Up in a Meeting",
    icon: "spark",
    description: "You want to share an idea in a room full of colleagues.",
    opener: "Right, thanks everyone — does anyone have thoughts on the timeline before we wrap?",
    category: "Work",
    difficulty: "medium",
    partnerBrief:
      "You facilitate the meeting — invite quieter voices neutrally without putting anyone on the spot.",
  },
  // Social (5)
  {
    id: "meeting-new",
    title: "Meeting Someone New",
    icon: "hand",
    description: "You're at a social event and someone introduces themselves.",
    opener: "Hey! I'm Alex. I think we know some of the same people — how do you know the host?",
    category: "Social",
    difficulty: "easy",
    partnerBrief:
      "You are an approachable stranger at a social event — curious and friendly.",
  },
  {
    id: "ending-convo",
    title: "Ending a Conversation Politely",
    icon: "hand",
    description: "You want to leave a conversation without being rude.",
    opener: "So yeah, that's basically what happened! Anyway, what are you up to later?",
    category: "Social",
    difficulty: "easy",
    partnerBrief:
      "You are chatty but pick up cues — allow natural exits without guilt-tripping.",
  },
  {
    id: "group-convo",
    title: "Joining a Group Conversation",
    icon: "bubbles",
    description: "You approach a circle already talking and want to participate comfortably.",
    opener: "…and that's why we ended up taking the longer route. Sorry — were we blocking the snacks?",
    category: "Social",
    difficulty: "medium",
    partnerBrief:
      "You are people mid-conversation — mildly distracted but not hostile to someone joining.",
  },
  {
    id: "plans-friend",
    title: "Making Plans with a Friend",
    icon: "calendar",
    description: "You want to suggest hanging out without pressure.",
    opener: "I've been meaning to actually catch up properly — when are you usually free-ish?",
    category: "Social",
    difficulty: "easy",
    partnerBrief:
      "You are a friend juggling schedules — flexible but honest about what works.",
  },
  {
    id: "reconnect-longtime",
    title: "Reconnecting After a Long Time",
    icon: "spark",
    description: "You bump into someone you haven't spoken to in years.",
    opener: "Oh wow — is that you? It's been forever. How have you been?",
    category: "Social",
    difficulty: "medium",
    partnerBrief:
      "You are someone pleasantly surprised to reconnect — warm, no guilt-tripping about silence.",
  },
  // Everyday (5)
  {
    id: "asking-help",
    title: "Asking for Help",
    icon: "hand",
    description: "You need to ask a colleague or teacher for help with something.",
    opener: "Hey, you look like you've got a question. What's up?",
    category: "Everyday",
    difficulty: "easy",
    partnerBrief:
      "You are helpful and patient — assume good intent from someone asking for support.",
  },
  {
    id: "phone-call",
    title: "Making a Phone Call",
    icon: "question",
    description: "You need to call to make an appointment or ask a question.",
    opener: "Hello, you're through to the reception desk. How can I help you?",
    category: "Everyday",
    difficulty: "easy",
    partnerBrief:
      "You are a neutral receptionist — efficient and polite.",
  },
  {
    id: "restaurant-order",
    title: "Ordering at a Restaurant",
    icon: "cup",
    description: "You're ordering food with simple preferences or allergies.",
    opener: "Hi folks — what can I get started for you tonight?",
    category: "Everyday",
    difficulty: "easy",
    partnerBrief:
      "You are a calm server — busy but kind when handling dietary questions.",
  },
  {
    id: "shop-return",
    title: "Returning an Item to a Shop",
    icon: "briefcase",
    description: "You need to return something that wasn't right.",
    opener: "Hi there — how can I help today?",
    category: "Everyday",
    difficulty: "medium",
    partnerBrief:
      "You are retail staff following policy — reasonable and non-judgmental.",
  },
  {
    id: "neighbour-chat",
    title: "Small Talk with a Neighbour",
    icon: "sun",
    description: "You cross paths outside and want a low-key chat.",
    opener: "Morning — freezing today, isn't it? Are you off somewhere nice?",
    category: "Everyday",
    difficulty: "easy",
    partnerBrief:
      "You are a neighbour keeping things light — brief and friendly.",
  },
  // Difficult (5)
  {
    id: "handling-conflict",
    title: "Handling Conflict",
    icon: "shield",
    description: "Someone is upset with you about something. You need to respond calmly.",
    opener:
      "I'm a bit frustrated because I feel like my message wasn't heard earlier. Can we talk about it?",
    category: "Difficult",
    difficulty: "hard",
    partnerBrief:
      "You are upset but not abusive — emotional yet hoping for repair; respond to repair attempts.",
  },
  {
    id: "say-no-friend",
    title: "Saying No to a Friend",
    icon: "shield",
    description: "You need to decline an invite without hurting the friendship.",
    opener: "So we're thinking Saturday night — you'd be up for it, right?",
    category: "Difficult",
    difficulty: "medium",
    partnerBrief:
      "You are a hopeful friend — not manipulative, but a bit disappointed when plans shift.",
  },
  {
    id: "rude-person",
    title: "Dealing with Someone Being Rude",
    icon: "shield",
    description: "Someone speaks dismissively to you in public.",
    opener: "Can you hurry up? Some of us actually have places to be.",
    category: "Difficult",
    difficulty: "hard",
    partnerBrief:
      "You are mildly rude and impatient — snippy but not slurs, threats, or harassment.",
  },
  {
    id: "apologise-wrong",
    title: "Apologising When You're Wrong",
    icon: "heart",
    description: "You need to own a mistake sincerely.",
    opener: "Hey — I heard what happened. I'm really not okay with how that went down.",
    category: "Difficult",
    difficulty: "medium",
    partnerBrief:
      "You are hurt but listening — willing to hear a genuine apology without mocking.",
  },
  {
    id: "disagree-respect",
    title: "Disagreeing Respectfully",
    icon: "shield",
    description: "You disagree with someone's take and want to stay respectful.",
    opener: "Honestly I think we're seeing this really differently — but I'm curious what I'm missing.",
    category: "Difficult",
    difficulty: "medium",
    partnerBrief:
      "You disagree firmly but calmly — no insults; invite dialogue.",
  },
  // Relationships (4)
  {
    id: "ask-date",
    title: "Asking Someone on a Date",
    icon: "heart",
    description: "You want to ask someone out clearly but kindly.",
    opener: "Hey — random question. Would you want to grab coffee sometime, just us?",
    category: "Relationships",
    difficulty: "hard",
    partnerBrief:
      "You are either gently interested or kindly unsure — either way honest and kind.",
  },
  {
    id: "partner-difficult",
    title: "Difficult Conversation with a Partner",
    icon: "bubble",
    description: "You need to raise something sensitive with your partner.",
    opener: "I've been carrying something around and I think we should talk about it properly.",
    category: "Relationships",
    difficulty: "hard",
    partnerBrief:
      "You are their partner — emotionally invested but not cruel; want mutual understanding.",
  },
  {
    id: "boundary-friend",
    title: "Setting a Boundary with a Friend",
    icon: "shield",
    description: "You need to set a limit without ending the friendship.",
    opener: "You're okay with X, right? It's only an hour or two.",
    category: "Relationships",
    difficulty: "medium",
    partnerBrief:
      "You are a friend testing boundaries lightly — not malicious; can accept 'no' if explained kindly.",
  },
  {
    id: "hard-truth-friend",
    title: "Telling a Friend Something They Don't Want to Hear",
    icon: "spark",
    description: "You need to say something uncomfortable but important.",
    opener: "Okay… I'm going to say this because I care about you, not because I want drama.",
    category: "Relationships",
    difficulty: "hard",
    partnerBrief:
      "You are defensive at first but capable of listening — avoid cruelty.",
  },
  // Self-Advocacy (4)
  {
    id: "accommodations",
    title: "Asking for Accommodations at Work/School",
    icon: "briefcase",
    description: "You need adjustments so you can work or learn effectively.",
    opener: "Thanks for meeting — what did you want to run through today?",
    category: "Self-Advocacy",
    difficulty: "medium",
    partnerBrief:
      "You are a HR lead or teacher — procedural but willing to consider reasonable requests.",
  },
  {
    id: "doctor-needs",
    title: "Explaining Your Needs to a Doctor",
    icon: "question",
    description: "You want to describe symptoms and concerns clearly in limited time.",
    opener: "Right — we've got ten minutes. What's brought you in today?",
    category: "Self-Advocacy",
    difficulty: "medium",
    partnerBrief:
      "You are a GP — brisk but professional; invite specifics without brushing them off.",
  },
  {
    id: "stand-up-self",
    title: "Standing Up for Yourself Without Aggression",
    icon: "shield",
    description: "Someone pushes past you in tone — you want to respond firmly but calmly.",
    opener: "Look — I'm not trying to argue, but that tone isn't okay.",
    category: "Self-Advocacy",
    difficulty: "hard",
    partnerBrief:
      "You are slightly defensive — can dial down if met with calm firmness.",
  },
  {
    id: "negotiate-deadline",
    title: "Negotiating (Price, Deadline, etc.)",
    icon: "hand",
    description: "You negotiate for more time or a fairer outcome.",
    opener: "The earliest we can do is Friday — that's already stretching things.",
    category: "Self-Advocacy",
    difficulty: "medium",
    partnerBrief:
      "You represent the other side — practical constraints; willing to hear compromise.",
  },
  // Bonus pack (unlock after 3 scenarios)
  {
    id: "bonus-transport",
    title: "Talking to a Stranger on Public Transport",
    icon: "calendar",
    description: "You're seated next to someone — brief, optional chat.",
    opener: "Sorry — do you know if this one stops at [station]? My phone's being weird.",
    category: "Bonus",
    difficulty: "easy",
    requiresUnlock: "bonus-pack-1",
    partnerBrief:
      "You are a neutral stranger — fine with a quick polite exchange or quiet.",
  },
  {
    id: "bonus-compliment",
    title: "Complimenting Someone",
    icon: "spark",
    description: "You want to give a genuine compliment without awkwardness.",
    opener: "Hey — sorry to bother you, I just wanted to say your presentation earlier was really clear.",
    category: "Bonus",
    difficulty: "easy",
    requiresUnlock: "bonus-pack-1",
    partnerBrief:
      "You are pleasantly surprised — respond graciously without pressure.",
  },
  {
    id: "bonus-directions",
    title: "Asking for Directions",
    icon: "question",
    description: "You're a bit lost and need quick help.",
    opener: "Excuse me — do you know where [place] is from here? I'm hopeless with maps.",
    category: "Bonus",
    difficulty: "easy",
    requiresUnlock: "bonus-pack-1",
    partnerBrief:
      "You are a passer-by — helpful and brief.",
  },
];

export const SUGGESTED_REPLIES = {
  "work-intro": [
    "Hi! I'm [name], I just started this week. Nice to meet you!",
    "Hey — I'm [name]. Still finding my way around!",
    "Hi, nice to meet you! I'm on [team] — how long have you been here?",
  ],
  "job-interview": [
    "Thanks for having me. I'm [name], and I've been working in [field] for [time]...",
    "I'd describe myself as someone who enjoys [strength] — that's what drew me here.",
    "Sure — I've got a background in [area], and I'm keen to bring that experience here.",
  ],
  "small-talk": [
    "Yeah, quiet weekend actually — nice rest. How about you?",
    "Not bad — caught up on sleep mostly. Yours?",
    "Pretty good — went for a walk on Saturday. Did you get up to much?",
  ],
  "boss-help": [
    "I've hit a blocker on [task]. Could you point me to who owns [part], or what you'd prioritise first?",
    "I want to do this properly — would [timeline] work if I confirm X by Wednesday?",
    "I'm unsure I'm interpreting the brief right — could we sanity-check the expectations?",
  ],
  "criticism-manager": [
    "Thanks for telling me — I didn't realise that. What would 'good' look like next time?",
    "I appreciate you saying it directly. I'll fix [specific thing] and send an updated version.",
    "I'm sorry that slipped — can you flag one example so I can match your standard?",
  ],
  "meeting-speakup": [
    "I had one thought — could we extend the timeline by a few days so QA isn't squeezed?",
    "Smaller point — would it help if we assigned an owner for each deliverable?",
    "Happy to take notes if that's useful — otherwise I'll stay quiet.",
  ],
  "meeting-new": [
    "I know them through [connection]. How did you end up here?",
    "We used to study together — small world! What do you do nowadays?",
    "I'm [name] — first time here. Who else do you know around?",
  ],
  "ending-convo": [
    "Good question — I'll figure it out. Nice chatting — I'd better head off though!",
    "Not sure yet! Anyway I've got to run — let's catch up soon.",
    "I've got to jump to something — great talking to you!",
  ],
  "group-convo": [
    "Sorry to interrupt — mind if I squeeze in? Happy to grab snacks after.",
    "Hope I'm not cutting in — that reminded me of something similar…",
    "Can I join you folks here for a minute? Only if it's not awkward!",
  ],
  "plans-friend": [
    "I'd love that — I'm better weekdays after 6 if that works?",
    "Yeah — maybe a coffee Saturday morning? Low-key.",
    "I'm pretty flexible next week — want to pick a day that suits you?",
  ],
  "reconnect-longtime": [
    "I'm good thanks — work's been busy but okay. What about you?",
    "Honestly mixed — but mostly okay. Where are you living now?",
    "It's wild seeing you — remember when we [memory]? That feels ages ago.",
  ],
  "asking-help": [
    "Yeah — I'm stuck on [topic]. Could you walk me through [specific step]?",
    "If you've got five minutes, could you show me where I'm going wrong?",
    "No rush — when you're free, could you point me to the right resource?",
  ],
  "phone-call": [
    "Hi — I'd like to book an appointment please. My name is [name].",
    "Hello, I'm calling about [reason]. Is now okay?",
    "Hi — could you tell me what slots you have next week?",
  ],
  "restaurant-order": [
    "Could I get [item], but without [ingredient] please? Allergy.",
    "I'll go for [meal] and tap water — thanks.",
    "What's popular here? I'm vegetarian.",
  ],
  "shop-return": [
    "Hi — I'd like to return this — it didn't fit. I've got the receipt.",
    "Is it okay to swap this for store credit if you can't refund?",
    "It stopped working after two days — I'd like a replacement if possible.",
  ],
  "neighbour-chat": [
    "Freezing! Just errands — nothing exciting. You?",
    "Yeah brutal wind — I'm heading to the shops and back.",
    "Pretty quiet weekend — hope yours was alright!",
  ],
  "handling-conflict": [
    "I'm sorry you felt unheard — walk me through what happened from your side?",
    "Thanks for telling me. I might've misunderstood — what would help now?",
    "I hear you. I didn't mean it that way — what would fix this for you?",
  ],
  "say-no-friend": [
    "I'd love to but I'm wiped Saturday — could we aim for another weekend?",
    "I can't make Saturday — would Sunday afternoon work instead?",
    "I'm going to sit this one out — nothing personal, I'm just low capacity.",
  ],
  "rude-person": [
    "I'm doing my best — please don't speak to me like that.",
    "I'd rather keep this polite — I'll be as quick as I can.",
    "That's not okay — I'm happy to move aside once you're respectful.",
  ],
  "apologise-wrong": [
    "You're right — that was on me. I'm sorry. Here's what I'll change…",
    "I messed up there — I didn't mean to hurt you. Can we reset?",
    "Thanks for saying it — I own that. What would help going forward?",
  ],
  "disagree-respect": [
    "I see it differently — here's why — but I'm open to being wrong.",
    "Fair — my read was X because… What's your main concern?",
    "We might not align fully — can we agree on next steps anyway?",
  ],
  "ask-date": [
    "I'd really like that — does [day] work for you?",
    "That's sweet — yes, I'd like that. Coffee sounds perfect.",
    "Thanks for asking — I'm not sure I'm feeling that way, but I appreciate you asking kindly.",
  ],
  "partner-difficult": [
    "I've been stressed because [topic]. Can we talk without rushing?",
    "I want us both to feel okay — here's what's hard for me lately…",
    "I'm not blaming — I'm trying to explain what's going on for me.",
  ],
  "boundary-friend": [
    "I wish I could — this week I can't do evenings. Rain check?",
    "I'm trying to protect downtime — could we do something shorter?",
    "Thanks for thinking of me — I'm going to say no this time.",
  ],
  "hard-truth-friend": [
    "I'm worried because [observation]. I'm saying it because I care.",
    "Please hear me out — I might be wrong, but this has been weighing on me.",
    "I don't want drama — I want you to be okay long-term.",
  ],
  "accommodations": [
    "I'd like to discuss adjustments that help me work effectively — do we use a formal process?",
    "Here's what would help — quieter seating / notes shared / flexible deadlines when flare-ups happen.",
    "Could we document agreed accommodations so I don't have to re-explain each time?",
  ],
  "doctor-needs": [
    "Main thing is [symptom] — it's been going on [duration].",
    "I'm worried because [reason]. It's affecting [daily life].",
    "I've tried [x] — I'm not sure it's helping. What would you suggest next?",
  ],
  "stand-up-self": [
    "I want to sort this calmly — but I need you to speak to me respectfully.",
    "Let's pause — I'm happy to talk when we're both less heated.",
    "I'm not okay with that tone — I'll stay if we keep it respectful.",
  ],
  "negotiate-deadline": [
    "Friday's tight — could Monday midday work without blocking your side?",
    "If we split deliverables, could we hit Tuesday instead?",
    "What would make Friday realistic — fewer scope items or extra resource?",
  ],
  "bonus-transport": [
    "I think so — I'm pretty sure the next stop is [station]. Want me to check the board?",
    "Sorry — I'm not sure either. Maybe ask the driver when they stop?",
    "Same — mine's dying too. I'd ask someone in uniform to be sure.",
  ],
  "bonus-compliment": [
    "Thank you — that's really kind. I was nervous about it!",
    "Oh wow thanks — I wasn't expecting that.",
    "That's lovely — I appreciate you saying it.",
  ],
  "bonus-directions": [
    "Head straight two blocks, then left at the lights — big blue sign.",
    "Honestly I'm not sure — I'd use maps on my phone if I were you!",
    "It's just past the café — two minute walk.",
  ],
};

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id);
}

/** Map legacy badge ids from Phase 1 saves to Sprint 2 ids */
export function migrateEarnedBadges(ids) {
  const map = {
    "first-chat": "first-steps",
    "three-done": "growing",
    "five-done": "rooted",
    listener: "thoughtful",
    followup: "curious",
    "all-cats": "explorer",
  };
  return [...new Set((ids || []).map((id) => map[id] || id))];
}

export const BADGES = [
  {
    id: "first-steps",
    icon: "leaf",
    name: "First Steps",
    desc: "Had your first practice",
    toast: "You just had your first practice. That took courage.",
  },
  {
    id: "growing",
    icon: "leaf",
    name: "Growing",
    desc: "Completed 3 different scenarios",
    toast: "Three scenarios practised — you're building real momentum.",
  },
  {
    id: "rooted",
    icon: "heart",
    name: "Rooted",
    desc: "Completed 5 different scenarios",
    toast: "Five scenarios done — steady progress adds up.",
  },
  {
    id: "thoughtful",
    icon: "spark",
    name: "Thoughtful",
    desc: "Added detail in your responses",
    toast: "You brought thoughtful detail into your replies.",
  },
  {
    id: "curious",
    icon: "question",
    name: "Curious",
    desc: "Asked a question back",
    toast: "You asked something back — curiosity builds connection.",
  },
  {
    id: "explorer",
    icon: "trophy",
    name: "Explorer",
    desc: "Tried scenarios from every category",
    toast: "You've explored every category — brilliant breadth.",
  },
  {
    id: "brave",
    icon: "shield",
    name: "Brave",
    desc: "Completed a Difficult scenario",
    toast: "You tackled a difficult scenario. That's brave.",
  },
  {
    id: "dedicated",
    icon: "chart",
    name: "Dedicated",
    desc: "Completed 10 practice sessions",
    toast: "Ten sessions logged — dedication shows.",
  },
  {
    id: "all-rounder",
    icon: "bubbles",
    name: "All-Rounder",
    desc: "Completed easy, medium, and challenging scenarios",
    toast: "You've sampled every difficulty tag — great range.",
  },
  {
    id: "summit",
    icon: "trophy",
    name: "Summit",
    desc: "Completed 20 different scenarios",
    toast: "Twenty scenarios — that's Summit-level practice.",
  },
];
