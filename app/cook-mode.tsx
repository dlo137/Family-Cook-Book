import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";

const C = {
  primary: "#9c3f10",
  surface: "#fff8f3",
  surfaceContainer: "#fbecd9",
  surfaceContainerLow: "#fff2e2",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHighest: "#efe0cd",
  onSurface: "#221a0f",
  onSurfaceVariant: "#56423a",
  onTertiaryFixedVariant: "#5e4030",
  outlineVariant: "#ddc1b6",
  secondaryContainer: "#fecb98",
  primaryContainer: "#bc5627",
  outline: "#8a7269",
  onPrimary: "#ffffff",
  tertiary: "#765443",
};

const RECIPES: Record<string, {
  title: string;
  ingredients: { id: string; text: string }[];
  steps: { instruction: string; ingredients: string[]; tip: string | null }[];
}> = {
  "1": {
    title: "Mom's Famous Lasagna",
    ingredients: [
      { id: "i1", text: "1 lb Ground Beef" },
      { id: "i2", text: "2 cups Ricotta Cheese" },
      { id: "i3", text: "1 package Lasagna Noodles" },
      { id: "i4", text: "2 cups Shredded Mozzarella" },
      { id: "i5", text: "1 jar Marinara Sauce" },
      { id: "i6", text: "1 Egg" },
      { id: "i7", text: "Pinch of Nutmeg" },
      { id: "i8", text: "Salt & Pepper to taste" },
    ],
    steps: [
      {
        instruction: "Preheat your oven to 375°F (190°C). Bring a large pot of salted water to a boil.",
        ingredients: [],
        tip: null,
      },
      {
        instruction: "Brown the ground beef in a large skillet over medium heat until no longer pink. Drain excess fat and season with salt and pepper.",
        ingredients: ["i1"],
        tip: null,
      },
      {
        instruction: "Stir the marinara sauce into the cooked beef. Reduce heat and simmer for 10 minutes, stirring occasionally.",
        ingredients: ["i1", "i5"],
        tip: null,
      },
      {
        instruction: "In a bowl, mix the ricotta cheese with the egg and a pinch of nutmeg until smooth.",
        ingredients: ["i2", "i6", "i7"],
        tip: "Grandma's secret: the nutmeg makes all the difference.",
      },
      {
        instruction: "Cook the lasagna noodles according to package directions. Drain and lay flat on a lightly oiled baking sheet.",
        ingredients: ["i3"],
        tip: null,
      },
      {
        instruction: "Spread a thin layer of meat sauce on the bottom of a 9×13 baking dish. Layer noodles, ricotta mixture, meat sauce, and mozzarella. Repeat until all ingredients are used.",
        ingredients: ["i3", "i2", "i4", "i1"],
        tip: null,
      },
      {
        instruction: "Top with remaining mozzarella. Cover tightly with foil and bake for 25 minutes.",
        ingredients: ["i4"],
        tip: null,
      },
      {
        instruction: "Remove foil and bake an additional 20 minutes until the top is golden and bubbly. Let rest for 10 minutes before slicing.",
        ingredients: [],
        tip: "Resting is key — it helps the layers hold together when you slice.",
      },
    ],
  },
  "2": {
    title: "Grandma's Sunday Roast",
    ingredients: [
      { id: "i1", text: "3 lb Beef Chuck Roast" },
      { id: "i2", text: "4 medium Potatoes, quartered" },
      { id: "i3", text: "3 large Carrots, cut into chunks" },
      { id: "i4", text: "2 Onions, sliced" },
      { id: "i5", text: "4 cloves Garlic, minced" },
      { id: "i6", text: "2 cups Beef Stock" },
      { id: "i7", text: "2 tbsp Olive Oil" },
      { id: "i8", text: "Fresh Rosemary & Thyme" },
      { id: "i9", text: "Salt & Pepper to taste" },
    ],
    steps: [
      {
        instruction: "Preheat your oven to 325°F (165°C). Pat the roast completely dry with paper towels and season generously all over with salt and pepper.",
        ingredients: ["i1", "i9"],
        tip: null,
      },
      {
        instruction: "Heat olive oil in a large Dutch oven over high heat. Sear the roast on all sides until deeply browned, about 3–4 minutes per side. Remove and set aside.",
        ingredients: ["i1", "i7"],
        tip: "Don't rush the sear — that crust is where all the flavour lives.",
      },
      {
        instruction: "Reduce heat to medium. Add onions and garlic to the pot and cook for 3 minutes until softened. Stir in the beef stock, scraping up any browned bits from the bottom.",
        ingredients: ["i4", "i5", "i6"],
        tip: null,
      },
      {
        instruction: "Return the roast to the pot. Tuck the potatoes and carrots around it and lay the rosemary and thyme on top.",
        ingredients: ["i1", "i2", "i3", "i8"],
        tip: null,
      },
      {
        instruction: "Cover tightly and transfer to the oven. Roast for 2.5–3 hours until the meat is fall-apart tender.",
        ingredients: [],
        tip: "Grandma always said low and slow is the only way.",
      },
      {
        instruction: "Remove the roast and vegetables to a platter. Skim the fat from the juices and simmer on the stovetop for 5 minutes to make a simple gravy. Serve everything together.",
        ingredients: [],
        tip: null,
      },
    ],
  },
  "3": {
    title: "Dad's Summer Salad",
    ingredients: [
      { id: "i1", text: "1 large head Romaine Lettuce, chopped" },
      { id: "i2", text: "1 cup Cherry Tomatoes, halved" },
      { id: "i3", text: "1 Cucumber, sliced" },
      { id: "i4", text: "½ Red Onion, thinly sliced" },
      { id: "i5", text: "½ cup Kalamata Olives" },
      { id: "i6", text: "100g Feta Cheese, crumbled" },
      { id: "i7", text: "3 tbsp Olive Oil" },
      { id: "i8", text: "1½ tbsp Red Wine Vinegar" },
      { id: "i9", text: "1 tsp Dried Oregano" },
      { id: "i10", text: "Salt & Pepper to taste" },
    ],
    steps: [
      {
        instruction: "Soak the sliced red onion in cold water for 10 minutes, then drain. This takes the sharp bite off while keeping the crunch.",
        ingredients: ["i4"],
        tip: "Dad's trick — raw onion ruins a salad if you skip this step.",
      },
      {
        instruction: "In a large bowl, combine the romaine, cherry tomatoes, cucumber, and drained red onion.",
        ingredients: ["i1", "i2", "i3", "i4"],
        tip: null,
      },
      {
        instruction: "Whisk together the olive oil, red wine vinegar, oregano, salt, and pepper in a small bowl until combined.",
        ingredients: ["i7", "i8", "i9", "i10"],
        tip: null,
      },
      {
        instruction: "Add the olives and drizzle the dressing over the salad. Toss gently to coat everything evenly.",
        ingredients: ["i5"],
        tip: null,
      },
      {
        instruction: "Top with crumbled feta. Serve immediately — this salad waits for no one.",
        ingredients: ["i6"],
        tip: "Dad always plates the feta last so it doesn't break up in the toss.",
      },
    ],
  },
  "4": {
    title: "Sister's Taco Night Special",
    ingredients: [
      { id: "i1", text: "1 lb Ground Beef or Turkey" },
      { id: "i2", text: "1 packet Taco Seasoning" },
      { id: "i3", text: "8 small Flour or Corn Tortillas" },
      { id: "i4", text: "1 cup Shredded Cheddar Cheese" },
      { id: "i5", text: "1 cup Salsa" },
      { id: "i6", text: "1 cup Sour Cream" },
      { id: "i7", text: "1 Avocado, sliced" },
      { id: "i8", text: "½ cup Fresh Cilantro" },
      { id: "i9", text: "1 Lime, cut into wedges" },
    ],
    steps: [
      {
        instruction: "Brown the ground beef in a large skillet over medium-high heat until cooked through. Break it up as it cooks. Drain excess fat.",
        ingredients: ["i1"],
        tip: null,
      },
      {
        instruction: "Add the taco seasoning packet plus ⅔ cup of water. Stir well and simmer for 5 minutes until the sauce thickens and coats the meat.",
        ingredients: ["i1", "i2"],
        tip: "Sister's move: add a splash of hot sauce to the meat while it simmers.",
      },
      {
        instruction: "Warm the tortillas directly over a gas flame for 20 seconds per side, or in a dry skillet, until slightly charred and pliable.",
        ingredients: ["i3"],
        tip: null,
      },
      {
        instruction: "Set out all the toppings in bowls so everyone can build their own: cheese, salsa, sour cream, avocado, cilantro, and lime wedges.",
        ingredients: ["i4", "i5", "i6", "i7", "i8", "i9"],
        tip: null,
      },
      {
        instruction: "Spoon the seasoned meat into each tortilla and load up your toppings. Squeeze a lime wedge over the top before eating.",
        ingredients: [],
        tip: "The lime at the end is non-negotiable — Sister insists.",
      },
    ],
  },
  "5": {
    title: "Weekend Fluffy Pancakes",
    ingredients: [
      { id: "i1", text: "1½ cups All-Purpose Flour" },
      { id: "i2", text: "3½ tsp Baking Powder" },
      { id: "i3", text: "1 tsp Salt" },
      { id: "i4", text: "1 tbsp Sugar" },
      { id: "i5", text: "1¼ cups Milk" },
      { id: "i6", text: "1 Egg" },
      { id: "i7", text: "3 tbsp Melted Butter" },
      { id: "i8", text: "1 tsp Vanilla Extract" },
    ],
    steps: [
      {
        instruction: "In a large bowl, whisk together the flour, baking powder, salt, and sugar.",
        ingredients: ["i1", "i2", "i3", "i4"],
        tip: null,
      },
      {
        instruction: "In a separate bowl, beat the egg lightly, then mix in the milk, melted butter, and vanilla.",
        ingredients: ["i5", "i6", "i7", "i8"],
        tip: null,
      },
      {
        instruction: "Pour the wet ingredients into the dry and stir until just combined. A few lumps are fine — don't overmix or the pancakes will be tough.",
        ingredients: [],
        tip: "The lumps are your friend. Overmixing kills the fluff.",
      },
      {
        instruction: "Let the batter rest for 5 minutes while you heat a lightly greased pan or griddle over medium heat.",
        ingredients: [],
        tip: null,
      },
      {
        instruction: "Pour ¼ cup of batter per pancake. Cook until bubbles form on the surface and the edges look set, about 2–3 minutes. Flip and cook 1–2 minutes more until golden.",
        ingredients: [],
        tip: "Only flip once — every extra flip makes them denser.",
      },
      {
        instruction: "Serve immediately with butter and maple syrup. These are best eaten straight off the griddle.",
        ingredients: [],
        tip: null,
      },
    ],
  },
};

