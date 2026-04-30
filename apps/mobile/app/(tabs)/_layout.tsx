import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: MOBILE_THEME.gold,
        tabBarInactiveTintColor: MOBILE_THEME.mutedText,
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 12,
          borderRadius: 24,
          backgroundColor: "rgba(17,16,13,0.96)",
          borderTopColor: "transparent",
          borderWidth: 1,
          borderColor: MOBILE_THEME.border,
          height: 74,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: MOBILE_THEME.black,
          shadowOpacity: 0.42,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="grimoire"
        options={{
          title: "Grimorio",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="auto-stories" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Biblioteca",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="menu-book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Mercado",
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="store" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="archivist"
        options={{
          title: "Archivista",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="auto-awesome" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
