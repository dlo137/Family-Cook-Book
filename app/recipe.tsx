import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const C = {
  primary: "#556B2F",
  surface: "#F6F3EA",
  surfaceContainer: "#E8E0CE",
  surfaceContainerLow: "#EDE7D9",
  surfaceContainerLowest: "#FDFAF4",
  onSurface: "#3F3426",
  onSurfaceVariant: "#5C4F3A",
  onTertiaryFixedVariant: "#4A5228",
  outlineVariant: "#C8BFAB",
  secondaryContainer: "#D4C89A",
  onSecondaryContainer: "#3B3020",
  tertiaryFixed: "#E8DFC2",
  outline: "#7A6E5A",
  onPrimary: "#ffffff",
  accent: "#C97B63",
};

type RecipeData = {
  title: string;
  by: string;
  photo: string | null;
  prep: string;
  cook: string;
  servings: string;
  tip: string;
  ingredients: { id: string; text: string }[];
  steps: string[];
};

function mapRow(row: any): RecipeData {
  const c = row.content as any ?? {};
  return {
    title: row.title,
    by: c.author ?? "",
    photo: c.photo ?? null,
    prep: c.prep_time ?? "",
    cook: c.cook_time ?? "",
    servings: c.servings ?? "",
    tip: c.notes ?? "",
    ingredients: (c.ingredients ?? []).map((text: string, i: number) => ({ id: String(i), text })),
    steps: c.steps ?? [],
  };
}

export default function Recipe() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [favorited, setFavorited] = useState(false);
  const [familyRole, setFamilyRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("family_role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setFamilyRole(data?.family_role ?? null));
  }, [user?.id]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase
      .from("recipes")
      .select("id, title, content")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setRecipe(mapRow(data));
        setLoading(false);
      });
  }, [id]);

  const toggleCheck = (ingId: string) =>
    setChecked((prev) => ({ ...prev, [ingId]: !prev[ingId] }));

  const canEdit = !!familyRole && !!recipe && recipe.by.toLowerCase() === familyRole.toLowerCase();

  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
              <MaterialIcons name="arrow-back" size={24} color={C.primary} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Family Cookbook</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16, color: C.outline }}>Recipe not found.</Text>
        </View>
      </View>
    );
  }

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
          {recipe.photo ? (
            <Image source={{ uri: recipe.photo }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, { backgroundColor: C.surfaceContainer, alignItems: "center", justifyContent: "center" }]}>
              <MaterialIcons name="restaurant" size={56} color={C.outlineVariant} />
            </View>
          )}
          {recipe.by ? (
            <View style={s.heroBadge}>
              <Text style={s.heroBadgeText}>By {recipe.by}</Text>
            </View>
          ) : null}
        </View>

        {/* Title + Meta */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{recipe.title}</Text>
          <View style={s.metaRow}>
            {recipe.prep ? (
              <View style={s.metaItem}>
                <MaterialIcons name="timer" size={22} color={C.primary} />
                <Text style={s.metaLabel}>Prep: {recipe.prep}</Text>
              </View>
            ) : null}
            {recipe.cook ? (
              <View style={s.metaItem}>
                <MaterialIcons name="outdoor-grill" size={22} color={C.primary} />
                <Text style={s.metaLabel}>Cook: {recipe.cook}</Text>
              </View>
            ) : null}
            {recipe.servings ? (
              <View style={s.metaItem}>
                <MaterialIcons name="restaurant" size={22} color={C.primary} />
                <Text style={s.metaLabel}>Serves: {recipe.servings}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionRow}>
          <View style={s.actionLeft}>
            {canEdit && (
              <TouchableOpacity style={s.btnSecondary} onPress={() => router.push("/add-recipe")}>
                <MaterialIcons name="edit" size={18} color={C.onSecondaryContainer} />
                <Text style={s.btnSecondaryText}>Edit</Text>
              </TouchableOpacity>
            )}
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
          {canEdit && (
            <TouchableOpacity style={s.deleteBtn}>
              <MaterialIcons name="delete-outline" size={24} color={C.outlineVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Ingredients</Text>
              {canEdit && <Text style={s.editableLabel}>EDITABLE</Text>}
            </View>
            {recipe.ingredients.map((ing) => (
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
          </View>
        )}

        {/* Family Tip */}
        {recipe.tip ? (
          <View style={s.section}>
            <View style={s.tipCard}>
              <Text style={s.tipTitle}>Family Tip</Text>
              <Text style={s.tipText}>"{recipe.tip}"</Text>
            </View>
          </View>
        ) : null}

        {/* Instructions */}
        {recipe.steps.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Instructions</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={s.stepWrap}>
                <View style={s.stepBadge}>
                  <Text style={s.stepBadgeText}>{i + 1}</Text>
                </View>
                <View style={s.stepCard}>
                  <Text style={s.stepText}>{step}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
  heroBadge: {
    position: "absolute", bottom: 14, left: 14,
    backgroundColor: C.primary + "e6",
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999,
  },
  heroBadgeText: { color: C.onPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },

  titleBlock: { alignItems: "center", paddingHorizontal: 24, marginTop: 20 },
  title: { fontSize: 32, fontWeight: "700", fontStyle: "italic", color: C.onSurface, textAlign: "center", lineHeight: 38 },
  metaRow: { flexDirection: "row", gap: 28, marginTop: 16, flexWrap: "wrap", justifyContent: "center" },
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
    backgroundColor: "#D3D9B0",
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

  tipCard: { backgroundColor: C.tertiaryFixed, padding: 20, borderRadius: 16 },
  tipTitle: { fontSize: 20, fontWeight: "700", fontStyle: "italic", color: C.onSurface, marginBottom: 8 },
  tipText: { fontSize: 17, fontStyle: "italic", color: C.onTertiaryFixedVariant, lineHeight: 26 },

  stepWrap: { marginBottom: 16 },
  stepBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
    marginBottom: -16, marginLeft: 4, zIndex: 1, alignSelf: "flex-start",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  stepBadgeText: { color: C.onPrimary, fontWeight: "700", fontSize: 13 },
  stepCard: {
    backgroundColor: C.surfaceContainerLowest,
    padding: 16, paddingTop: 24, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.surfaceContainer,
  },
  stepText: { fontSize: 15, color: C.onSurface, lineHeight: 24 },

  addDashedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, marginTop: 4,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12,
  },
  addDashedText: { fontSize: 14, fontWeight: "500", color: C.onSurfaceVariant },
});
