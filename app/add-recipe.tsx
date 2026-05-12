import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { createFamilyPlan } from "@/services/familyPlanService";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";

// Run: npx expo install expo-image-picker

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  tertiaryFixed: "#E8DFC2",
  outline: "#7A6E5A",
  accent: "#C97B63",
  onPrimary: "#ffffff",
};

const PHOTO_TEMPLATES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAO8ipVd-NjkI1sLd1AUipGb-h3IGrifhUmTjZwuJ7FwJuluzpdAWx6LjzZ0pqLGLezcBY8FpsuiT0hwZf4VhnVQfwnAQIsYj2T0cARpMkQlL6aYAJr0Zc-RgVmzywNNXg8BVcDqsjknyAZMq8R43rRonYW3ihsSQve2oJvOll74XLpQe0G8i7msW6S04K2ps7UXKMrBCl-M96rKMSMkp65otZ9CzgitnQCmOEOPpIdP_RR4siowIUl-Ye5eSWdk9rEmRxyJ_gZ2cw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB4abNG-ERepXH6UGnPiI5BacVRg6Au_4089QusGsq7J_f74ruFdp6xMy2pbnePZ2MBi8h95DPu1gT3kPvfILfBOUjW0QhqkEWodS3W-1OtcixHV0w-cJDFINZlpDsFopMk61rTpcGQKt4jv58o-o2O1Do5a3SpEWo0Tgu05CEEyDVkoVkfrcgn2Ui2KjBMy0Ya1naRZZqyXs2ie7ljnWIE3RG2rpIHnf4mhsGOt4tXFHUQyW9COGWHJO9yUrBAFCD7erxzyIja1wI",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAWNQm6sb5mR3QNMk9rHmmVmsfr86qCSrKdCMUPwGhpkTMBwla45Kw0-uw1Qku0IQRxwb9kGxctKd_jWYCkvRjlLERd6QM8iOyLVUuYQcsuLTQZPsAAUYN3I6DATB58eInmdhhA-ci7IVJLSEWgxTUezQasQuqx-TEu5awfDOBgBxaXtQkbdA3g62RykDRcUofwGTOl3yD0L31Qnc8yuYzkD898Wljktpy992awVHadWl8uUUHUQLb7iDiP8c-MIETcV0l6ZpaBJt8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1bf1dMfvl-csxrk-CEyO0084IFm0C_Hh9GkZ3s2-FJkEKy_vCKJ6ap_aoLAoSbWp13soa3a2ejmVNQ60JFHE1qPdhqzeysKONmKRpOwvZhVOSbI3Ch70MHz8yqf5ZPNjhWVwIah-_KoMbgnJUuSRBwWqiRwikL40IVcYqYBKvV9G7VyMlBDIPEB5_TexZaB__qBXVdiMERrfl0lIPV1JqBlK538RAOapYEBe63aW0yBhODxI-MgQE4Jd-9sd53xguDlJ1WHjKd5c",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDgRl31faxhk8MrSS85YhPicd12q2ks6PeGTxS43mNIA5RKTDBMmZ3IvkyDkBeP0ExQfTZ6FdrJB7lXkzK8pyQEDhISwXZsjMmq3cb8wQQSmT_XZvRZ1TqqBWZ-0DlKIUhQJ6bsmW16Tm_9GSHxRIX-1QIC6TluFRMALwVcCMt1A5dxdh5f9kf1Y1yGLVGddtTFGMMX3x186zhf1bPyRD6wTTzz6ebdhTAU5o1V-TOVYnXH6Jt1qg4l6Ylt4yNFBCDn-Iw4k0RmCNk",
];

type Ingredient = { id: string; text: string };
type Step = { id: string; text: string; ingredientIds: string[] };

let _id = 0;
const uid = () => String(++_id);

