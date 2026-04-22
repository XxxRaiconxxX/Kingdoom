import { Text, View } from "react-native";
import { ScreenShell } from "@/src/components/ScreenShell";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function GrimoireScreen() {
  return (
    <ScreenShell title="Grimorio" subtitle="Magias y bestiario">
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
          Sin registros por ahora.
        </Text>
      </View>
    </ScreenShell>
  );
}
