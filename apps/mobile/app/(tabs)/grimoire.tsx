import { Text, View } from "react-native";
import { ScreenShell } from "@/src/components/ScreenShell";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function GrimoireScreen() {
  return (
    <ScreenShell title="Grimorio" subtitle="Catalogos de magia nativos">
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
          Aqui ira el listado por categorias y niveles, con carga admin desde Supabase.
        </Text>
      </View>
    </ScreenShell>
  );
}
