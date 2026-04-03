/**
 * constants/iap.ts — IAP Product IDs
 *
 * RELATED FILES:
 *   - services/IAPService.ts               → Imports PRODUCT_IDS to fetch & purchase
 *   - components/paywall/PaywallScreen.tsx → Uses PLANS to render paywall UI
 *
 * RULES:
 *   - These IDs must EXACTLY match what you created in App Store Connect
 *   - Format convention: com.yourcompany.yourapp.{duration}
 *   - After changing IDs here, you must create matching products in App Store Connect
 *     before they'll return from getSubscriptions()
 *
 * APP STORE CONNECT SETUP CHECKLIST:
 *   ☐ Created a Subscription Group (e.g. "Pro Access")
 *   ☐ Added each product below to that group
 *   ☐ Set a price for each product
 *   ☐ Added at least one Localization (display name + description)
 *   ☐ Submitted for review or set to "Ready to Submit"
 *   ☐ Added a Sandbox Tester under Users & Access → Sandbox → Testers
 */

export const PRODUCT_IDS = [
  "ShopMyRoom.Weekly",
  "ShopMyRoom.Monthly",
  "ShopMyRoom.Yearly",
];

/**
 * Plan metadata for rendering the paywall UI.
 * Prices here are display fallbacks — always prefer the price returned
 * from IAPService.getProducts() since it reflects the user's local currency.
 */
export const PLANS = [
  {
    id: "ShopMyRoom.Weekly",
    label: "Weekly",
    price: "$2.99",
    period: "/ week",
    highlight: false,
  },
  {
    id: "ShopMyRoom.Monthly",
    label: "Monthly",
    price: "$7.99",
    period: "/ month",
    highlight: true, // ← mark your recommended plan
  },
  {
    id: "ShopMyRoom.Yearly",
    label: "Yearly",
    price: "$49.99",
    period: "/ year",
    highlight: false,
  },
];
