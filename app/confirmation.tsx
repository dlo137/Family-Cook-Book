import { useRef, useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, ClipPath, Defs, Image as SvgImage, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BLOB_W = SCREEN_WIDTH * 1.2;
const BLOB_H = SCREEN_WIDTH * 1.22;

const C = {
  primary: '#556B2F',
  surface: '#F6F3EA',
  secondaryContainer: '#D4C89A',
  onSurface: '#3F3426',
  onSurfaceVariant: '#5C4F3A',
  outline: '#7A6E5A',
};

const GOAL_PHRASES: Record<string, string> = {
  save:     'save family recipes',
  cook:     'cook at home more',
  healthy:  'eat healthier',
  organize: 'stay organized',
  share:    'save their favorite meals',
  store:    'store recipes safely',
  connect:  'connect with family and friends',
};

const DEFAULTS = ['keep track of recipes', 'cook at home more', 'eat healthier'];

function buildPhrase(selectedGoals: string[]): string {
  const chosen = selectedGoals
    .filter((id) => id !== 'other' && GOAL_PHRASES[id])
    .slice(0, 3)
    .map((id) => GOAL_PHRASES[id]);

  const padded = [...chosen];
  for (const d of DEFAULTS) {
    if (padded.length >= 3) break;
    if (!padded.includes(d)) padded.push(d);
  }

  const [a, b, c] = padded;
  return `${a}, ${b}, and ${c}`;
}

// 5-anchor blob — C1 smooth at every junction, irregular asymmetric anchors for natural waviness
const BLOB_PATH =
  'M 50,5 C 72,-10 100,15 88,28 C 76,41 100,65 82,75 C 64,85 55,102 28,88 C 1,74 -5,55 12,42 C 29,29 30,-5 50,5 Z';

function BlobImage() {
  return (
    <Svg width={BLOB_W} height={BLOB_H} viewBox="-40 -40 175 180" style={{ transform: [{ rotate: '-3deg' }] }}>
      <Defs>
        <ClipPath id="blobClip">
          <Path d={BLOB_PATH} />
        </ClipPath>
      </Defs>
      <SvgImage
        href={require('../assets/cutting.jpg')}
        x=""
        y="0"
        width="95"
        height="95"
        preserveAspectRatio="xMidYMid slice"
        clipPath="url(#blobClip)"
      />
    </Svg>
  );
}

// ─── Animated SVG primitives ──────────────────────────────────────────────────
const AnimatedPath   = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Graph constants ──────────────────────────────────────────────────────────
const GRAPH_W = SCREEN_WIDTH - 64;
const GRAPH_H = GRAPH_W * 0.55;

// Curve lives in a normalised viewBox="0 0 100 60" for easy maths.
// Starts bottom-left (5,55), stays flat, then sweeps steeply to top-right (95,5).
// The S-command mirrors the previous control point for C1 smoothness.
const CURVE_D = 'M -10,55 C 18,54 45,45 65,30 S 85,8 95,5';
// Arc-length of this path ≈ 106 viewBox units (measured by summing chord segments).
// Keep PATH_LEN close to actual so the dot doesn't overshoot the tip.
// Path arc ≈ 119 units with new start at x=-10
const PATH_LEN = 121;

// Dot positions recalculated for curve starting at (-10,55).
// Segment 1 is ~67% of total arc; segment 2 ~33%.
const DOT_X = [-10,  9,  26,  43,  65,  76,  88,  95];
const DOT_Y = [ 55, 53,  49,  43,  30,  20,   9,   5];
const DOT_T  = [  0, 0.15, 0.3, 0.45, 0.671, 0.75, 0.9, 1];

// ─── Graph Card ───────────────────────────────────────────────────────────────
function GraphCard() {
  const progress        = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);
  const successOpacity  = useRef(new Animated.Value(0)).current;
  const organizedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in "Organized Recipes" after 1s
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(organizedOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]).start();
  }, []);

  useEffect(() => {
    // Draw the curve over 1.2 s with ease-out acceleration
    Animated.timing(progress, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // SVG props require the JS driver
    }).start(() => setDone(true));
  }, []);

  useEffect(() => {
    if (!done) return;
    // Fade in success text once the curve is fully drawn
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [done]);

  // Animate strokeDashoffset from full-length → 0 to "draw" the line
  const dashOffset = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [PATH_LEN, 0],
  });

  // Dot follows the tip of the curve using arc-length-calibrated stops
  const dotX = progress.interpolate({ inputRange: DOT_T, outputRange: DOT_X });
  const dotY = progress.interpolate({ inputRange: DOT_T, outputRange: DOT_Y });

  return (
    <View style={sg.card}>
      <View style={{ position: 'relative' }}>
      <Svg width={GRAPH_W} height={GRAPH_H} viewBox="-14 -6 114 76">
        <Defs>
          {/* Gradient runs left-to-right in userSpace coords matching the viewBox */}
          <LinearGradient id="graphGrad" x1="-10" y1="0" x2="95" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="1" stopColor={C.primary} />
          </LinearGradient>
        </Defs>

        {/* Subtle dashed grid lines spanning full card width */}
        {[15, 30, 45].map((y) => (
          <Path key={y} d={`M -17,${y} H 97`} stroke="#E8E0CE" strokeWidth={0.6} strokeDasharray="2 2" />
        ))}

        {/* Animated curve — strokeDashoffset draws from left to right */}
        <AnimatedPath
          d={CURVE_D}
          stroke="url(#graphGrad)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={PATH_LEN}
          strokeDashoffset={dashOffset}
        />

        {/* Small dot that rides the curve tip */}
        <AnimatedCircle cx={dotX} cy={dotY} r={2.5} fill="url(#graphGrad)" />

        {/* Scattered Recipes — blue pill, bottom-left */}
        <Rect x="-13" y="59" width="46" height="7.5" rx="2" fill="#3B82F6" />
        <SvgText x="10" y="64.2" fontSize="4" fill="white" textAnchor="middle" fontWeight="600">Scattered Recipes</SvgText>

      </Svg>

      {/* Organized Recipes — native View for reliable opacity fade-in */}
      <Animated.View style={[sg.organizedPill, { opacity: organizedOpacity }]}>
        <Text style={sg.pillText}>Organized Recipes</Text>
      </Animated.View>
      </View>

    </View>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function ConfirmationLoading() {
  const router = useRouter();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (percent === 100) {
      const t = setTimeout(() => router.push('/subscription'), 500);
      return () => clearTimeout(t);
    }
  }, [percent]);

  const message =
    percent < 25 ? 'Creating your cookbook...' :
    percent < 50 ? 'Adding recipe templates...' :
    percent < 75 ? 'Setting up your collection...' :
    percent < 100 ? 'Almost ready...' : 'Ready!';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.brandRow}>
          <Image source={require('../assets/icon.png')} style={s.brandIcon} />
          <Text style={s.brandText}>The Family Cookbook</Text>
        </View>
        <View style={s.content}>
          <Text style={sl.message}>{message}</Text>
          <Text style={sl.percent}>{percent}%</Text>
          <View style={sl.barBg}>
            <View style={[sl.barFill, { width: `${percent}%` as any }]} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Confirmation Step 2 ──────────────────────────────────────────────────────
