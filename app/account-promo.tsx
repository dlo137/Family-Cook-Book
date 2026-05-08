import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setError(null);
    setLoading(true);
    try {
      // If user is anonymous, update in-place
      if (user && user.email && user.email.startsWith('anon_')) {
        // Convert anonymous user to real account
        const { data, error: updateError } = await supabase.auth.updateUser({
          email: email.trim(),
          password,
        });
        if (updateError) throw updateError;
        // Update profile row with new info
        const { error: profileError } = await supabase.from('profiles').update({
          email: email.trim(),
          display_name: name.trim(),
          has_seen_paywall: true,
          is_pro_version: true,
        }).eq('id', user.id);
        if (profileError) console.warn('[AccountPromo] profile update error:', profileError);
        router.replace('/(home)/home');
        return;
      }
      // Otherwise, sign up as new user (fallback)
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw signUpError;
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: email.trim(),
            display_name: name.trim(),
            has_seen_paywall: true,
            is_pro_version: true,
          },
          { onConflict: 'id' }
        );
        if (profileError) console.warn('[AccountPromo] profile upsert error:', profileError);
      }
      router.replace('/(home)/home');
    } catch (e: any) {
      console.error('[AccountPromo] signup failed:', JSON.stringify(e, null, 2));
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
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn} activeOpacity={0.6}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={C.outline} />
            </TouchableOpacity>
          </View>

          {error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
            style={s.skip}
            disabled={loading}
          >
            <Text style={s.skipText}>Maybe Later</Text>
          </TouchableOpacity>
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
    lineHeight: 20, marginBottom: 20, maxWidth: 280,
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
  skip: { alignSelf: 'center' },
  skipText: { fontSize: 13, color: C.outline, fontWeight: '500' },
});
