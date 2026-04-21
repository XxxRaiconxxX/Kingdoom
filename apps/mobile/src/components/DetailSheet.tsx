import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.66)", justifyContent: "flex-end" }}>
        <SafeAreaView
          style={{
            maxHeight: "88%",
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
              <Text style={{ color: MOBILE_THEME.text, fontSize: 18, lineHeight: 18 }}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
