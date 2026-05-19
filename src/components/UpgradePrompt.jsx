import { NC } from "../theme/tokens";
import { navigateTo } from "../lib/routing";
import { dismissUpgradePrompt, isUpgradeDismissed, PRICING } from "../lib/subscription";
import { Body, GhostButton, PrimaryButton } from "./nc/ui";

const COPY = {
  detailed_feedback: {
    title: "Deeper reflection",
    body: "Premium includes detailed multi-section feedback with example phrasing — still strengths-first.",
  },
  custom_scenarios: {
    title: "Custom scenarios",
    body: "Build practice from your real life with the custom scenario builder.",
  },
  conversation_history: {
    title: "Conversation history",
    body: "Re-read past sessions and saved coaching notes whenever you like.",
  },
  prepare_tomorrow: {
    title: "Prepare for Tomorrow",
    body: "Plan for a real event with gentle scenario suggestions and a coaching tip.",
  },
  pacing: {
    title: "Pacing controls",
    body: "Hide turn pressure and practise at your own speed.",
  },
  social_explainer: {
    title: "Social cue explainer",
    body: 'Tap "what just happened?" on any AI line for a plain-language read of the subtext.',
  },
  bonus_content: {
    title: "Bonus scenarios & tips",
    body: "Extra scenarios and advanced tip sets when you've earned them.",
  },
};

export function UpgradePrompt({ featureKey, onDismiss }) {
  if (!featureKey || isUpgradeDismissed(featureKey)) return null;

  const copy = COPY[featureKey] || {
    title: "NeuroChat Premium",
    body: "Unlock deeper coaching tools when you're ready — no pressure.",
  };

  const handleDismiss = () => {
    dismissUpgradePrompt(featureKey);
    onDismiss?.();
  };

  return (
    <div
      style={{
        background: NC.butterSoft,
        border: `1px solid ${NC.cardEdge}`,
        borderRadius: 14,
        padding: "14px 16px",
        marginTop: 12,
        marginBottom: 4,
      }}
    >
      <div style={{ fontFamily: NC.serif, fontSize: 17, fontWeight: 500, color: NC.ink, marginBottom: 6 }}>{copy.title}</div>
      <Body size={13} color={NC.inkSoft} style={{ lineHeight: 1.55, marginBottom: 12 }}>
        {copy.body}
      </Body>
      <Body size={12} color={NC.inkMute} style={{ marginBottom: 12 }}>
        {PRICING.monthly}/month or {PRICING.yearly}/year. If cost is a barrier, get in touch — we&apos;ll sort something out.
      </Body>
      <div style={{ display: "flex", gap: 8 }}>
        <PrimaryButton
          kind="ink"
          style={{ flex: 1, minHeight: 44, fontSize: 14 }}
          onClick={() => navigateTo("/#pricing")}
        >
          See plans
        </PrimaryButton>
        <GhostButton style={{ flex: 1, minHeight: 44, fontSize: 14 }} onClick={handleDismiss}>
          Not now
        </GhostButton>
      </div>
    </div>
  );
}
