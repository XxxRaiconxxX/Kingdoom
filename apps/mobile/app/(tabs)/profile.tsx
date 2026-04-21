import { Pressable, Text, View } from "react-native";
import { ScreenShell } from "@/src/components/ScreenShell";
import { MOBILE_THEME } from "@/src/theme/colors";
import { useSessionStore } from "@/src/features/session/sessionStore";

export default function ProfileScreen() {
  const { player, disconnect } = useSessionStore();

  return (
    <ScreenShell title="Perfil" subtitle="Sesion, oro y estado base">
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: MOBILE_THEME.border,
          backgroundColor: MOBILE_THEME.surfaceSoft,
          padding: 14,
          gap: 8,
        }}
      >
        <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, letterSpacing: 0.7 }}>
          JUGADOR
        </Text>
        <Text style={{ color: MOBILE_THEME.text, fontSize: 18, fontWeight: "800" }}>
          {player ? player.username : "Sin sesion activa"}
        </Text>
        <Text style={{ color: MOBILE_THEME.gold, fontSize: 15, fontWeight: "700" }}>
          Oro: {player?.gold ?? 0}
        </Text>

        <Pressable
          onPress={disconnect}
          style={{
            marginTop: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            paddingVertical: 11,
            alignItems: "center",
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontWeight: "700" }}>Cerrar sesion</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}
