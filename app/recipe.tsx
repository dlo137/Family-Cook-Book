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
import { useLocalSearchParams, useRouter } from "expo-router";

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

const RECIPES: Record<string, {
  title: string;
  by: string;
  uri: string;
  prep: string;
  cook: string;
  servings: string;
  tip: string;
  ingredients: { id: string; text: string }[];
  steps: string[];
}> = {
  "1": {
    title: "Mom's Famous Lasagna",
    by: "Mom",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO8ipVd-NjkI1sLd1AUipGb-h3IGrifhUmTjZwuJ7FwJuluzpdAWx6LjzZ0pqLGLezcBY8FpsuiT0hwZf4VhnVQfwnAQIsYj2T0cARpMkQlL6aYAJr0Zc-RgVmzywNNXg8BVcDqsjknyAZMq8R43rRonYW3ihsSQve2oJvOll74XLpQe0G8i7msW6S04K2ps7UXKMrBCl-M96rKMSMkp65otZ9CzgitnQCmOEOPpIdP_RR4siowIUl-Ye5eSWdk9rEmRxyJ_gZ2cw",
    prep: "20 min",
    cook: "45 min",
    servings: "6",
    tip: "Add a pinch of nutmeg to the ricotta — it's Grandma's secret.",
    ingredients: [
      { id: "1", text: "1 lb Ground Beef" },
      { id: "2", text: "2 cups Ricotta Cheese" },
      { id: "3", text: "1 package Lasagna Noodles" },
      { id: "4", text: "2 cups Shredded Mozzarella" },
      { id: "5", text: "1 jar Marinara Sauce" },
      { id: "6", text: "1 Egg" },
      { id: "7", text: "Pinch of Nutmeg" },
      { id: "8", text: "Salt & Pepper to taste" },
    ],
    steps: [
      "Preheat your oven to 375°F (190°C). Bring a large pot of salted water to a boil.",
      "Brown the ground beef in a large skillet over medium heat until no longer pink. Drain excess fat and season with salt and pepper.",
      "Stir the marinara sauce into the cooked beef. Reduce heat and simmer for 10 minutes.",
      "Mix the ricotta cheese with the egg and a pinch of nutmeg until smooth.",
      "Cook the lasagna noodles according to package directions. Drain and lay flat.",
      "Layer noodles, ricotta mixture, meat sauce, and mozzarella in a 9×13 baking dish. Repeat until all ingredients are used.",
      "Top with remaining mozzarella. Cover with foil and bake for 25 minutes.",
      "Remove foil and bake an additional 20 minutes until golden and bubbly. Rest 10 minutes before slicing.",
    ],
  },
  "2": {
    title: "Grandma's Sunday Roast",
    by: "Grandma",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4abNG-ERepXH6UGnPiI5BacVRg6Au_4089QusGsq7J_f74ruFdp6xMy2pbnePZ2MBi8h95DPu1gT3kPvfILfBOUjW0QhqkEWodS3W-1OtcixHV0w-cJDFINZlpDsFopMk61rTpcGQKt4jv58o-o2O1Do5a3SpEWo0Tgu05CEEyDVkoVkfrcgn2Ui2KjBMy0Ya1naRZZqyXs2ie7ljnWIE3RG2rpIHnf4mhsGOt4tXFHUQyW9COGWHJO9yUrBAFCD7erxzyIja1wI",
    prep: "20 min",
    cook: "3 hrs",
    servings: "8",
    tip: "Low and slow is the only way — Grandma never rushed a roast.",
    ingredients: [
      { id: "1", text: "3 lb Beef Chuck Roast" },
      { id: "2", text: "4 medium Potatoes, quartered" },
      { id: "3", text: "3 large Carrots, cut into chunks" },
      { id: "4", text: "2 Onions, sliced" },
      { id: "5", text: "4 cloves Garlic, minced" },
      { id: "6", text: "2 cups Beef Stock" },
      { id: "7", text: "2 tbsp Olive Oil" },
      { id: "8", text: "Fresh Rosemary & Thyme" },
      { id: "9", text: "Salt & Pepper to taste" },
    ],
    steps: [
      "Preheat your oven to 325°F (165°C). Pat the roast dry and season generously with salt and pepper.",
      "Heat olive oil in a Dutch oven over high heat. Sear the roast on all sides until deeply browned, about 3–4 minutes per side.",
      "Reduce heat. Add onions and garlic and cook 3 minutes. Add beef stock, scraping up browned bits.",
      "Return the roast to the pot. Tuck potatoes, carrots, and herbs around it.",
      "Cover tightly and roast in the oven for 2.5–3 hours until fall-apart tender.",
      "Remove roast and vegetables. Simmer the juices on the stovetop for 5 minutes to make gravy. Serve together.",
    ],
  },
  "3": {
    title: "Dad's Summer Salad",
    by: "Dad",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWNQm6sb5mR3QNMk9rHmmVmsfr86qCSrKdCMUPwGhpkTMBwla45Kw0-uw1Qku0IQRxwb9kGxctKd_jWYCkvRjlLERd6QM8iOyLVUuYQcsuLTQZPsAAUYN3I6DATB58eInmdhhA-ci7IVJLSEWgxTUezQasQuqx-TEu5awfDOBgBxaXtQkbdA3g62RykDRcUofwGTOl3yD0L31Qnc8yuYzkD898Wljktpy992awVHadWl8uUUHUQLb7iDiP8c-MIETcV0l6ZpaBJt8",
    prep: "15 min",
    cook: "0 min",
    servings: "2",
    tip: "Soak the red onion in cold water first — Dad's trick for a milder bite.",
    ingredients: [
      { id: "1", text: "1 large head Romaine Lettuce, chopped" },
      { id: "2", text: "1 cup Cherry Tomatoes, halved" },
      { id: "3", text: "1 Cucumber, sliced" },
      { id: "4", text: "½ Red Onion, thinly sliced" },
      { id: "5", text: "½ cup Kalamata Olives" },
      { id: "6", text: "100g Feta Cheese, crumbled" },
      { id: "7", text: "3 tbsp Olive Oil" },
      { id: "8", text: "1½ tbsp Red Wine Vinegar" },
      { id: "9", text: "1 tsp Dried Oregano" },
      { id: "10", text: "Salt & Pepper to taste" },
    ],
    steps: [
      "Soak the sliced red onion in cold water for 10 minutes, then drain.",
      "Combine the romaine, cherry tomatoes, cucumber, and drained red onion in a large bowl.",
      "Whisk together olive oil, red wine vinegar, oregano, salt, and pepper.",
      "Add the olives and drizzle the dressing over the salad. Toss gently.",
      "Top with crumbled feta and serve immediately.",
    ],
  },
};

