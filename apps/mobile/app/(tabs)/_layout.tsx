import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import { MOBILE_THEME } from "@/src/theme/colors";

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        width: 42,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "rgba(240,179,47,0.13)" : "transparent",
        borderWidth: focused ? 1 : 0,
        borderColor: "rgba(240,179,47,0.25)",
      }}
    >
      {children}
    </View>
  );
}

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
          height: 72,
          paddingTop: 7,
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
          fontSize: 9,
          fontWeight: "800",
          marginBottom: 1,
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
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <MaterialIcons name="home" color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="grimoire"
        options={{
          title: "Grimorio",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <MaterialIcons name="auto-stories" color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Biblioteca",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <MaterialIcons name="menu-book" color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Mercado",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <FontAwesome5 name="store" color={color} size={size - 3} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <MaterialIcons name="person" color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="archivist"
        options={{
          title: "Archivista",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused}>
              <MaterialIcons name="auto-awesome" color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}
