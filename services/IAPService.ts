import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SUBSCRIPTION_SKUS, INAPP_SKUS } from '@/constants/iap';
import type { Purchase } from 'react-native-iap';

// ─────────────────────────────────────────────────────────────────────────────
// react-native-iap v14 (Nitro) API reference:
//
//   fetchProducts({ skus, type: 'subs' | 'inapp' })
//   requestPurchase({ type, request: { apple: { sku } } })
//   finishTransaction({ purchase, isConsumable })   ← uses purchase.id on iOS
//   getAvailablePurchases()                         ← restore / pending check
//   purchaseUpdatedListener / purchaseErrorListener
//
// Purchase object fields (v14):
//   purchase.id        — transactionId on iOS
//   purchase.productId — the SKU
// ─────────────────────────────────────────────────────────────────────────────

let iapAvailable = false;
let iapModule: any = null;

// react-native-iap v14 uses Nitro Modules, which throw a fatal native error
// in Expo Go. Gate the require() behind an Expo Go check.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    iapModule = require('react-native-iap');
    if (typeof iapModule.initConnection === 'function') {
      iapAvailable = true;
      console.log('[IAP] ✅ Module loaded');
    } else {
      console.log('[IAP] ❌ initConnection missing — module may not be linked');
    }
  } catch (e: any) {
    console.log('[IAP] require failed:', e?.message);
  }
} else {
  console.log('[IAP] Expo Go detected — simulation mode active');
}

const ALL_PRODUCT_IDS = [...SUBSCRIPTION_SKUS, ...INAPP_SKUS];
const INFLIGHT_KEY = 'iapPurchaseInFlight';

// ─────────────────────────────────────────────────────────────────────────────
class IAPService {
  private static instance: IAPService;
  private isConnected = false;
  private hasListener = false;
  private processedIds = new Set<string>();
  private purchaseLogs: string[] = [];
  private productFetchLogs: string[] = [];
  private debugCallback: ((info: any) => void) | null = null;
  private currentPurchaseProductId: string | null = null;
  private purchasePromiseResolve: ((value: void) => void) | null = null;
  private purchasePromiseReject: ((reason?: any) => void) | null = null;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  private constructor() {}
  static getInstance(): IAPService {
    if (!IAPService.instance) IAPService.instance = new IAPService();
    return IAPService.instance;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  isAvailable(): boolean { return iapAvailable && iapModule !== null; }

  setDebugCallback(cb: (info: any) => void) { this.debugCallback = cb; }
  clearPurchaseLogs() { this.purchaseLogs = []; }
  getPurchaseLogs(): string[] { return [...this.purchaseLogs]; }
  getProductFetchLogs(): string[] { return [...this.productFetchLogs]; }

  /** No-op shim — kept for _layout.tsx compatibility. Profile is updated inside processPurchase. */
  setOnPurchaseSuccess(_cb: ((purchase: Purchase) => void) | null) {}

  // ── Initialization ─────────────────────────────────────────────────────────

  /** Called from _layout.tsx as iapService.init() */
  async init(): Promise<void> {
    await this.initialize();
  }

  async initialize(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      if (!this.isConnected) {
        await iapModule.initConnection();
        this.isConnected = true;
        console.log('[IAP] initConnection success');
      }
      if (!this.hasListener) {
        this.setupPurchaseListeners();
        this.hasListener = true;
      }
      await this.checkForPendingPurchases();
      return true;
    } catch (e: any) {
      console.error('[IAP] initialize failed:', e?.message);
      return false;
    }
  }

  // ── Product fetching ───────────────────────────────────────────────────────

  async getProducts(): Promise<any[]> {
    this.productFetchLogs = [];
    this.log('========== PRODUCT FETCH ==========');

    if (!this.isAvailable()) { this.log('❌ IAP not available'); return []; }
    if (!this.isConnected) {
      const ok = await this.initialize();
      if (!ok) { this.log('❌ Initialization failed'); return []; }
    }

    // Brief pause to let StoreKit settle after connection
    await new Promise(r => setTimeout(r, 500));

    const results: any[] = [];

    // Fetch subscriptions
    if (SUBSCRIPTION_SKUS.length > 0) {
      this.log(`Fetching subs: ${SUBSCRIPTION_SKUS.join(', ')}`);
      try {
        const subs = await iapModule.fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
        this.log(`✅ Got ${subs.length} subscription(s)`);
        results.push(...subs);
      } catch (e: any) {
        this.log(`fetchProducts(subs) failed: ${e?.message}`);
      }
    }

    // Fetch non-consumables
    if (INAPP_SKUS.length > 0) {
      this.log(`Fetching inapp: ${INAPP_SKUS.join(', ')}`);
      try {
        const inapp = await iapModule.fetchProducts({ skus: INAPP_SKUS, type: 'inapp' });
        this.log(`✅ Got ${inapp.length} in-app product(s)`);
        results.push(...inapp);
      } catch (e: any) {
        this.log(`fetchProducts(inapp) failed: ${e?.message}`);
      }
    }

    if (results.length === 0) {
      this.log('========== NO PRODUCTS FOUND ==========');
      this.log('Checklist:');
      this.log('  1. Product IDs match App Store Connect exactly');
      this.log('  2. Products are "Ready to Submit" or "Approved"');
      this.log('  3. Sandbox Apple ID signed into device');
      this.log(`  Requested: ${ALL_PRODUCT_IDS.join(', ')}`);
    }

    return results;
  }

