import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
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
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const C = {
  primary: "#556B2F",
  surface: "#F6F3EA",
  surfaceContainer: "#E8E0CE",
  surfaceContainerLow: "#EDE7D9",
  surfaceContainerHigh: "#DDD4BE",
  surfaceContainerLowest: "#FDFAF4",
  onSurface: "#3F3426",
  onSurfaceVariant: "#5C4F3A",
  outlineVariant: "#C8BFAB",
  secondaryContainer: "#D4C89A",
  outline: "#7A6E5A",
  onPrimary: "#ffffff",
  accent: "#C97B63",
};

type CookRecipe = {
  id: string;
  title: string;
  meta: string;
  by: string;
  source: number | { uri: string } | null;
};

const STATIC_RECIPES: CookRecipe[] = [
  { id: "s1", title: "Mom's Famous Lasagna", meta: "45 min • 6 servings", by: "Mom", source: require("../../assets/lasagna.png") },
  { id: "s2", title: "Grandma's Sunday Roast", meta: "120 min • 8 servings", by: "Grandma", source: require("../../assets/beefstew.jpg") },
  { id: "s3", title: "Dad's Summer Salad", meta: "15 min • 2 servings", by: "Dad", source: require("../../assets/salad1.avif") },
  { id: "s4", title: "Sister's Taco Night Special", meta: "30 min • 4 servings", by: "Mom", source: require("../../assets/tacos.webp") },
  { id: "s5", title: "Weekend Fluffy Pancakes", meta: "25 min • 4 servings", by: "Dad", source: require("../../assets/pancakes.webp") },
];

