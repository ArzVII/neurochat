# NeuroChat — Phase 2 Build Brief

**Project:** NeuroChat
**Owner:** Aaron (concept originated by Sheena Samuels)
**Status:** Phase 1 complete — live at neurochat-eight.vercel.app with AI-powered conversations and feedback
**Goal:** Transform NeuroChat from a working proof of concept into a robust, sellable product that schools, SEN departments, therapists, and individual users would pay for.

---

## What Phase 1 Achieved

- Live PWA at neurochat-eight.vercel.app
- 8 scenarios across 4 categories
- Claude API-powered conversations (intelligent, responsive to anything)
- Claude API-powered feedback (context-aware, strengths-first)
- Suggested replies during conversations
- Tips library (5 categories, 15 tips)
- Progress tracking with 6 badges
- v2 design (Quicksand + DM Sans, soft blues/yellows, organic gradients)

## What Phase 1 Is Missing

- No user accounts — progress resets on browser close
- Only 8 scenarios — too thin for a real product
- No mood check-in or adaptive experience
- No reward/unlock system beyond basic badges
- No conversation history or review
- No onboarding for first-time users
- No difficulty levels within scenarios
- Tips library is shallow (15 tips)
- No institutional/admin layer
- No custom scenario creation
- No offline capability

---

## Phase 2 Design Principles

Everything built in Phase 2 must follow these rules. They come from Sheena's direct insight into what neurodivergent users need:

1. **Rewards are additive, never subtractive.** Users gain things for engaging. They never lose anything for not engaging. No streaks, no "you missed a day," no guilt mechanics. (Inspired by Finch app philosophy.)

2. **Nothing is forced.** The mood check-in is optional. Unlockable content is bonus, not gated essentials. Users can always access core functionality without paying or completing challenges.

3. **Encouragement is quiet.** Toast notifications slide in gently and fade. No sounds, no vibrations, no blocking modals, no confetti. Just warm acknowledgement.

4. **Personalisation feels natural.** The app adapts based on mood and history without making it obvious or creepy. If someone is having a low day, it gently suggests easier scenarios — it doesn't announce "We've detected you're feeling bad."

5. **Strengths first, always.** Every piece of feedback, every progress screen, every notification leads with what the user did well.

---

## Feature Specifications

### F1: Mood Check-In

**What:** When a user opens the app, a gentle check-in screen asks "How are you feeling?" with three options:
- 😊 Feeling good (green-tinted)
- 😐 Doing okay (amber-tinted)
- 😔 Bit low (soft purple-tinted)

**Behaviour:**
- Tapping a mood takes you to the home screen within 0.5s
- A small mood banner appears at the top of the home screen showing what they picked, with a "change" link
- The scenario suggestion text adapts:
  - Good → "Want to try something new today?"
  - Okay → "Maybe a familiar scenario?"
  - Low → "Go easy on yourself today. Something short?"
- Mood is saved to the user's session (and to their account if logged in)
- Mood history is tracked privately — never shown to institutional admins. This is personal.
- The check-in is **skippable**. If someone taps outside or swipes, they go straight to home. Never forced.

**Why:** This makes the experience feel personal from the first second, and ensures someone having a bad day isn't pushed into a difficult scenario.

---

### F2: User Accounts & Persistence

**What:** Users can create an account and log in so their progress, badges, conversation history, and preferences persist across sessions and devices.

**Implementation:**
- Use Supabase Auth (magic link email — no passwords to remember, low friction)
- Alternative: "Continue as guest" option that stores progress in localStorage with a prompt to create an account to save it permanently
- Database tables:
  - `users` — id, email, display_name, created_at
  - `sessions` — id, user_id, scenario_id, messages_json, feedback_json, mood, created_at
  - `progress` — user_id, completed_scenarios[], earned_badges[], total_sessions, last_active
  - `preferences` — user_id, font_size, dark_mode, mood_history[]

**Account screen includes:**
- Display name (not required, defaults to "You")
- Total conversations practised
- Member since date
- Font size adjustment
- Dark mode toggle (for future implementation)
- "Delete all my data" button — privacy is a core value
- Sign out

**Why:** Without accounts, the app can't retain users. Schools can't track student engagement. Progress disappears. This is the single most important infrastructure piece.

---