export default function Recipe() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = RECIPES[id ?? "1"] ?? RECIPES["1"];
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
          <Image source={{ uri: recipe.uri }} style={s.heroImg} />
          <View style={s.heroGradient} />
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>By {recipe.by}</Text>
          </View>
        </View>

        {/* Title + Meta */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{recipe.title}</Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <MaterialIcons name="timer" size={22} color={C.primary} />
              <Text style={s.metaLabel}>Prep: {recipe.prep}</Text>
            </View>
            <View style={s.metaItem}>
              <MaterialIcons name="outdoor-grill" size={22} color={C.primary} />
              <Text style={s.metaLabel}>Cook: {recipe.cook}</Text>
            </View>
            <View style={s.metaItem}>
              <MaterialIcons name="restaurant" size={22} color={C.primary} />
              <Text style={s.metaLabel}>Servings: {recipe.servings}</Text>
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
          <TouchableOpacity style={s.addDashedBtn}>
            <MaterialIcons name="add" size={20} color={C.onSurfaceVariant} />
            <Text style={s.addDashedText}>Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* Grandma's Tip */}
        <View style={s.section}>
          <View style={s.tipCard}>
            <Text style={s.tipTitle}>Grandma's Tip</Text>
            <Text style={s.tipText}>"{recipe.tip}"</Text>
          </View>
        </View>

        {/* Instructions */}
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
