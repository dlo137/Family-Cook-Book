import { useRef, useState } from "react";
import {
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
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

// Run: npx expo install expo-image-picker

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  tertiaryFixed: "#ffdbca",
  outline: "#8a7269",
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
type Step = { id: string; text: string };

let _id = 0;
const uid = () => String(++_id);

export default function AddRecipe() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: uid(), text: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ id: uid(), text: "" }]);
  const [notes, setNotes] = useState("");

  function animate() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    setSteps((prev) => [...prev, { id: uid(), text: "" }]);
  }

  function removeStep(id: string) {
    animate();
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStep(id: string, text: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
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
          <TextInput
            style={s.topBarTitle}
            value={title}
            onChangeText={setTitle}
            placeholder="New Recipe"
            placeholderTextColor={C.outline}
          />
          <TouchableOpacity style={s.saveBtn} onPress={() => router.back()}>
            <Text style={s.saveBtnText}>Save</Text>
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
              style={s.authorInput}
              value={author}
              onChangeText={setAuthor}
              placeholder="Family member"
              placeholderTextColor={C.outline}
            />
          </View>

          {/* Meta Row */}
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <MaterialIcons name="timer" size={18} color={C.primary} />
              <TextInput
                style={s.metaInput}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="Prep"
                placeholderTextColor={C.outline}
                keyboardType="default"
              />
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <MaterialIcons name="outdoor-grill" size={18} color={C.primary} />
              <TextInput
                style={s.metaInput}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="Cook"
                placeholderTextColor={C.outline}
              />
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <MaterialIcons name="restaurant" size={18} color={C.primary} />
              <TextInput
                style={s.metaInput}
                value={servings}
                onChangeText={setServings}
                placeholder="Serves"
                placeholderTextColor={C.outline}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Ingredients */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ingredients</Text>
            {ingredients.map((ing, index) => (
              <View key={ing.id} style={s.listRow}>
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
                {ingredients.length > 1 && (
                  <TouchableOpacity onPress={() => removeIngredient(ing.id)} style={s.deleteBtn}>
                    <MaterialIcons name="close" size={16} color={C.outline} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={s.addRowBtn} onPress={addIngredient}>
              <MaterialIcons name="add" size={18} color={C.primary} />
              <Text style={s.addRowText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Instructions</Text>
            {steps.map((step, index) => (
              <View key={step.id} style={s.stepCard}>
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
                  {steps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(step.id)} style={s.deleteBtn}>
                      <MaterialIcons name="close" size={16} color={C.outline} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
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
  topBarTitle: {
    flex: 1, fontSize: 18, fontWeight: "700", color: C.onSurface,
    letterSpacing: -0.3,
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
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.outlineVariant,
    alignItems: "center", justifyContent: "center", gap: 8,
    marginBottom: 16, overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%", borderRadius: 16 },
  photoLabel: { fontSize: 14, color: C.outline, fontWeight: "500" },

  photoModalOverlay: { flex: 1, backgroundColor: "rgba(34,26,15,0.5)", justifyContent: "flex-end" },
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
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(156,63,16,0.45)",
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

  metaRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surfaceContainerLow, borderRadius: 14,
    padding: 12, marginBottom: 8,
  },
  metaItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  metaDivider: { width: 1, height: 28, backgroundColor: C.outlineVariant },
  metaInput: { flex: 1, fontSize: 13, fontWeight: "500", color: C.onSurface },

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
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.outlineVariant,
    borderRadius: 12, marginTop: 4,
  },
  addRowText: { fontSize: 13, fontWeight: "600", color: C.primary },

  stepCard: {
    backgroundColor: C.surfaceContainerLowest, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant,
    shadowColor: "#221a0f", shadowOffset: { width: 0, height: 1 },
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

  notesCard: {
    backgroundColor: C.tertiaryFixed, borderRadius: 14,
    padding: 16,
  },
  notesInput: {
    fontSize: 15, fontStyle: "italic", color: C.onTertiaryFixedVariant,
    lineHeight: 24, minHeight: 80,
  },
});
