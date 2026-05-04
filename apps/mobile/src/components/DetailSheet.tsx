import type { ReactNode } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeIn, SlideInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOBILE_THEME } from "@/src/theme/colors";

type DetailSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function DetailSheet({ visible, title, subtitle, onClose, children }: DetailSheetProps) {
  const entranceCurve = Easing.bezier(0.22, 1, 0.36, 1);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.66)", justifyContent: "flex-end" }}
      >
        <Animated.View entering={SlideInDown.duration(300).easing(entranceCurve)} style={{ maxHeight: "88%" }}>
          <SafeAreaView
            style={{
              maxHeight: "100%",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderColor: "rgba(240,179,47,0.28)",
              backgroundColor: "rgba(13,12,10,0.99)",
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 16,
              gap: 12,
              overflow: "hidden",
              shadowColor: MOBILE_THEME.gold,
              shadowOpacity: 0.18,
              shadowRadius: 24,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -95,
                right: -80,
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: "rgba(240,179,47,0.11)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: -80,
                bottom: -110,
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: "rgba(49,209,179,0.06)",
              }}
            />
            <View
              style={{
                alignSelf: "center",
                width: 48,
                height: 4,
                borderRadius: 999,
                backgroundColor: "rgba(240,179,47,0.42)",
                marginBottom: 2,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: MOBILE_THEME.text, fontSize: 21, lineHeight: 25, fontWeight: "900" }}>{title}</Text>
                {subtitle ? (
                  <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 4, fontSize: 12 }}>{subtitle}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(240,179,47,0.24)",
                  width: 34,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(5,5,4,0.72)",
                }}
              >
                <MaterialIcons name="close" color={MOBILE_THEME.text} size={18} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