### F3: Expanded Scenario Library (25+ Scenarios)

**What:** Expand from 8 to 25+ scenarios across the existing 4 categories, plus add 2 new categories. Each scenario should feel specific and real — not generic.

**New categories:**
- **Relationships** — dating, friendships, family dynamics
- **Self-Advocacy** — standing up for yourself, asking for accommodations, saying no

**Full scenario list:**

**Work (6 scenarios):**
1. Introducing Yourself at Work (existing)
2. Job Interview (existing)
3. Small Talk at Work (existing)
4. Asking Your Boss for Help
5. Receiving Criticism from a Manager
6. Speaking Up in a Meeting

**Social (5 scenarios):**
7. Meeting Someone New (existing)
8. Ending a Conversation (existing)
9. Joining a Group Conversation
10. Making Plans with a Friend
11. Reconnecting with Someone After a Long Time

**Everyday (5 scenarios):**
12. Asking for Help (existing)
13. Making a Phone Call (existing)
14. Ordering at a Restaurant
15. Returning an Item to a Shop
16. Small Talk with a Neighbour

**Difficult (5 scenarios):**
17. Handling Conflict (existing)
18. Saying No to a Friend
19. Dealing with Someone Being Rude
20. Apologising When You're Wrong
21. Disagreeing Respectfully

**Relationships (4 scenarios):**
22. Asking Someone on a Date
23. Having a Difficult Conversation with a Partner
24. Setting a Boundary with a Friend
25. Telling a Friend Something They Don't Want to Hear

**Self-Advocacy (4 scenarios):**
26. Asking for Accommodations at Work/School
27. Explaining Your Needs to a Doctor
28. Standing Up for Yourself Without Aggression
29. Negotiating (Price, Deadline, etc.)

**Each scenario needs:**
- Title, icon, category, description
- Opening line from the AI partner
- 3 suggested replies for different stages
- System prompt context telling Claude how the AI partner should behave (e.g., for "Dealing with Rudeness" the AI partner should be mildly rude but not abusive)

**Difficulty indicators (not levels, not forced):**
- Each scenario has a gentle tag: "Quick & easy", "Takes a bit more thought", or "Challenging"
- These are visible but don't gate anything. Users pick whatever they want.

---

### F4: Gentle Reward & Unlock System

**What:** An additive reward system where engaging more unlocks bonus content. Core app remains fully usable without unlocking anything.

**Unlock triggers:**
- Complete 3 scenarios → Unlock "Bonus Scenario Pack 1" (3 extra scenarios: "Talking to a Stranger on Public Transport", "Complimenting Someone", "Asking for Directions")
- Complete 5 scenarios → Unlock an exclusive tip set: "Advanced Conversation Techniques" (5 tips)
- Complete your first Difficult scenario → Unlock tip set: "Staying Calm Under Pressure" (3 tips)
- Complete a scenario from every category → Unlock "Custom Scenario Builder" (see F7)
- Complete 10 total sessions → Unlock "Conversation Review" feature (see F6)

**Badge system (expanded from 6 to 10):**
- 🌱 First Steps — first practice completed
- 🌿 Growing — 3 scenarios done
- 🌳 Rooted — 5 scenarios done
- 🦋 Thoughtful — added detail in responses
- 🐝 Curious — asked a question back
- 🦉 Explorer — tried every category
- 🌊 Brave — completed a Difficult scenario
- 🔥 Dedicated — 10 total sessions
- 🌈 All-Rounder — completed all difficulty tags (easy, medium, challenging)
- 🏔️ Summit — completed 20 different scenarios

**Toast notification on unlock:**
When a badge is earned or content is unlocked, a toast slides down from top of screen:
- Shows for 3.5 seconds, then fades
- Contains the badge emoji + a warm message
- Example: "🌱 You just had your first practice. That took courage."
- Example: "🌊 You tackled a difficult scenario. That's brave."
- Example: "🎁 You've unlocked 3 bonus scenarios! Find them in the scenario list."
- No sound. No vibration. No blocking. Just quiet acknowledgement.

**What this system NEVER does:**
- Never punishes for inactivity
- Never shows "you haven't practised in X days"
- Never removes unlocked content
- Never creates FOMO or urgency
- Never compares users to each other

---

### F5: Comprehensive Tips Library (50+ Tips)

