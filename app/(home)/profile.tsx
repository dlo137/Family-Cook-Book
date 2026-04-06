import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const C = {
  bg: '#fff8f3',
  surface: '#ffffff',
  surfaceSecondary: '#fff2e2',
  surfaceContainer: '#fbecd9',
  text: '#221a0f',
  textSecondary: '#56423a',
  textMuted: '#8a7269',
  primary: '#9c3f10',
  primaryLight: '#fecb98',
  border: '#ddc1b6',
  error: '#ba1a1a',
  errorBg: '#ffdad6',
  success: '#16A34A',
  successBg: '#DCFCE7',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isAnonymous } = useAuth();

  const [isPro, setIsPro] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [generationsCount, setGenerationsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('is_pro_version, subscription_plan, credits_current, generations_count')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setIsPro(data.is_pro_version ?? false);
          setSubscriptionPlan(data.subscription_plan ?? null);
          setCreditsLeft(data.credits_current ?? null);
          setGenerationsCount(data.generations_count ?? 0);
        }
      });
  }, [user?.id]);

  const planLabel = isPro
    ? subscriptionPlan?.includes('Weekly')
      ? 'Weekly Pro'
      : subscriptionPlan?.includes('Yearly')
      ? 'Yearly Pro'
      : 'Monthly Pro'
    : 'Free Plan';

  const displayName = isAnonymous
    ? (user?.user_metadata?.display_name ?? 'Guest')
    : (user?.email?.split('@')[0] ?? 'User');
  const email = isAnonymous ? 'Anonymous Account' : (user?.email ?? '');
  const initials = displayName.charAt(0).toUpperCase();

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
              router.replace('/onboarding');
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
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          <Text style={s.email}>{email}</Text>
        </View>

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

        <Text style={s.version}>Grandma's Cookbook · v1.0.0</Text>
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
    shadowColor: '#221a0f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
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
});
