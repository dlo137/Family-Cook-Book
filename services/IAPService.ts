/**
 * services/IAPService.ts — In-App Purchase Service (react-native-iap)
 *
 * RELATED FILES:
 *   - components/paywall/PaywallScreen.tsx  → Calls IAPService to fetch & purchase
 *   - app/_layout.tsx                       → Call IAPService.init() once on app start
 *   - constants/iap.ts                      → All product IDs live there, imported here
 *   - lib/supabase.ts                       → Optional: write purchase receipts to DB
 *
 * SETUP:
 *   1. Install: npx expo install react-native-iap
 *   2. Add plugin to app.json plugins array:
 *        ["react-native-iap", { "paymentProvider": "Apple" }]
 *   3. In App Store Connect → your app → Subscriptions:
 *        - Create a Subscription Group
 *        - Add each product ID (must match constants/iap.ts exactly)
 *        - Set pricing & duration
 *        - Add a localization (required before sandbox testing)
 *   4. Add a Sandbox Tester in App Store Connect → Users & Access → Sandbox
 *   5. Run a production or TestFlight build — IAP does NOT work in Expo Go
 *
 * ⚠️ LAUNCH CRASH NOTE:
 *   Call IAPService.init() inside a useEffect in _layout.tsx, not at module load.
 *   initConnection() can throw if called before the native module is ready.
 *   Always wrap in try/catch and call endConnection() on unmount.
 *
 * ⚠️ iOS SANDBOX NOTE:
 *   Sandbox purchases go through instantly with no charge.
 *   Sign out of your real Apple ID on the test device before testing.
 *   Use the Sandbox account created in App Store Connect.
 */

import { PRODUCT_IDS } from "@/constants/iap";
import type { Purchase, Subscription } from "react-native-iap";

// ⚠️ react-native-iap accesses native modules at import time, which crashes
// the dev client before the native bridge is ready. Use require() lazily
// so the module is only loaded when methods are actually called (production only).
const getRNIAP = () => require("react-native-iap");

class IAPService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isConnected = false;

  async init(onPurchaseSuccess?: (purchase: Purchase) => void) {
    if (__DEV__) return;
    try {
      const {
        initConnection,
        purchaseUpdatedListener,
        purchaseErrorListener,
        finishTransaction,
      } = getRNIAP();

      await initConnection();
      this.isConnected = true;

      this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          await finishTransaction({ purchase, isConsumable: false });
          onPurchaseSuccess?.(purchase);
        }
      });

      this.purchaseErrorSubscription = purchaseErrorListener((error: any) => {
        console.warn("[IAPService] Purchase error:", error);
      });
    } catch (err) {
      console.warn("[IAPService] initConnection failed:", err);
    }
  }

  async getProducts(): Promise<Subscription[]> {
    if (__DEV__) return [];
    try {
      const { getSubscriptions } = getRNIAP();
      return await getSubscriptions({ skus: PRODUCT_IDS });
    } catch (err) {
      console.warn("[IAPService] getProducts failed:", err);
      return [];
    }
  }

  async purchase(productId: string): Promise<void> {
    if (__DEV__) return;
    try {
      const { requestSubscription } = getRNIAP();
      await requestSubscription({ sku: productId });
    } catch (err: any) {
      if (err?.code !== "E_USER_CANCELLED") {
        console.warn("[IAPService] requestSubscription failed:", err);
        throw err;
      }
    }
  }

  async destroy() {
    if (__DEV__) return;
    this.purchaseUpdateSubscription?.remove();
    this.purchaseErrorSubscription?.remove();
    if (this.isConnected) {
      const { endConnection } = getRNIAP();
      await endConnection();
      this.isConnected = false;
    }
  }
}

export const iapService = new IAPService();