const TIMER_PRESETS = [1, 5, 10, 15, 20, 25, 30, 45, 60];

// Drop a short beep MP3 at assets/sounds/timer-beep.mp3
async function playTimerSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/timer-beep.mp3")
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {
    console.warn("Timer sound unavailable:", e);
  }
}

type Phase = "prep" | "cooking" | "done";

export default function CookMode() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const RECIPE = RECIPES[id ?? "1"] ?? RECIPES["1"];
  const [phase, setPhase] = useState<Phase>("prep");
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown tick
  useEffect(() => {
    if (!timerRunning) return;
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  // Fire alarm when countdown reaches 0
  useEffect(() => {
    if (timerSeconds !== 0) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setTimerSeconds(null);
    playTimerSound();
    Alert.alert("⏰ Timer Done!", "Your timer has finished.");
  }, [timerSeconds]);

  function startTimer(minutes: number) {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerSeconds(minutes * 60);
    setTimerRunning(true);
    setShowTimerModal(false);
  }

  function cancelTimer() {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setTimerSeconds(null);
    setTimerRunning(false);
  }

  function clearTimerForStep() {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setTimerSeconds(null);
    setTimerRunning(false);
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const totalSteps = RECIPE.steps.length;
  const currentStep = RECIPE.steps[stepIndex];

  function toggleIngredient(id: string) {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function goNext() {
    clearTimerForStep();
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setPhase("done");
    }
  }

  function goBack() {
    clearTimerForStep();
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else {
      setPhase("prep");
    }
  }

  // ── PREP PHASE ────────────────────────────────────────────────
  if (phase === "prep") {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <MaterialIcons name="close" size={22} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.topBarTitle} numberOfLines={1}>{RECIPE.title}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[s.prepScroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.phaseLabel}>BEFORE YOU BEGIN</Text>
          <Text style={s.prepTitle}>Gather Your{"\n"}Ingredients</Text>
          <Text style={s.prepSubtitle}>Check off each ingredient as you get it ready.</Text>

          <View style={s.ingredientList}>
            {RECIPE.ingredients.map((ing) => (
              <TouchableOpacity
                key={ing.id}
                style={s.ingredientRow}
                onPress={() => toggleIngredient(ing.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={checkedIngredients[ing.id] ? "check-circle" : "radio-button-unchecked"}
                  size={22}
                  color={checkedIngredients[ing.id] ? C.primary : C.outlineVariant}
                />
                <Text style={[s.ingredientText, checkedIngredients[ing.id] && s.ingredientDone]}>
                  {ing.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={[s.prepFooter, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity style={s.startCookingBtn} onPress={() => setPhase("cooking")} activeOpacity={0.85}>
            <Text style={s.startCookingText}>Start Cooking</Text>
            <MaterialIcons name="arrow-forward" size={20} color={C.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── DONE PHASE ────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <View style={[s.root, s.doneRoot, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <View style={s.doneContent}>
          <View style={s.doneIcon}>
            <MaterialIcons name="restaurant" size={40} color={C.primary} />
          </View>
          <Text style={s.doneTitle}>You did it!</Text>
          <Text style={s.doneSubtitle}>
            {RECIPE.title} is ready.{"\n"}Let it rest before serving.
          </Text>
          <View style={s.doneTip}>
            <Text style={s.doneTipText}>"Cooking is love made visible."</Text>
          </View>
        </View>
        <View style={s.doneActions}>
          <TouchableOpacity style={s.doneBackBtn} onPress={() => router.back()}>
            <Text style={s.doneBackText}>Back to Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.doneRestartBtn}
            onPress={() => { setStepIndex(0); setPhase("prep"); setCheckedIngredients({}); }}
          >
            <Text style={s.doneRestartText}>Cook Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── COOKING PHASE ─────────────────────────────────────────────
  const stepIngredients = RECIPE.ingredients.filter((ing) =>
    currentStep.ingredients.includes(ing.id)
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={22} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.topBarTitle} numberOfLines={1}>{RECIPE.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Step Indicator */}
      <View style={s.stepIndicatorWrap}>
        <Text style={s.stepLabel}>STEP {stepIndex + 1} OF {totalSteps}</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.cookScroll, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Instruction Card */}
        <View style={s.instructionCard}>
          <Text style={s.instructionText}>{currentStep.instruction}</Text>
        </View>

        {/* Ingredients for this step */}
        {stepIngredients.length > 0 && (
          <View style={s.stepIngredientsCard}>
            <Text style={s.stepIngredientsLabel}>INGREDIENTS FOR THIS STEP</Text>
            {stepIngredients.map((ing) => (
              <TouchableOpacity
                key={ing.id}
                style={s.stepIngRow}
                onPress={() => toggleIngredient(ing.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={checkedIngredients[ing.id] ? "check-box" : "check-box-outline-blank"}
                  size={20}
                  color={checkedIngredients[ing.id] ? C.primary : C.outlineVariant}
                />
                <Text style={[s.stepIngText, checkedIngredients[ing.id] && s.ingredientDone]}>
                  {ing.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timer */}
        {timerRunning && timerSeconds !== null ? (
          <View style={s.timerCountdownCard}>
            <MaterialIcons name="timer" size={20} color={C.primary} />
            <Text style={s.timerCountdownText}>{formatTime(timerSeconds)}</Text>
            <TouchableOpacity style={s.timerCancelBtn} onPress={cancelTimer} activeOpacity={0.8}>
              <Text style={s.timerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.timerBtn} activeOpacity={0.85} onPress={() => setShowTimerModal(true)}>
            <MaterialIcons name="timer" size={22} color={C.onPrimary} />
            <Text style={s.timerBtnText}>Set a Timer</Text>
          </TouchableOpacity>
        )}

        {/* Timer Picker Modal */}
        <Modal visible={showTimerModal} transparent animationType="slide" onRequestClose={() => setShowTimerModal(false)}>
          <Pressable style={s.timerModalOverlay} onPress={() => setShowTimerModal(false)}>
            <Pressable style={s.timerModalSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={s.timerModalTitle}>Set a Timer</Text>
              <View style={s.timerPresetGrid}>
                {TIMER_PRESETS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={s.timerPresetChip}
                    activeOpacity={0.8}
                    onPress={() => startTimer(min)}
                  >
                    <Text style={s.timerPresetText}>{min} min</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.timerModalCancelBtn} onPress={() => setShowTimerModal(false)} activeOpacity={0.8}>
                <Text style={s.timerModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Grandma's Tip */}
        {currentStep.tip && (
          <View style={s.tipCard}>
            <Text style={s.tipTitle}>Grandma's Tip</Text>
            <Text style={s.tipText}>"{currentStep.tip}"</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[s.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.navBtn, s.navBtnBack]}
          onPress={goBack}
          activeOpacity={0.85}
        >
          <MaterialIcons name="arrow-back-ios" size={26} color={C.primary} />
        </TouchableOpacity>

        {/* Dot progress */}
        <View style={s.dots}>
          {RECIPE.steps.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === stepIndex && s.dotActive,
                i < stepIndex && s.dotDone,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[s.navBtn, s.navBtnNext]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <MaterialIcons
            name={stepIndex === totalSteps - 1 ? "check" : "arrow-forward-ios"}
            size={26}
            color={C.onPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant,
  },
  closeBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  topBarTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", fontStyle: "italic", color: C.primary, marginHorizontal: 8 },

  // ── PREP ──
  prepScroll: { paddingHorizontal: 24, paddingTop: 32 },
  phaseLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: C.outline, marginBottom: 12 },
  prepTitle: { fontSize: 36, fontWeight: "800", color: C.onSurface, lineHeight: 42, marginBottom: 10 },
  prepSubtitle: { fontSize: 14, color: C.onSurfaceVariant, marginBottom: 28 },
  ingredientList: { gap: 4 },
  ingredientRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14, marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
  },
  ingredientText: { fontSize: 15, fontWeight: "500", color: C.onSurface, flex: 1 },
  ingredientDone: { textDecorationLine: "line-through", color: C.outline },

  prepFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: C.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.outlineVariant,
  },
  startCookingBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: C.primary, borderRadius: 999, paddingVertical: 18,
  },
  startCookingText: { fontSize: 17, fontWeight: "700", color: C.onPrimary },

  // ── COOKING ──
  stepIndicatorWrap: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  stepLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: C.outline, textAlign: "center", marginBottom: 10 },
  progressBar: { height: 3, backgroundColor: C.outlineVariant, borderRadius: 999 },
  progressFill: { height: "100%", backgroundColor: C.primary, borderRadius: 999 },

  cookScroll: { paddingHorizontal: 20 },

  instructionCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 20, padding: 28, marginBottom: 16,
    shadowColor: "#221a0f", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
  },
  instructionText: { fontSize: 24, fontWeight: "700", fontStyle: "italic", color: C.onSurface, lineHeight: 34 },

  stepIngredientsCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16, padding: 16, marginBottom: 14,
  },
  stepIngredientsLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: C.tertiary, marginBottom: 10 },
  stepIngRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  stepIngText: { fontSize: 14, fontWeight: "500", color: C.onSurfaceVariant, flex: 1 },

  timerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: C.primaryContainer, borderRadius: 999,
    paddingVertical: 16, marginBottom: 14,
  },
  timerBtnText: { fontSize: 16, fontWeight: "700", color: C.onPrimary },

  timerCountdownCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 999, paddingVertical: 14, paddingHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1.5, borderColor: C.primary,
  },
  timerCountdownText: { flex: 1, fontSize: 22, fontWeight: "800", color: C.primary, letterSpacing: 1 },
  timerCancelBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: C.surfaceContainerHighest,
  },
  timerCancelText: { fontSize: 13, fontWeight: "600", color: C.primary },

  timerModalOverlay: {
    flex: 1, backgroundColor: "rgba(34,26,15,0.5)",
    justifyContent: "flex-end",
  },
  timerModalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
  },
  timerModalTitle: { fontSize: 20, fontWeight: "700", color: C.onSurface, marginBottom: 20, textAlign: "center" },
  timerPresetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 24 },
  timerPresetChip: {
    backgroundColor: C.primaryContainer,
    borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12,
    minWidth: 90, alignItems: "center",
  },
  timerPresetText: { fontSize: 15, fontWeight: "700", color: C.onPrimary },
  timerModalCancelBtn: {
    alignItems: "center", paddingVertical: 14,
    borderRadius: 999, backgroundColor: C.surfaceContainerHighest,
  },
  timerModalCancelText: { fontSize: 15, fontWeight: "600", color: C.primary },

  tipCard: {
    backgroundColor: "#ffdbca", borderRadius: 16, padding: 18, marginBottom: 8,
  },
  tipTitle: { fontSize: 16, fontWeight: "700", fontStyle: "italic", color: C.onSurface, marginBottom: 6 },
  tipText: { fontSize: 15, fontStyle: "italic", color: C.onTertiaryFixedVariant, lineHeight: 22 },

  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 28, paddingTop: 16,
    backgroundColor: C.surface,
  },
  navBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  navBtnBack: { backgroundColor: C.surfaceContainerHighest },
  navBtnNext: { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  dots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.outlineVariant },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  dotDone: { backgroundColor: C.secondaryContainer },

  // ── DONE ──
  doneRoot: { justifyContent: "space-between" },
  doneContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  doneIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.secondaryContainer,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  doneTitle: { fontSize: 40, fontWeight: "800", fontStyle: "italic", color: C.onSurface, marginBottom: 12 },
  doneSubtitle: { fontSize: 17, color: C.onSurfaceVariant, textAlign: "center", lineHeight: 26, marginBottom: 28 },
  doneTip: { backgroundColor: "#ffdbca", borderRadius: 16, padding: 18 },
  doneTipText: { fontSize: 16, fontStyle: "italic", color: C.onTertiaryFixedVariant, textAlign: "center" },
  doneActions: { paddingHorizontal: 24, gap: 10 },
  doneBackBtn: {
    backgroundColor: C.primary, borderRadius: 999,
    paddingVertical: 16, alignItems: "center",
  },
  doneBackText: { fontSize: 16, fontWeight: "700", color: C.onPrimary },
  doneRestartBtn: {
    backgroundColor: C.surfaceContainerLow, borderRadius: 999,
    paddingVertical: 14, alignItems: "center",
  },
  doneRestartText: { fontSize: 15, fontWeight: "600", color: C.primary },
});
