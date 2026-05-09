import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
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
  primary: '#556B2F',
  surface: '#F6F3EA',
  surfaceContainerLow: '#EDE7D9',
  secondaryContainer: '#D4C89A',
  onSurface: '#3F3426',
  onSurfaceVariant: '#5C4F3A',
  outline: '#7A6E5A',
  badge: '#3D5226',
  accent: '#C97B63',
};

const TESTIMONIALS = [
  { quote: "I finally have all of grandma's recipes in one place. This app is a treasure.", name: 'Renata', age: 42, stars: 5 },
  { quote: "My kids will always have access to our family traditions. Worth every penny.", name: 'Marcus', age: 38, stars: 5 },
  { quote: "So easy to use. I saved 30 recipes from my mom before she passed. Priceless.", name: 'Delores', age: 61, stars: 5 },
];
const T_CARD_W = 220;
const T_GAP = 12;
const T_TOTAL = (T_CARD_W + T_GAP) * TESTIMONIALS.length;

type PlanKey = 'monthly' | 'lifetime';

// ── Debug Worm ───────────────────────────────────────────────────────────────
function DebugWorm({ logs, listenerStatus }: { logs: string[]; listenerStatus: string }) {
  const [expanded, setExpanded] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => pan.flattenOffset(),
    })
  ).current;

  const statusColor = listenerStatus.includes('✅') || listenerStatus.includes('SUCCESS')
    ? '#4CAF50'
    : listenerStatus.includes('❌') || listenerStatus.includes('FAILED')
    ? '#F44336'
    : listenerStatus.includes('⏳')
    ? '#FF9800'
    : '#90CAF9';

  if (!expanded) {
    return (
      <Animated.View
        style={[dbs.worm, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity onPress={() => setExpanded(true)} activeOpacity={0.85} style={dbs.wormPill}>
          <View style={[dbs.wormDot, { backgroundColor: statusColor }]} />
          <Text style={dbs.wormLabel} numberOfLines={1}>IAP Debug</Text>
          <MaterialIcons name="bug-report" size={14} color="#90CAF9" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[dbs.panel, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <View style={dbs.panelHeader}>
        <View style={dbs.panelTitleRow}>
          <MaterialIcons name="bug-report" size={14} color="#90CAF9" />
          <Text style={dbs.panelTitle}>IAP Debug</Text>
        </View>
        <TouchableOpacity onPress={() => setExpanded(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={16} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={dbs.statusRow}>
        <View style={[dbs.wormDot, { backgroundColor: statusColor }]} />
        <Text style={[dbs.statusText, { color: statusColor }]} numberOfLines={2}>{listenerStatus || 'Idle'}</Text>
      </View>
      <ScrollView style={dbs.logScroll} showsVerticalScrollIndicator={false}>
        {logs.length === 0
          ? <Text style={dbs.logEmpty}>No logs yet</Text>
          : [...logs].reverse().map((l, i) => (
              <Text key={i} style={dbs.logLine}>{l}</Text>
            ))
        }
      </ScrollView>
    </Animated.View>
  );
}

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

  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [listenerStatus, setListenerStatus] = useState('Idle');

  const isRestoringRef = useRef(false);
  const marqueeX = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Wire up IAP debug callback
  useEffect(() => {
    iapService.setDebugCallback((info: any) => {
      if (info.listenerStatus) setListenerStatus(info.listenerStatus);
      if (info.purchaseLog) {
        setDebugLogs((prev) => [...prev, info.purchaseLog]);
      }
      if (info.allPurchaseLogs) {
        setDebugLogs(info.allPurchaseLogs);
      }
    });
    return () => iapService.setDebugCallback(() => {});
  }, []);

  // Testimonial marquee
  useEffect(() => {
    Animated.loop(
      Animated.timing(marqueeX, {
        toValue: -T_TOTAL,
        duration: 24000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const results = await iapService.getProducts();
        setProducts(results);
        setIapReady(true);
        const fetchLogs = iapService.getProductFetchLogs();
        if (fetchLogs.length) setDebugLogs((prev) => [...prev, ...fetchLogs]);
        setListenerStatus(results.length > 0 ? `✅ ${results.length} product(s) loaded` : '❌ No products returned');
      } catch (e: any) {
        if (iapService.isAvailable()) setIapReady(false);
        setDebugLogs((prev) => [...prev, `fetchProducts error: ${e?.message}`]);
        setListenerStatus('❌ Product fetch failed');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
    // If IAP module not linked (Expo Go), mark ready so UI is not locked
    if (!iapService.isAvailable()) setIapReady(true);
  }, []);

  // ── DEV simulation ──────────────────────────────────────────────────────────
  async function simulatePurchase(plan: PlanKey) {
    setPurchasing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
      }
      // No user yet — they'll create an account in the next modal
    } finally {
      setPurchasing(false);
      showAccountModal();
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleContinue() {
    if (!iapService.isAvailable()) {
      // IAP module not linked (Expo Go / web) — use simulation
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
      showAccountModal();
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
          { text: 'Continue', onPress: () => { isRestoringRef.current = false; showAccountModal(); } },
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
    router.replace('/onboarding');
  }

  function dismissDiscount() {
    Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => {
      setDiscountVisible(false);
      router.replace('/onboarding');
    });
  }

  function showAccountModal() {
    router.replace('/(home)/home');
    router.push('/account-promo');
  }

  const ctaLabel = !iapReady || loadingProducts ? 'Loading...' : purchasing ? 'Processing...' : 'Start Saving Recipes';
  const ctaDisabled = !iapReady || loadingProducts || purchasing;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleClose} style={s.iconBtn} activeOpacity={0.7}>
          <MaterialIcons name="close" size={22} color={C.onSurfaceVariant} />
        </TouchableOpacity>
        <View style={{ width: 36 }} />
        <TouchableOpacity onPress={handleRestore} activeOpacity={0.7}>
          <Text style={s.restore}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={s.iconWrap}>
          <Image source={require('../assets/icon.png')} style={s.appIcon} />
        </View>

        <Text style={s.title}>Never Lose Another{'\n'}Family Recipe</Text>

        <Text style={s.subtitle}>
          Some things are too precious to forget... Keep all the meals, memories, and traditions you love!
        </Text>

        {/* Plan cards */}
        <View style={[s.plans, { width: '100%', marginTop: 16, marginBottom: 16 }]}>
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
                    {!!plan.period && <Text style={s.planPeriod}>{plan.period}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Testimonials title */}
        <Text style={s.testimonialTitle}>
          <Text style={s.testimonialTitleBlue}>The easiest way{'\n'}</Text>
          to save & share loved family meals.
        </Text>

        {/* Testimonials marquee */}
        <View style={s.testimonialTrack}>
          <Animated.View style={[s.testimonialRow, { transform: [{ translateX: marqueeX }] }]}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <View key={i} style={s.testimonialCard}>
                <View style={s.testimonialStars}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <MaterialIcons key={si} name="star" size={14} color="#F4A936" />
                  ))}
                </View>
                <Text style={s.testimonialQuote}>{t.quote}</Text>
                <View style={s.testimonialFooter}>
                  <View style={s.testimonialAvatar}>
                    <MaterialIcons name="person" size={16} color={C.outline} />
                  </View>
                  <Text style={s.testimonialName}>{t.name}, {t.age}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Features title */}
        <Text style={s.featuresTitle}>Everything you need</Text>

        {/* Features */}
        <View style={s.features}>
          {[
            'Keep recipes organized forever',
            'Access recipes anytime you cook',
            'Share recipes with family members',
            'Preserve traditions across generations',
          ].map((f) => (
            <View key={f} style={s.featureRow}>
              <MaterialIcons name="check-circle" size={20} color={C.primary} />
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

      </Animated.ScrollView>

      {/* Fixed bottom: button */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.ctaBtn, ctaDisabled && s.ctaBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={ctaDisabled}
        >
          <Text style={s.ctaText}>{ctaLabel}</Text>
          {!ctaDisabled && <MaterialIcons name="arrow-forward" size={18} color="#fff" />}
        </TouchableOpacity>
        <Text style={s.cancelText}>{selectedPlan === 'lifetime' ? 'One Purchase. Lifetime Access.' : 'Cancel Anytime. No Commitment.'}</Text>
      </View>

      {/* Debug worm — floating draggable log panel */}
      <DebugWorm logs={debugLogs} listenerStatus={listenerStatus} />

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
                <Text style={s.discountSkipText}>No thanks, go back</Text>
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
  restore: { fontSize: 11, color: '#ABABAB', fontWeight: '400' },

  scroll: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },

  iconWrap: {
    width: 100, height: 100, borderRadius: 22,
    overflow: 'hidden', marginBottom: 20,
  },
  appIcon: { width: '100%', height: '100%' },

  title: {
    fontSize: 30, fontWeight: '800', color: C.onSurface,
    textAlign: 'center', letterSpacing: -0.8, lineHeight: 36, marginBottom: 12,
  },
  subtitle: {
    fontSize: 15, fontWeight: '500', color: C.onSurfaceVariant,
    textAlign: 'center', lineHeight: 22, maxWidth: 340, marginBottom: 24,
  },

  featuresTitle: {
    fontSize: 22, fontWeight: '800', color: '#3A7BD5', fontStyle: 'italic',
    textAlign: 'center', marginBottom: 16, marginTop: 8,
  },
  features: { width: '100%', gap: 10, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 15, color: C.onSurface, fontWeight: '500', flex: 1 },

  testimonialTrack: { width: '100%', overflow: 'hidden', marginBottom: 24 },
  testimonialTitle: {
    fontSize: 22, fontWeight: '800', color: C.onSurface,
    textAlign: 'center', lineHeight: 30, marginBottom: 16, marginTop: 24, paddingVertical: 12,
  },
  testimonialTitleBlue: { color: '#3A7BD5', fontStyle: 'italic' },
  testimonialRow: { flexDirection: 'row', gap: T_GAP },
  testimonialCard: {
    width: T_CARD_W, backgroundColor: '#FAFAF7', borderRadius: 14,
    padding: 14, borderLeftWidth: 3, borderLeftColor: C.primary,
  },
  testimonialStars: { flexDirection: 'row', gap: 2, marginBottom: 8 },
  testimonialQuote: { fontSize: 12, color: C.onSurface, lineHeight: 18, fontStyle: 'italic', marginBottom: 10 },
  testimonialFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  testimonialAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
  },
  testimonialName: { fontSize: 11, color: C.onSurface, fontWeight: '600' },

  plans: { width: '100%', gap: 12, marginBottom: 12 },
  planCard: {
    borderRadius: 14, borderWidth: 1.5, borderColor: '#C8D4A0',
    backgroundColor: '#F8FAF0', padding: 16, paddingTop: 20,
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
    borderTopWidth: 1, borderTopColor: '#D0D9B0',
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#E8900A', paddingVertical: 18, borderRadius: 999,
    shadowColor: '#E8900A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  cancelText: { fontSize: 12, color: C.outline, textAlign: 'center', marginTop: 8 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  discountSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40, alignItems: 'center',
  },
  discountHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#B8C898', alignSelf: 'center', marginBottom: 20,
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

const dbs = StyleSheet.create({
  worm: {
    position: 'absolute', top: 60, right: 12, zIndex: 999,
  },
  wormPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(20,20,30,0.88)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#334',
  },
  wormDot: { width: 8, height: 8, borderRadius: 4 },
  wormLabel: { fontSize: 11, color: '#ccc', fontWeight: '600' },

  panel: {
    position: 'absolute', top: 60, right: 12, zIndex: 999,
    width: 280, maxHeight: 320,
    backgroundColor: 'rgba(16,16,24,0.95)', borderRadius: 14,
    borderWidth: 1, borderColor: '#334', overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panelTitle: { fontSize: 12, fontWeight: '700', color: '#90CAF9' },
  statusRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2a',
  },
  statusText: { fontSize: 11, fontWeight: '600', flex: 1 },
  logScroll: { maxHeight: 220, paddingHorizontal: 12, paddingVertical: 6 },
  logEmpty: { fontSize: 11, color: '#555', fontStyle: 'italic' },
  logLine: {
    fontSize: 10, color: '#aaa', fontFamily: 'monospace',
    lineHeight: 15, marginBottom: 2,
  },
});
