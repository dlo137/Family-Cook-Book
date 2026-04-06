import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useFavorites } from "@/context/FavoritesContext";

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
  primaryContainer: "#bc5627",
  outline: "#8a7269",
  onPrimary: "#ffffff",
};

const FAVORITES = [
  {
    id: "1",
    label: "Mom's Lasagna",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAsTHeQg6nw5zFvAtKpKkYeC8ZxbNwMxeHfvK7nFifly88duuu8hNNRAF6NMBgr5--ItBZzLsCN8LHcIxvOeRYDykBwLIBwFINHiWWUTz9JyG0uOZHSkrPCaQeF7C-0Iqi_vk3DA6oKoacOXCIZa6cnYRAd-1j1-nsm61aGqiq4MZ1talMqAsBfg3mjjgmJ2su5kbL1Oz16E7GKddlxLlJ6GPijq9kifGPNasSGstUshuJ_9ZsKUZziviAA4VM9XP9WSuVlquBKzro",
  },
  {
    id: "2",
    label: "Dad's Chili",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxoCxlHxo3Sk-EwhqOwKhFGrtTDDOyq29DCo86RbYTbw2-Ess-sjUGD8XvrVU93bdS8KhxXR2zJO59EKg8qwWjdXOGVHZjXlVOZABdMawE-rod2ZCy1RLirFbUrZUlhwddR_-xntMg1tv3T_zAeOnZHfFltk8xcSdv9bsY0tx98Y7Ql2T_uM5Ckr-AHEJvR2hbzof--T2JPIFcoEkktR1LOIZ7LoBZ96__Q-29ipDNStJBbbtgho8cRUtAhI0nmd7jA2aNEtO8pFA",
  },
  {
    id: "3",
    label: "Nan's Pancakes",
    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCF_bJyVNcANYs4DX3Yq4hEsTpPE8QnDkA50H6O2WlZhwbw56C-AYcarsQGGyzrLr-9X1ToZn0C0pwR-FpqcwcRPA188XvBdNh9_7tZOz1D6ApY1Gs3WxY47qVSQuykJEpE_3r-KoYgvUjDIb-lIPYLtUBB-5djkMLgaNHgfKSPZZeEfssxpWnsxTrFFpR3w1DileRb4QeDLNGYXG6TRMAs7LQbRSOEJ7g1W4xs62MNNa-twaObJwef_JBSPllMhiDYVWkXhcB97_Q",
  },
];

