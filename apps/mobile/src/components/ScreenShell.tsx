import { PropsWithChildren } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOBILE_THEME } from "@/src/theme/colors";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

export function ScreenShell({
  title,
  subtitle,
  children,
  onRefresh,
  refreshing = false,
}: ScreenShellProps) {
  const entranceCurve = Easing.bezier(0.22, 1, 0.36, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: MOBILE_THEME.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 36 }}
        style={{ flex: 1 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MOBILE_THEME.gold}
            />
          ) : undefined
        }
      >
        <Animated.View entering={FadeInDown.duration(420).easing(entranceCurve)}>
          <Text style={{ color: MOBILE_THEME.gold, fontSize: 12, letterSpacing: 1.1, fontWeight: "700" }}>
            KINGDOOM APP
          </Text>
          <Text style={{ color: MOBILE_THEME.text, fontSize: 28, fontWeight: "800", marginTop: 4 }}>
            {title}
          </Text>
          <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 6, lineHeight: 20 }}>
            {subtitle}
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(80).duration(460).easing(entranceCurve)}
          layout={LinearTransition.duration(180)}
          style={{ gap: 14 }}
        >
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
