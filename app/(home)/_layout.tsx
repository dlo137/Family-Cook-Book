import { Tabs } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function HomeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#556B2F",
        tabBarInactiveTintColor: "#7A6E5A",
        tabBarStyle: {
          backgroundColor: "#F6F3EA",
          borderTopColor: "#C8BFAB",
          height: 64,
        },
        tabBarActiveBackgroundColor: "transparent",
        tabBarItemStyle: { paddingVertical: 8 },
        tabBarIndicatorStyle: { backgroundColor: "transparent" },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="home" size={26} color={focused ? "#4D6A28" : "#6D7B4C"} />
          ),
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name="pot-steam" size={26} color={focused ? "#4D6A28" : "#6D7B4C"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="person" size={26} color={focused ? "#4D6A28" : "#6D7B4C"} />
          ),
        }}
      />
    </Tabs>
  );
}
