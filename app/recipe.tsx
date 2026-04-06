import { useState } from "react";
import {
  Image,
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
  onSurface: "#221a0f",
  onSurfaceVariant: "#56423a",
  onTertiaryFixedVariant: "#5e4030",
  outlineVariant: "#ddc1b6",
  secondaryContainer: "#fecb98",
  onSecondaryContainer: "#79542b",
  tertiaryFixed: "#ffdbca",
  outline: "#8a7269",
  onPrimary: "#ffffff",
};

const INGREDIENTS = [
  { id: "1", text: "1 lb Ground Beef" },
  { id: "2", text: "2 cups Ricotta Cheese" },
  { id: "3", text: "1 package Lasagna Noodles" },
];

const STEPS = [
  "Brown the ground beef in a large skillet over medium heat until no longer pink. Drain excess fat and set aside to cool slightly.",
  "Layer noodles and cheese. Start with a thin layer of sauce, followed by noodles, ricotta mixture, and ground beef. Repeat until the dish is full.",
];

export default function Recipe() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [favorited, setFavorited] = useState(false);

  const toggleCheck = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Family Cookbook</Text>
        </View>
        <MaterialIcons name="account-circle" size={28} color={C.primary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Hero */}
        <View style={s.heroWrap}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDywNsQkbthUhtC2HoYPympzrDFKzvr14B7V9tyADNFPEdncewkiRWr20jjGg3t-GKe1aE69T2KVvZZhZR-jffQHenO0JrMbfgZQGY9Rz_Fw4fk6AW0EcVpdwxeal2pALGAUlghVBHhOvNhqsAQsgcDP-PZkU_Bxft2v27Zo9VUeXF_LqdbrjT-BAQmUZVq4-t8nZM0aN2mo6INm5Q85L547F7dedQLQvP5bLDhTXKEI5huXHguVIxw8Xdu1yVP3hFdRaAMPHY6Lcs" }}
            style={s.heroImg}
          />
          <View style={s.heroGradient} />
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>By Mom</Text>
          </View>
        </View>

        {/* Title + Meta */}
        <View style={s.titleBlock}>
          <Text style={s.title}>Mom's Famous Lasagna</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <MaterialIcons name="timer" size={22} color={C.primary} />
              <Text style={s.metaLabel}>Prep: 20 min</Text>
            </View>
            <View style={s.metaItem}>
              <MaterialIcons name="outdoor-grill" size={22} color={C.primary} />
              <Text style={s.metaLabel}>Cook: 45 min</Text>
            </View>
            <View style={s.metaItem}>
              <MaterialIcons name="restaurant" size={22} color={C.primary} />
              <Text style={s.metaLabel}>Servings: 6</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionRow}>
          <View style={s.actionLeft}>
            <TouchableOpacity style={s.btnSecondary} onPress={() => router.push("/add-recipe")}>
              <MaterialIcons name="edit" size={18} color={C.onSecondaryContainer} />
              <Text style={s.btnSecondaryText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnOutline, favorited && s.btnOutlineActive]}
              onPress={() => setFavorited((f) => !f)}
            >
              <MaterialIcons
                name={favorited ? "favorite" : "favorite-border"}
                size={18}
                color={C.primary}
              />
              <Text style={s.btnOutlineText}>Favorite</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.deleteBtn}>
            <MaterialIcons name="delete-outline" size={24} color={C.outlineVariant} />
          </TouchableOpacity>
        </View>

        {/* Ingredients */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Ingredients</Text>
            <Text style={s.editableLabel}>EDITABLE</Text>
          </View>
          {INGREDIENTS.map((ing) => (
            <TouchableOpacity
              key={ing.id}
              style={s.ingredientRow}
              onPress={() => toggleCheck(ing.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={checked[ing.id] ? "check-box" : "check-box-outline-blank"}
                size={22}
                color={checked[ing.id] ? C.primary : C.outlineVariant}
              />
              <Text style={[s.ingredientText, checked[ing.id] && s.ingredientChecked]}>
                {ing.text}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.addDashedBtn}>
            <MaterialIcons name="add" size={20} color={C.onSurfaceVariant} />
            <Text style={s.addDashedText}>Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* Grandma's Tip */}
        <View style={s.section}>
          <View style={s.tipCard}>
            <Text style={s.tipTitle}>Grandma's Tip</Text>
            <Text style={s.tipText}>
              "Add a pinch of nutmeg to the ricotta for a secret family flavor."
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Instructions</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={s.stepWrap}>
              <View style={s.stepBadge}>
                <Text style={s.stepBadgeText}>{i + 1}</Text>
              </View>
              <View style={s.stepCard}>
                <Text style={s.stepText}>{step}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={[s.addDashedBtn, s.addStepBtn]}>
            <MaterialIcons name="playlist-add" size={24} color={C.onSurfaceVariant} />
            <Text style={s.addDashedText}>Add Step</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, height: 56,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", fontStyle: "italic", color: C.primary, letterSpacing: -0.5 },
  iconBtn: { padding: 4 },
  scroll: { paddingBottom: 40 },

  heroWrap: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: "hidden", aspectRatio: 4 / 3 },
  heroImg: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0)", backgroundImage: undefined },
  heroBadge: {
    position: "absolute", bottom: 14, left: 14,
    backgroundColor: C.primary + "e6",
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999,
  },
  heroBadgeText: { color: C.onPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },

  titleBlock: { alignItems: "center", paddingHorizontal: 24, marginTop: 20 },
  title: { fontSize: 32, fontWeight: "700", fontStyle: "italic", color: C.onSurface, textAlign: "center", lineHeight: 38 },
  metaRow: { flexDirection: "row", gap: 28, marginTop: 16 },
  metaItem: { alignItems: "center", gap: 4 },
  metaLabel: { fontSize: 12, fontWeight: "500", color: C.onSurfaceVariant },

  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 24 },
  actionLeft: { flexDirection: "row", gap: 10 },
  btnSecondary: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.secondaryContainer,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: "700", color: C.onSecondaryContainer },
  btnOutline: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#f5e6d3",
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
  },
  btnOutlineActive: { backgroundColor: C.secondaryContainer },
  btnOutlineText: { fontSize: 13, fontWeight: "700", color: C.primary },
  deleteBtn: { padding: 8 },

  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: C.onSurface },
  editableLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: C.primary },

  ingredientRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, backgroundColor: C.surfaceContainerLow,
    borderRadius: 12, marginBottom: 8,
  },
  ingredientText: { fontSize: 15, color: C.onSurface, flex: 1 },
  ingredientChecked: { textDecorationLine: "line-through", color: C.outline },

  addDashedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, marginTop: 4,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.outlineVariant, borderRadius: 12,
  },
  addDashedText: { fontSize: 14, fontWeight: "500", color: C.onSurfaceVariant },
  addStepBtn: { paddingVertical: 20, marginTop: 8 },

  tipCard: { backgroundColor: C.tertiaryFixed, padding: 20, borderRadius: 16 },
  tipTitle: { fontSize: 20, fontWeight: "700", fontStyle: "italic", color: C.onSurface, marginBottom: 8 },
  tipText: { fontSize: 17, fontStyle: "italic", color: C.onTertiaryFixedVariant, lineHeight: 26 },

  stepWrap: { marginBottom: 16 },
  stepBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
    marginBottom: -16, marginLeft: 0, zIndex: 1, alignSelf: "flex-start", marginLeft: 4,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  stepBadgeText: { color: C.onPrimary, fontWeight: "700", fontSize: 13 },
  stepCard: {
    backgroundColor: C.surfaceContainerLowest,
    padding: 16, paddingTop: 24, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.surfaceContainer,
  },
  stepText: { fontSize: 15, color: C.onSurface, lineHeight: 24 },
});
