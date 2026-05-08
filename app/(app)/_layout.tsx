import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function AppLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#F5F7EE" },
        headerTintColor: "#4D6A28",
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="family/invite"
        options={{
          title: "Manage Family",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 8 }}>
              <MaterialIcons name="arrow-back" size={24} color="#4D6A28" />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
