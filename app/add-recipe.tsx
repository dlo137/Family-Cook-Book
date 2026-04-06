import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  primary: "#9c3f10",
  surface: "#fff8f3",
  surfaceContainer: "#fbecd9",
  surfaceContainerLow: "#fff2e2",
  surfaceContainerHigh: "#f5e6d3",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHighest: "#efe0cd",
  onSurface: "#221a0f",
  onSurfaceVariant: "#56423a",
  onTertiaryFixedVariant: "#5e4030",
  outlineVariant: "#ddc1b6",
  secondaryContainer: "#fecb98",
  tertiaryFixed: "#ffdbca",
  outline: "#8a7269",
  onPrimary: "#ffffff",
};

type Ingredient = { id: string; text: string };
type Step = { id: string; text: string };

let _id = 0;
const uid = () => String(++_id);

export default function AddRecipe() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: uid(), text: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ id: uid(), text: "" }]);
  const [notes, setNotes] = useState("");

  function animate() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  function addIngredient() {
    animate();
    setIngredients((prev) => [...prev, { id: uid(), text: "" }]);
  }

  function removeIngredient(id: string) {
    animate();
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  function updateIngredient(id: string, text: string) {
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
  }

  function addStep() {
    animate();
    setSteps((prev) => [...prev, { id: uid(), text: "" }]);
  }

  function removeStep(id: string) {
    animate();
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStep(id: string, text: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Top Bar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <TextInput
            style={s.topBarTitle}
            value={title}
            onChangeText={setTitle}
            placeholder="New Recipe"
            placeholderTextColor={C.outline}
          />
          <TouchableOpacity style={s.saveBtn} onPress={() => router.back()}>
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Upload */}
          <TouchableOpacity style={s.photoArea}>
            <MaterialIcons name="add-photo-alternate" size={36} color={C.outline} />
            <Text style={s.photoLabel}>Add Photo</Text>
          </TouchableOpacity>

          {/* Author */}
          <View style={s.authorRow}>
            <Text style={s.authorPrefix}>By</Text>
            <TextInput
              style={s.authorInput}
              value={author}
              onChangeText={setAuthor}
              placeholder="Family member"
              placeholderTextColor={C.outline}
            />
          </View>

          {/* Meta Row */}
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <MaterialIcons name="timer" size={18} color={C.primary} />
              <TextInput
                style={s.metaInput}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="Prep"
                placeholderTextColor={C.outline}
                keyboardType="default"
              />
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <MaterialIcons name="outdoor-grill" size={18} color={C.primary} />
              <TextInput
                style={s.metaInput}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="Cook"
                placeholderTextColor={C.outline}
              />
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <MaterialIcons name="restaurant" size={18} color={C.primary} />
              <TextInput
                style={s.metaInput}
                value={servings}
                onChangeText={setServings}
                placeholder="Serves"
                placeholderTextColor={C.outline}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Ingredients */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ingredients</Text>
            {ingredients.map((ing, index) => (
              <View key={ing.id} style={s.listRow}>
                <View style={s.listBullet}>
                  <Text style={s.listBulletText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={s.listInput}
                  value={ing.text}
                  onChangeText={(t) => updateIngredient(ing.id, t)}
                  placeholder="e.g. 1 cup flour"
                  placeholderTextColor={C.outline}
                  returnKeyType="next"
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => removeIngredient(ing.id)} style={s.deleteBtn}>
                    <MaterialIcons name="close" size={16} color={C.outline} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={s.addRowBtn} onPress={addIngredient}>
              <MaterialIcons name="add" size={18} color={C.primary} />
              <Text style={s.addRowText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Instructions</Text>
            {steps.map((step, index) => (
              <View key={step.id} style={s.stepCard}>
                <View style={s.stepHeader}>
                  <View style={s.stepBadge}>
                    <Text style={s.stepBadgeText}>{index + 1}</Text>
                  </View>
                  {steps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(step.id)} style={s.deleteBtn}>
                      <MaterialIcons name="close" size={16} color={C.outline} />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={s.stepInput}
                  value={step.text}
                  onChangeText={(t) => updateStep(step.id, t)}
                  placeholder="Describe this step…"
                  placeholderTextColor={C.outline}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ))}
            <TouchableOpacity style={s.addRowBtn} onPress={addStep}>
              <MaterialIcons name="playlist-add" size={20} color={C.primary} />
              <Text style={s.addRowText}>Add Step</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Family Tips</Text>
            <View style={s.notesCard}>
              <MaterialIcons name="lightbulb-outline" size={18} color={C.onTertiaryFixedVariant} style={{ marginBottom: 6 }} />
              <TextInput
                style={s.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder={`"Add a secret ingredient or family tip…"`}
                placeholderTextColor={C.onTertiaryFixedVariant}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, height: 56,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant,
    gap: 8,
  },
  iconBtn: { padding: 8 },
  topBarTitle: {
    flex: 1, fontSize: 18, fontWeight: "700", color: C.onSurface,
    letterSpacing: -0.3,
  },
  saveBtn: {
    backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999,
  },
  saveBtnText: { color: C.onPrimary, fontWeight: "700", fontSize: 14 },

  scroll: { padding: 16, gap: 8 },

  photoArea: {
    height: 180, borderRadius: 16,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.outlineVariant,
    alignItems: "center", justifyContent: "center", gap: 8,
    marginBottom: 16,
  },
  photoLabel: { fontSize: 14, color: C.outline, fontWeight: "500" },

  authorRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 4, marginBottom: 12,
  },
  authorPrefix: { fontSize: 14, fontWeight: "600", color: C.onSurfaceVariant },
  authorInput: {
    flex: 1, fontSize: 14, fontWeight: "600", color: C.primary,
    borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    paddingVertical: 4,
  },

  metaRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surfaceContainerLow, borderRadius: 14,
    padding: 12, marginBottom: 8,
  },
  metaItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  metaDivider: { width: 1, height: 28, backgroundColor: C.outlineVariant },
  metaInput: { flex: 1, fontSize: 13, fontWeight: "500", color: C.onSurface },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: C.onSurface, marginBottom: 12 },

  listRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
  },
  listBullet: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.surfaceContainerHigh,
    alignItems: "center", justifyContent: "center",
  },
  listBulletText: { fontSize: 11, fontWeight: "700", color: C.onSurfaceVariant },
  listInput: { flex: 1, fontSize: 14, color: C.onSurface },
  deleteBtn: { padding: 4 },

  addRowBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.outlineVariant,
    borderRadius: 12, marginTop: 4,
  },
  addRowText: { fontSize: 13, fontWeight: "600", color: C.primary },

  stepCard: {
    backgroundColor: C.surfaceContainerLowest, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
    shadowColor: "#221a0f", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  stepHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
  },
  stepBadgeText: { color: C.onPrimary, fontWeight: "700", fontSize: 12 },
  stepInput: { fontSize: 14, color: C.onSurface, lineHeight: 22, minHeight: 60 },

  notesCard: {
    backgroundColor: C.tertiaryFixed, borderRadius: 14,
    padding: 16,
  },
  notesInput: {
    fontSize: 15, fontStyle: "italic", color: C.onTertiaryFixedVariant,
    lineHeight: 24, minHeight: 80,
  },
});
