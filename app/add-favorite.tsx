import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const C = {
  primary: "#556B2F",
  surface: "#F6F3EA",
  surfaceContainer: "#E8E0CE",
  surfaceContainerLow: "#EDE7D9",
  surfaceContainerLowest: "#FDFAF4",
  surfaceContainerHigh: "#DDD4BE",
  onSurface: "#3F3426",
  onSurfaceVariant: "#5C4F3A",
  outlineVariant: "#C8BFAB",
  secondaryContainer: "#D4C89A",
  outline: "#7A6E5A",
  onPrimary: "#ffffff",
  accent: "#C97B63",
};

type RecipeRow = {
  id: string;
  title: string;
  author: string;
  meta: string;
  source: number | { uri: string } | null;
};

const STATIC_RECIPES: RecipeRow[] = [
  { id: "s1", title: "Mom's Famous Lasagna", author: "Mom", meta: "45 min • 6 servings", source: require("../assets/lasagna.png") },
  { id: "s2", title: "Grandma's Sunday Roast", author: "Grandma", meta: "120 min • 8 servings", source: require("../assets/beefstew.jpg") },
  { id: "s3", title: "Dad's Summer Salad", author: "Dad", meta: "15 min • 2 servings", source: require("../assets/salad1.avif") },
  { id: "s4", title: "Sister's Taco Night Special", author: "Sister", meta: "30 min • 4 servings", source: require("../assets/tacos.webp") },
  { id: "s5", title: "Weekend Fluffy Pancakes", author: "Mom", meta: "25 min • 4 servings", source: require("../assets/pancakes.webp") },
  { id: "s6", title: "Classic Caesar Salad", author: "Mom", meta: "20 min • 4 servings", source: require("../assets/salad1.avif") },
];

export default function AddFavorite() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addFavorites } = useFavorites();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dbRecipes, setDbRecipes] = useState<RecipeRow[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: memberships } = await supabase
        .from("family_memberships")
        .select("plan_id")
        .eq("user_id", user!.id)
        .limit(1);
      const planId = memberships?.[0]?.plan_id;
      if (!planId) return;
      const { data } = await supabase
        .from("recipes")
        .select("id, title, content")
        .eq("plan_id", planId)
        .order("created_at", { ascending: false });
      setDbRecipes(
        (data ?? []).map((r) => {
          const c = r.content as any;
          const parts = [c?.cook_time, c?.servings ? `${c.servings} servings` : null].filter(Boolean);
          return {
            id: r.id,
            title: r.title,
            author: c?.author ?? "Unknown",
            meta: parts.join(" • "),
            source: c?.photo ? { uri: c.photo } : null,
          };
        })
      );
    }
    load();
  }, [user?.id]);

  const allRecipes = [...dbRecipes, ...STATIC_RECIPES];
  const filters = ["All", ...Array.from(new Set(allRecipes.map((r) => r.author)))];

  const filtered = allRecipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "All" || r.author === activeFilter;
    return matchesSearch && matchesFilter;
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add to Favorites</Text>
        <TouchableOpacity
          style={[s.addBtn, selected.size === 0 && s.addBtnDisabled]}
          onPress={() => {
            if (selected.size === 0) return;
            const toAdd = allRecipes
              .filter((r) => selected.has(r.id))
              .map((r) => ({ id: r.id, title: r.title, source: r.source }));
            addFavorites(toAdd);
            router.back();
          }}
          activeOpacity={selected.size > 0 ? 0.8 : 1}
        >
          <Text style={[s.addBtnText, selected.size === 0 && s.addBtnTextDisabled]}>
            {selected.size > 0 ? `Add (${selected.size})` : "Add"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <MaterialIcons name="search" size={20} color={C.outline} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search recipes..."
          placeholderTextColor={C.outline}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={18} color={C.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* Family Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={s.filterScroll}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, activeFilter === f && s.filterChipActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selection hint */}
      <Text style={s.hint}>
        {selected.size === 0 ? "Tap recipes to select them" : `${selected.size} recipe${selected.size > 1 ? "s" : ""} selected`}
      </Text>

      {/* Recipe List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 24 }]}
      >
        {filtered.map((recipe) => {
          const isSelected = selected.has(recipe.id);
          return (
            <TouchableOpacity
              key={recipe.id}
              style={[s.recipeRow, isSelected && s.recipeRowSelected]}
              onPress={() => toggle(recipe.id)}
              activeOpacity={0.75}
            >
              <View style={s.imgWrap}>
                {recipe.source ? (
                  <Image source={recipe.source as any} style={s.recipeImg} resizeMode="cover" />
                ) : (
                  <View style={[s.recipeImg, { backgroundColor: C.surfaceContainerHigh, alignItems: "center", justifyContent: "center" }]}>
                    <MaterialIcons name="restaurant" size={24} color={C.outlineVariant} />
                  </View>
                )}
                {isSelected && (
                  <View style={s.imgOverlay}>
                    <MaterialIcons name="check-circle" size={28} color={C.onPrimary} />
                  </View>
                )}
              </View>
              <View style={s.recipeInfo}>
                <Text style={s.recipeTitle}>{recipe.title}</Text>
                <Text style={s.recipeAuthor}>By {recipe.author}</Text>
                <Text style={s.recipeMeta}>{recipe.meta}</Text>
              </View>
              <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                {isSelected && <MaterialIcons name="check" size={16} color={C.onPrimary} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <MaterialIcons name="search-off" size={36} color={C.outlineVariant} />
            <Text style={s.emptyText}>No recipes found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant,
  },
  iconBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: C.onSurface, marginLeft: 4 },
  addBtn: {
    backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999,
  },
  addBtnDisabled: { backgroundColor: C.surfaceContainerHigh },
  addBtnText: { fontSize: 14, fontWeight: "700", color: C.onPrimary },
  addBtnTextDisabled: { color: C.outline },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14, paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.onSurface },

  filterScroll: { height: 48, marginTop: 10, flexGrow: 0 },
  filterRow: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999, backgroundColor: C.surfaceContainerHigh,
  },
  filterChipActive: { backgroundColor: C.primary },
  filterText: { fontSize: 13, fontWeight: "500", color: C.onSurfaceVariant },
  filterTextActive: { color: C.onPrimary },

  hint: {
    fontSize: 12, color: C.outline, marginHorizontal: 20,
    marginTop: 8, marginBottom: 4,
  },

  list: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },

  recipeRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16, padding: 12,
    borderWidth: 1.5, borderColor: "transparent",
  },
  recipeRowSelected: {
    borderColor: C.primary,
    backgroundColor: C.surfaceContainerLow,
  },
  imgWrap: { position: "relative" },
  recipeImg: { width: 72, height: 72, borderRadius: 12, backgroundColor: C.surfaceContainer },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(77,106,40,0.55)",
    borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  recipeInfo: { flex: 1 },
  recipeTitle: { fontSize: 15, fontWeight: "700", color: C.onSurface, marginBottom: 2 },
  recipeAuthor: { fontSize: 12, color: C.primary, fontWeight: "600", marginBottom: 2 },
  recipeMeta: { fontSize: 12, color: C.onSurfaceVariant },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: C.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: C.primary, borderColor: C.primary },

  empty: { paddingVertical: 48, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 15, color: C.outline },
});