**What:** Expand from 15 tips to 50+ across 8 categories. Each tip should be specific, actionable, and include an example.

**Categories (expanded from 5 to 8):**
1. Starting Conversations (5 tips)
2. Keeping It Going (5 tips)
3. Ending Politely (5 tips)
4. Tone & Delivery (5 tips)
5. Difficult Moments (5 tips)
6. Body Language & Non-Verbal Cues (5 tips) — NEW
7. Digital Communication (5 tips) — NEW (texting, emails, social media messaging)
8. Self-Advocacy & Boundaries (5 tips) — NEW

**Plus unlockable tip sets (see F4):**
- Advanced Conversation Techniques (5 tips)
- Staying Calm Under Pressure (3 tips)

**Tip format:**
Each tip has:
- A clear title (e.g., "The 2-Second Pause")
- A plain-language explanation (2-3 sentences)
- A concrete example (e.g., "Instead of jumping in immediately, try counting to 2 in your head. Then respond. This tiny pause makes you seem thoughtful rather than impulsive.")

**Tips should be written in consultation with ND community feedback.** Start with AI-generated tips, but flag them for review. Consider consulting a speech therapist or ND support worker to validate the content before selling to institutions.

---

### F6: Conversation History & Review

**What:** Users can look back at past conversations and see their feedback again.

**Implementation:**
- Every completed conversation is saved to the database (scenario, messages, feedback, mood, timestamp)
- Accessible from a "History" tab on the Progress screen
- Each entry shows: scenario name, date, mood at time of practice, and a "Review" button
- Tapping Review shows the full transcript with the original feedback
- Users can delete individual conversations from history

**Why:** This lets users see their own growth over time. It's also essential for institutional use — therapists may want to review sessions with students (with consent).

---

### F7: Custom Scenario Builder (Unlockable)

**What:** Users describe a real situation they're anxious about, and the AI generates a tailored practice scenario.

**User flow:**
1. User taps "Create a Custom Scenario" (unlocked after trying all categories)
2. A text field asks: "Describe a conversation you'd like to practise. What's the situation? Who are you talking to?"
3. User types, e.g., "I need to tell my flatmate they're being too loud at night"
4. The app sends this to Claude with a system prompt that generates:
   - A scenario title
   - An opening line from the other person
   - 3 suggested replies
   - The AI partner's personality/behaviour description
5. The custom scenario starts immediately
6. It's saved to the user's scenario list as "My Scenarios" for re-use

**Why:** This is the feature that makes NeuroChat genuinely therapeutic. People don't just have anxiety about generic situations — they have anxiety about *specific* conversations coming up. This lets them rehearse the exact thing they're worried about. This is also a strong premium/paid feature.

---

### F8: First-Time Onboarding

**What:** A 3-screen intro flow for brand new users that sets expectations and reduces anxiety about using the app.

**Screen 1: Welcome**
- "Welcome to NeuroChat"
- "This is a safe space to practise conversations. No one is watching. No one is scoring you."
- [Continue]

**Screen 2: How it works**
- "You'll chat with an AI partner who plays the other person. Afterwards, you'll get gentle feedback — strengths first, always."
- "If you get stuck, tap for a suggestion. There are no wrong answers."
- [Continue]