export default function AddRecipe() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!editId;

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("family_role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.family_role) setAuthor(data.family_role);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!editId) return;
    supabase
      .from("recipes")
      .select("title, content")
      .eq("id", editId)
      .single()
      .then(({ data }) => {
        if (!data) { setLoadingEdit(false); return; }
        const c = data.content as any ?? {};
        setTitle(data.title ?? "");
        if (c.photo) setPhoto(c.photo);
        if (c.prep_time) setPrepTime(c.prep_time);
        if (c.cook_time) setCookTime(c.cook_time);
        if (c.servings) setServings(c.servings);
        if (c.notes) setNotes(c.notes);
        if (c.author) setAuthor(c.author);
        if (Array.isArray(c.ingredients) && c.ingredients.length > 0) {
          setIngredients(c.ingredients.map((text: string) => ({ id: uid(), text })));
        }
        if (Array.isArray(c.steps) && c.steps.length > 0) {
          setSteps(c.steps.map((step: any) => ({
            id: uid(),
            text: typeof step === "string" ? step : step.instruction ?? "",
            ingredientIds: typeof step === "string" ? [] : (step.ingredientIds ?? []),
          })));
        }
        setLoadingEdit(false);
      });
  }, [editId]);
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: uid(), text: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ id: uid(), text: "", ingredientIds: [] }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [openIngPicker, setOpenIngPicker] = useState<string | null>(null);
  const [metaPicker, setMetaPicker] = useState<"prep" | "cook" | "servings" | null>(null);

  async function saveRecipe() {
    if (!title.trim()) {
      Alert.alert("Name required", "Please give your recipe a name.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      let membership: { id: string; plan_id: string } | undefined;
      if (!isEditing) {
        let { data: memberships } = await supabase
          .from("family_memberships")
          .select("id, plan_id")
          .eq("user_id", user.id)
          .limit(1);
        if (!memberships?.[0]) {
          const displayName = user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Owner";
          await createFamilyPlan(user.id, displayName);
          const { data: refreshed } = await supabase
            .from("family_memberships")
            .select("id, plan_id")
            .eq("user_id", user.id)
            .limit(1);
          memberships = refreshed;
        }
        membership = memberships?.[0];
        if (!membership) throw new Error("Failed to set up your cookbook. Please try again.");
      }
      const validIngredients = ingredients.filter((i) => i.text.trim());
      const ingIdMap: Record<string, string> = {};
      validIngredients.forEach((ing, index) => { ingIdMap[ing.id] = `ing-${index}`; });

      const content = {
        photo: photo ?? null,
        prep_time: prepTime.trim() || null,
        cook_time: cookTime.trim() || null,
        servings: servings.trim() || null,
        ingredients: validIngredients.map((i) => i.text.trim()),
        steps: steps
          .filter((s) => s.text.trim())
          .map((s) => ({
            instruction: s.text.trim(),
            ingredientIds: s.ingredientIds.filter((id) => ingIdMap[id]).map((id) => ingIdMap[id]),
          })),
        notes: notes.trim() || null,
        author: author || null,
      };
      const { error } = isEditing
        ? await supabase.from("recipes").update({ title: title.trim(), content }).eq("id", editId)
        : await supabase.from("recipes").insert({
            plan_id: membership.plan_id,
            created_by_user_id: user.id,
            owner_membership_id: membership.id,
            title: title.trim(),
            content,
          });
      if (error) throw error;
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  function animate() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      setPhotoModalOpen(false);
      setShowTemplates(false);
    }
  }

  function pickTemplate(uri: string) {
    setPhoto(uri);
    setPhotoModalOpen(false);
    setShowTemplates(false);
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
    setSteps((prev) => [...prev, { id: uid(), text: "", ingredientIds: [] }]);
  }


  function toggleStepIngredient(stepId: string, ingId: string) {
    setSteps((prev) => prev.map((s) =>
      s.id !== stepId ? s : {
        ...s,
        ingredientIds: s.ingredientIds.includes(ingId)
          ? s.ingredientIds.filter((id) => id !== ingId)
          : [...s.ingredientIds, ingId],
      }
    ));
  }

  function removeStep(id: string) {
    animate();
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStep(id: string, text: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  }

  const PREP_OPTIONS = ["5 min", "10 min", "15 min", "20 min", "30 min", "45 min", "1 hr", "1.5 hr", "2 hr"];
  const COOK_OPTIONS = ["10 min", "15 min", "20 min", "30 min", "45 min", "1 hr", "1.5 hr", "2 hr", "3 hr", "4 hr"];
  const SERVES_OPTIONS = ["1", "2", "3", "4", "5", "6", "8", "10", "12+"];

  const metaPickerOptions = metaPicker === "prep" ? PREP_OPTIONS : metaPicker === "cook" ? COOK_OPTIONS : SERVES_OPTIONS;
  const metaPickerValue = metaPicker === "prep" ? prepTime : metaPicker === "cook" ? cookTime : servings;
  const metaPickerSet = metaPicker === "prep" ? setPrepTime : metaPicker === "cook" ? setCookTime : setServings;
  const metaPickerLabel = metaPicker === "prep" ? "Prep Time" : metaPicker === "cook" ? "Cook Time" : "Servings";

  if (loadingEdit) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
    <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Top Bar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.topBarLabel}>{isEditing ? "Edit Recipe" : "New Recipe"}</Text>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={saveRecipe} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? "Saving…" : isEditing ? "Update" : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Upload */}
          <TouchableOpacity style={s.photoArea} onPress={() => { setShowTemplates(false); setPhotoModalOpen(true); }} activeOpacity={0.8}>
            {photo ? (
              <Image source={{ uri: photo }} style={s.photoPreview} />
            ) : (
              <>
                <MaterialIcons name="add-photo-alternate" size={36} color={C.outline} />
                <Text style={s.photoLabel}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Photo Picker Modal */}
          <Modal visible={photoModalOpen} transparent animationType="slide" onRequestClose={() => { setPhotoModalOpen(false); setShowTemplates(false); }}>
            <Pressable style={s.photoModalOverlay} onPress={() => { setPhotoModalOpen(false); setShowTemplates(false); }}>
              <Pressable style={s.photoModalSheet} onPress={() => {}}>
                <View style={s.photoModalHandle} />

                {!showTemplates ? (
                  <>
                    <Text style={s.photoModalTitle}>Add a Photo</Text>
                    <View style={s.photoModalBtns}>
                      <TouchableOpacity style={s.photoModalBtn} onPress={pickFromLibrary} activeOpacity={0.8}>
                        <View style={s.photoModalBtnIcon}>
                          <MaterialIcons name="photo-library" size={26} color={C.primary} />
                        </View>
                        <Text style={s.photoModalBtnLabel}>Upload Photo</Text>
                        <Text style={s.photoModalBtnSub}>From your camera roll</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.photoModalBtn} onPress={() => setShowTemplates(true)} activeOpacity={0.8}>
                        <View style={s.photoModalBtnIcon}>
                          <MaterialIcons name="auto-awesome" size={26} color={C.primary} />
                        </View>
                        <Text style={s.photoModalBtnLabel}>Use Template</Text>
                        <Text style={s.photoModalBtnSub}>Pick a placeholder photo</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={s.photoTemplateHeader}>
                      <TouchableOpacity onPress={() => setShowTemplates(false)} style={s.photoBackBtn}>
                        <MaterialIcons name="arrow-back" size={20} color={C.primary} />
                      </TouchableOpacity>
                      <Text style={s.photoModalTitle}>Choose a Template</Text>
                    </View>
                    <View style={s.photoTemplateGrid}>
                      {PHOTO_TEMPLATES.map((uri) => (
                        <TouchableOpacity key={uri} onPress={() => pickTemplate(uri)} activeOpacity={0.8} style={s.photoTemplateItem}>
                          <Image source={{ uri }} style={s.photoTemplateImg} />
                          {photo === uri && (
                            <View style={s.photoTemplateCheck}>
                              <MaterialIcons name="check-circle" size={22} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </Pressable>
            </Pressable>
          </Modal>

          {/* Author */}
          <View style={s.authorRow}>
            <Text style={s.authorPrefix}>By</Text>
            <TextInput
              style={[s.authorInput, s.authorInputLocked]}
              value={author}
              editable={false}
              placeholder="Set your family role in Profile"
              placeholderTextColor={C.outline}
            />
          </View>

          {/* Recipe Title */}
          <TextInput
            style={s.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Recipe Name"
            placeholderTextColor={C.outline}
          />

          {/* Meta Row — dropdown pickers */}
          <View style={s.metaRow}>
            <TouchableOpacity style={s.metaItem} onPress={() => setMetaPicker("prep")} activeOpacity={0.7}>
              <MaterialIcons name="timer" size={18} color={C.primary} />
              <Text style={[s.metaPickerText, !prepTime && s.metaPickerPlaceholder]}>
                {prepTime || "Prep"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={16} color={C.outline} />
            </TouchableOpacity>
            <View style={s.metaDivider} />
            <TouchableOpacity style={s.metaItem} onPress={() => setMetaPicker("cook")} activeOpacity={0.7}>
              <MaterialIcons name="outdoor-grill" size={18} color={C.primary} />
              <Text style={[s.metaPickerText, !cookTime && s.metaPickerPlaceholder]}>
                {cookTime || "Cook"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={16} color={C.outline} />
            </TouchableOpacity>
            <View style={s.metaDivider} />
            <TouchableOpacity style={s.metaItem} onPress={() => setMetaPicker("servings")} activeOpacity={0.7}>
              <MaterialIcons name="restaurant" size={18} color={C.primary} />
              <Text style={[s.metaPickerText, !servings && s.metaPickerPlaceholder]}>
                {servings ? `Serves ${servings}` : "Serves"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={16} color={C.outline} />
            </TouchableOpacity>
          </View>

          {/* Meta Picker Modal */}
          <Modal visible={!!metaPicker} transparent animationType="slide" onRequestClose={() => setMetaPicker(null)}>
            <Pressable style={s.photoModalOverlay} onPress={() => setMetaPicker(null)}>
              <Pressable style={s.photoModalSheet} onPress={() => {}}>
                <View style={s.photoModalHandle} />
                <Text style={s.photoModalTitle}>{metaPickerLabel}</Text>
                <View style={s.pickerGrid}>
                  {metaPickerOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[s.pickerChip, metaPickerValue === opt && s.pickerChipActive]}
                      onPress={() => { metaPickerSet(opt); setMetaPicker(null); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.pickerChipText, metaPickerValue === opt && s.pickerChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                  {metaPickerValue && !metaPickerOptions.includes(metaPickerValue) && (
                    <TouchableOpacity
                      style={[s.pickerChip, s.pickerChipActive]}
                      onPress={() => setMetaPicker(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.pickerChipText, s.pickerChipTextActive]}>{metaPickerValue}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={s.pickerClear} onPress={() => { metaPickerSet(""); setMetaPicker(null); }}>
                  <Text style={s.pickerClearText}>Clear</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Ingredients */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ingredients</Text>
            <DraggableFlatList
              data={ingredients}
              keyExtractor={(ing) => ing.id}
              onDragEnd={({ data }) => setIngredients(data)}
              scrollEnabled={false}
              renderItem={({ item: ing, drag, isActive, getIndex }: RenderItemParams<Ingredient>) => {
                const index = getIndex() ?? 0;
                return (
                  <ScaleDecorator activeScale={0.98}>
                    <View style={[s.listRow, isActive && { opacity: 0.85 }]}>
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
                      <TouchableOpacity onLongPress={drag} delayLongPress={100} hitSlop={6} style={s.dragHandle}>
                        <MaterialIcons name="drag-handle" size={20} color={C.outlineVariant} />
                      </TouchableOpacity>
                      {ingredients.length > 1 && (
                        <TouchableOpacity onPress={() => removeIngredient(ing.id)} style={s.deleteBtn}>
                          <MaterialIcons name="close" size={16} color={C.outline} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScaleDecorator>
                );
              }}
            />
            <TouchableOpacity style={s.addRowBtn} onPress={addIngredient}>
              <MaterialIcons name="add" size={18} color={C.primary} />
              <Text style={s.addRowText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Instructions</Text>
            <DraggableFlatList
              data={steps}
              keyExtractor={(step) => step.id}
              onDragEnd={({ data }) => setSteps(data)}
              scrollEnabled={false}
              renderItem={({ item: step, drag, isActive, getIndex }: RenderItemParams<Step>) => {
                const index = getIndex() ?? 0;
                const pickerOpen = openIngPicker === step.id;
                const filledIngredients = ingredients.filter((i) => i.text.trim());
                const selectedCount = step.ingredientIds.filter((id) =>
                  filledIngredients.some((i) => i.id === id)
                ).length;
                return (
                  <ScaleDecorator activeScale={0.98}>
                    <View style={[s.stepCard, isActive && { opacity: 0.85 }]}>
                      <View style={s.stepRow}>
                        <View style={s.stepBadge}>
                          <Text style={s.stepBadgeText}>{index + 1}</Text>
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
                        <TouchableOpacity onLongPress={drag} delayLongPress={100} hitSlop={6} style={s.dragHandle}>
                          <MaterialIcons name="drag-handle" size={20} color={C.outlineVariant} />
                        </TouchableOpacity>
                        {steps.length > 1 && (
                          <TouchableOpacity onPress={() => removeStep(step.id)} style={s.deleteBtn}>
                            <MaterialIcons name="close" size={16} color={C.outline} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Ingredient linker */}
                      {filledIngredients.length > 0 && (
                        <View style={s.stepIngSection}>
                          <TouchableOpacity
                            style={s.stepIngToggle}
                            onPress={() => setOpenIngPicker(pickerOpen ? null : step.id)}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="link" size={15} color={C.primary} />
                            <Text style={s.stepIngToggleText}>
                              {selectedCount > 0 ? `${selectedCount} ingredient${selectedCount > 1 ? "s" : ""} linked` : "Link ingredients"}
                            </Text>
                            <MaterialIcons name={pickerOpen ? "expand-less" : "expand-more"} size={16} color={C.primary} />
                          </TouchableOpacity>

                          {pickerOpen && (
                            <View style={s.stepIngList}>
                              {filledIngredients.map((ing) => {
                                const checked = step.ingredientIds.includes(ing.id);
                                return (
                                  <TouchableOpacity
                                    key={ing.id}
                                    style={s.stepIngItem}
                                    onPress={() => toggleStepIngredient(step.id, ing.id)}
                                    activeOpacity={0.7}
                                  >
                                    <MaterialIcons
                                      name={checked ? "check-box" : "check-box-outline-blank"}
                                      size={18}
                                      color={checked ? C.primary : C.outline}
                                    />
                                    <Text style={[s.stepIngItemText, checked && s.stepIngItemChecked]} numberOfLines={1}>
                                      {ing.text.trim()}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </ScaleDecorator>
                );
              }}
            />
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
  topBarLabel: {
    flex: 1, fontSize: 16, fontWeight: "600", color: C.onSurface,
    textAlign: "center", letterSpacing: -0.2,
  },
  titleInput: {
    fontSize: 22, fontWeight: "700", color: C.onSurface,
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant,
    marginBottom: 12, letterSpacing: -0.3,
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
    borderWidth: 1, borderColor: C.outlineVariant,
    alignItems: "center", justifyContent: "center", gap: 8,
    marginBottom: 16, overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%", borderRadius: 16 },
  photoLabel: { fontSize: 14, color: C.outline, fontWeight: "500" },

  photoModalOverlay: { flex: 1, backgroundColor: "rgba(28,33,16,0.5)", justifyContent: "flex-end" },
  photoModalSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40,
  },
  photoModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, alignSelf: "center", marginBottom: 20 },
  photoModalTitle: { fontSize: 18, fontWeight: "700", color: C.onSurface, marginBottom: 20 },
  photoModalBtns: { flexDirection: "row", gap: 12 },
  photoModalBtn: {
    flex: 1, backgroundColor: C.surfaceContainerLow, borderRadius: 16,
    padding: 16, alignItems: "center", gap: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
  },
  photoModalBtnIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.surfaceContainerHigh,
    alignItems: "center", justifyContent: "center",
  },
  photoModalBtnLabel: { fontSize: 14, fontWeight: "700", color: C.onSurface },
  photoModalBtnSub: { fontSize: 11, color: C.outline, textAlign: "center" },

  photoTemplateHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  photoBackBtn: { padding: 4 },
  photoTemplateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoTemplateItem: { width: "30%", aspectRatio: 1, borderRadius: 12, overflow: "hidden" },
  photoTemplateImg: { width: "100%", height: "100%" },
  photoTemplateCheck: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(77,106,40,0.45)",
    alignItems: "center", justifyContent: "center",
  },

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
  authorInputLocked: { opacity: 0.7 },

  metaRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surfaceContainerLow, borderRadius: 14,
    padding: 12, marginBottom: 8,
  },
  metaItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  metaDivider: { width: 1, height: 28, backgroundColor: C.outlineVariant },
  metaPickerText: { flex: 1, fontSize: 13, fontWeight: "500", color: C.onSurface },
  metaPickerPlaceholder: { color: C.outline },

  pickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  pickerChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1, borderColor: C.outlineVariant, backgroundColor: C.surfaceContainerLow,
  },
  pickerChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  pickerChipText: { fontSize: 14, color: C.onSurface, fontWeight: "500" },
  pickerChipTextActive: { color: "#fff", fontWeight: "700" },
  pickerClear: { alignSelf: "center", paddingVertical: 8 },
  pickerClearText: { fontSize: 13, color: C.outline },

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
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12, marginTop: 4,
  },
  addRowText: { fontSize: 13, fontWeight: "600", color: C.primary },

  stepCard: {
    backgroundColor: C.surfaceContainerLowest, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
    shadowColor: "#1C2110", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14, marginTop: 2,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  stepBadgeText: { color: C.onPrimary, fontWeight: "700", fontSize: 12 },
  stepInput: { flex: 1, fontSize: 14, color: C.onSurface, lineHeight: 22, minHeight: 28 },

  dragHandle: { paddingHorizontal: 4, paddingVertical: 2 },

  stepIngSection: { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.outlineVariant, paddingTop: 8 },
  stepIngToggle: { flexDirection: "row", alignItems: "center", gap: 5 },
  stepIngToggleText: { flex: 1, fontSize: 12, color: C.primary, fontWeight: "600" },
  stepIngList: { marginTop: 8, gap: 2 },
  stepIngItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  stepIngItemText: { flex: 1, fontSize: 13, color: C.onSurfaceVariant },
  stepIngItemChecked: { color: C.primary, fontWeight: "600" },

  notesCard: {
    backgroundColor: C.tertiaryFixed, borderRadius: 14,
    padding: 16,
  },
  notesInput: {
    fontSize: 15, fontStyle: "italic", color: C.onTertiaryFixedVariant,
    lineHeight: 24, minHeight: 80,
  },
});