const FAMILY = [
  {
    id: "mom",
    name: "Mom",
    count: "1 recipe",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxWGPbNEawsG3axY83GA5D-2w7Tt8gYvXVlBZZHwXHFOyTZXBOr95TW-nX6VXn5mtAx6BehUwQfB-KPqjNFDWbXgzdLwsyWnzM49DRA2u319eWZ_Sd0MxtdBZbWNEKrnOyjLO750TGsxLncVwgtCtAP46XZSQSC-Lxx0gAv1_4SKA8V5viP390w08AonpenbCllAOn4Imx00WMPaDmb53PmjGwonH0gQcK1j-EVi2Bx7VvsIp-ANobpz_0rL3CZZFFtW6aJd2P3Xk",
    recipes: [
      {
        id: "default-mom",
        name: "Mom's Famous Lasagna",
        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO8ipVd-NjkI1sLd1AUipGb-h3IGrifhUmTjZwuJ7FwJuluzpdAWx6LjzZ0pqLGLezcBY8FpsuiT0hwZf4VhnVQfwnAQIsYj2T0cARpMkQlL6aYAJr0Zc-RgVmzywNNXg8BVcDqsjknyAZMq8R43rRonYW3ihsSQve2oJvOll74XLpQe0G8i7msW6S04K2ps7UXKMrBCl-M96rKMSMkp65otZ9CzgitnQCmOEOPpIdP_RR4siowIUl-Ye5eSWdk9rEmRxyJ_gZ2cw",
      },
    ],
  },
  {
    id: "dad",
    name: "Dad",
    count: "1 recipe",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjnbgU_5_u65tlYEEzommgafl584wdlO4l2dKSPT0-ZJEn5a-lqmYvGh0zZcYR-pZ-yrpP08lp1k_Msz2jR5e9GOKnHyx9ruxg1LZNBRmDyLZ7DFE2O84qjDFB42QjWUgLAIjsKPvvj6m5borLgpL2bHw_cKWheYBVDXug2HL_9BJ4catqMYGc6HKWIDaQHvwxSH81MKAo4RvpvR71E3x6Jwfr4x04qHaV77WmvtOXkrlvRUyQVqklkOVbqGFHAdnWYfOo4vsdteo",
    recipes: [
      {
        id: "default-dad",
        name: "Dad's Summer Salad",
        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWNQm6sb5mR3QNMk9rHmmVmsfr86qCSrKdCMUPwGhpkTMBwla45Kw0-uw1Qku0IQRxwb9kGxctKd_jWYCkvRjlLERd6QM8iOyLVUuYQcsuLTQZPsAAUYN3I6DATB58eInmdhhA-ci7IVJLSEWgxTUezQasQuqx-TEu5awfDOBgBxaXtQkbdA3g62RykDRcUofwGTOl3yD0L31Qnc8yuYzkD898Wljktpy992awVHadWl8uUUHUQLb7iDiP8c-MIETcV0l6ZpaBJt8",
      },
    ],
  },
  {
    id: "grandma",
    name: "Grandma",
    count: "1 recipe",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA02DNm62bt4F_evfbcb2DhU8WvSyXAEDq6FeVKHfohl4mbWHLaUn2fPSTLwZtfUlj7T-D8_7z5VbSbm9aVKl4fStAfXnnfz9pIL1Qy_ar2ihmNXKsrcyBgAVcT_jlooj9Q8o4nOFeV6Ps2wzslsslIMYXBAa2-TvFzgtol-UbvfUggMOn1vXDkJwHSIkJDjY81zzZNYtpjiH0HQhBBn8oAq1nswKGuXbJaIUWJQHwAtpnTF0QzH8rvjt3OI4u_2ow01cl3seBv_-0",
    recipes: [
      {
        id: "default-grandma",
        name: "Grandma's Sunday Roast",
        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4abNG-ERepXH6UGnPiI5BacVRg6Au_4089QusGsq7J_f74ruFdp6xMy2pbnePZ2MBi8h95DPu1gT3kPvfILfBOUjW0QhqkEWodS3W-1OtcixHV0w-cJDFINZlpDsFopMk61rTpcGQKt4jv58o-o2O1Do5a3SpEWo0Tgu05CEEyDVkoVkfrcgn2Ui2KjBMy0Ya1naRZZqyXs2ie7ljnWIE3RG2rpIHnf4mhsGOt4tXFHUQyW9COGWHJO9yUrBAFCD7erxzyIja1wI",
      },
    ],
  },
];

const AVATAR_TEMPLATES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBxWGPbNEawsG3axY83GA5D-2w7Tt8gYvXVlBZZHwXHFOyTZXBOr95TW-nX6VXn5mtAx6BehUwQfB-KPqjNFDWbXgzdLwsyWnzM49DRA2u319eWZ_Sd0MxtdBZbWNEKrnOyjLO750TGsxLncVwgtCtAP46XZSQSC-Lxx0gAv1_4SKA8V5viP390w08AonpenbCllAOn4Imx00WMPaDmb53PmjGwonH0gQcK1j-EVi2Bx7VvsIp-ANobpz_0rL3CZZFFtW6aJd2P3Xk",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAjnbgU_5_u65tlYEEzommgafl584wdlO4l2dKSPT0-ZJEn5a-lqmYvGh0zZcYR-pZ-yrpP08lp1k_Msz2jR5e9GOKnHyx9ruxg1LZNBRmDyLZ7DFE2O84qjDFB42QjWUgLAIjsKPvvj6m5borLgpL2bHw_cKWheYBVDXug2HL_9BJ4catqMYGc6HKWIDaQHvwxSH81MKAo4RvpvR71E3x6Jwfr4x04qHaV77WmvtOXkrlvRUyQVqklkOVbqGFHAdnWYfOo4vsdteo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA02DNm62bt4F_evfbcb2DhU8WvSyXAEDq6FeVKHfohl4mbWHLaUn2fPSTLwZtfUlj7T-D8_7z5VbSbm9aVKl4fStAfXnnfz9pIL1Qy_ar2ihmNXKsrcyBgAVcT_jlooj9Q8o4nOFeV6Ps2wzslsslIMYXBAa2-TvFzgtol-UbvfUggMOn1vXDkJwHSIkJDjY81zzZNYtpjiH0HQhBBn8oAq1nswKGuXbJaIUWJQHwAtpnTF0QzH8rvjt3OI4u_2ow01cl3seBv_-0",
];

