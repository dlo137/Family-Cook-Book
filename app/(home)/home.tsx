import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
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
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";

const C = {
  primary: "#556B2F",
  surface: "#F6F3EA",
  surfaceContainer: "#E8E0CE",
  surfaceContainerLow: "#EDE7D9",
  surfaceContainerHigh: "#DDD4BE",
  surfaceContainerLowest: "#FDFAF4",
  surfaceContainerHighest: "#D3C9AE",
  onSurface: "#3F3426",
  onSurfaceVariant: "#5C4F3A",
  onTertiaryFixedVariant: "#4A5228",
  outlineVariant: "#C8BFAB",
  secondaryContainer: "#D4C89A",
  primaryContainer: "#6B8040",
  outline: "#7A6E5A",
  onPrimary: "#ffffff",
  accent: "#C97B63",
};

type FamilyRecipeItem = { id: string; name: string; source: number | { uri: string } | null };
type HomeMember = { id: string; name: string; avatar: string };

const HARDCODED_RECIPES: Record<string, FamilyRecipeItem[]> = {
  mom: [{ id: "static-1", name: "Mom's Famous Lasagna", source: require("../../assets/lasagna.png") }],
  dad: [{ id: "static-3", name: "Dad's Summer Salad", source: require("../../assets/salad1.avif") }],
  grandma: [{ id: "static-2", name: "Grandma's Sunday Roast", source: require("../../assets/beefstew.jpg") }],
};

const FAMILY: HomeMember[] = [
  {
    id: "mom",
    name: "Mom",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxWGPbNEawsG3axY83GA5D-2w7Tt8gYvXVlBZZHwXHFOyTZXBOr95TW-nX6VXn5mtAx6BehUwQfB-KPqjNFDWbXgzdLwsyWnzM49DRA2u319eWZ_Sd0MxtdBZbWNEKrnOyjLO750TGsxLncVwgtCtAP46XZSQSC-Lxx0gAv1_4SKA8V5viP390w08AonpenbCllAOn4Imx00WMPaDmb53PmjGwonH0gQcK1j-EVi2Bx7VvsIp-ANobpz_0rL3CZZFFtW6aJd2P3Xk",
  },
  {
    id: "dad",
    name: "Dad",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjnbgU_5_u65tlYEEzommgafl584wdlO4l2dKSPT0-ZJEn5a-lqmYvGh0zZcYR-pZ-yrpP08lp1k_Msz2jR5e9GOKnHyx9ruxg1LZNBRmDyLZ7DFE2O84qjDFB42QjWUgLAIjsKPvvj6m5borLgpL2bHw_cKWheYBVDXug2HL_9BJ4catqMYGc6HKWIDaQHvwxSH81MKAo4RvpvR71E3x6Jwfr4x04qHaV77WmvtOXkrlvRUyQVqklkOVbqGFHAdnWYfOo4vsdteo",
  },
  {
    id: "grandma",
    name: "Grandma",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA02DNm62bt4F_evfbcb2DhU8WvSyXAEDq6FeVKHfohl4mbWHLaUn2fPSTLwZtfUlj7T-D8_7z5VbSbm9aVKl4fStAfXnnfz9pIL1Qy_ar2ihmNXKsrcyBgAVcT_jlooj9Q8o4nOFeV6Ps2wzslsslIMYXBAa2-TvFzgtol-UbvfUggMOn1vXDkJwHSIkJDjY81zzZNYtpjiH0HQhBBn8oAq1nswKGuXbJaIUWJQHwAtpnTF0QzH8rvjt3OI4u_2ow01cl3seBv_-0",
  },
];

const PS_NOTES = [
  { text: "Always taste before you season. Your father never learned that lesson.", from: "Kitchen wisdom" },
  { text: "The secret to perfect pasta? More salt in the water than you think is reasonable.", from: "The secret keeper" },
  { text: "Never rush a good pot of chili. Low and slow — same as everything worth doing.", from: "A trusted voice" },
  { text: "If it smells right, it probably is right. Trust your nose more than the timer.", from: "The wise one" },
  { text: "A little extra butter never hurt nobody. That's not a suggestion, it's a rule.", from: "A kind voice" },
  { text: "Cook with love. People can taste the difference, even if they can't explain it.", from: "A warm memory" },
  { text: "When in doubt, add garlic. I have never once regretted adding garlic.", from: "A family favorite" },
  { text: "Let the meat rest. I know you're hungry — so is everyone — just wait five minutes.", from: "A gentle reminder" },
];