function ConfirmationStep2({ onNext }: { onNext: () => void }) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.brandRow}>
          <Image source={require('../assets/icon.png')} style={s.brandIcon} />
          <Text style={s.brandText}>The Family Cookbook</Text>
        </View>

        <View style={s.content}>
          <Text style={s.title}>Become the Reason Traditions Last</Text>
          <GraphCard />
          <Text style={s.subtitle}>
            You're on your way! Every saved recipe brings your {'\n'} family memories, traditions, and home cooked meals together in one place.
          </Text>
        </View>

        <TouchableOpacity style={s.button} onPress={onNext} activeOpacity={0.85}>
          <Text style={s.buttonText}>Start Creating</Text>
          <MaterialIcons name="arrow-forward" size={18} color={C.onSurface} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Confirmation Step 1 ──────────────────────────────────────────────────────
export default function Confirmation() {
  const router = useRouter();
  const { goals } = useLocalSearchParams<{ goals: string }>();
  const [step, setStep] = useState(0);

  if (step === 2) return <ConfirmationLoading />;
  if (step === 1) return <ConfirmationStep2 onNext={() => setStep(2)} />;

  const selectedGoals: string[] = goals ? JSON.parse(goals) : [];
  const phrase = buildPhrase(selectedGoals);
  const tagline =
    selectedGoals.includes('healthy') || selectedGoals.includes('cook')
      ? "Cook healthier meals \nwith less stress 🤝"
      : "Because family recipes \nshould never dissappear 🤝";

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.brandRow}>
          <Image source={require('../assets/icon.png')} style={s.brandIcon} />
          <Text style={s.brandText}>The Family Cookbook</Text>
        </View>

        <View style={s.content}>
          <Text style={s.title}>Those are good goals!</Text>
          <Text style={s.subtitle}>
            <Text style={s.stat}>92%</Text> of users say The Family Cookbookno  helped them{' '}
            <Text style={s.highlight}>{phrase}</Text> without even thinking about it.
          </Text>
          <View style={s.blobWrap}>
            <BlobImage />
          </View>
          <Text style={s.tagline}>{tagline}</Text>
        </View>

        <TouchableOpacity style={s.button} onPress={() => setStep(1)} activeOpacity={0.85}>
          <Text style={s.buttonText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={18} color={C.onSurface} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const sg = StyleSheet.create({
  card: {
    width: GRAPH_W,
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingVertical: 16,
    marginVertical: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    gap: 10,
  },
  success: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
    textAlign: 'center',
  },
  organizedPill: {
    position: 'absolute',
    top: -4,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: C.primary,
    borderRadius: Math.round(GRAPH_W * 0.02),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: Math.round(GRAPH_W * 0.030),
    color: 'white',
    fontWeight: '600',
  },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  container: { flex: 1, paddingHorizontal: 32, paddingBottom: 42, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', gap: 10, alignItems: 'center' },
  title: {
    fontSize: 36, fontWeight: '900', color: C.onSurface,
    letterSpacing: -1.5, lineHeight: 42, textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, color: C.onSurfaceVariant, lineHeight: 24, fontWeight: '500', textAlign: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', paddingTop: 24 },
  brandIcon: { width: 36, height: 36, borderRadius: 8 },
  brandText: { fontSize: 26, fontFamily: 'GreatVibes_400Regular', color: C.onSurface },
  blobWrap: { alignItems: 'center', marginTop: -72, marginBottom: -100 },
  tagline: { fontSize: 26, fontWeight: '900', color: C.onSurface, letterSpacing: -1.5, lineHeight: 32, textAlign: 'center' },
  stat: { color: C.primary, fontSize: 15 },
  highlight: { color: C.onSurface },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.secondaryContainer,
    paddingVertical: 18, paddingHorizontal: 48,
    borderRadius: 999, width: '100%',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  buttonText: { fontSize: 17, fontWeight: '800', color: C.onSurface, letterSpacing: -0.2 },
});

const sl = StyleSheet.create({
  message: {
    fontSize: 16, fontWeight: '600', color: C.onSurfaceVariant,
    textAlign: 'center', letterSpacing: -0.3,
  },
  percent: {
    fontSize: 64, fontWeight: '900', color: C.onSurface,
    letterSpacing: -2, lineHeight: 72, textAlign: 'center',
  },
  barBg: {
    width: '100%', height: 10, borderRadius: 999,
    backgroundColor: '#E8E0CE', overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 999,
    backgroundColor: C.primary,
  },
});