**Screen 3: Set your pace**
- "You control everything. Practise as much or as little as you want. We'll never pressure you."
- "Ready to try your first conversation?"
- [Let's go] → takes them to mood check-in → then home

**This only shows once.** After completing it, users go straight to mood check-in on future visits. Store a `has_onboarded` flag.

---

### F9: Institutional Admin Dashboard (Phase 2b — build after core features)

**What:** A separate admin view for schools, therapists, and organisations that license NeuroChat for multiple users.

**Admin capabilities:**
- Create and manage user accounts for their students/clients
- Assign specific scenario packs ("This week, try the Workplace scenarios")
- View anonymised, aggregate progress data:
  - How many conversations completed across all users
  - Most popular scenarios
  - Average feedback trends (are users improving over time?)
  - Engagement metrics (how often users return)
- **Cannot** see individual conversation transcripts (privacy)
- **Cannot** see individual mood data (privacy)
- Can see: which scenarios each user has completed, how many total sessions, badges earned

**Admin pricing:**
- Per-seat licensing (e.g., £3/student/month or £25/student/year)
- School package (up to 100 seats: £1,500/year)
- Therapist package (up to 20 clients: £400/year)

**Why:** This is where the real money is. One school contract = hundreds of paying users. But the admin dashboard must respect user privacy — therapists and teachers see progress, not private conversations.

---

### F10: My Suggestions (Things Neither Sheena Nor Saventi Have Mentioned)

**A. "Prepare for Tomorrow" Mode**
Users can set a specific upcoming event (e.g., "Job interview on Friday", "Meeting partner's parents Saturday") and the app creates a focused practice plan:
- Suggests relevant scenarios to practise this week
- Sends a gentle reminder the day before (if notifications are enabled): "Your interview is tomorrow. Want to do one more practice?"
- After the event, asks: "How did it go?" with options: "Better than expected / About the same / Still tough"
- This creates a real-world feedback loop that no other app has

**B. "Replay with Different Choices" Feature**
After completing a scenario, users can replay the same conversation but try different responses. The AI remembers the original scenario context but responds fresh. This lets users experiment: "What happens if I'm more assertive? More casual? More detailed?" — learning through variation, not repetition.

**C. Conversation Pacing Controls**
Some ND users process language more slowly. Add a toggle in settings: "Give me more time to think." When enabled:
- The AI's typing indicator stays visible for 2 extra seconds before the response appears
- No visual indication of "hurry up"
- The turn counter is hidden entirely
- The suggestion button is always visible (not behind a tap)

**D. "What Just Happened?" Explainer**
After certain AI responses in a conversation, a small "?" icon appears. Tapping it explains the social cue:
- AI says: "Oh right, cool." → "?" explains: "This is a polite but brief response. The other person might be wrapping up or not very engaged. You could ask them a question to re-engage, or take the cue to end the conversation."
- This teaches social literacy in context — the most effective way for ND users to learn.
- This should be optional (toggle: "Show conversation hints") so it doesn't clutter the experience for users who don't need it.

**E. Voice Mode (Phase 3 — future)**
Record voice instead of typing. The app transcribes and analyses tone, pace, filler words ("um", "like"), volume variation. This is a premium feature. Don't build now, but architect the API endpoint to accept audio in future.

**F. "Share Your Progress" Card**
Users can generate a simple, beautiful card showing their stats (scenarios completed, badges earned, days practised) that they can save as an image and share — with a therapist, parent, or on social media. No personal conversation data is included. Just a celebration of progress.

---

## Implementation Order

### Sprint 1 (Week 1-2): Foundation
- [ ] F2: Supabase auth + user accounts + guest mode
- [ ] F8: First-time onboarding (3 screens)
- [ ] F1: Mood check-in with adaptive home screen
- [ ] Save progress, badges, and mood to database

### Sprint 2 (Week 2-3): Content Depth
- [ ] F3: Expand to 25+ scenarios with difficulty indicators
- [ ] F5: Expand tips library to 50+ tips across 8 categories
- [ ] F4: Implement gentle toast reward system
- [ ] F4: Implement unlock triggers and bonus content

### Sprint 3 (Week 3-4): Power Features
- [ ] F6: Conversation history and review
- [ ] F7: Custom scenario builder (unlockable)
- [ ] F10-A: "Prepare for Tomorrow" mode
- [ ] F10-D: "What Just Happened?" social cue explainer

### Sprint 4 (Week 4-5): Polish & Institutional
- [ ] F10-B: Replay with different choices
- [ ] F10-C: Conversation pacing controls
- [ ] F10-F: Share your progress card
- [ ] F9: Institutional admin dashboard (MVP)

### Sprint 5 (Week 5-6): Launch Prep
- [ ] PWA optimisation (offline support, install prompt)
- [ ] Stripe integration for subscriptions
- [ ] Landing page for institutional sales
- [ ] Privacy policy (plain language, GDPR compliant)
- [ ] Testing with 30-50 ND community members

---

## Pricing Model (Refined)

### Individual Users

**Free tier:**
- 5 core scenarios (one from each original category)
- Basic feedback (strengths + 1 tip)
- Basic tips library (original 15 tips)
- Mood check-in
- Guest mode (no account needed)

**Premium (£5.99/month or £49/year):**
- All 25+ scenarios
- Full AI feedback with detailed analysis
- Complete tips library (50+ tips)
- Unlock system with bonus scenarios
- Custom scenario builder
- Conversation history and review
- "Prepare for Tomorrow" mode
- "What Just Happened?" explainer
- Pacing controls
- Progress sharing cards

### Institutional

**Therapist licence (up to 20 users): £400/year**
**School licence (up to 100 users): £1,500/year**
**Enterprise (100+ users): Custom pricing**

All institutional licences include:
- All premium features for every user
- Admin dashboard
- Anonymised progress reporting
- Scenario assignment
- Priority support
- Option to request custom scenarios for their specific use case

---

## Technical Notes for Cursor

### Database Schema (Supabase)

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  display_name text,
  has_onboarded boolean default false,
  font_size text default 'medium',
  pacing_mode boolean default false,
  show_hints boolean default true,
  created_at timestamptz default now()
);

