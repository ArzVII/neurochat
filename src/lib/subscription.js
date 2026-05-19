/** Premium tier helpers — Stripe wiring can set `is_premium` on profiles later. */

export const PREMIUM_STORAGE_KEY = "neurochat_premium";
export const PREMIUM_DISMISS_PREFIX = "neurochat_upgrade_dismiss_";

export const PRICING = {
  monthly: "£4.99",
  yearly: "£39",
  therapistYear: "£400",
  schoolYear: "£1,500",
  contactEmail: "hello@neurochat.app",
};

export const PREMIUM_FEATURES = {
  detailedFeedback: "detailed_feedback",
  customScenarios: "custom_scenarios",
  conversationHistory: "conversation_history",
  prepareTomorrow: "prepare_tomorrow",
  pacing: "pacing",
  socialExplainer: "social_explainer",
  bonusContent: "bonus_content",
};

export function readPremiumLocal() {
  try {
    return window.localStorage.getItem(PREMIUM_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writePremiumLocal(isPremium) {
  try {
    if (isPremium) window.localStorage.setItem(PREMIUM_STORAGE_KEY, "true");
    else window.localStorage.removeItem(PREMIUM_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isUpgradeDismissed(featureKey) {
  try {
    return window.localStorage.getItem(`${PREMIUM_DISMISS_PREFIX}${featureKey}`) === "1";
  } catch {
    return false;
  }
}

export function dismissUpgradePrompt(featureKey) {
  try {
    window.localStorage.setItem(`${PREMIUM_DISMISS_PREFIX}${featureKey}`, "1");
  } catch {
    // ignore
  }
}

export function clearUpgradeDismiss(featureKey) {
  try {
    window.localStorage.removeItem(`${PREMIUM_DISMISS_PREFIX}${featureKey}`);
  } catch {
    // ignore
  }
}
