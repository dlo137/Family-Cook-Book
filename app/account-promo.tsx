import { supabase } from '@/lib/supabase';
import useAppleSignIn from '@/hooks/useAppleSignIn';
import * as AppleAuthentication from 'expo-apple-authentication';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const C = {
  primary: '#556B2F',
  surface: '#F6F3EA',
  surfaceContainerLow: '#EDE7D9',
  onSurface: '#3F3426',
  onSurfaceVariant: '#5C4F3A',
  outline: '#7A6E5A',
  border: '#C8BFAB',
  accent: '#C97B63',
};

export default function AccountPromo() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [familyRole, setFamilyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleRequired, setRoleRequired] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  function triggerRolePulse() {
    setRoleRequired(true);
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      { iterations: 4 }
    ).start();
  }

  const {
    signInWithApple,
    isAvailable: appleAvailable,
    loading: appleLoading,
    error: appleError,
  } = useAppleSignIn();

  const displayError = error ?? appleError;

  const handleAppleSignUp = async () => {
    if (!familyRole) {
      triggerRolePulse();
      return;
    }
    setError(null);
    // Capture the anonymous user ID before Apple sign-in replaces the session
    const anonUserId = user?.email?.startsWith('anon_') ? user.id : null;

    const success = await signInWithApple();
    if (!success) return;

    const { data: { user: appleUser } } = await supabase.auth.getUser();
    if (appleUser) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', appleUser.id)
        .single();
      if (!existing) {
        await supabase.from('profiles').upsert({
          id: appleUser.id,
          email: appleUser.email ?? '',
          display_name: appleUser.user_metadata?.full_name ?? appleUser.email?.split('@')[0] ?? 'User',
          has_seen_paywall: true,
          is_pro_version: true,
          ...(familyRole ? { family_role: familyRole } : {}),
        }, { onConflict: 'id' });
      } else if (familyRole) {
        await supabase.from('profiles').update({ family_role: familyRole }).eq('id', appleUser.id);
      }

      // Delete the orphaned anonymous account so only one account exists
      if (anonUserId && anonUserId !== appleUser.id) {
        await supabase.functions.invoke('delete-anonymous-user', { body: { userId: anonUserId } });
      }
    }
    router.replace('/(home)/home');
  };

  const handleSignUp = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setError(null);
    setLoading(true);
    try {
      if (user && user.email && user.email.startsWith('anon_')) {
        const { error: fnError } = await supabase.functions.invoke('convert-anonymous-user', {
          body: { email: email.trim(), password, display_name: name.trim(), family_role: familyRole },
        });
        if (fnError) {
          let msg = fnError.message;
          try {
            const body = await (fnError as any).context?.json?.();
            if (body?.error) msg = body.error;
          } catch {}
          throw new Error(msg);
        }
        // Sign in fresh after conversion — refreshSession() is unreliable
        // when Supabase invalidates the anonymous session on credential update
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw new Error(signInError.message);
      }

      // Get a fresh user after auth, then upsert profile directly
      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !freshUser) throw new Error('Could not verify session. Please try again.');

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: freshUser.id,
        email: email.trim(),
        display_name: name.trim(),
        family_role: familyRole ?? null,
      }, { onConflict: 'id' });

      if (profileError) throw new Error(profileError.message);

      router.replace('/(home)/home');
    } catch (e: any) {
      console.error('[AccountPromo] signup failed:', e?.message ?? String(e));
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.iconWrap}>
            <MaterialIcons name="people" size={36} color={C.primary} />
          </View>
          <Text style={s.title}>You're All Set!</Text>
          <Text style={s.sub}>
            Create a free account to invite family members, share recipes, and keep your collection safe forever.
          </Text>

          <TextInput
            style={s.input}
            placeholder="Full Name"
            placeholderTextColor={C.outline}
            autoCapitalize="words"
            value={name}
            onChangeText={(v) => { setError(null); setName(v); }}
          />
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={C.outline}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => { setError(null); setEmail(v); }}
          />
          <View style={s.passwordWrap}>
            <TextInput
              style={s.passwordInput}
              placeholder="Password"
              placeholderTextColor={C.outline}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => { setError(null); setPassword(v); }}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn} activeOpacity={0.6}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={C.outline} />
            </TouchableOpacity>
          </View>
          <View style={s.passwordWrap}>
            <TextInput
              style={s.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor={C.outline}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(v) => { setError(null); setConfirmPassword(v); }}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={s.eyeBtn} activeOpacity={0.6}>
              <MaterialIcons name={showConfirmPassword ? 'visibility-off' : 'visibility'} size={20} color={C.outline} />
            </TouchableOpacity>
          </View>

          <View style={s.roleLabelRow}>
            <Text style={s.roleLabel}>Your role in the family</Text>
            {roleRequired && (
              <Animated.View style={[s.roleRequiredBadge, { opacity: pulseAnim }]}>
                <MaterialIcons name="error" size={11} color="#fff" />
                <Text style={s.roleRequiredText}>Required</Text>
              </Animated.View>
            )}
          </View>
          <View style={[s.roleChips, roleRequired && s.roleChipsRequired]}>
            {['Mom', 'Dad', 'Grandma', 'Grandpa', 'Sister', 'Brother', 'Aunt', 'Uncle', 'Other'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[s.roleChip, familyRole === role && s.roleChipActive]}
                onPress={() => { setFamilyRole(familyRole === role ? null : role); setRoleRequired(false); }}
                activeOpacity={0.7}
              >
                <Text style={[s.roleChipText, familyRole === role && s.roleChipTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {displayError && <Text style={s.error}>{displayError}</Text>}

          <TouchableOpacity
            style={[s.btn, (loading || appleLoading) && s.btnDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.85}
            disabled={loading || appleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {appleAvailable && (
            <>
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.dividerLine} />
              </View>

              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={999}
                style={s.appleBtn}
                onPress={handleAppleSignUp}
              />
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#B8C898', alignSelf: 'center', marginBottom: 20,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, alignSelf: 'center',
  },
  title: {
    fontSize: 22, fontWeight: '800', color: C.onSurface,
    textAlign: 'center', marginBottom: 8,
  },
  sub: {
    fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center',
    lineHeight: 20, marginBottom: 20, maxWidth: 280, alignSelf: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    padding: 14, fontSize: 16, marginBottom: 12,
    backgroundColor: '#fff', color: C.onSurface,
  },
  passwordWrap: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    backgroundColor: '#fff', marginBottom: 12,
  },
  passwordInput: {
    flex: 1, padding: 14, fontSize: 16, color: C.onSurface,
  },
  eyeBtn: {
    paddingHorizontal: 14, paddingVertical: 14,
  },
  error: { color: '#e74c3c', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: {
    backgroundColor: C.primary, paddingVertical: 16,
    borderRadius: 999, width: '100%', alignItems: 'center', marginBottom: 14, marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 0, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { marginHorizontal: 12, color: C.outline, fontSize: 13 },
  appleBtn: { width: '100%', height: 52 },
  roleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 10 },
  roleLabel: { fontSize: 13, color: C.onSurfaceVariant, fontWeight: '600' },
  roleRequiredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#e74c3c', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  roleRequiredText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChipsRequired: { borderWidth: 1.5, borderColor: '#e74c3c', borderRadius: 12, padding: 8 },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: '#fff',
  },
  roleChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  roleChipText: { fontSize: 13, color: C.onSurfaceVariant, fontWeight: '500' },
  roleChipTextActive: { color: '#fff', fontWeight: '700' },
});