-- Completed sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  scenario_id text not null,
  messages jsonb not null,
  feedback jsonb,
  mood text,
  created_at timestamptz default now()
);

-- User progress (denormalised for fast reads)
create table progress (
  user_id uuid references profiles(id) primary key,
  completed_scenarios text[] default '{}',
  earned_badges text[] default '{}',
  total_sessions integer default 0,
  unlocked_content text[] default '{}',
  last_active timestamptz default now()
);

-- Custom scenarios
create table custom_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  description text,
  opener text not null,
  ai_personality text,
  suggested_replies jsonb,
  created_at timestamptz default now()
);

-- Institutional accounts
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_user_id uuid references profiles(id),
  licence_type text, -- 'therapist', 'school', 'enterprise'
  max_seats integer,
  created_at timestamptz default now()
);

create table org_members (
  org_id uuid references organisations(id),
  user_id uuid references profiles(id),
  role text default 'member', -- 'admin' or 'member'
  primary key (org_id, user_id)
);
```

### API Endpoints to Build

```
POST   /api/conversation          — existing, live AI conversation
POST   /api/feedback              — existing, live AI feedback
POST   /api/auth/signup           — Supabase magic link
POST   /api/auth/login            — Supabase magic link
GET    /api/progress/:userId      — get user progress
POST   /api/progress/update       — update after session
GET    /api/sessions/:userId      — get conversation history
POST   /api/sessions/save         — save completed session
POST   /api/scenarios/custom      — generate custom scenario via Claude
GET    /api/scenarios/custom/:userId — get user's custom scenarios
POST   /api/prepare               — create "prepare for tomorrow" plan
GET    /api/admin/org/:orgId      — get org dashboard data
POST   /api/explain               — "What just happened?" cue explainer
```

### How to Give This to Cursor

Open Cursor with the neurochat project. Drop this file into the project root. Then work through it sprint by sprint:

**Sprint 1 prompt:**
"Read NEUROCHAT_PHASE2_BRIEF.md. Start with Sprint 1: Set up Supabase auth with magic link login, create the database tables from the schema section, build the onboarding flow (F8), and implement the mood check-in (F1). Save user progress to Supabase after each session. Keep the existing v2 design. Commit and push after each feature."

**Sprint 2 prompt:**
"Continue with Sprint 2 from the Phase 2 brief. Add all 25+ scenarios from F3 with difficulty tags. Expand the tips library to 50+ tips across 8 categories (F5). Build the toast notification system and unlock triggers from F4. Commit and push."

And so on for each sprint.

---

## What Success Looks Like

**In 6 weeks:**
- 25+ scenarios with difficulty indicators
- User accounts with persistent progress
- Mood check-in that adapts the experience
- Gentle reward system with unlockable content
- Comprehensive tips library
- Conversation history
- Custom scenario builder
- First-time onboarding
- 50+ real ND users testing it

**In 3 months:**
- Stripe payments live
- Institutional admin dashboard
- 3-5 schools or therapists piloting it
- Landing page for B2B sales
- 200+ individual users
- Featured in ND community spaces

**In 6 months:**
- Revenue from subscriptions and institutional licences
- 1,000+ users
- Partnership with at least one ND charity or organisation
- Serious decision point: scale yourself, seek investment, or sell

---

**End of Phase 2 Brief.**

Built by Aaron, with Claude as build partner.
Original concept by Sheena Samuels.
This is real. This matters. Let's build it.
