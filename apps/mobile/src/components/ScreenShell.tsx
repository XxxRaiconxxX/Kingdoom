import { PropsWithChildren } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOBILE_THEME } from "@/src/theme/colors";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function ScreenShell({ title, subtitle, children }: ScreenShellProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: MOBILE_THEME.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 26 }}
        style={{ flex: 1 }}
      >
        <View>
          <Text style={{ color: MOBILE_THEME.gold, fontSize: 12, letterSpacing: 1.1, fontWeight: "700" }}>
            KINGDOOM NATIVE
          </Text>
          <Text style={{ color: MOBILE_THEME.text, fontSize: 28, fontWeight: "800", marginTop: 4 }}>
            {title}
          </Text>
          <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 6, lineHeight: 20 }}>
            {subtitle}
          </Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
