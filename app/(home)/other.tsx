import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
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

const C = {
  primary: "#9c3f10",
  surface: "#fff8f3",
  surfaceContainer: "#fbecd9",
  surfaceContainerLow: "#fff2e2",
  surfaceContainerHigh: "#f5e6d3",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#221a0f",
  onSurfaceVariant: "#56423a",
  outlineVariant: "#ddc1b6",
  secondaryContainer: "#fecb98",
  outline: "#8a7269",
  onPrimary: "#ffffff",
};

const FILTERS = ["All", "Favorites", "Mom", "Dad", "Grandma"];

const MENU_ITEMS = [
  { label: "Home", icon: "home" as const, route: "/(home)/home" },
  { label: "Search", icon: "search" as const, route: "/(home)/other" },
  { label: "Profile", icon: "person" as const, route: "/(home)/profile" },
];

const RECIPES = [
  {
    id: "1",
    title: "Mom's Famous Lasagna",
    meta: "45 min • 6 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO8ipVd-NjkI1sLd1AUipGb-h3IGrifhUmTjZwuJ7FwJuluzpdAWx6LjzZ0pqLGLezcBY8FpsuiT0hwZf4VhnVQfwnAQIsYj2T0cARpMkQlL6aYAJr0Zc-RgVmzywNNXg8BVcDqsjknyAZMq8R43rRonYW3ihsSQve2oJvOll74XLpQe0G8i7msW6S04K2ps7UXKMrBCl-M96rKMSMkp65otZ9CzgitnQCmOEOPpIdP_RR4siowIUl-Ye5eSWdk9rEmRxyJ_gZ2cw",
  },
  {
    id: "2",
    title: "Grandma's Sunday Roast",
    meta: "120 min • 8 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4abNG-ERepXH6UGnPiI5BacVRg6Au_4089QusGsq7J_f74ruFdp6xMy2pbnePZ2MBi8h95DPu1gT3kPvfILfBOUjW0QhqkEWodS3W-1OtcixHV0w-cJDFINZlpDsFopMk61rTpcGQKt4jv58o-o2O1Do5a3SpEWo0Tgu05CEEyDVkoVkfrcgn2Ui2KjBMy0Ya1naRZZqyXs2ie7ljnWIE3RG2rpIHnf4mhsGOt4tXFHUQyW9COGWHJO9yUrBAFCD7erxzyIja1wI",
  },
  {
    id: "3",
    title: "Dad's Summer Salad",
    meta: "15 min • 2 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWNQm6sb5mR3QNMk9rHmmVmsfr86qCSrKdCMUPwGhpkTMBwla45Kw0-uw1Qku0IQRxwb9kGxctKd_jWYCkvRjlLERd6QM8iOyLVUuYQcsuLTQZPsAAUYN3I6DATB58eInmdhhA-ci7IVJLSEWgxTUezQasQuqx-TEu5awfDOBgBxaXtQkbdA3g62RykDRcUofwGTOl3yD0L31Qnc8yuYzkD898Wljktpy992awVHadWl8uUUHUQLb7iDiP8c-MIETcV0l6ZpaBJt8",
  },
  {
    id: "4",
    title: "Sister's Taco Night Special",
    meta: "30 min • 4 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1bf1dMfvl-csxrk-CEyO0084IFm0C_Hh9GkZ3s2-FJkEKy_vCKJ6ap_aoLAoSbWp13soa3a2ejmVNQ60JFHE1qPdhqzeysKONmKRpOwvZhVOSbI3Ch70MHz8yqf5ZPNjhWVwIah-_KoMbgnJUuSRBwWqiRwikL40IVcYqYBKvV9G7VyMlBDIPEB5_TexZaB__qBXVdiMERrfl0lIPV1JqBlK538RAOapYEBe63aW0yBhODxI-MgQE4Jd-9sd53xguDlJ1WHjKd5c",
  },
  {
    id: "5",
    title: "Weekend Fluffy Pancakes",
    meta: "25 min • 4 servings",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgRl31faxhk8MrSS85YhPicd12q2ks6PeGTxS43mNIA5RKTDBMmZ3IvkyDkBeP0ExQfTZ6FdrJB7lXkzK8pyQEDhISwXZsjMmq3cb8wQQSmT_XZvRZ1TqqBWZ-0DlKIUhQJ6bsmW16Tm_9GSHxRIX-1QIC6TluFRMALwVcCMt1A5dxdh5f9kf1Y1yGLVGddtTFGMMX3x186zhf1bPyRD6wTTzz6ebdhTAU5o1V-TOVYnXH6Jt1qg4l6Ylt4yNFBCDn-Iw4k0RmCNk",
  },
];

export default function Other() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = RECIPES.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setMenuOpen(true)}>
            <MaterialIcons name="menu" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Grandma's Cookbook</Text>
        </View>
        <View style={s.avatar}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwnsiky2TruhS7MEhrclqbeCFJanL4OM_l0QRtWgIO6F42B2DOJ55114i2cbxA_0W8tGPIbmAYU09LZPuuPsvFqoZC2NY0uZXbbO3zkQI51WNdlSpWg_kB525VJR5uvagYuVW3GVKuertEHD0D6jjB9J5h2au3lAy3qdPZ3S4KiVHuwzOmHrdzGoKO6SqdkWgWq4Rkn4aYTgLuFKgSMXThdHXPbL3wgO1P4HAtkgPsZ_OmxmarP4PfjWv7TDuBfLgVumDfCV-ImCQ" }}
            style={s.avatarImg}
          />
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={s.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={[s.menuSheet, { top: insets.top + 56 }]}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={s.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(item.route as any);
                }}
              >
                <MaterialIcons name={item.icon} size={20} color={C.primary} />
                <Text style={s.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
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

        {/* Recipe List */}
        <View style={s.list}>
          {filtered.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={s.recipeRow}
              activeOpacity={0.7}
              onPress={() => router.push("/cook-mode")}
            >
              <Image source={{ uri: recipe.uri }} style={s.recipeImg} />
              <View style={s.recipeInfo}>
                <Text style={s.recipeTitle}>{recipe.title}</Text>
                <Text style={s.recipeMeta}>{recipe.meta}</Text>
              </View>
              <View style={s.startBtn}>
                <Text style={s.startBtnText}>Start</Text>
              </View>
            </TouchableOpacity>
          ))}

          {filtered.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>No recipes found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.onSurface, letterSpacing: -0.5 },
  iconBtn: { padding: 8, borderRadius: 999 },
  avatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: C.surfaceContainerHigh },
  avatarImg: { width: "100%", height: "100%" },

  menuOverlay: { flex: 1, backgroundColor: "rgba(34,26,15,0.3)" },
  menuSheet: {
    position: "absolute", left: 16,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14, overflow: "hidden", minWidth: 180,
    shadowColor: "#221a0f", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant,
  },
  menuItemText: { fontSize: 15, fontWeight: "600", color: C.onSurface },

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
  recipeImg: { width: 76, height: 76, borderRadius: 12, backgroundColor: C.surfaceContainer, flexShrink: 0 },
  recipeInfo: { flex: 1 },
  recipeTitle: { fontSize: 17, fontWeight: "700", color: C.onSurface, lineHeight: 22 },
  recipeMeta: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 4 },

  startBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
  },
  startBtnText: { color: C.onPrimary, fontSize: 12, fontWeight: "700" },

  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 15, color: C.outline },
});
