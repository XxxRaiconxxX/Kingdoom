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
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              backgroundColor: MOBILE_THEME.surface,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 16,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: MOBILE_THEME.text, fontSize: 21, fontWeight: "800" }}>{title}</Text>
                {subtitle ? (
                  <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 4, fontSize: 12 }}>{subtitle}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: MOBILE_THEME.border,
                  width: 34,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
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
