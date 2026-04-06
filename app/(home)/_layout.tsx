import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function HomeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#9c3f10",
        tabBarInactiveTintColor: "#5e4030",
        tabBarStyle: {
          backgroundColor: "#fff8f3",
          borderTopColor: "#ddc1b6",
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
            <MaterialIcons name="home" size={26} color={focused ? "#9c3f10" : "#5e4030"} />
          ),
        }}
      />
      <Tabs.Screen
        name="other"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="search" size={26} color={focused ? "#9c3f10" : "#5e4030"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="menu-book" size={26} color={focused ? "#9c3f10" : "#5e4030"} />
          ),
        }}
      />
    </Tabs>
  );
}