const MENU_ITEMS = [
  { label: "Home", icon: "home" as const, route: "/(home)/home" },
  { label: "Search", icon: "search" as const, route: "/(home)/other" },
  { label: "Profile", icon: "person" as const, route: "/(home)/profile" },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites } = useFavorites();
  const [expanded, setExpanded] = useState<string | null>("mom");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("");
  const [family, setFamily] = useState(FAMILY);

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
        <TouchableOpacity style={s.avatar} onPress={() => router.push("/(home)/profile")} activeOpacity={0.8}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwnsiky2TruhS7MEhrclqbeCFJanL4OM_l0QRtWgIO6F42B2DOJ55114i2cbxA_0W8tGPIbmAYU09LZPuuPsvFqoZC2NY0uZXbbO3zkQI51WNdlSpWg_kB525VJR5uvagYuVW3GVKuertEHD0D6jjB9J5h2au3lAy3qdPZ3S4KiVHuwzOmHrdzGoKO6SqdkWgWq4Rkn4aYTgLuFKgSMXThdHXPbL3wgO1P4HAtkgPsZ_OmxmarP4PfjWv7TDuBfLgVumDfCV-ImCQ" }}
            style={s.avatarImg}
          />
        </TouchableOpacity>
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

      {/* Scrollable Body */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Favorites */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Favorites</Text>
            <Text style={s.viewAll}>VIEW ALL</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.favRow}>
            <TouchableOpacity style={s.addFav} onPress={() => router.push("/add-favorite")}>
              <MaterialIcons name="add-circle" size={28} color={C.primary} />
              <Text style={s.addFavLabel}>ADD NEW</Text>
            </TouchableOpacity>
            {favorites.map((fav) => (
              <TouchableOpacity key={fav.id} style={s.favItem} activeOpacity={0.8} onPress={() => router.push("/recipe")}>
                <Image source={{ uri: fav.uri }} style={s.favImg} />
                <Text style={s.favLabel} numberOfLines={1}>{fav.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Family Recipes */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { paddingHorizontal: 8 }]}>Family Recipes</Text>
            <TouchableOpacity style={s.addFamilyBtn} onPress={() => setAddMemberOpen(true)}>
              <MaterialIcons name="add-circle" size={16} color={C.primary} />
              <Text style={s.addFamilyText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
          {family.map((member) => {
            const isOpen = expanded === member.id;
            return (
              <View key={member.id} style={s.memberCard}>
                <TouchableOpacity
                  style={s.memberRow}
                  onPress={() => setExpanded(isOpen ? null : member.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.avatarRing, isOpen && s.avatarRingActive]}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={s.memberAvatar} />
                    ) : (
                      <Text style={s.memberInitial}>{member.name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.memberName}>{member.name}</Text>
                    <Text style={s.memberCount}>{member.count.toUpperCase()}</Text>
                  </View>
                  <MaterialIcons
                    name={isOpen ? "expand-less" : "expand-more"}
                    size={24}
                    color={isOpen ? C.primary : C.outline}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={s.recipeList}>
                    {member.recipes.map((recipe) => (
                      <TouchableOpacity
                        key={recipe.id}
                        style={s.recipeRow}
                        activeOpacity={0.7}
                        onPress={() => router.push("/recipe")}
                      >
                        <Image source={{ uri: recipe.uri }} style={s.recipeImg} />
                        <Text style={s.recipeName}>{recipe.name}</Text>
                        <MaterialIcons name="chevron-right" size={18} color={C.outline} />
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={s.addRecipeBtn} onPress={() => router.push("/add-recipe")}>
                      <MaterialIcons name="add" size={16} color={C.primary} />
                      <Text style={s.addRecipeBtnText}>ADD RECIPE</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Start New Recipe Button */}
        <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => router.push("/add-recipe")}>
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text style={s.fabText}>Start New Recipe</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Family Member Modal */}
      <Modal visible={addMemberOpen} transparent animationType="fade" onRequestClose={() => setAddMemberOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={s.modalOverlay} onPress={() => setAddMemberOpen(false)}>
            <Pressable style={s.modalSheet} onPress={() => {}}>
              {/* Handle */}
              <View style={s.modalHandle} />

              <Text style={s.modalTitle}>Add Family Member</Text>
              <Text style={s.modalSubtitle}>They'll get their own recipe collection.</Text>

              {/* Avatar picker */}
              <View style={s.avatarPickerRow}>
                {/* Upload option */}
                <TouchableOpacity style={[s.avatarOption, !newMemberAvatar && s.avatarOptionSelected]}>
                  <MaterialIcons name="add-a-photo" size={22} color={C.outline} />
                </TouchableOpacity>

                {/* Template options */}
                {AVATAR_TEMPLATES.map((uri) => (
                  <TouchableOpacity
                    key={uri}
                    style={[s.avatarOption, newMemberAvatar === uri && s.avatarOptionSelected]}
                    onPress={() => setNewMemberAvatar(uri)}
                  >
                    <Image source={{ uri }} style={s.avatarOptionImg} />
                    {newMemberAvatar === uri && (
                      <View style={s.avatarCheckOverlay}>
                        <MaterialIcons name="check-circle" size={18} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Name input */}
              <Text style={s.inputLabel}>Name</Text>
              <TextInput
                style={s.nameInput}
                value={newMemberName}
                onChangeText={setNewMemberName}
                placeholder="e.g. Grandpa, Aunt Rosa…"
                placeholderTextColor={C.outline}
                autoFocus
                returnKeyType="done"
              />

              {/* Actions */}
              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setAddMemberOpen(false); setNewMemberName(""); setNewMemberAvatar(""); }}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, !newMemberName.trim() && s.saveBtnDisabled]}
                  onPress={() => {
                    if (!newMemberName.trim()) return;
                    setFamily((prev) => [...prev, {
                      id: Date.now().toString(),
                      name: newMemberName.trim(),
                      count: "0 recipes",
                      avatar: newMemberAvatar,
                      recipes: [],
                    }]);
                    setNewMemberName("");
                    setNewMemberAvatar("");
                    setAddMemberOpen(false);
                  }}
                >
                  <Text style={s.saveBtnText}>Add Member</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.onSurface, letterSpacing: -0.5 },
  iconBtn: { padding: 8, borderRadius: 999 },
  avatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: C.surfaceContainerHighest },
  avatarImg: { width: "100%", height: "100%" },

  menuOverlay: { flex: 1, backgroundColor: "rgba(34,26,15,0.3)" },
  menuSheet: {
    position: "absolute",
    left: 16,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14,
    overflow: "hidden",
    minWidth: 180,
    shadowColor: "#221a0f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  menuItemText: { fontSize: 15, fontWeight: "600", color: C.onSurface },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  section: { marginBottom: 24, marginTop: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: C.primary },
  viewAll: { fontSize: 10, fontWeight: "600", letterSpacing: 1.5, color: C.onTertiaryFixedVariant },
  memberInitial: { fontSize: 16, fontWeight: "800", color: C.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(34,26,15,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.surfaceContainerLowest,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: C.onSurface, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: C.outline, marginBottom: 24 },
  avatarPickerRow: { flexDirection: "row", gap: 12, marginBottom: 24, alignItems: "center" },
  avatarOption: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 2, borderColor: "transparent",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  avatarOptionSelected: { borderColor: C.primary },
  avatarOptionImg: { width: "100%", height: "100%", borderRadius: 30 },
  avatarCheckOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(156,63,16,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  inputLabel: { fontSize: 12, fontWeight: "700", color: C.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.5 },
  nameInput: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: C.onSurface, marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 999,
    backgroundColor: C.surfaceContainerLow, alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: C.onSurfaceVariant },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 999,
    backgroundColor: C.primary, alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: C.surfaceContainerHigh },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: C.onPrimary },

  addFamilyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.outlineVariant,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  addFamilyText: { fontSize: 11, fontWeight: "600", color: C.primary },
  favRow: { paddingHorizontal: 8, gap: 12 },
  addFav: {
    width: 96, height: 96, borderRadius: 12,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.outlineVariant,
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  addFavLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 0.5, color: C.onSurface },
  favItem: { width: 96 },
  favImg: { width: 96, height: 96, borderRadius: 12, backgroundColor: C.surfaceContainer, marginBottom: 6 },
  favLabel: { fontSize: 11, fontWeight: "500", textAlign: "center", color: C.onSurface },
  memberCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    marginHorizontal: 4,
  },
  memberRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatarRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "transparent", padding: 2, overflow: "hidden", backgroundColor: C.secondaryContainer, alignItems: "center", justifyContent: "center" },
  avatarRingActive: { borderColor: C.primaryContainer },
  memberAvatar: { width: "100%", height: "100%", borderRadius: 999 },
  memberName: { fontSize: 14, fontWeight: "700", color: C.onSurface },
  memberCount: { fontSize: 10, letterSpacing: 1, color: C.onTertiaryFixedVariant, marginTop: 1 },
  recipeList: {
    paddingHorizontal: 14, paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.outlineVariant,
    gap: 8,
  },
  recipeRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 8, backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12, marginTop: 8,
  },
  recipeImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: C.surfaceContainer },
  recipeName: { flex: 1, fontSize: 14, fontWeight: "500", color: C.onSurface },
  addRecipeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, marginTop: 4,
    backgroundColor: C.secondaryContainer + "80",
    borderWidth: 1, borderStyle: "dashed", borderColor: C.primary + "33",
    borderRadius: 12,
  },
  addRecipeBtnText: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: C.primary },
  fab: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginTop: 20, marginBottom: 12,
    height: 58, borderRadius: 999,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
