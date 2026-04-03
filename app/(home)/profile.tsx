import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/onboarding");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user?.email && <Text style={styles.email}>{user.email}</Text>}
      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  email: { fontSize: 15, color: "#666", marginBottom: 48 },
  button: {
    borderWidth: 1.5,
    borderColor: "#e74c3c",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: { color: "#e74c3c", fontSize: 16, fontWeight: "600" },
});
