import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  primary: '#556B2F',
  surface: '#F6F3EA',
  surfaceContainerLow: '#EDE7D9',
  secondaryContainer: '#D4C89A',
  onSurface: '#3F3426',
  onSurfaceVariant: '#5C4F3A',
  outline: '#7A6E5A',
  onPrimary: '#ffffff',
  accent: '#C97B63',
};

const CARD_IMAGES = [
  require('../assets/onboarding1.png'),
  require('../assets/onboarding4.png'),
  require('../assets/onboarding3.png'),
];

const CARD_TRANSFORMS = [
  { rotate: '-10deg', translateX: -50 },
  { rotate: '0deg',   translateX: 0 },
  { rotate: '10deg',  translateX: 50 },
];

function CardSpreadMockups() {
  const opacities = useRef(CARD_IMAGES.map(() => new Animated.Value(0))).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    function runSequence() {
      opacities.forEach((op) => op.setValue(0));

      const fadeIns = CARD_IMAGES.map((_, i) =>
        Animated.sequence([
          Animated.delay(i * 700),
          Animated.timing(opacities[i], { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );

      animRef.current = Animated.sequence([
        Animated.parallel(fadeIns),
        Animated.delay(4500),
      ]);

      animRef.current.start(({ finished }) => {
        if (finished) runSequence();
      });
    }

    runSequence();
    return () => { animRef.current?.stop(); };
  }, []);

  const cardW = SCREEN_WIDTH * 0.42;
  const cardH = cardW * 2.1;

  return (
    <View style={[s.cardContainer, { height: cardH }]}>
      {CARD_IMAGES.map((src, i) => (
        <Animated.Image
          key={i}
          source={src}
          style={[
            s.card,
            { width: cardW, height: cardH },
            {
              opacity: opacities[i],
              transform: [
                { rotate: CARD_TRANSFORMS[i].rotate },
                { translateX: CARD_TRANSFORMS[i].translateX },
              ],
            },
          ]}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const SLIDES = [
  {
    id: '1',
    icon: 'menu-book' as const,
    headline: 'Welcome to Your Cookbook',
    sub: 'Save recipes, share favorite meals, & keep every tradition alive!',
  },
  {
    id: '2',
    icon: 'people' as const,
    headline: 'Cook as a\nFamily',
    sub: 'Organize recipes by family member. Mom, Dad, Grandma — everyone has their own collection.',
  },
  {
    id: '3',
    icon: 'outdoor-grill' as const,
    headline: 'Step-by-Step\nCook Mode',
    sub: 'Follow along live while you cook. Walk through every step without losing your place.',
  },
];


import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { createProfile } from '@/services/ProfileService';
import RecipeCardGrid from '@/components/RecipeCardGrid';

export default function Onboarding() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }
  const anonSignInFired = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    // Fire anonymous sign-in when reaching slide 3 (index 2), only once
    if (activeIndex === 2 && !anonSignInFired.current && !user) {
      anonSignInFired.current = true;
      const email = `anon_${Date.now()}@anon.com`;
      const password = Math.random().toString(36).slice(2);
      supabase.auth.signUp({ email, password })
        .then(async ({ data, error }) => {
          if (data?.user) {
            await createProfile(data.user.id, email);
          }
        });
    }
  }, [activeIndex, user]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.push({ pathname: '/confirmation', params: { goals: JSON.stringify(selectedGoals) } });
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;
  const isFirst = activeIndex === 0;

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        renderItem={({ item, index }) => (
          <View style={s.slide}>
            {index === 0 ? (
              <>
                <View style={s.brandRow}>
                  <Image source={require('../assets/icon.png')} style={s.brandIcon} />
                  <Text style={s.brandText}>The Family Cookbook</Text>
                </View>
                <Text style={s.headline}>{item.headline}</Text>
                <CardSpreadMockups />
                <Text style={s.sub}>{item.sub}</Text>
              </>
            ) : index === 1 ? (
              <>
                <Text style={s.slide2Title}>Keep every <Text style={s.slide2Italic}>memory</Text> alive, forever.</Text>
                <View style={{ height: SCREEN_WIDTH * 1.1, width: SCREEN_WIDTH, marginHorizontal: -40 }}>
                  <RecipeCardGrid />
                </View>
              </>

            ) : (
              <View style={s.goalsContainer}>
                <Text style={s.goalsTitle}>What are your goals?</Text>
                <Text style={s.goalsSub}>Select all that apply.</Text>
                <View style={s.goalsList}>
                  {[
                    { id: 'save',     emoji: '📖', label: 'Save Family Recipes' },
                    { id: 'cook',     emoji: '🍳', label: 'Cook More' },
                    { id: 'healthy',  emoji: '🥗', label: 'Eat Healthier' },
                    { id: 'organize', emoji: '🗂️', label: 'Stay Organized' },
                    { id: 'share',   emoji: '❤️', label: 'Save Favorite Meals' },
                    { id: 'store',    emoji: '🔒', label: 'Store Recipes Safely' },
                    { id: 'connect',  emoji: '👨‍👩‍👧', label: 'Connect with Family / Friends' },
                    { id: 'other',    emoji: '✨', label: 'Other' },
                  ].map((goal) => {
                    const selected = selectedGoals.includes(goal.id);
                    return (
                      <TouchableOpacity
                        key={goal.id}
                        style={[s.goalItem, selected && s.goalItemSelected]}
                        onPress={() => toggleGoal(goal.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={s.goalEmoji}>{goal.emoji}</Text>
                        <Text style={[s.goalLabel, selected && s.goalLabelSelected]}>{goal.label}</Text>
                        {selected && <MaterialIcons name="check" size={18} color={C.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      />

      <View style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={s.button} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.buttonText}>{isFirst ? 'Get Started' : 'Next'}</Text>
          <MaterialIcons name="arrow-forward" size={18} color={C.onSurface} />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={() => router.push('/signin')} activeOpacity={0.7}>
            <Text style={s.skip}>Already have an account? <Text style={s.skipSignIn}>Sign in</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },

  slide: {
    width: SCREEN_WIDTH, flex: 1,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 28,
  },

  brandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 4,
  },
  brandIcon: { width: 36, height: 36, borderRadius: 8 },
  brandText: { fontSize: 26, fontFamily: 'GreatVibes_400Regular', color: C.onSurface },
  cardContainer: {
    width: SCREEN_WIDTH * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { position: 'absolute' },

  iconWrap: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: C.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.secondaryContainer,
  },

  headline: {
    fontSize: 42, fontWeight: '800', color: C.onSurface,
    textAlign: 'center', letterSpacing: -1.2, lineHeight: 48,
  },

  sub: {
    fontSize: 16, fontWeight: '500', fontStyle: 'italic',
    color: C.onSurfaceVariant, textAlign: 'center',
    lineHeight: 24, maxWidth: 300,
  },

  bottom: { paddingHorizontal: 32, paddingBottom: 24, gap: 16, alignItems: 'center' },

  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#BAC898' },
  dotActive: { width: 24, borderRadius: 4, backgroundColor: C.primary },

  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.secondaryContainer,
    paddingVertical: 18, paddingHorizontal: 48,
    borderRadius: 999, width: '100%',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  buttonText: { fontSize: 17, fontWeight: '800', color: C.onSurface, letterSpacing: -0.2 },

  goalsContainer: { flex: 1, alignSelf: 'stretch', gap: 12, justifyContent: 'flex-start', paddingTop: 8, marginHorizontal: -16 },
  goalsBack: { alignSelf: 'flex-start', marginBottom: 4 },
  goalsTitle: { fontSize: 33, fontWeight: '800', color: C.onSurface, letterSpacing: -1, lineHeight: 40, textAlign: 'center', paddingTop: 24 },
  goalsSub: { fontSize: 14, color: C.outline, fontWeight: '500', marginTop: -4, textAlign: 'center' },
  goalsList: { gap: 10, marginTop: 24 },
  goalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 18, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E0CE',
    backgroundColor: '#ffffff',
  },
  goalItemSelected: { borderColor: C.primary, backgroundColor: '#EEF2E6' },
  goalEmoji: { fontSize: 18 },
  goalLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.onSurfaceVariant },
  goalLabelSelected: { color: C.primary },
  familyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 24 },
  familyMember: { alignItems: 'flex-start', gap: 8 },
  familySquare: { width: 90, height: 90, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  familyInitial: { fontSize: 36, fontWeight: '800', color: '#3D3D3D' },
  familyName: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  familyCount: { fontSize: 12, color: C.outline, fontWeight: '500' },
  slide2Title: { fontSize: 36, fontWeight: '800', color: C.onSurface, textAlign: 'center', letterSpacing: -1.2, lineHeight: 42 },
  slide2Italic: { fontStyle: 'italic' },
  skip: { fontSize: 14, color: C.outline, fontWeight: '500' },
  skipSignIn: { color: '#2B2B2B', fontStyle: 'italic' },
});
