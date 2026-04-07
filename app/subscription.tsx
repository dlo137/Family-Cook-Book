import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { iapService } from '@/services/IAPService';
import { PRODUCT_IDS, PLANS } from '@/constants/iap';

const C = {
  primary: '#9c3f10',
  surface: '#fff8f3',
  surfaceContainerLow: '#fff2e2',
  secondaryContainer: '#fecb98',
  onSurface: '#221a0f',
  onSurfaceVariant: '#56423a',
  outline: '#8a7269',
  badge: '#c0440f',
};

type PlanKey = 'monthly' | 'lifetime';

export default function Subscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('lifetime');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [iapReady, setIapReady] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [discountVisible, setDiscountVisible] = useState(false);

  const isRestoringRef = useRef(false);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const results = await iapService.getProducts();
        setProducts(results);
        setIapReady(true);
      } catch {
        setIapReady(false);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
    // In __DEV__ getProducts() returns [] immediately, still mark ready
    if (__DEV__) setIapReady(true);
  }, []);

  // ── DEV simulation ──────────────────────────────────────────────────────────
  async function simulatePurchase(plan: PlanKey) {
    setPurchasing(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Not authenticated');
      await supabase
        .from('profiles')
        .update({
          subscription_plan: plan,
          is_pro_version: true,
          entitlement: 'pro',
          subscription_id: `dev_${plan}_${Date.now()}`,
          purchase_time: new Date().toISOString(),
        })
        .eq('id', user.id);
      setPurchasing(false);
      router.replace('/(home)/home');
    } catch {
      setPurchasing(false);
      Alert.alert('Simulation Error', 'Could not simulate subscription. Are you logged in?');
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleContinue() {
    if (__DEV__ && products.length === 0) {
      await simulatePurchase(selectedPlan);
      return;
    }

    const plan = PLANS.find((p) => p.planKey === selectedPlan)!;
    const product = products.find((p: any) => (p.id ?? p.productId) === plan.id);
    if (!product) {
      Alert.alert('Plan unavailable', 'Could not find that plan. Check your connection and try again.');
      return;
    }

    setPurchasing(true);
    try {
      await iapService.purchaseProduct(product.id ?? product.productId);
      setPurchasing(false);
      router.replace('/(home)/home');
    } catch (err: any) {
      setPurchasing(false);
      const msg = String(err?.message || err);
      if (!msg.toLowerCase().includes('cancel')) {
        Alert.alert('Purchase Failed', msg || 'Unable to complete purchase. Please try again.');
      }
    }
  }

  async function handleRestore() {
    if (isRestoringRef.current) return;
    isRestoringRef.current = true;
    try {
      const results = await iapService.restorePurchases();
      if (results && results.length > 0) {
        Alert.alert('Restored', 'Your purchases have been restored!', [
          { text: 'Continue', onPress: () => { isRestoringRef.current = false; router.replace('/(home)/home'); } },
        ]);
      } else {
        isRestoringRef.current = false;
        Alert.alert('No Purchases', 'No previous purchases were found.');
      }
    } catch (err: any) {
      isRestoringRef.current = false;
      const msg = String(err?.message || err);
      Alert.alert('Restore Failed', msg.includes('No previous') ? 'No previous purchases were found.' : 'Something went wrong. Please try again.');
    }
  }

  function handleClose() {
    setDiscountVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }

  function dismissDiscount() {
    Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => {
      setDiscountVisible(false);
      router.replace('/(home)/home');
    });
  }

  const ctaLabel = !iapReady || loadingProducts ? 'Loading...' : purchasing ? 'Processing...' : 'Get Started';
  const ctaDisabled = !iapReady || loadingProducts || purchasing;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleClose} style={s.iconBtn} activeOpacity={0.7}>
          <MaterialIcons name="close" size={22} color={C.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestore} activeOpacity={0.7}>
          <Text style={s.restore}>Restore Purchases</Text>
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={s.iconWrap}>
          <MaterialIcons name="menu-book" size={52} color={C.primary} />
        </View>

        <Text style={s.title}>Family Cookbook{'\n'}Premium</Text>
        <Text style={s.subtitle}>
          Unlock unlimited family members, recipes, and the full cook mode experience.
        </Text>

        {/* Features */}
        <View style={s.features}>
          {[
            'Unlimited family member collections',
            'Full step-by-step cook mode',
            'Unlimited recipe storage',
            'Family sharing & collaboration',
          ].map((f) => (
            <View key={f} style={s.featureRow}>
              <MaterialIcons name="check-circle" size={20} color={C.primary} />
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plan cards */}
        <View style={s.plans}>
          {PLANS.map((plan) => {
            const active = selectedPlan === plan.planKey;
            const liveProduct = products.find((p: any) => (p.id ?? p.productId) === plan.id);
            const displayPrice = liveProduct?.localizedPrice ?? plan.price;

            return (
              <TouchableOpacity
                key={plan.planKey}
                style={[s.planCard, active && s.planCardActive]}
                onPress={() => setSelectedPlan(plan.planKey)}
                activeOpacity={0.8}
              >
                {plan.badge && (
                  <View style={s.badgeWrap}>
                    <Text style={s.badgeText}>{plan.badge}</Text>
                  </View>
                )}
                <View style={s.planRow}>
                  <View style={[s.radio, active && s.radioActive]}>
                    {active && <View style={s.radioInner} />}
                  </View>
                  <View style={s.planInfo}>
                    <Text style={[s.planLabel, active && s.planLabelActive]}>{plan.label}</Text>
                    <Text style={s.planDesc}>{plan.description}</Text>
                  </View>
                  <View style={s.planPricing}>
                    <Text style={[s.planPrice, active && s.planPriceActive]}>{displayPrice}</Text>
                    <Text style={s.planPeriod}>{plan.period}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.legal}>
          Payment will be charged to your Apple ID account. Subscriptions automatically renew unless
          cancelled at least 24 hours before the end of the current period. Lifetime purchase is a
          one-time payment with no recurring charges.
        </Text>
      </Animated.ScrollView>

      {/* Fixed bottom button */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.ctaBtn, ctaDisabled && s.ctaBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={ctaDisabled}
        >
          <Text style={s.ctaText}>{ctaLabel}</Text>
          {!ctaDisabled && <MaterialIcons name="arrow-forward" size={18} color={C.onSurface} />}
        </TouchableOpacity>
        <Text style={s.cancelText}>Cancel Anytime. No Commitment.</Text>
      </View>

      {/* Discount modal — shown when user tries to close */}
      <Modal transparent visible={discountVisible} animationType="fade">
        <Pressable style={s.overlay} onPress={dismissDiscount}>
          <Animated.View style={[s.discountSheet, { transform: [{ translateY: slideAnim }] }]}>
            <Pressable onPress={() => {}}>
              <View style={s.discountHandle} />
              <View style={s.discountIconWrap}>
                <MaterialIcons name="local-offer" size={36} color={C.primary} />
              </View>
              <Text style={s.discountTitle}>Before You Go</Text>
              <Text style={s.discountSub}>
                Keep your family's recipes safe and organized forever. The Lifetime plan is a single
                one-time payment — no monthly charges, ever.
              </Text>
              <TouchableOpacity
                style={s.discountBtn}
                onPress={() => {
                  setDiscountVisible(false);
                  setSelectedPlan('lifetime');
                  Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
                }}
                activeOpacity={0.85}
              >
                <Text style={s.discountBtnText}>View Lifetime Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={dismissDiscount} activeOpacity={0.6} style={s.discountSkip}>
                <Text style={s.discountSkipText}>No thanks, continue for free</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  restore: { fontSize: 13, color: C.outline, fontWeight: '500' },

  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },

  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.secondaryContainer, marginBottom: 20,
  },

  title: {
    fontSize: 30, fontWeight: '800', color: C.onSurface,
    textAlign: 'center', letterSpacing: -0.8, lineHeight: 36, marginBottom: 12,
  },
  subtitle: {
    fontSize: 15, fontWeight: '500', color: C.onSurfaceVariant,
    textAlign: 'center', lineHeight: 22, maxWidth: 300, marginBottom: 24,
  },

  features: { width: '100%', gap: 10, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 15, color: C.onSurface, fontWeight: '500', flex: 1 },

  plans: { width: '100%', gap: 12, marginBottom: 20 },
  planCard: {
    borderRadius: 14, borderWidth: 1.5, borderColor: '#e8d5c8',
    backgroundColor: '#fffaf6', padding: 16, paddingTop: 20,
  },
  planCardActive: { borderColor: C.primary, backgroundColor: C.surfaceContainerLow },

  badgeWrap: {
    position: 'absolute', top: -11, alignSelf: 'center',
    backgroundColor: C.badge, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.outline, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  planInfo: { flex: 1 },
  planLabel: { fontSize: 16, fontWeight: '700', color: C.onSurfaceVariant, marginBottom: 2 },
  planLabelActive: { color: C.primary },
  planDesc: { fontSize: 12, color: C.outline, fontWeight: '400' },

  planPricing: { alignItems: 'flex-end' },
  planPrice: { fontSize: 17, fontWeight: '800', color: C.onSurface },
  planPriceActive: { color: C.primary },
  planPeriod: { fontSize: 11, color: C.outline, marginTop: 1 },

  legal: {
    fontSize: 11, color: C.outline, textAlign: 'center', lineHeight: 16, maxWidth: 300,
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface, paddingHorizontal: 24, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#f0ddd0',
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.secondaryContainer, paddingVertical: 18, borderRadius: 999,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 17, fontWeight: '800', color: C.onSurface, letterSpacing: -0.2 },
  cancelText: { fontSize: 12, color: C.outline, textAlign: 'center', marginTop: 8 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  discountSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40, alignItems: 'center',
  },
  discountHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e0cfc6', alignSelf: 'center', marginBottom: 20,
  },
  discountIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center',
  },
  discountTitle: {
    fontSize: 22, fontWeight: '800', color: C.onSurface, textAlign: 'center', marginBottom: 12,
  },
  discountSub: {
    fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center',
    lineHeight: 20, marginBottom: 24, maxWidth: 280, alignSelf: 'center',
  },
  discountBtn: {
    backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: 999, width: '100%', alignItems: 'center', marginBottom: 14,
  },
  discountBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  discountSkip: { alignSelf: 'center' },
  discountSkipText: { fontSize: 13, color: C.outline, fontWeight: '500' },
});
