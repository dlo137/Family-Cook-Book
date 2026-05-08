/**
 * app/(app)/family/join.tsx — Accept a Family Invite
 *
 * Route params:
 *   token: string — the invite_token from the invite link/QR code
 *
 * Flow:
 *   [no session] → sign up or sign in inline → [session] → enter display name → acceptInvite() → home
 *
 * The token is kept in local state throughout so it survives the auth step.
 */

import { acceptInvite } from "@/services/familyPlanService";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Step = "checking" | "auth" | "name" | "done";
type AuthMode = "signup" | "signin";

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  // Step drives the entire screen
  const [step, setStep] = useState<Step>("checking");

  // Auth step state
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // The userId we'll use for acceptInvite — set either from an existing session
  // or directly from the signUp/signIn response, so it's available immediately.
  const [userId, setUserId] = useState<string | null>(null);

  // Name step state
  const [displayName, setDisplayName] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // On mount: check for an existing session and skip auth if found
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setStep("name");
      } else {
        setStep("auth");
      }
    });
  }, []);

  // ----------------------------------------------------------------
  // Auth handler (sign up or sign in)
  // ----------------------------------------------------------------
  const handleAuth = async () => {
    if (!email.trim()) { setAuthError("Please enter your email."); return; }
    if (!password.trim()) { setAuthError("Please enter your password."); return; }

    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // If email confirmation is required, data.session is null but data.user exists.
        // Flip to sign-in with a helpful message so they can continue after confirming.
        const authedUser = data.session?.user ?? data.user;
        if (!authedUser) {
          setAuthError("Check your email to confirm your account, then sign in below.");
          setAuthMode("signin");
          return;
        }
        if (!data.session) {
          setAuthError("Check your email to confirm your account, then sign in below.");
          setAuthMode("signin");
          return;
        }

        setUserId(authedUser.id);
        setStep("name");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Sign in succeeded but no user was returned.");

        setUserId(data.user.id);
        setStep("name");
      }
    } catch (e: any) {
      setAuthError(e.message ?? "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Join handler
  // ----------------------------------------------------------------
  const handleJoin = async () => {
    if (!token) { setJoinError("Invalid invite link — no token found."); return; }
    if (!userId) { setJoinError("No session found. Please go back and sign in."); return; }
    if (!displayName.trim()) { setJoinError("Please enter a display name."); return; }

    setJoinError(null);
    setJoinLoading(true);

    try {
      await acceptInvite(token, userId, displayName.trim());
      setStep("done");
      setTimeout(() => router.replace("/(home)/home"), 1200);
    } catch (e: any) {
      const message: string = e.message ?? "Something went wrong.";

      if (message.includes("no longer valid")) {
        setJoinError("This invite has already been used or was cancelled.");
      } else if (message.includes("expired")) {
        setJoinError("This invite link has expired. Ask the plan owner for a new one.");
      } else if (message.includes("ALREADY_MEMBER") || message.includes("duplicate") || message.includes("unique")) {
        setJoinError("You are already a member of this family plan.");
      } else {
        setJoinError(message);
      }
    } finally {
      setJoinLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Render: invalid token (always shown regardless of step)
  // ----------------------------------------------------------------
  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorHeading}>Invalid Link</Text>
        <Text style={styles.errorBody}>
          This invite link is missing a token. Try opening it again from the
          original message.
        </Text>
      </View>
    );
  }

  // ----------------------------------------------------------------
  // Render: checking session
  // ----------------------------------------------------------------
  if (step === "checking") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4D6A28" />
      </View>
    );
  }

  // ----------------------------------------------------------------
  // Render: success
  // ----------------------------------------------------------------
  if (step === "done") {
    return (
      <View style={styles.centered}>
        <Text style={styles.successHeading}>You're in!</Text>
        <Text style={styles.successBody}>Taking you to the home screen…</Text>
        <ActivityIndicator style={{ marginTop: 16 }} color="#4D6A28" />
      </View>
    );
  }

  // ----------------------------------------------------------------
  // Render: auth step (sign up or sign in)
  // ----------------------------------------------------------------
  if (step === "auth") {
    const isSignUp = authMode === "signup";
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            {isSignUp ? "Create an Account" : "Sign In"}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? "You'll need an account to join the family plan."
              : "Sign in to accept your invite."}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => { setEmail(v); setAuthError(null); }}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={(v) => { setPassword(v); setAuthError(null); }}
            returnKeyType="done"
            onSubmitEditing={handleAuth}
          />

          {authError && <Text style={styles.errorText}>{authError}</Text>}

          <Pressable
            style={[styles.button, authLoading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? "Create Account" : "Sign In"}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.toggleBtn}
            onPress={() => {
              setAuthMode(isSignUp ? "signin" : "signup");
              setAuthError(null);
            }}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? "I already have an account — Sign in"
                : "Don't have an account? Create one"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ----------------------------------------------------------------
  // Render: display name step
  // ----------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>One Last Step</Text>
      <Text style={styles.subtitle}>
        Choose a display name that your family will see.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Display name (e.g. Grandma Rose)"
        value={displayName}
        onChangeText={(v) => { setDisplayName(v); setJoinError(null); }}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleJoin}
      />

      {joinError && <Text style={styles.errorText}>{joinError}</Text>}

      <Pressable
        style={[styles.button, joinLoading && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={joinLoading}
      >
        {joinLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Join Family</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#F5F7EE",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F5F7EE",
  },

  title: { fontSize: 28, fontWeight: "700", marginBottom: 8, textAlign: "center", color: "#1C2110" },
  subtitle: { fontSize: 15, color: "#404E25", textAlign: "center", marginBottom: 32, lineHeight: 22 },

  input: {
    borderWidth: 1,
    borderColor: "#BAC898",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },

  errorText: { color: "#e74c3c", fontSize: 14, marginBottom: 12, textAlign: "center" },

  button: {
    backgroundColor: "#4D6A28",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  toggleBtn: { marginTop: 20, alignItems: "center" },
  toggleText: { color: "#4D6A28", fontSize: 15, textAlign: "center" },

  errorHeading: { fontSize: 22, fontWeight: "700", color: "#1C2110", marginBottom: 12 },
  errorBody: { fontSize: 15, color: "#404E25", textAlign: "center", lineHeight: 22 },

  successHeading: { fontSize: 28, fontWeight: "700", color: "#166534", marginBottom: 8 },
  successBody: { fontSize: 15, color: "#404E25" },
});
