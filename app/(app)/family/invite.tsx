import { useAuth } from "@/context/AuthContext";
import { getPlanWithMembers, inviteMember, removeMember } from "@/services/familyPlanService";
import type { FamilyMembership, FamilyPlan } from "@/types/familyPlan";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const REDIRECT_BASE = "https://blzwcujchavhzlvvdxwh.supabase.co/functions/v1/join-redirect";

export default function InviteScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { user } = useAuth();

  const [plan, setPlan] = useState<FamilyPlan | null>(null);
  const [members, setMembers] = useState<FamilyMembership[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getPlanWithMembers(planId);
      setPlan(result.plan);
      setMembers(result.members);
    } catch (e: any) {
      setLoadError(e.message ?? "Failed to load plan.");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!planId) return;
    setInviting(true);
    try {
      const invite = await inviteMember(planId);
      const link = `${REDIRECT_BASE}?token=${encodeURIComponent(invite.invite_token)}`;
      await Share.share({
        message: `Join my family cookbook on Grandma's Cookbook! ${link}`,
        url: link,
      });
      await load();
    } catch (e: any) {
      if (e?.message !== "The user did not share") {
        Alert.alert("Error", e.message ?? "Could not create invite.");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (membership: FamilyMembership) => {
    Alert.alert(
      "Remove Member",
      `Remove ${membership.display_name} from the family plan?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingId(membership.id);
            try {
              await removeMember(planId!, membership.id);
              setMembers((prev) => prev.filter((m) => m.id !== membership.id));
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Could not remove member.");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4D6A28" />
      </View>
    );
  }

  if (loadError || !plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError ?? "Plan not found."}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const atCapacity = members.length >= plan.max_members;
  const isOwner = user?.id === plan.owner_user_id;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>
        Family Members ({members.length}/{plan.max_members})
      </Text>

      {atCapacity && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Plan is full. Remove a member before inviting someone new.
          </Text>
        </View>
      )}

      {members.length === 0 ? (
        <Text style={styles.emptyText}>No members yet.</Text>
      ) : (
        members.map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.display_name}</Text>
              <Text style={styles.memberRole}>{m.role}</Text>
            </View>
            {isOwner && m.role !== "owner" && (
              <Pressable
                style={[styles.removeButton, removingId === m.id && styles.buttonDisabled]}
                onPress={() => handleRemove(m)}
                disabled={removingId === m.id}
              >
                {removingId === m.id ? (
                  <ActivityIndicator size="small" color="#e74c3c" />
                ) : (
                  <Text style={styles.removeButtonText}>Remove</Text>
                )}
              </Pressable>
            )}
          </View>
        ))
      )}

      {isOwner && !atCapacity && (
        <Pressable
          style={[styles.inviteBtn, inviting && styles.buttonDisabled]}
          onPress={handleInvite}
          disabled={inviting}
        >
          {inviting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="person-add" size={20} color="#fff" />
              <Text style={styles.inviteBtnText}>Invite Family Member</Text>
            </>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F5F7EE" },
  container: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12, color: "#1C2110" },
  emptyText: { color: "#6D7B4C", fontSize: 15, marginBottom: 16 },

  memberRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#BAC898",
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: "600", color: "#1C2110" },
  memberRole: { fontSize: 13, color: "#6D7B4C", marginTop: 2, textTransform: "capitalize" },
  removeButton: { paddingHorizontal: 12, paddingVertical: 6 },
  removeButtonText: { color: "#e74c3c", fontSize: 14, fontWeight: "600" },

  warningBanner: {
    backgroundColor: "#fef3c7", borderRadius: 10, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: "#fcd34d",
  },
  warningText: { color: "#92400e", fontSize: 14 },

  inviteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#4D6A28",
    borderRadius: 14, paddingVertical: 16, marginTop: 24,
  },
  inviteBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  buttonDisabled: { opacity: 0.5 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#4D6A28", borderRadius: 10 },
  retryButtonText: { color: "#fff", fontWeight: "600" },
  errorText: { color: "#e74c3c", fontSize: 14, marginBottom: 12 },
});
