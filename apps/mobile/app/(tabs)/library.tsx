import { Text, View } from "react-native";
import { ScreenShell } from "@/src/components/ScreenShell";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function LibraryScreen() {
  return (
    <ScreenShell title="Biblioteca" subtitle="Cronicas, mapa y bestiario">
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: MOBILE_THEME.border,
          backgroundColor: MOBILE_THEME.surfaceSoft,
          padding: 14,
        }}
      >
        <Text style={{ color: MOBILE_THEME.text, fontSize: 15, fontWeight: "700" }}>
          Modulo en preparacion
        </Text>
        <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 8, lineHeight: 20 }}>
          Seccion orientada a lectura mobile-first y cache local de contenidos.
        </Text>
      </View>
    </ScreenShell>
  );
}
