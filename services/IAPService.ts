/**
 * services/IAPService.ts — In-App Purchase Service (react-native-iap v14)
 *
 * RELATED FILES:
 *   - components/paywall/PaywallScreen.tsx  → Calls IAPService to fetch & purchase
 *   - app/_layout.tsx                       → Call IAPService.init() once on app start
 *   - constants/iap.ts                      → All product IDs live there, imported here
 *
 * v14 API NOTES:
 *   - Dynamic import only — never static import react-native-iap at module level
 *   - fetchProducts({ skus, type: 'subs' }) — not getSubscriptions
 *   - requestPurchase returns null — result comes through purchaseUpdatedListener
 *   - p.id — not p.productId
 *   - Always call initConnection() before registering listeners
 *   - Always remove listeners and call endConnection() in finally
 */

import { PRODUCT_IDS } from "@/constants/iap";
import type { Purchase, Subscription } from "react-native-iap";

// ✅ Dynamic import — never static import at module level
let _iap: any = null;
async function loadIAP() {
  if (_iap) return _iap;
  _iap = await import("react-native-iap");
  return _iap;
}

// Debug log — readable in PaywallScreen debug panel
type LogEntry = { time: string; msg: string };
const _logs: LogEntry[] = [];
let _logListener: (() => void) | null = null;

function iapLog(msg: string) {
  const entry = { time: new Date().toLocaleTimeString(), msg };
  _logs.push(entry);
  if (_logs.length > 50) _logs.shift();
  console.log("[IAPService]", msg);
  _logListener?.();
}

export function getIAPLogs() { return [..._logs]; }
export function setIAPLogListener(cb: (() => void) | null) { _logListener = cb; }

class IAPService {
  private isConnected = false;
  private onPurchaseSuccessCallback: ((purchase: Purchase) => void) | null = null;

  /** Set by _layout.tsx — called after every confirmed purchase (e.g. update Supabase profile) */
  setOnPurchaseSuccess(cb: ((purchase: Purchase) => void) | null) {
    this.onPurchaseSuccessCallback = cb;
  }

  /** Call once in _layout.tsx useEffect after app is ready */
  async init() {
    if (__DEV__) return;
    try {
      iapLog("initConnection() starting...");
      const iap = await loadIAP();
      await iap.initConnection();
      this.isConnected = true;
      iapLog("initConnection() success");
    } catch (err: any) {
      iapLog(`initConnection() failed: ${err?.message}`);
      console.warn("[IAPService] initConnection failed:", err);
    }
  }

  /** Fetch live subscription products from App Store */
  async getProducts(): Promise<Subscription[]> {
    if (__DEV__) return [];
    try {
      iapLog(`fetchProducts() skus: ${PRODUCT_IDS.join(", ")}`);
      const iap = await loadIAP();
      const products = await iap.fetchProducts({ skus: PRODUCT_IDS, type: "subs" });
      iapLog(`fetchProducts() returned ${products.length} product(s): ${products.map((p: any) => p.id).join(", ") || "none"}`);
      return products;
    } catch (err: any) {
      iapLog(`fetchProducts() failed: ${err?.message}`);
      console.warn("[IAPService] getProducts failed:", err);
      return [];
    }
  }

  /**
   * Trigger a purchase. Returns a Promise that resolves only after
   * the purchase is confirmed and finishTransaction is called.
   * requestPurchase returns null — result comes through purchaseUpdatedListener.
   */
  async purchase(sku: string): Promise<void> {
    if (__DEV__) return;
    const iap = await loadIAP();
    let updateSub: any = null;
    let errorSub: any = null;

    try {
      iapLog(`requestPurchase() sku: ${sku}`);
      const purchase = await new Promise<Purchase>((resolve, reject) => {
        updateSub = iap.purchaseUpdatedListener((p: Purchase) => {
          iapLog(`purchaseUpdatedListener fired — id: ${(p as any).id}`);
          resolve(p);
        });
        errorSub = iap.purchaseErrorListener((err: any) => {
          iapLog(`purchaseErrorListener fired — code: ${err?.code} msg: ${err?.message}`);
          reject(err);
        });
        iap.requestPurchase({
          type: "subs",
          request: {
            apple: {
              sku,
              andDangerouslyFinishTransactionAutomatically: false,
            },
          },
        });
      });

      iapLog("finishTransaction() calling...");
      await iap.finishTransaction({ purchase, isConsumable: false });
      iapLog("finishTransaction() success — purchase complete");
      this.onPurchaseSuccessCallback?.(purchase);
    } catch (err: any) {
      if (err?.code === "E_USER_CANCELLED") {
        iapLog("Purchase cancelled by user");
      } else {
        iapLog(`purchase() error: ${err?.message}`);
        console.warn("[IAPService] purchase failed:", err);
        throw err;
      }
    } finally {
      updateSub?.remove();
      errorSub?.remove();
    }
  }

  /** Call in _layout.tsx useEffect cleanup */
  async destroy() {
    if (__DEV__) return;
    try {
      if (this.isConnected) {
        iapLog("endConnection() calling...");
        const iap = await loadIAP();
        await iap.endConnection();
        this.isConnected = false;
        iapLog("endConnection() done");
      }
    } catch (err: any) {
      iapLog(`endConnection() failed: ${err?.message}`);
      console.warn("[IAPService] endConnection failed:", err);
    }
  }
}

export const iapService = new IAPService();
