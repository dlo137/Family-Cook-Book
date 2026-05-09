import { useEffect, useRef, useState } from 'react';
import {
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

export default function Onboarding() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
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
      router.push('/subscription');
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
                <Image source={require('../assets/onboarding1.png')} style={s.mockupImage} resizeMode="contain" />
                <Text style={s.sub}>{item.sub}</Text>
              </>
            ) : (
              <>
                <View style={s.iconWrap}>
                  <MaterialIcons name={item.icon} size={72} color={C.primary} />
                </View>
                <Text style={s.headline}>{item.headline}</Text>
                <Text style={s.sub}>{item.sub}</Text>
              </>
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
          <Text style={s.buttonText}>{isLast || isFirst ? 'Get Started' : 'Next'}</Text>
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
  mockupImage: { width: SCREEN_WIDTH * 0.78, height: SCREEN_WIDTH * 0.78, marginBottom: 4 },

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

  skip: { fontSize: 14, color: C.outline, fontWeight: '500' },
  skipSignIn: { color: '#2B2B2B', fontStyle: 'italic' },
});
