import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { createFamilyPlan } from '@/services/familyPlanService';
import type { FamilyMembership, FamilyPlan } from '@/types/familyPlan';

const C = {
  bg: '#F6F3EA',
  surface: '#FDFAF4',
  surfaceSecondary: '#EDE7D9',
  surfaceContainer: '#E8E0CE',
  text: '#3F3426',
  textSecondary: '#5C4F3A',
  textMuted: '#7A6E5A',
  primary: '#556B2F',
  primaryLight: '#D4C89A',
  border: '#C8BFAB',
  error: '#ba1a1a',
  errorBg: '#ffdad6',
  success: '#16A34A',
  successBg: '#DCFCE7',
  accent: '#C97B63',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isAnonymous = user?.is_anonymous ?? false;

  const [isPro, setIsPro] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [generationsCount, setGenerationsCount] = useState(0);
  const [familyRole, setFamilyRole] = useState<string | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  // Family plan state
  const [familyPlan, setFamilyPlan] = useState<FamilyPlan | null>(null);
  const [familyMembership, setFamilyMembership] = useState<FamilyMembership | null>(null);
  const [familyMemberCount, setFamilyMemberCount] = useState(0);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Edit profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('is_pro_version, subscription_plan, credits_current, generations_count, family_role, email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setIsPro(data.is_pro_version ?? false);
          setSubscriptionPlan(data.subscription_plan ?? null);
          setCreditsLeft(data.credits_current ?? null);
          setGenerationsCount(data.generations_count ?? 0);
          setFamilyRole(data.family_role ?? null);
          if (data.email && !data.email.startsWith('anon_')) setProfileEmail(data.email);
        }
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user) { setFamilyLoading(false); return; }

    async function loadFamilyPlan() {
      setFamilyLoading(true);
      setFamilyError(null);
      try {
        // Look up the user's membership
        const { data: membership, error: membershipError } = await supabase
          .from('family_memberships')
          .select('*')
          .eq('user_id', user!.id)
          .limit(1)
          .maybeSingle();

        if (membershipError) throw new Error(membershipError.message);
        if (!membership) { setFamilyLoading(false); return; }

        setFamilyMembership(membership as FamilyMembership);

        // Load the plan and member count in parallel
        const [planResult, countResult] = await Promise.all([
          supabase.from('family_plans').select('*').eq('id', membership.plan_id).single(),
          supabase.from('family_memberships').select('id', { count: 'exact', head: true }).eq('plan_id', membership.plan_id),
        ]);

        if (planResult.data) setFamilyPlan(planResult.data as FamilyPlan);
        if (countResult.count !== null) setFamilyMemberCount(countResult.count);
      } catch (e: any) {
        setFamilyError(e.message ?? 'Failed to load family plan.');
      } finally {
        setFamilyLoading(false);
      }
    }

    loadFamilyPlan();
  }, [user?.id]);

  async function handleCreatePlan() {
    if (!user) return;
    setCreatingPlan(true);
    setFamilyError(null);
    try {
      const plan = await createFamilyPlan(
        user.id,
        user.email?.split('@')[0] ?? 'Owner'
      );
      setFamilyPlan(plan);
      setFamilyMemberCount(1);
      router.push({ pathname: '/(app)/family/invite', params: { planId: plan.id } } as any);
    } catch (e: any) {
      setFamilyError(e.message ?? 'Failed to create plan.');
    } finally {
      setCreatingPlan(false);
    }
  }

  const planLabel = isPro
    ? subscriptionPlan?.includes('Weekly')
      ? 'Weekly Pro'
      : subscriptionPlan?.includes('Yearly')
      ? 'Yearly Pro'
      : 'Monthly Pro'
    : 'Free Plan';

  const displayName = isAnonymous
    ? (user?.user_metadata?.display_name ?? 'Guest')
    : (user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'User');
  const authEmail = user?.email ?? '';
  const email = profileEmail || (authEmail.startsWith('anon_') ? '' : authEmail);
  const initials = displayName.charAt(0).toUpperCase();

  function openEdit() {
    setEditName(displayName);
    setEditEmail(email);
    setEditOpen(true);
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      const newName = editName.trim();
      const newEmail = editEmail.trim();
      const nameChanged = newName && newName !== displayName;
      const emailChanged = newEmail && newEmail !== email;

      if (!nameChanged && !emailChanged) {
        setEditOpen(false);
        return;
      }

      const authUpdates: { data?: { display_name: string }; email?: string } = {};
      if (nameChanged) authUpdates.data = { display_name: newName };
      if (emailChanged) authUpdates.email = newEmail;

      const { error } = await supabase.auth.updateUser(authUpdates);
      if (error) throw error;

      if (nameChanged) {
        await Promise.all([
          supabase.from('profiles').update({ display_name: newName }).eq('id', user.id),
          supabase.from('family_memberships').update({ display_name: newName }).eq('user_id', user.id),
        ]);
      }

      setEditOpen(false);
      if (emailChanged) {
        Alert.alert('Check your email', 'A confirmation link was sent to your new email address.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await signOut();
          router.replace('/onboarding');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;
              await signOut();
              Alert.alert(
                'Account Deleted',
                'Your account and all associated data have been permanently deleted.',
                [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  }

  function handleRestorePurchases() {
    Alert.alert('Coming Soon', 'Purchase restore will be available in a future update.');
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* USER INFO */}
        <View style={s.card}>
          <TouchableOpacity style={s.editIcon} onPress={openEdit} activeOpacity={0.7} hitSlop={8}>
            <MaterialIcons name="edit" size={18} color={C.textMuted} />
          </TouchableOpacity>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          <Text style={s.email}>{email}</Text>
        </View>

        {/* EDIT PROFILE MODAL */}
        <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={s.roleModalOverlay} onPress={() => setEditOpen(false)}>
              <Pressable style={s.roleModalSheet} onPress={() => {}}>
                <View style={s.roleModalHandle} />
                <Text style={s.roleModalTitle}>Edit Profile</Text>

                <Text style={s.inputLabel}>Display Name</Text>
                <TextInput
                  style={s.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="words"
                />

                <Text style={s.inputLabel}>Email</Text>
                <TextInput
                  style={s.editInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TouchableOpacity
                  style={[s.familyPrimaryBtn, saving && s.familyPrimaryBtnDisabled]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.familyPrimaryBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* PLAN CARD */}
        <View style={s.card}>
          <View style={s.planRow}>
            <View style={s.planTitleRow}>
              <MaterialIcons
                name={isPro ? 'star' : 'star-outline'}
                size={16}
                color={isPro ? '#F59E0B' : C.textMuted}
              />
              <Text style={s.planTitle}>{planLabel}</Text>
            </View>
            {isPro && (
              <View style={s.proBadge}>
                <Text style={s.proBadgeText}>Active</Text>
              </View>
            )}
          </View>

          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{generationsCount}</Text>
              <Text style={s.statLabel}>Recipes Added</Text>
            </View>
            {creditsLeft !== null && (
              <>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statValue}>{creditsLeft}</Text>
                  <Text style={s.statLabel}>Family Members</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* FAMILY ROLE */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Family Role</Text>
          <TouchableOpacity style={s.roleRow} onPress={() => setRolePickerOpen(true)} activeOpacity={0.7}>
            <Text style={s.roleValue}>
              Family Role: <Text style={s.roleValueBold}>{familyRole ?? 'Not set'}</Text>
            </Text>
            <MaterialIcons name="add" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Role Picker Modal */}
        <Modal visible={rolePickerOpen} transparent animationType="slide" onRequestClose={() => setRolePickerOpen(false)}>
          <Pressable style={s.roleModalOverlay} onPress={() => setRolePickerOpen(false)}>
            <Pressable style={s.roleModalSheet} onPress={() => {}}>
              <View style={s.roleModalHandle} />
              <Text style={s.roleModalTitle}>Select Family Role</Text>
              {['Mom', 'Dad', 'Grandma', 'Grandpa', 'Sister', 'Brother', 'Aunt', 'Uncle', 'Other'].map((role) => {
                const active = familyRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={s.roleOption}
                    onPress={async () => {
                      setFamilyRole(role);
                      setRolePickerOpen(false);
                      if (user) {
                        await supabase
                          .from('profiles')
                          .update({ family_role: role })
                          .eq('id', user.id);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.roleOptionText, active && s.roleOptionTextActive]}>{role}</Text>
                    {active && <MaterialIcons name="check" size={18} color={C.primary} />}
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

        {/* FAMILY PLAN */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Family Plan</Text>

          {familyLoading ? (
            <ActivityIndicator color={C.primary} style={{ marginVertical: 8 }} />
          ) : familyError ? (
            <Text style={s.familyErrorText}>{familyError}</Text>
          ) : !familyPlan ? (
            <>
              <Text style={s.familyEmptyText}>
                Create a plan to share recipes with your family. Up to 6 members can join under one subscription.
              </Text>
              <TouchableOpacity
                style={[s.familyPrimaryBtn, creatingPlan && s.familyPrimaryBtnDisabled]}
                onPress={handleCreatePlan}
                disabled={creatingPlan}
                activeOpacity={0.8}
              >
                {creatingPlan ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <>
                    <MaterialIcons name='group-add' size={18} color='#fff' />
                    <Text style={s.familyPrimaryBtnText}>Create Family Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={s.familyStatusRow}>
                <View style={s.familyStatusItem}>
                  <Text style={s.familyStatusValue}>{familyMemberCount}</Text>
                  <Text style={s.familyStatusLabel}>Members</Text>
                </View>
                <View style={s.familyStatusDivider} />
                <View style={s.familyStatusItem}>
                  <Text style={s.familyStatusValue}>{familyPlan.max_members}</Text>
                  <Text style={s.familyStatusLabel}>Max Seats</Text>
                </View>
                <View style={s.familyStatusDivider} />
                <View style={s.familyStatusItem}>
                  <Text style={[s.familyStatusValue, { textTransform: 'capitalize', fontSize: 14 }]}>
                    {familyMembership?.role ?? '—'}
                  </Text>
                  <Text style={s.familyStatusLabel}>Your Role</Text>
                </View>
              </View>

              {familyMembership?.role === 'owner' && (
                <TouchableOpacity
                  style={s.familyPrimaryBtn}
                  onPress={() => router.push({ pathname: '/(app)/family/invite', params: { planId: familyPlan.id } } as any)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name='people' size={18} color='#fff' />
                  <Text style={s.familyPrimaryBtnText}>Manage Members</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={s.familySecondaryBtn}
                onPress={() => router.push({ pathname: '/(app)/family/invite', params: { planId: familyPlan.id } } as any)}
                activeOpacity={0.8}
              >
                <MaterialIcons name='visibility' size={16} color={C.primary} />
                <Text style={s.familySecondaryBtnText}>View Family</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* SETTINGS */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Account</Text>

          <SettingsRow
            icon="refresh"
            title="Restore Purchases"
            subtitle="Recover a previous purchase"
            onPress={handleRestorePurchases}
          />
          <View style={s.separator} />
          <SettingsRow
            icon="logout"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
          />
          <View style={s.separator} />
          <SettingsRow
            icon="delete-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        <Text style={s.version}>Family Cookbook · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type SettingsRowProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
};

function SettingsRow({ icon, title, subtitle, onPress, destructive }: SettingsRowProps) {
  return (
    <TouchableOpacity style={s.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.settingsIcon, destructive && s.settingsIconDestructive]}>
        <MaterialIcons
          name={icon}
          size={18}
          color={destructive ? C.error : C.textSecondary}
        />
      </View>
      <View style={s.settingsText}>
        <Text style={[s.settingsTitle, destructive && { color: C.error }]}>{title}</Text>
        <Text style={s.settingsSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={18} color={C.border} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 40, paddingBottom: 32, gap: 16 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#1C2110',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },

  editIcon: { position: 'absolute', top: 16, right: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  editInput: {
    backgroundColor: C.surfaceSecondary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, color: C.text, marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },

  avatarCircle: {
    width: 68, height: 68, borderRadius: 999,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.primary },
  displayName: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center' },
  email: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },

  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  proBadge: { backgroundColor: C.successBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  proBadgeText: { fontSize: 12, fontWeight: '700', color: C.success },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceSecondary, borderRadius: 14, padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: C.border },
  statValue: { fontSize: 22, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '500' },

  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIconDestructive: { backgroundColor: C.errorBg },
  settingsText: { flex: 1, gap: 1 },
  settingsTitle: { fontSize: 15, fontWeight: '500', color: C.text },
  settingsSubtitle: { fontSize: 12, color: C.textMuted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 48 },

  version: { textAlign: 'center', fontSize: 12, color: C.textMuted, marginTop: 4 },

  // Family plan card
  familyEmptyText: { fontSize: 13, color: C.textMuted, lineHeight: 19 },
  familyErrorText: { fontSize: 13, color: C.error },
  familyStatusRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceSecondary, borderRadius: 14, padding: 14,
  },
  familyStatusItem: { flex: 1, alignItems: 'center', gap: 2 },
  familyStatusDivider: { width: 1, height: 32, backgroundColor: C.border },
  familyStatusValue: { fontSize: 22, fontWeight: '800', color: C.text },
  familyStatusLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '500' },
  familyPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 999,
    paddingVertical: 13,
  },
  familyPrimaryBtnDisabled: { opacity: 0.5 },
  familyPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  familySecondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: C.primary, borderRadius: 999,
    paddingVertical: 11,
  },
  familySecondaryBtnText: { color: C.primary, fontSize: 14, fontWeight: '600' },

  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleValue: { fontSize: 15, color: C.textSecondary },
  roleValueBold: { fontWeight: '700', color: C.text },

  roleModalOverlay: { flex: 1, backgroundColor: 'rgba(28,33,16,0.5)', justifyContent: 'flex-end' },
  roleModalSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40,
  },
  roleModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  roleModalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12 },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  roleOptionText: { fontSize: 16, color: C.textSecondary, fontWeight: '500' },
  roleOptionTextActive: { color: C.primary, fontWeight: '700' },
});
