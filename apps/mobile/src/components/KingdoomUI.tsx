import type { ReactNode } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MOBILE_THEME } from "@/src/theme/colors";

type IconName = keyof typeof MaterialIcons.glyphMap;

export function RealmCard({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "gold" | "teal" | "danger";
}) {
  const borderColor =
    tone === "gold"
      ? "rgba(240,179,47,0.42)"
      : tone === "teal"
        ? "rgba(49,209,179,0.36)"
        : tone === "danger"
          ? "rgba(225,100,100,0.42)"
          : MOBILE_THEME.border;

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        backgroundColor: "rgba(17,16,13,0.92)",
        padding: 12,
        gap: 10,
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: -80,
          top: -90,
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor:
            tone === "teal"
              ? "rgba(49,209,179,0.08)"
              : tone === "danger"
                ? "rgba(225,100,100,0.08)"
                : "rgba(240,179,47,0.08)",
        }}
      />
      {children}
    </View>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <Text
            style={{
              color: MOBILE_THEME.gold,
              fontSize: 10,
              fontWeight: "900",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text style={{ color: MOBILE_THEME.text, fontSize: 19, fontWeight: "900", marginTop: 2 }}>
          {title}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const content = (
    <>
      {icon ? <MaterialIcons name={icon} size={14} color={active ? MOBILE_THEME.black : MOBILE_THEME.mutedText} /> : null}
      <Text
        style={{
          color: active ? MOBILE_THEME.black : MOBILE_THEME.mutedText,
          fontSize: 12,
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </>
  );

  const style = {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: active ? "rgba(240,179,47,0.9)" : MOBILE_THEME.border,
    backgroundColor: active ? MOBILE_THEME.gold : "rgba(5,5,4,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  };

  if (!onPress) {
    return <View style={style}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.78 : 1 }]}>
      {content}
    </Pressable>
  );
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: MOBILE_THEME.border,
        backgroundColor: "rgba(5,5,4,0.76)",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <MaterialIcons name="search" size={18} color={MOBILE_THEME.dimText} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        placeholder={placeholder}
        placeholderTextColor={MOBILE_THEME.dimText}
        style={{
          flex: 1,
          color: MOBILE_THEME.text,
          paddingVertical: 12,
          fontSize: 14,
        }}
      />
    </View>
  );
}

export function PrimaryAction({
  label,
  onPress,
  disabled,
  loading,
  icon = "bolt",
  variant = "gold",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  variant?: "gold" | "ghost" | "danger";
}) {
  const isGold = variant === "gold";
  const isDanger = variant === "danger";
  const backgroundColor = disabled
    ? MOBILE_THEME.border
    : isGold
      ? MOBILE_THEME.gold
      : isDanger
        ? "rgba(225,100,100,0.14)"
        : "rgba(5,5,4,0.58)";
  const textColor = disabled
    ? MOBILE_THEME.dimText
    : isGold
      ? MOBILE_THEME.black
      : isDanger
        ? MOBILE_THEME.danger
        : MOBILE_THEME.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        minHeight: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isGold ? "rgba(240,179,47,0.45)" : MOBILE_THEME.border,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: pressed ? 0.84 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isGold ? MOBILE_THEME.black : MOBILE_THEME.gold} />
      ) : (
        <>
          <MaterialIcons name={icon} size={17} color={textColor} />
          <Text style={{ color: textColor, fontWeight: "900", fontSize: 14 }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function MetricTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: IconName;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 84,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: MOBILE_THEME.border,
        backgroundColor: "rgba(5,5,4,0.62)",
        padding: 12,
        justifyContent: "space-between",
      }}
    >
      <MaterialIcons name={icon} size={18} color={MOBILE_THEME.gold} />
      <View>
        <Text style={{ color: MOBILE_THEME.text, fontSize: 19, fontWeight: "900" }}>{value}</Text>
        <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "800", marginTop: 2 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon = "auto-stories",
}: {
  title: string;
  message?: string;
  icon?: IconName;
}) {
  return (
    <RealmCard>
      <View style={{ alignItems: "center", paddingVertical: 8, gap: 8 }}>
        <MaterialIcons name={icon} size={28} color={MOBILE_THEME.dimText} />
        <Text style={{ color: MOBILE_THEME.text, fontWeight: "900", textAlign: "center" }}>{title}</Text>
        {message ? (
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20, textAlign: "center" }}>{message}</Text>
        ) : null}
      </View>
    </RealmCard>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <RealmCard tone="danger">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <MaterialIcons name="sync-problem" size={18} color={MOBILE_THEME.danger} />
        <Text style={{ color: MOBILE_THEME.danger, lineHeight: 19, flex: 1 }}>{message}</Text>
      </View>
      {onRetry ? <PrimaryAction label="Reintentar" icon="refresh" variant="ghost" onPress={onRetry} /> : null}
    </RealmCard>
  );
}

export function StaggerItem({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(70 * index).duration(420)}>
      {children}
    </Animated.View>
  );
}
