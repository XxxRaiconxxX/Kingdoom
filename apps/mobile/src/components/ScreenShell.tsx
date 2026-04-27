import { PropsWithChildren, ReactNode } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOBILE_THEME } from "@/src/theme/colors";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  eyebrow?: string;
  rightSlot?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

export function ScreenShell({
  title,
  subtitle,
  eyebrow = "Kingdoom native",
  rightSlot,
  children,
  onRefresh,
  refreshing = false,
}: ScreenShellProps) {
  const entranceCurve = Easing.bezier(0.22, 1, 0.36, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: MOBILE_THEME.bg }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 270,
          height: 270,
          borderRadius: 135,
          backgroundColor: "rgba(240,179,47,0.08)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 14,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: "rgba(240,179,47,0.2)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 22,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: "rgba(49,209,179,0.09)",
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, gap: 14, paddingBottom: 118 }}
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
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                {eyebrow}
              </Text>
              <Text style={{ color: MOBILE_THEME.text, fontSize: 31, fontWeight: "900", marginTop: 6 }}>
                {title}
              </Text>
              <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 7, lineHeight: 20, fontSize: 14 }}>
                {subtitle}
              </Text>
            </View>
            {rightSlot}
          </View>
          <View
            style={{
              height: 1,
              marginTop: 16,
              backgroundColor: "rgba(240,179,47,0.2)",
            }}
          />
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