export default function Other() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [dbRecipes, setDbRecipes] = useState<CookRecipe[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("s1");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickSoundRef = useRef<AudioPlayer | null>(null);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  useEffect(() => {
    setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    try {
      tickSoundRef.current = createAudioPlayer(require("../../assets/sounds/timer-beep.mp3"));
    } catch (e) {
      console.warn("Could not load tick sound:", e);
    }
    return () => { tickSoundRef.current?.remove(); };
  }, []);

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
            meta: parts.join(" • "),
            by: c?.author ?? "Unknown",
            source: c?.photo ? { uri: c.photo } : null,
          };
        })
      );
    }
    load();
  }, [user?.id]);

  const startCooking = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    playTick();
    setCountdown(3);
  };

  async function playTick() {
    try {
      if (tickSoundRef.current) {
        tickSoundRef.current.seekTo(0);
        tickSoundRef.current.play();
      }
    } catch (e) {
      console.warn("Countdown sound error:", e);
    }
  }

  useEffect(() => {
    if (countdown === null) return;
    scaleAnim.setValue(1.4);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    if (countdown === 0) {
      setCountdown(null);
      router.push({ pathname: "/cook-mode", params: { id: selectedRecipeId } } as any);
      return;
    }
    intervalRef.current = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, [countdown]);

  const allRecipes = [...dbRecipes, ...STATIC_RECIPES];
  const filters = ["Favorites", "All", ...Array.from(new Set(allRecipes.map((r) => r.by)))];

  const filtered = allRecipes.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === "Favorites") return matchesSearch && favorites.has(r.id);
    if (activeFilter !== "All") return matchesSearch && r.by === activeFilter;
    return matchesSearch;
  });

  return (
    <LinearGradient colors={["#F8F5EC", "#EDE5D2"]} style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>The Family Cookbook</Text>
        <TouchableOpacity style={s.avatar} onPress={() => router.push('/(home)/profile')} activeOpacity={0.8}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwnsiky2TruhS7MEhrclqbeCFJanL4OM_l0QRtWgIO6F42B2DOJ55114i2cbxA_0W8tGPIbmAYU09LZPuuPsvFqoZC2NY0uZXbbO3zkQI51WNdlSpWg_kB525VJR5uvagYuVW3GVKuertEHD0D6jjB9J5h2au3lAy3qdPZ3S4KiVHuwzOmHrdzGoKO6SqdkWgWq4Rkn4aYTgLuFKgSMXThdHXPbL3wgO1P4HAtkgPsZ_OmxmarP4PfjWv7TDuBfLgVumDfCV-ImCQ" }}
            style={s.avatarImg}
          />
        </TouchableOpacity>
      </View>

      {/* Countdown overlay */}
      <Modal visible={countdown !== null} transparent animationType="fade">
        <View style={s.countdownOverlay}>
          <Animated.Text style={[s.countdownNumber, { transform: [{ scale: scaleAnim }] }]}>
            {countdown}
          </Animated.Text>
          <Text style={s.countdownLabel}>Get ready to cook!</Text>
          <TouchableOpacity
            style={s.countdownCancel}
            onPress={() => {
              setCountdown(null);
              if (intervalRef.current) clearTimeout(intervalRef.current);
              tickSoundRef.current?.pause();
            }}
          >
            <Text style={s.countdownCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page Title */}
        <View style={s.titleBlock}>
          <Text style={s.pageTitle}>Start Cooking</Text>
          <Text style={s.pageSubtitle}>Select a family treasure to begin your journey.</Text>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <MaterialIcons name="search" size={20} color={C.outline} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipes..."
            placeholderTextColor={C.outline}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
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

        {/* Recipe List */}
        <View style={s.list}>
          {filtered.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={s.recipeRow}
              activeOpacity={0.7}
              onPress={() => startCooking(recipe.id)}
            >
              {recipe.source ? (
                <Image source={recipe.source as any} style={s.recipeImg} resizeMode="cover" />
              ) : (
                <View style={[s.recipeImg, s.recipeImgPlaceholder]}>
                  <MaterialIcons name="restaurant" size={28} color={C.outlineVariant} />
                </View>
              )}
              <View style={s.recipeInfo}>
                <Text style={s.recipeTitle}>{recipe.title}</Text>
                {recipe.meta ? <Text style={s.recipeMeta}>{recipe.meta}</Text> : null}
              </View>
              <TouchableOpacity
                style={s.heartBtn}
                onPress={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name={favorites.has(recipe.id) ? "favorite" : "favorite-border"}
                  size={22}
                  color={favorites.has(recipe.id) ? C.accent : C.outlineVariant}
                />
              </TouchableOpacity>
              <View style={s.startBtn}>
                <Text style={s.startBtnText}>Start</Text>
              </View>
            </TouchableOpacity>
          ))}

          {filtered.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>
                {activeFilter === "Favorites"
                  ? "No favorites yet. Tap ♡ on a recipe to save it."
                  : "No recipes found."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, height: 56,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant,
  },
  headerTitle: { fontSize: 28, fontFamily: "GreatVibes_400Regular", color: C.onSurface },
  avatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: C.surfaceContainerHigh },
  avatarImg: { width: "100%", height: "100%" },

  scroll: { paddingHorizontal: 20 },

  titleBlock: { marginTop: 20, marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: "700", color: C.onSurface, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 4 },

  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14, paddingHorizontal: 14, marginBottom: 16, height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: C.onSurface },

  filterRow: { gap: 8, paddingBottom: 4, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999, backgroundColor: C.surfaceContainerHigh,
  },
  filterChipActive: { backgroundColor: C.primary },
  filterText: { fontSize: 13, fontWeight: "500", color: C.onSurfaceVariant },
  filterTextActive: { color: C.onPrimary },

  list: { marginTop: 8, gap: 4 },
  recipeRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 14,
  },
  recipeImg: { width: 76, height: 76, borderRadius: 12, backgroundColor: C.surfaceContainer, flexShrink: 0, overflow: "hidden" },
  recipeImgPlaceholder: { alignItems: "center", justifyContent: "center" },
  recipeInfo: { flex: 1 },
  recipeTitle: { fontSize: 17, fontWeight: "700", color: C.onSurface, lineHeight: 22 },
  recipeMeta: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 4 },

  heartBtn: { padding: 4 },

  startBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
  },
  startBtnText: { color: C.onPrimary, fontSize: 12, fontWeight: "700" },

  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 15, color: C.outline, textAlign: "center" },

  countdownOverlay: {
    flex: 1, backgroundColor: "rgba(28,33,16,0.85)",
    alignItems: "center", justifyContent: "center", gap: 16,
  },
  countdownNumber: {
    fontSize: 120, fontWeight: "800", color: C.onPrimary, lineHeight: 130,
  },
  countdownLabel: { fontSize: 20, fontWeight: "600", color: C.secondaryContainer },
  countdownCancel: {
    marginTop: 24, paddingHorizontal: 28, paddingVertical: 10,
    borderRadius: 999, borderWidth: 1.5, borderColor: C.outlineVariant,
  },
  countdownCancelText: { fontSize: 14, fontWeight: "600", color: C.outlineVariant },
});
