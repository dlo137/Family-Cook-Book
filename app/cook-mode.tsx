import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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

const RECIPE = {
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
};

type Phase = "prep" | "cooking" | "done";

export default function CookMode() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("prep");
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const totalSteps = RECIPE.steps.length;
  const currentStep = RECIPE.steps[stepIndex];

  function toggleIngredient(id: string) {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function goNext() {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setPhase("done");
    }
  }

  function goBack() {
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

        {/* Timer placeholder */}
        <TouchableOpacity style={s.timerBtn} activeOpacity={0.85}>
          <MaterialIcons name="timer" size={22} color={C.onPrimary} />
          <Text style={s.timerBtnText}>Set a Timer</Text>
        </TouchableOpacity>

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