  // ── Purchase ───────────────────────────────────────────────────────────────

  async purchaseProduct(productId: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('IAP not available');
    if (!this.isConnected) await this.initialize();

    // Determine purchase type from product ID
    const type = INAPP_SKUS.includes(productId) ? 'inapp' : 'subs';

    this.currentPurchaseProductId = productId;
    await AsyncStorage.setItem(INFLIGHT_KEY, 'true');

    const purchasePromise = new Promise<void>((resolve, reject) => {
      this.purchasePromiseResolve = resolve;
      this.purchasePromiseReject = reject;
      // 60s timeout
      setTimeout(async () => {
        if (this.purchasePromiseReject) {
          await AsyncStorage.setItem(INFLIGHT_KEY, 'false');
          this.purchasePromiseReject(new Error('Purchase timeout'));
          this.purchasePromiseResolve = null;
          this.purchasePromiseReject = null;
        }
      }, 60000);
    });

    try {
      this.plog(`requestPurchase — sku: ${productId} type: ${type}`);
      await iapModule.requestPurchase({
        type,
        request: { apple: { sku: productId } },
      });
      this.debugCallback?.({ listenerStatus: 'PURCHASE INITIATED — WAITING ⏳' });
      await purchasePromise;
      this.plog('✅ Purchase complete');
    } catch (e: any) {
      await AsyncStorage.setItem(INFLIGHT_KEY, 'false');
      this.currentPurchaseProductId = null;
      this.purchasePromiseResolve = null;
      this.purchasePromiseReject = null;
      this.debugCallback?.({ listenerStatus: 'PURCHASE FAILED ❌' });
      if (e?.code === 'E_USER_CANCELLED' || e?.message?.includes('cancel')) {
        throw new Error('User cancelled purchase');
      }
      throw e;
    }
  }

  // ── Restore ────────────────────────────────────────────────────────────────