const AVATAR_TEMPLATES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBxWGPbNEawsG3axY83GA5D-2w7Tt8gYvXVlBZZHwXHFOyTZXBOr95TW-nX6VXn5mtAx6BehUwQfB-KPqjNFDWbXgzdLwsyWnzM49DRA2u319eWZ_Sd0MxtdBZbWNEKrnOyjLO750TGsxLncVwgtCtAP46XZSQSC-Lxx0gAv1_4SKA8V5viP390w08AonpenbCllAOn4Imx00WMPaDmb53PmjGwonH0gQcK1j-EVi2Bx7VvsIp-ANobpz_0rL3CZZFFtW6aJd2P3Xk",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAjnbgU_5_u65tlYEEzommgafl584wdlO4l2dKSPT0-ZJEn5a-lqmYvGh0zZcYR-pZ-yrpP08lp1k_Msz2jR5e9GOKnHyx9ruxg1LZNBRmDyLZ7DFE2O84qjDFB42QjWUgLAIjsKPvvj6m5borLgpL2bHw_cKWheYBVDXug2HL_9BJ4catqMYGc6HKWIDaQHvwxSH81MKAo4RvpvR71E3x6Jwfr4x04qHaV77WmvtOXkrlvRUyQVqklkOVbqGFHAdnWYfOo4vsdteo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA02DNm62bt4F_evfbcb2DhU8WvSyXAEDq6FeVKHfohl4mbWHLaUn2fPSTLwZtfUlj7T-D8_7z5VbSbm9aVKl4fStAfXnnfz9pIL1Qy_ar2ihmNXKsrcyBgAVcT_jlooj9Q8o4nOFeV6Ps2wzslsslIMYXBAa2-TvFzgtol-UbvfUggMOn1vXDkJwHSIkJDjY81zzZNYtpjiH0HQhBBn8oAq1nswKGuXbJaIUWJQHwAtpnTF0QzH8rvjt3OI4u_2ow01cl3seBv_-0",
];


