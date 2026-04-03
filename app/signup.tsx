import { supabase } from "@/lib/supabase";
import { createProfile } from "@/services/ProfileService";
import useAppleSignIn from "@/hooks/useAppleSignIn";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    signInWithApple,
    isAvailable: appleAvailable,
    loading: appleLoading,
    error: appleError,
  } = useAppleSignIn();

  const displayError = error ?? appleError;

  const validate = () => {
    if (!email.trim()) { setError("Please enter your email."); return false; }
    if (!password.trim()) { setError("Please enter your password."); return false; }
    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
    } else {
      if (data.user) await createProfile(data.user.id, email);
      setLoading(false);
      router.replace("/subscription");
    }
  };

  const handleAppleSignIn = async () => {
    const success = await signInWithApple();
    if (success) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await createProfile(user.id, user.email ?? "");
      router.replace("/subscription");
    }
  };

  const isDisabled = loading || appleLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Create an account or sign in</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(v) => { setError(null); setEmail(v); }}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(v) => { setError(null); setPassword(v); }}
      />

      {displayError && <Text style={styles.error}>{displayError}</Text>}

      <Pressable
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </Pressable>

      {appleAvailable && (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        </>
      )}

      <Pressable onPress={() => router.push("/signin")} disabled={isDisabled}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32, backgroundColor: "#f8fafc" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  error: { color: "#e74c3c", fontSize: 14, marginBottom: 12, textAlign: "center" },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e0e0e0" },
  dividerText: { marginHorizontal: 12, color: "#999", fontSize: 14 },
  appleButton: { width: "100%", height: 56, marginTop: 12 },
  link: { color: "#6366f1", fontSize: 15, textAlign: "center", marginTop: 20 },
});
