/**
 * constants/iap.ts — IAP Product IDs
 *
 * RELATED FILES:
 *   - services/IAPService.ts   → Imports these to fetch & purchase
 *   - app/subscription.tsx     → Uses PLANS to render the paywall UI
 *
 * RULES:
 *   - IDs must EXACTLY match App Store Connect
 *   - Monthly is a subscription; Lifetime is a non-consumable
 */

export const PRODUCT_IDS = {
  monthly:  'product_id_monthly_cookbook',
  lifetime: 'product_id_lifetime',
};

/** Subscription SKUs (fetched with type: "subs") */
export const SUBSCRIPTION_SKUS = [PRODUCT_IDS.monthly];

/** Non-consumable SKUs (fetched with type: "inapp") */
export const INAPP_SKUS = [PRODUCT_IDS.lifetime];

/** All SKUs combined */
export const PRODUCT_IDS_ARRAY = [...SUBSCRIPTION_SKUS, ...INAPP_SKUS];

export const PLANS = [
  {
    id: PRODUCT_IDS.monthly,
    planKey: 'monthly' as const,
    type: 'subs' as const,
    label: 'Monthly',
    price: '$2.99',
    period: '/ month',
    badge: null,
    description: 'Billed monthly, cancel anytime',
  },
  {
    id: PRODUCT_IDS.lifetime,
    planKey: 'lifetime' as const,
    type: 'inapp' as const,
    label: 'Lifetime',
    price: '$9.99',
    period: 'one-time',
    badge: 'BEST VALUE',
    description: 'Pay once, keep forever',
  },
];
