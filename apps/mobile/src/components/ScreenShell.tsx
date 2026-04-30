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
          bottom: 90,
          left: -150,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: "rgba(49,209,179,0.045)",
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
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 130,
          backgroundColor: "rgba(240,179,47,0.025)",
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, gap: 12, paddingBottom: 122 }}
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
              <Text style={{ color: MOBILE_THEME.text, fontSize: 28, lineHeight: 33, fontWeight: "900", marginTop: 5 }}>
                {title}
              </Text>
              <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 5, lineHeight: 18, fontSize: 13 }}>
                {subtitle}
              </Text>
            </View>
            {rightSlot}
          </View>
          <Animated.View
            entering={FadeInDown.delay(120).duration(520).easing(entranceCurve)}
            style={{
              height: 1,
              marginTop: 14,
              backgroundColor: "rgba(240,179,47,0.22)",
            }}
          />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(80).duration(460).easing(entranceCurve)}
          layout={LinearTransition.duration(180)}
          style={{ gap: 12 }}
        >
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
