import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ShopMyRoom</Text>
      <Text style={styles.tagline}>AI-powered interior design for your home</Text>
      <Pressable style={styles.button} onPress={() => router.push("/signup")}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  logo: { fontSize: 32, fontWeight: "800", marginBottom: 12 },
  tagline: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 48 },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
