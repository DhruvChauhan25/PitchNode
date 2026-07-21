/*
 * Freemium plan model — the single source of truth the UI reads from.
 *
 * IMPORTANT: these values are display + UX gating only. Real enforcement
 * must happen in the backend (entitlements checked on session create),
 * otherwise limits are trivially bypassed client-side. Backend item: P3.
 *
 * Later: CURRENT_USER_PLAN and USAGE come from an auth/entitlements API.
 */

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    sessionsPerMonth: 3,
    features: [
      "3 interview sessions / month",
      "Basic AI feedback",
      "Standard question bank",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 12,
    priceLabel: "$12 / month",
    sessionsPerMonth: Infinity,
    features: [
      "Unlimited sessions",
      "Detailed NLP insights",
      "Performance trends",
      "CV-tailored questions",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    priceLabel: "Custom / org / month",
    sessionsPerMonth: Infinity,
    features: [
      "Admin dashboard",
      "Bulk user management",
      "Custom question sets",
      "White-label integration",
    ],
  },
};

/* Mock entitlements until the backend provides them */
export const CURRENT_USER_PLAN = "free";
export const SESSIONS_USED_THIS_MONTH = 1;

export function getSessionsLeft() {
  const plan = PLANS[CURRENT_USER_PLAN];
  if (plan.sessionsPerMonth === Infinity) return Infinity;
  return Math.max(0, plan.sessionsPerMonth - SESSIONS_USED_THIS_MONTH);
}
