# NeuroChat — Full Build Brief for Claude Code

**Project:** NeuroChat
**Founder:** Sheena Samuels
**Product Lead:** Aaron
**Status:** Interactive React prototype complete — ready for full build
**Goal:** Ship a production-ready web app (PWA) with live AI conversations, user accounts, and a monetisation layer.

---

## 1. Product Vision

NeuroChat is a social communication practice app for neurodivergent people (children, teens, and adults). It gives users a safe, low-pressure environment to practise real-world conversations with an AI partner, receive gentle strengths-first feedback, and build confidence at their own pace.

**It is not:** therapy, a social network, or a gamified test.
**It is:** a private practice space for building social confidence.

### Core principles (non-negotiable)
- Strengths shown before improvements — always
- No scoring, no timers, no pressure
- One main action per screen
- Sensory-friendly: soft blues, yellows, whites, no harsh colours, no pastel pinks
- Nunito font throughout
- Calm, reassuring tone — never patronising, never childish
- "You can't get this wrong" messaging philosophy

---

## 2. Current State

A working React prototype exists (`neurochat.jsx`) with:
- Home screen
- 8 scenarios across 4 categories (Work, Social, Everyday, Difficult)
- Scripted AI chat with suggested replies
- Feedback dashboard (strengths → explore → examples)
- 5-category tips library (15 tips total)
- Progress tracking with 6 unlockable badges
- How It Works screen

**This prototype is the design source of truth.** All visual styling, tone, and flow should be preserved in the full build.

---

## 3. What Claude Code Needs to Build

### 3.1 Tech stack
- **Frontend:** React + Vite (or Next.js if SSR is wanted)
- **Styling:** Keep the existing inline style system OR migrate to Tailwind — match the prototype exactly
- **Backend:** Node.js + Express, OR Next.js API routes
- **Database:** PostgreSQL (via Supabase for speed) or SQLite for MVP
- **Auth:** Supabase Auth or Clerk
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) for live conversation and feedback generation
- **Hosting:** Vercel (frontend) + Supabase (backend/db)
- **Payments:** Stripe
- **PWA:** Must be installable on iOS and Android home screens

### 3.2 Replace scripted AI with live Claude API
The prototype uses hardcoded responses. Replace with real Claude API calls:
- **Conversation endpoint:** takes scenario context + message history, returns a natural response in character
- **Feedback endpoint:** takes full transcript, returns structured JSON with `strengths[]`, `explore[]`, `examples[]`
- System prompts must enforce: neurodivergent-friendly tone, no judgement, age-appropriate, strengths-first framing

### 3.3 User accounts & persistence
- Sign up / log in (email or magic link preferred — low friction)
- Save: completed scenarios, earned badges, conversation history, preferences
- Settings: font size, dark/light mode, text-only vs voice toggle (voice can be a later phase)

### 3.4 Expand scenario library
Current 8 scenarios should grow to 20+ at launch, grouped into packs (see monetisation below). Additional scenarios to add:
- Ordering at a restaurant, returning an item, dealing with rudeness, giving feedback to a friend, apologising, asking someone out, disagreeing respectfully, job interview follow-ups, networking, setting a boundary, etc.

### 3.5 Accessibility
- WCAG AA minimum
- Adjustable font size
- Screen reader compatible
- Reduced motion option
- High contrast mode

---

## 4. Monetisation Model

Build the app with payment infrastructure from day one, even if the paid tiers launch later. The model is **progression-based: users start free, pay for deeper, more personalised help as their needs grow.**

### 4.1 Freemium → Conversion (Core Model)

**Free tier includes:**
- Basic conversation practice (limited to 3–4 core scenarios)
- Simple feedback summary (strengths + one tip)
- Basic tips library

**Premium unlocks:**
- Advanced feedback — deeper analysis of tone, pacing, word choice, empathy
- Full scenario library (20+ scenarios, growing)
- Personalisation — tailored responses, saved conversation history, custom practice plans
- Progress tracking with full badge system

The trigger to upgrade is **better outcomes, not just more access.**

### 4.2 Subscription (Recurring Revenue — Primary)

Monthly / annual subscription model, positioned as continuous improvement (similar to Duolingo or Calm).