export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [family, setFamily] = useState<HomeMember[]>(FAMILY);
  const [familyRole, setFamilyRole] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const psNote = useMemo(() => PS_NOTES[Math.floor(Math.random() * PS_NOTES.length)], []);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [dbRecipes, setDbRecipes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("family_role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        const role = data?.family_role ?? null;
        setFamilyRole(role);
        if (role) {
          setFamily((prev) => {
            const exists = prev.some((m) => m.name.toLowerCase() === role.toLowerCase());
            if (exists) return prev;
            return [...prev, { id: role.toLowerCase(), name: role, avatar: "" }];
          });
        }
      });
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      supabase
        .from("family_memberships")
        .select("plan_id")
        .eq("user_id", user.id)
        .limit(1)
        .then(({ data: memberships }) => {
          const planId = memberships?.[0]?.plan_id;
          if (!planId) return;
          supabase
            .from("recipes")
            .select("id, title, content")
            .eq("plan_id", planId)
            .order("created_at", { ascending: false })
            .then(({ data }) => setDbRecipes(data ?? []));
        });
    }, [user?.id])
  );

  const sortedFamily = editMode
    ? family
    : [...family].sort((a, b) => {
        const myRole = familyRole?.toLowerCase() ?? '';
        if (a.name.toLowerCase() === myRole) return -1;
        if (b.name.toLowerCase() === myRole) return 1;
        return 0;
      });

  function moveUp(index: number) {
    if (index === 0) return;
    setFamily((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setFamily((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function deleteMember(id: string) {
    setFamily((prev) => prev.filter((m) => m.id !== id));
  }

  function commitRename(id: string) {
    const trimmed = renameText.trim();
    if (trimmed) {
      setFamily((prev) => prev.map((m) => m.id === id ? { ...m, name: trimmed } : m));
    }
    setRenamingId(null);
    setRenameText("");
  }

  return (
    <LinearGradient colors={["#F8F5EC", "#EDE5D2"]} style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>The Family Cookbook</Text>
        <TouchableOpacity style={s.avatar} onPress={() => router.push("/(home)/profile")} activeOpacity={0.8}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwnsiky2TruhS7MEhrclqbeCFJanL4OM_l0QRtWgIO6F42B2DOJ55114i2cbxA_0W8tGPIbmAYU09LZPuuPsvFqoZC2NY0uZXbbO3zkQI51WNdlSpWg_kB525VJR5uvagYuVW3GVKuertEHD0D6jjB9J5h2au3lAy3qdPZ3S4KiVHuwzOmHrdzGoKO6SqdkWgWq4Rkn4aYTgLuFKgSMXThdHXPbL3wgO1P4HAtkgPsZ_OmxmarP4PfjWv7TDuBfLgVumDfCV-ImCQ" }}
            style={s.avatarImg}
          />
        </TouchableOpacity>
      </View>


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
            <TouchableOpacity onPress={() => router.push("/add-favorite")} activeOpacity={0.7}>
              <Text style={s.viewAll}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.favRow}>
            <TouchableOpacity style={s.addFav} onPress={() => router.push("/add-favorite")}>
              <MaterialIcons name="add-circle" size={28} color={C.accent} />
              <Text style={s.addFavLabel}>ADD NEW</Text>
            </TouchableOpacity>
            {favorites.map((fav) => (
              <TouchableOpacity key={fav.id} style={s.favItem} activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/recipe", params: { id: fav.id } } as any)}>
                {fav.source ? (
                  <Image source={fav.source as any} style={s.favImg} resizeMode="cover" />
                ) : (
                  <View style={[s.favImg, { backgroundColor: C.surfaceContainerHigh, alignItems: "center", justifyContent: "center", borderRadius: 12 }]}>
                    <MaterialIcons name="restaurant" size={20} color={C.outlineVariant} />
                  </View>
                )}
                <Text style={s.favLabel} numberOfLines={2}>{fav.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Family Recipes */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { paddingHorizontal: 8 }]}>Recipes</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {!editMode && (
                <TouchableOpacity style={s.addFamilyBtn} onPress={() => setAddMemberOpen(true)}>
                  <MaterialIcons name="add-circle" size={16} color={C.primary} />
                  <Text style={s.addFamilyText}>Add Member</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.addFamilyBtn, editMode && s.addFamilyBtnActive]}
                onPress={() => { setEditMode((v) => !v); setRenamingId(null); }}
              >
                <MaterialIcons name={editMode ? "check" : "swap-vert"} size={16} color={editMode ? "#fff" : C.primary} />
                <Text style={[s.addFamilyText, editMode && { color: "#fff" }]}>{editMode ? "Done" : "Reorder"}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <DraggableFlatList
            data={sortedFamily}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => setFamily(data)}
            renderItem={({ item: member, drag, isActive, getIndex }) => {
              const index = getIndex() ?? 0;
              const isOpen = !editMode && expanded === member.id;
              const isRenaming = renamingId === member.id;
              const staticRecipes = HARDCODED_RECIPES[member.id] ?? [];
              const memberRecipes: FamilyRecipeItem[] = [
                ...staticRecipes,
                ...dbRecipes
                  .filter((r: any) => (r.content as any)?.author?.toLowerCase() === member.name.toLowerCase())
                  .map((r: any) => ({
                    id: r.id,
                    name: r.title,
                    source: (r.content as any)?.photo ? { uri: (r.content as any).photo } : null,
                  })),
              ];
              return (
                <ScaleDecorator activeScale={0.98}>
                  <View style={[s.memberCard, isActive && s.memberCardDragging]}>
                    <View style={s.memberRow}>
                      {editMode ? (
                        <>
                          <View style={s.reorderBtns}>
                            <TouchableOpacity onPress={() => moveUp(index)} hitSlop={6} disabled={index === 0}>
                              <MaterialIcons name="keyboard-arrow-up" size={22} color={index === 0 ? C.outlineVariant : C.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => moveDown(index)} hitSlop={6} disabled={index === sortedFamily.length - 1}>
                              <MaterialIcons name="keyboard-arrow-down" size={22} color={index === sortedFamily.length - 1 ? C.outlineVariant : C.primary} />
                            </TouchableOpacity>
                          </View>
                          <View style={s.avatarRing}>
                            {member.avatar ? (
                              <Image source={{ uri: member.avatar }} style={s.memberAvatar} />
                            ) : (
                              <Text style={s.memberInitial}>{member.name.charAt(0).toUpperCase()}</Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            {isRenaming ? (
                              <TextInput
                                style={s.renameInput}
                                value={renameText}
                                onChangeText={setRenameText}
                                onBlur={() => commitRename(member.id)}
                                onSubmitEditing={() => commitRename(member.id)}
                                autoFocus
                                returnKeyType="done"
                              />
                            ) : (
                              <Text style={s.memberName}>{member.name}</Text>
                            )}
                          </View>
                          <TouchableOpacity onPress={() => { setRenamingId(member.id); setRenameText(member.name); }} hitSlop={6} style={{ paddingHorizontal: 4 }}>
                            <MaterialIcons name="edit" size={18} color={C.outline} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteMember(member.id)} hitSlop={6} style={{ paddingHorizontal: 4 }}>
                            <MaterialIcons name="delete-outline" size={20} color="#e74c3c" />
                          </TouchableOpacity>
                          <TouchableOpacity onLongPress={drag} delayLongPress={50} hitSlop={6} style={{ paddingHorizontal: 4 }}>
                            <MaterialIcons name="drag-handle" size={22} color={C.outlineVariant} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
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
                            <Text style={s.memberCount}>{`${memberRecipes.length} RECIPE${memberRecipes.length !== 1 ? "S" : ""}`}</Text>
                          </View>
                          <MaterialIcons name={isOpen ? "expand-less" : "expand-more"} size={24} color={isOpen ? C.primary : C.outline} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {!editMode && isOpen && (
                      <View style={s.recipeList}>
                        {memberRecipes.map((recipe) => (
                          <TouchableOpacity
                            key={recipe.id}
                            style={s.recipeRow}
                            activeOpacity={0.7}
                            onPress={() => router.push({ pathname: "/recipe", params: { id: recipe.id } } as any)}
                          >
                            {recipe.source ? (
                              <Image source={recipe.source as any} style={s.recipeImg} resizeMode="cover" />
                            ) : (
                              <View style={[s.recipeImg, { backgroundColor: C.surfaceContainerHigh, alignItems: "center", justifyContent: "center" }]}>
                                <MaterialIcons name="restaurant" size={18} color={C.outlineVariant} />
                              </View>
                            )}
                            <Text style={s.recipeName}>{recipe.name}</Text>
                            <MaterialIcons name="chevron-right" size={18} color={C.outline} />
                          </TouchableOpacity>
                        ))}
                        {memberRecipes.length === 0 && (
                          <Text style={{ fontSize: 13, color: C.outline, paddingHorizontal: 12, paddingVertical: 8 }}>No recipes yet</Text>
                        )}
                        {familyRole && member.name.toLowerCase() === familyRole.toLowerCase() && (
                          <TouchableOpacity style={s.addRecipeBtn} onPress={() => router.push("/add-recipe")}>
                            <MaterialIcons name="add" size={16} color={C.primary} />
                            <Text style={s.addRecipeBtnText}>ADD RECIPE</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        </View>

        {/* Start New Recipe Button */}
        <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => router.push("/add-recipe")}>
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text style={s.fabText}>Save New Recipe</Text>
        </TouchableOpacity>

        {/* P.S. Note */}
        <View style={s.psOuter}>
          <View style={s.psSheet}>
            {/* Crease lines */}
            <View style={s.psCrease1} />
            <View style={s.psCrease2} />
            {/* Folded corner */}
            <View style={s.psFold} />
            <Text style={s.psLabel}>P.S.</Text>
            <Text style={s.psTip}>"{psNote.text}"</Text>
            <Text style={s.psFrom}>— {psNote.from}</Text>
          </View>
        </View>
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

              {/* Role picker */}
              <Text style={s.inputLabel}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.roleChipsRow}>
                {['Mom', 'Dad', 'Grandma', 'Grandpa', 'Sister', 'Brother', 'Aunt', 'Uncle', 'Other'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[s.roleChip, newMemberRole === role && s.roleChipActive]}
                    onPress={() => {
                      setNewMemberRole(role);
                      if (!newMemberName.trim()) setNewMemberName(role);
                    }}
                  >
                    <Text style={[s.roleChipText, newMemberRole === role && s.roleChipTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Name input */}
              <Text style={[s.inputLabel, { marginTop: 16 }]}>Name</Text>
              <TextInput
                style={s.nameInput}
                value={newMemberName}
                onChangeText={setNewMemberName}
                placeholder="e.g. Grandpa, Aunt Rosa…"
                placeholderTextColor={C.outline}
                returnKeyType="done"
              />

              {/* Actions */}
              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setAddMemberOpen(false); setNewMemberName(""); setNewMemberAvatar(""); setNewMemberRole(""); }}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, !newMemberName.trim() && s.saveBtnDisabled]}
                  onPress={() => {
                    if (!newMemberName.trim()) return;
                    setFamily((prev) => [...prev, {
                      id: Date.now().toString(),
                      name: newMemberName.trim(),
                      avatar: newMemberAvatar,
                    }]);
                    setNewMemberName("");
                    setNewMemberAvatar("");
                    setNewMemberRole("");
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

    </LinearGradient>
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
  headerTitle: { fontSize: 28, fontFamily: "GreatVibes_400Regular", color: C.onSurface },
  avatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden", backgroundColor: C.surfaceContainerHighest },
  avatarImg: { width: "100%", height: "100%" },


  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  section: { marginBottom: 24, marginTop: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: C.primary },
  viewAll: { fontSize: 10, fontWeight: "600", letterSpacing: 1.5, color: C.onTertiaryFixedVariant },
  memberInitial: { fontSize: 16, fontWeight: "800", color: C.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(28,33,16,0.4)", justifyContent: "flex-end" },
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
    backgroundColor: "rgba(77,106,40,0.45)",
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

  roleChipsRow: { gap: 8, paddingBottom: 4 },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceContainerLow,
  },
  roleChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  roleChipText: { fontSize: 13, fontWeight: "600", color: C.onSurfaceVariant },
  roleChipTextActive: { color: "#fff" },

  addFamilyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1, borderColor: C.outlineVariant,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  addFamilyBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  addFamilyText: { fontSize: 11, fontWeight: "600", color: C.primary },
  reorderBtns: { flexDirection: "column", alignItems: "center", marginRight: 4 },
  renameInput: {
    fontSize: 14, fontWeight: "700", color: C.onSurface,
    borderBottomWidth: 1, borderBottomColor: C.primary,
    paddingVertical: 2,
  },
  favRow: { paddingHorizontal: 8, gap: 12 },
  addFav: {
    width: 96, height: 96, borderRadius: 12,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1, borderColor: C.outlineVariant,
    alignItems: "center", justifyContent: "center", gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  addFavLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 0.5, color: C.onSurface },
  favItem: { width: 96, alignItems: "center" },
  favImg: { width: 96, height: 96, borderRadius: 12, backgroundColor: C.surfaceContainer, marginBottom: 6, overflow: "hidden" },
  favLabel: { fontSize: 11, fontWeight: "500", textAlign: "center", color: C.onSurface },
  memberCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    marginHorizontal: 4,
  },
  memberCardDragging: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 10,
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
  recipeImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: C.surfaceContainer, overflow: "hidden" },
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
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  psOuter: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    transform: [{ rotate: "-1.4deg" }],
    shadowColor: "#3B2A1A",
    shadowOffset: { width: 3, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  psSheet: {
    backgroundColor: "#FDF4D0",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DFC97A",
    overflow: "hidden",
  },
  psCrease1: {
    position: "absolute", top: 28, left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D4B85A",
    opacity: 0.25,
    transform: [{ rotate: "0.4deg" }],
  },
  psCrease2: {
    position: "absolute", top: 0, bottom: 0, left: 44,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#D4B85A",
    opacity: 0.2,
    transform: [{ rotate: "0.2deg" }],
  },
  psFold: {
    position: "absolute", bottom: 0, right: 0,
    width: 0, height: 0,
    borderStyle: "solid",
    borderLeftWidth: 28, borderBottomWidth: 28,
    borderLeftColor: "transparent",
    borderBottomColor: "#E8CF7A",
  },
  psLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7A5C1E",
    letterSpacing: 1,
    marginBottom: 10,
  },
  psTip: {
    fontFamily: "GreatVibes_400Regular",
    fontSize: 22,
    color: "#4A3410",
    lineHeight: 32,
    marginBottom: 12,
  },
  psFrom: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#7A5C1E",
    fontWeight: "600",
    textAlign: "right",
    paddingRight: 32,
  },
});
