import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { ScreenShell } from "@/src/components/ScreenShell";
import { MOBILE_THEME } from "@/src/theme/colors";
import { useSessionStore } from "@/src/features/session/sessionStore";

export default function HomeScreen() {
  const [usernameInput, setUsernameInput] = useState("");
  const { player, isLoading, errorMessage, connectByUsername, clearError } = useSessionStore();

  async function handleConnect() {
    clearError();
    await connectByUsername(usernameInput);
  }

  return (
    <ScreenShell title="Kingdoom Native" subtitle="Sesion nativa y economia segura">
      <View style={{ gap: 12 }}>
        <Text style={{ color: MOBILE_THEME.text, fontSize: 16, fontWeight: "700" }}>
          Conecta tu perfil
        </Text>
        <TextInput
          value={usernameInput}
          onChangeText={setUsernameInput}
          autoCapitalize="none"
          placeholder="Username registrado"
          placeholderTextColor={MOBILE_THEME.mutedText}
          style={{
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: MOBILE_THEME.text,
            backgroundColor: MOBILE_THEME.surfaceSoft,
          }}
        />
        <Pressable
          onPress={() => void handleConnect()}
          style={{
            borderRadius: 12,
            paddingVertical: 12,
            backgroundColor: MOBILE_THEME.gold,
            alignItems: "center",
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={MOBILE_THEME.bg} />
          ) : (
            <Text style={{ color: MOBILE_THEME.bg, fontWeight: "800", fontSize: 15 }}>
              Conectar
            </Text>
          )}
        </Pressable>

        {errorMessage ? (
          <Text style={{ color: MOBILE_THEME.danger, fontSize: 13 }}>{errorMessage}</Text>
        ) : null}
      </View>

      <View
        style={{
          marginTop: 18,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: MOBILE_THEME.border,
          padding: 14,
          backgroundColor: MOBILE_THEME.surfaceSoft,
          gap: 6,
        }}
      >
        <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, letterSpacing: 0.7 }}>
          ESTADO ACTUAL
        </Text>
        <Text style={{ color: MOBILE_THEME.text, fontSize: 18, fontWeight: "800" }}>
          {player ? player.username : "Sin sesion"}
        </Text>
        <Text style={{ color: MOBILE_THEME.gold, fontSize: 16, fontWeight: "700" }}>
          Oro: {player?.gold ?? 0}
        </Text>
        <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>App nativa sin WebView.</Text>
      </View>
    </ScreenShell>
  );
}