  async restorePurchases(): Promise<any[]> {
    if (!this.isAvailable()) throw new Error('IAP not available');
    if (!this.isConnected) await this.initialize();

    await AsyncStorage.setItem(INFLIGHT_KEY, 'true');
    try {
      const purchases = await iapModule.getAvailablePurchases();
      if (!purchases?.length) {
        await AsyncStorage.setItem(INFLIGHT_KEY, 'false');
        throw new Error('No previous purchases found');
      }
      for (const p of purchases) await this.processPurchase(p, 'restore');
      await AsyncStorage.setItem(INFLIGHT_KEY, 'false');
      return purchases;
    } catch (e) {
      await AsyncStorage.setItem(INFLIGHT_KEY, 'false');
      throw e;
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  /** Called from _layout.tsx as iapService.destroy() */
  async destroy(): Promise<void> {
    await this.cleanup();
  }

  async cleanup(): Promise<void> {
    if (!this.isAvailable()) return;
    this.purchaseUpdateSubscription?.remove();
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription?.remove();
    this.purchaseErrorSubscription = null;
    if (this.isConnected) {
      await iapModule.endConnection();
      this.isConnected = false;
    }
    this.hasListener = false;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private log(msg: string) {
    const ts = new Date().toLocaleTimeString();
    this.productFetchLogs.push(`[${ts}] ${msg}`);
    console.log('[IAP]', msg);
  }

  private plog(msg: string) {
    const ts = new Date().toLocaleTimeString();
    const entry = `[${ts}] ${msg}`;
    this.purchaseLogs.push(entry);
    console.log('[IAP-PURCHASE]', msg);
    this.debugCallback?.({ purchaseLog: entry, allPurchaseLogs: [...this.purchaseLogs] });
  }

  private setupPurchaseListeners() {
    if (!this.isAvailable()) return;

    this.purchaseUpdateSubscription = iapModule.purchaseUpdatedListener(
      async (purchase: any) => {
        this.plog(`purchaseUpdatedListener — productId=${purchase?.productId} id=${purchase?.id}`);
        this.debugCallback?.({ listenerStatus: 'PURCHASE RECEIVED ✅' });
        await this.handlePurchaseUpdate(purchase);
      }
    );

    this.purchaseErrorSubscription = iapModule.purchaseErrorListener(
      (error: any) => {
        this.plog(`purchaseErrorListener: ${error?.message} (code=${error?.code})`);
        this.debugCallback?.({ listenerStatus: `PURCHASE ERROR ❌: ${error.message}` });
        this.currentPurchaseProductId = null;
        AsyncStorage.setItem(INFLIGHT_KEY, 'false');
        if (this.purchasePromiseReject) {
          this.purchasePromiseReject(new Error(error.message));
          this.purchasePromiseResolve = null;
          this.purchasePromiseReject = null;
        }
      }
    );

    console.log('[IAP] Purchase listeners registered');
  }

  private async handlePurchaseUpdate(purchase: any) {
    try {
      await this.processPurchase(purchase, 'listener');
      if (this.purchasePromiseResolve) {
        this.purchasePromiseResolve();
        this.purchasePromiseResolve = null;
        this.purchasePromiseReject = null;
      }
    } catch (e) {
      console.error('[IAP] handlePurchaseUpdate error:', e);
      if (this.purchasePromiseReject) {
        this.purchasePromiseReject(e);
        this.purchasePromiseResolve = null;
        this.purchasePromiseReject = null;
      }
    }
  }

  private async checkForPendingPurchases() {
    try {
      const purchases = await iapModule.getAvailablePurchases();
      if (purchases?.length > 0) {
        console.log(`[IAP] Found ${purchases.length} pending purchase(s)`);
        for (const p of purchases) {
          const txId = p.id ?? p.transactionId;
          if (txId && !this.processedIds.has(txId)) {
            await this.processPurchase(p, 'orphan');
          }
        }
      }
    } catch (e) {
      console.error('[IAP] checkForPendingPurchases error:', e);
    }
  }

  private async processPurchase(
    purchase: any,
    source: 'listener' | 'restore' | 'orphan'
  ): Promise<boolean> {
    const txId = purchase.id ?? purchase.transactionId;
    this.plog(`processPurchase — source=${source} txId=${txId} productId=${purchase?.productId}`);

    if (!txId) { this.plog('❌ No txId — skipping'); return false; }
    if (this.processedIds.has(txId)) { this.plog('⚠️ Already processed — skipping'); return false; }

    try {
      // Determine plan from product ID
      const productId: string = purchase.productId ?? '';
      const plan = productId.includes('lifetime') ? 'lifetime' : 'monthly';

      const inFlightRaw = await AsyncStorage.getItem(INFLIGHT_KEY);
      const inFlight = inFlightRaw === 'true';
      const shouldEntitle =
        (source === 'listener' && inFlight) ||
        source === 'restore' ||
        source === 'orphan';

      this.plog(`  inFlight=${inFlight} shouldEntitle=${shouldEntitle} plan=${plan}`);

      // If listener fires but no active purchase (re-delivered old transaction),
      // just finish it to clear the StoreKit queue without granting entitlement.
      if (source === 'listener' && !inFlight) {
        this.plog('⚠️ inFlight=false — finishing transaction without entitlement');
        try {
          await iapModule.finishTransaction({ purchase, isConsumable: false });
        } catch {}
        return false;
      }

      this.processedIds.add(txId);

      if (shouldEntitle) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated — cannot grant entitlement');

        const effectiveProductId = (source === 'listener' && this.currentPurchaseProductId)
          ? this.currentPurchaseProductId
          : purchase.productId;

        this.plog(`→ Calling validate-receipt (productId=${effectiveProductId} txId=${txId})`);

        const { error: fnError } = await supabase.functions.invoke('validate-receipt', {
          body: { productId: effectiveProductId, transactionId: txId, source },
        });

        if (fnError) {
          this.plog(`❌ validate-receipt error: ${JSON.stringify(fnError)}`);
          throw fnError;
        }
        this.plog('✅ validate-receipt success');

        // Cache locally so the app can read subscription state without a network call
        await AsyncStorage.multiSet([
          ['profile.subscription_plan', plan],
          ['profile.is_pro_version', 'true'],
          ['profile.entitlement', 'pro'],
        ]);
        this.plog('✅ AsyncStorage local cache updated');
      }

      await iapModule.finishTransaction({ purchase, isConsumable: false });
      this.plog('✅ finishTransaction complete');

      if (shouldEntitle) {
        await AsyncStorage.setItem(INFLIGHT_KEY, 'false');
        this.currentPurchaseProductId = null;
        this.debugCallback?.({ listenerStatus: 'PURCHASE SUCCESS! ✅', purchaseComplete: true });
        this.plog('🎉 Entitlement granted');
      }

      return shouldEntitle;
    } catch (e: any) {
      this.plog(`❌ processPurchase threw: ${e?.message ?? String(e)}`);
      await AsyncStorage.setItem(INFLIGHT_KEY, 'false');
      throw e;
    }
  }
}

export const iapService = IAPService.getInstance();
export default iapService;