- **Monthly:** ~£7.99/month
- **Annual:** ~£59/year (save ~40%)
- Includes: weekly practice plans, ongoing progress tracking, new scenario packs as they're released, priority access to new features

Positioning: *"You're growing a skill, not renting a tool."*

### 4.3 High-Value Layers (The Edge)

**A. Institutional Licensing** — the biggest opportunity
- Target: schools (SEN departments), therapists, coaches, youth services, NHS neurodivergent support teams
- Licence per-seat or per-organisation
- One contract = dozens or hundreds of users
- Build a simple admin dashboard for institutional accounts (add/remove users, view aggregate progress anonymously)

**B. Scenario Packs / Add-ons** — problem-specific one-time purchases
- Job Interview Pack
- Dating & Relationships Pack
- Workplace Communication Pack
- Difficult Conversations Pack
- Customer Service Pack
- Works for users who don't want a subscription but have a specific need

**C. Premium AI Features (Phase 2)**
- Voice-based conversations (speech-in, speech-out)
- Deeper behavioural feedback (pacing, filler words, emotional register)
- Custom scenario creation — users describe a real situation, AI generates a practice version
- These sit behind higher-tier plans

### 4.4 What to avoid
- No ads (ruins UX for the ND community)
- No dark patterns
- No manipulative streaks or FOMO mechanics

---

## 5. Build Phases

### Phase 1 — MVP (4–6 weeks)
- Port prototype to production stack
- Integrate Claude API for live conversations + feedback
- User auth and profile persistence
- PWA setup
- Deploy free tier only
- **Goal:** 20–30 real users from the ND community testing it

### Phase 2 — Monetisation (2–3 weeks)
- Stripe integration
- Free vs premium gating
- First scenario pack as a paid add-on
- Subscription tier live

### Phase 3 — Institutional (4+ weeks)
- Admin dashboard for organisations
- Seat-based licensing
- Aggregate (anonymised) reporting
- Outreach to schools, therapists, charities

### Phase 4 — Advanced features
- Voice mode (Web Speech API or ElevenLabs)
- Custom scenario generation
- Deeper behavioural feedback tier

---

## 6. Privacy & Trust

Critical for the ND community — this is a trust product.

- All conversation data encrypted at rest
- Users can delete all their data at any time
- No data sold or shared with third parties
- Clear, plain-language privacy policy (not legalese)
- GDPR compliant
- Optional anonymous mode (no account required for free tier)

---

## 7. Design System Reference

Pull these from the existing prototype:

**Colours:**
- Background: `#F5F7FA`
- Primary blue: `#2B6CB0` / dark `#1A4971` / light `#EBF4FF`
- Accent yellow: `#F6C94E` / light `#FEF9E7`
- Success green: `#48BB78` / light `#F0FFF4`
- Warm amber: `#ED8936` / light `#FFFAF0`
- Text: `#1A202C` / muted `#718096`

**Typography:** Nunito (weights 400, 600, 700, 800)

**Components:** Rounded corners (14–18px), soft shadows, generous padding, chat bubbles with rounded asymmetric corners.

---

## 8. Handover Checklist for Claude Code

When starting the build, Claude Code should:
1. Read the existing `neurochat.jsx` prototype file to understand the exact visual design and flow
2. Preserve all tone, copy, and design decisions — these were specified by the founder for a reason
3. Build with Anthropic Claude API for all AI interactions
4. Set up Stripe from day one even if pricing launches later
5. Default to PWA so users can install it on iOS/Android without app store approval
6. Prioritise accessibility and privacy — these are core product values, not add-ons

---

## 9. Pitch Statement (for reference)

*"NeuroChat's monetisation is built around user progression. The free version gives basic conversation practice, but paid tiers unlock deeper feedback, more advanced scenarios, and personalised support. The core model is subscription-based because users are improving a skill over time, not just using a one-off tool. Beyond that, there's strong potential for scenario-based add-ons like interview or relationship packs, and institutional licensing for schools and therapists. Longer-term, voice interaction and deeper behavioural feedback can sit behind higher tiers."*

---

**End of brief.**
Built from the original concept by Sheena Samuels. Prototype and product direction by Aaron, with Claude as build partner.
