/**
 * components/paywall/PaywallScreen.tsx — Subscription Paywall
 *
 * RELATED FILES:
 *   - services/IAPService.ts   → All purchase logic lives here, not in this file
 *   - constants/iap.ts         → PLANS array drives the UI; PRODUCT_IDS used by IAPService
 *   - app/_layout.tsx          → IAPService.init() must be called before this screen renders
 *   - context/AuthContext.tsx  → Optionally gate paywall behind auth (useAuth)
 *
 * HOW IT WORKS:
 *   1. On mount, fetches live product data from App Store via IAPService.getProducts()
 *   2. Falls back to static prices in constants/iap.ts if fetch fails (e.g. simulator)
 *   3. User taps a plan → IAPService.purchase(productId) is called
 *   4. The purchaseUpdatedListener in IAPService (set up in _layout.tsx) handles the result
 *   5. onSuccess prop is called → navigate away / unlock content
 *
 * ⚠️ TESTING NOTE:
 *   IAP does NOT work in Expo Go or the iOS Simulator.
 *   You need a real device + a TestFlight or production build.
 *   Use a Sandbox Tester account (App Store Connect → Users & Access → Sandbox).
 *
 * ⚠️ UI NOTE:
 *   This is a barebones functional shell. Style it to match your app.
 *   The `highlight` flag in PLANS can drive a "Best Value" badge.
 */

import { PLANS } from "@/constants/iap";
import { iapService, getIAPLogs, setIAPLogListener } from "@/services/IAPService";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Subscription } from "react-native-iap";

type Props = {
  onSuccess: () => void;
  onDismiss: () => void;
};

export default function PaywallScreen({ onSuccess, onDismiss }: Props) {
  const [products, setProducts] = useState<Subscription[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    PLANS.find((p) => p.highlight)?.id ?? PLANS[0].id
  );
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState(getIAPLogs());
  const [titleTaps, setTitleTaps] = useState(0);

  useEffect(() => {
    setIAPLogListener(() => setDebugLogs(getIAPLogs()));
    return () => setIAPLogListener(null);
  }, []);

  const handleTitleTap = () => {
    const next = titleTaps + 1;
    setTitleTaps(next);
    if (next >= 5) {
      setDebugVisible((v) => !v);
      setTitleTaps(0);
    }
  };

  useEffect(() => {
    const isProduction = !__DEV__;
    if (!isProduction) {
      setLoading(false); // show static prices from constants/iap.ts
      return;
    }
    iapService.getProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  /**
   * Returns live price string from App Store if available,
   * otherwise falls back to the static price in constants/iap.ts.
   */
  const getPriceForPlan = (planId: string): string => {
    const live = products.find((p) => (p as any).id === planId);
    if (live?.localizedPrice) return live.localizedPrice;
    return PLANS.find((p) => p.id === planId)?.price ?? "";
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // purchase() resolves only after finishTransaction confirms the purchase
      await iapService.purchase(selectedId);
      onSuccess();
    } catch (err: any) {
      Alert.alert("Purchase Failed", err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={handleTitleTap}>
        <Text style={styles.title}>Unlock Pro</Text>
      </Pressable>
      <Text style={styles.subtitle}>Get full access to all features</Text>

      {debugVisible && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>IAP Debug Log</Text>
          <ScrollView style={styles.debugScroll} nestedScrollEnabled>
            {debugLogs.length === 0 ? (
              <Text style={styles.debugRow}>No events yet</Text>
            ) : (
              [...debugLogs].reverse().map((log, i) => (
                <Text key={i} style={styles.debugRow}>
                  <Text style={styles.debugTime}>{log.time} </Text>{log.msg}
                </Text>
              ))
            )}
          </ScrollView>
          <Pressable onPress={() => setDebugVisible(false)}>
            <Text style={styles.debugClose}>Close</Text>
          </Pressable>
        </View>
      )}

      {/* Feature bullets — customize these */}
      <View style={styles.features}>
        {["✦ Feature one", "✦ Feature two", "✦ Feature three"].map((f) => (
          <Text key={f} style={styles.featureText}>
            {f}
          </Text>
        ))}
      </View>

      {/* Plan selector */}
      {PLANS.map((plan) => (
        <Pressable
          key={plan.id}
          style={[styles.planCard, selectedId === plan.id && styles.planCardSelected]}
          onPress={() => setSelectedId(plan.id)}
        >
          <View>
            <Text style={styles.planLabel}>{plan.label}</Text>
            {plan.highlight && <Text style={styles.badge}>Most Popular</Text>}
          </View>
          <Text style={styles.planPrice}>
            {getPriceForPlan(plan.id)}
            <Text style={styles.planPeriod}> {plan.period}</Text>
          </Text>
        </Pressable>
      ))}

      {/* CTA */}
      <Pressable
        style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
        onPress={handlePurchase}
        disabled={purchasing}
      >
        {purchasing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>Subscribe Now</Text>
        )}
      </Pressable>

      {/* Legal */}
      <Text style={styles.legal}>
        Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current
        period. Manage or cancel anytime in your Apple ID settings.
      </Text>

      <Pressable onPress={onDismiss}>
        <Text style={styles.dismiss}>No thanks</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 60, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 24 },
  features: { width: "100%", marginBottom: 24, gap: 8 },
  featureText: { fontSize: 15 },
  planCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planCardSelected: { borderColor: "#6366f1", backgroundColor: "#eef2ff" },
  planLabel: { fontSize: 16, fontWeight: "600" },
  badge: { fontSize: 11, color: "#6366f1", fontWeight: "600", marginTop: 2 },
  planPrice: { fontSize: 16, fontWeight: "700" },
  planPeriod: { fontSize: 13, fontWeight: "400", color: "#666" },
  ctaButton: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  legal: { fontSize: 11, color: "#999", textAlign: "center", marginBottom: 16 },
  dismiss: { fontSize: 14, color: "#999" },
  debugPanel: {
    width: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  debugTitle: { color: "#94a3b8", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  debugScroll: { maxHeight: 200 },
  debugRow: { color: "#e2e8f0", fontSize: 10, fontFamily: "monospace", marginBottom: 3 },
  debugTime: { color: "#64748b" },
  debugClose: { color: "#6366f1", fontSize: 12, textAlign: "right", marginTop: 8 },
});
