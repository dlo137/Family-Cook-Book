import { useState } from "react";
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

const C = {
  primary: "#9c3f10",
  surface: "#fff8f3",
  surfaceContainer: "#fbecd9",
  surfaceContainerLow: "#fff2e2",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#f5e6d3",
  onSurface: "#221a0f",
  onSurfaceVariant: "#56423a",
  outlineVariant: "#ddc1b6",
  secondaryContainer: "#fecb98",
  outline: "#8a7269",
  onPrimary: "#ffffff",
};

const FILTERS = ["All", "Mom", "Dad", "Grandma", "Sister"];

const ALL_RECIPES = [
  {
    id: "1",
    title: "Mom's Famous Lasagna",
    author: "Mom",
    meta: "45 min • 6 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO8ipVd-NjkI1sLd1AUipGb-h3IGrifhUmTjZwuJ7FwJuluzpdAWx6LjzZ0pqLGLezcBY8FpsuiT0hwZf4VhnVQfwnAQIsYj2T0cARpMkQlL6aYAJr0Zc-RgVmzywNNXg8BVcDqsjknyAZMq8R43rRonYW3ihsSQve2oJvOll74XLpQe0G8i7msW6S04K2ps7UXKMrBCl-M96rKMSMkp65otZ9CzgitnQCmOEOPpIdP_RR4siowIUl-Ye5eSWdk9rEmRxyJ_gZ2cw",
  },
  {
    id: "2",
    title: "Grandma's Sunday Roast",
    author: "Grandma",
    meta: "120 min • 8 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4abNG-ERepXH6UGnPiI5BacVRg6Au_4089QusGsq7J_f74ruFdp6xMy2pbnePZ2MBi8h95DPu1gT3kPvfILfBOUjW0QhqkEWodS3W-1OtcixHV0w-cJDFINZlpDsFopMk61rTpcGQKt4jv58o-o2O1Do5a3SpEWo0Tgu05CEEyDVkoVkfrcgn2Ui2KjBMy0Ya1naRZZqyXs2ie7ljnWIE3RG2rpIHnf4mhsGOt4tXFHUQyW9COGWHJO9yUrBAFCD7erxzyIja1wI",
  },
  {
    id: "3",
    title: "Dad's Summer Salad",
    author: "Dad",
    meta: "15 min • 2 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWNQm6sb5mR3QNMk9rHmmVmsfr86qCSrKdCMUPwGhpkTMBwla45Kw0-uw1Qku0IQRxwb9kGxctKd_jWYCkvRjlLERd6QM8iOyLVUuYQcsuLTQZPsAAUYN3I6DATB58eInmdhhA-ci7IVJLSEWgxTUezQasQuqx-TEu5awfDOBgBxaXtQkbdA3g62RykDRcUofwGTOl3yD0L31Qnc8yuYzkD898Wljktpy992awVHadWl8uUUHUQLb7iDiP8c-MIETcV0l6ZpaBJt8",
  },
  {
    id: "4",
    title: "Sister's Taco Night Special",
    author: "Sister",
    meta: "30 min • 4 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1bf1dMfvl-csxrk-CEyO0084IFm0C_Hh9GkZ3s2-FJkEKy_vCKJ6ap_aoLAoSbWp13soa3a2ejmVNQ60JFHE1qPdhqzeysKONmKRpOwvZhVOSbI3Ch70MHz8yqf5ZPNjhWVwIah-_KoMbgnJUuSRBwWqiRwikL40IVcYqYBKvV9G7VyMlBDIPEB5_TexZaB__qBXVdiMERrfl0lIPV1JqBlK538RAOapYEBe63aW0yBhODxI-MgQE4Jd-9sd53xguDlJ1WHjKd5c",
  },
  {
    id: "5",
    title: "Weekend Fluffy Pancakes",
    author: "Mom",
    meta: "25 min • 4 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgRl31faxhk8MrSS85YhPicd12q2ks6PeGTxS43mNIA5RKTDBMmZ3IvkyDkBeP0ExQfTZ6FdrJB7lXkzK8pyQEDhISwXZsjMmq3cb8wQQSmT_XZvRZ1TqqBWZ-0DlKIUhQJ6bsmW16Tm_9GSHxRIX-1QIC6TluFRMALwVcCMt1A5dxdh5f9kf1Y1yGLVGddtTFGMMX3x186zhf1bPyRD6wTTzz6ebdhTAU5o1V-TOVYnXH6Jt1qg4l6Ylt4yNFBCDn-Iw4k0RmCNk",
  },
  {
    id: "6",
    title: "Classic Caesar Salad",
    author: "Mom",
    meta: "20 min • 4 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJWGILVw2jt-7FnWQ9u6-C9VT1C0lgQJBx3W6L5b0v5KQj7TgDqnsfezwV0TM-mZIWWxrA3H_6TWnIOleNVoqz18Sr3deDv3Hx8lvh3pxUtDJMLry420v0WRT4AlMOEv5uWbe5s-zPGfjFX1-Do8SY69LAmXF0Nuovbh4CKekdafSmOY0XihNKSeCULjv6OTHefjqwcXRmDpkNA1HRsUwPQWim0UkAUGivUaMbc8Q0eK6o9Qkk5vGaJelwTBPW8zb0zNuepg0Y0Ms",
  },
];

export default function AddFavorite() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addFavorites } = useFavorites();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = ALL_RECIPES.filter((r) => {
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
            const toAdd = ALL_RECIPES
              .filter((r) => selected.has(r.id))
              .map((r) => ({ id: r.id, title: r.title, uri: r.uri }));
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
        {FILTERS.map((f) => (
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
                <Image source={{ uri: recipe.uri }} style={s.recipeImg} />
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
    backgroundColor: "rgba(156,63,16,0.55)",
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
