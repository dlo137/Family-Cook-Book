import { StyleSheet, Text, View } from "react-native";

export default function Other() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Other</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666" },
});
