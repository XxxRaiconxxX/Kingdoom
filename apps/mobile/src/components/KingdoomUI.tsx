import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
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
  const accentColor =
    tone === "teal" ? MOBILE_THEME.teal : tone === "danger" ? MOBILE_THEME.danger : MOBILE_THEME.gold;

  return (
    <Animated.View
      layout={LinearTransition.duration(180)}
      style={{
        borderRadius: 19,
        borderWidth: 1,
        borderColor,
        backgroundColor: "rgba(17,16,13,0.92)",
        padding: 13,
        gap: 10,
        overflow: "hidden",
        shadowColor: accentColor,
        shadowOpacity: tone === "default" ? 0.1 : 0.18,
        shadowRadius: tone === "default" ? 16 : 22,
        shadowOffset: { width: 0, height: 10 },
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 1,
          right: 1,
          top: 1,
          height: 48,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          backgroundColor: "rgba(255,255,255,0.025)",
        }}
      />
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
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: -50,
          bottom: -80,
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 1,
          borderColor:
            tone === "teal"
              ? "rgba(49,209,179,0.1)"
              : tone === "danger"
                ? "rgba(225,100,100,0.1)"
                : "rgba(240,179,47,0.1)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: tone === "default" ? "rgba(240,179,47,0.18)" : accentColor,
          opacity: tone === "default" ? 0.55 : 0.75,
        }}
      />
      {children}
    </Animated.View>
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
              letterSpacing: 1.8,
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text style={{ color: MOBILE_THEME.text, fontSize: 20, fontWeight: "900", marginTop: 2, letterSpacing: -0.2 }}>
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        style,
        {
          opacity: pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
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
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: focused ? "rgba(240,179,47,0.55)" : MOBILE_THEME.border,
        backgroundColor: focused ? "rgba(11,10,8,0.9)" : "rgba(5,5,4,0.76)",
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        keyboardAppearance="dark"
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
        borderRadius: 15,
        borderWidth: 1,
        borderColor: isGold ? "rgba(255,211,106,0.62)" : isDanger ? "rgba(225,100,100,0.4)" : MOBILE_THEME.border,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: isGold ? MOBILE_THEME.gold : isDanger ? MOBILE_THEME.danger : MOBILE_THEME.black,
        shadowOpacity: isGold && !disabled ? 0.24 : 0.09,
        shadowRadius: isGold ? 16 : 12,
        shadowOffset: { width: 0, height: 8 },
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
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(240,179,47,0.18)",
        backgroundColor: "rgba(5,5,4,0.68)",
        padding: 12,
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: -26,
          top: -30,
          width: 82,
          height: 82,
          borderRadius: 41,
          backgroundColor: "rgba(240,179,47,0.08)",
        }}
      />
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(240,179,47,0.11)",
          borderWidth: 1,
          borderColor: "rgba(240,179,47,0.16)",
        }}
      >
        <MaterialIcons name={icon} size={17} color={MOBILE_THEME.gold} />
      </View>
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

export function LoadingPanel({
  label = "Cargando datos",
}: {
  label?: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      false
    );
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${28 + progress.value * 48}%`,
    opacity: 0.48 + progress.value * 0.42,
  }));

  return (
    <RealmCard tone="gold">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ActivityIndicator color={MOBILE_THEME.gold} />
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={{ color: MOBILE_THEME.text, fontSize: 13, fontWeight: "900" }}>{label}</Text>
          <View
            style={{
              height: 7,
              borderRadius: 999,
              backgroundColor: "rgba(240,179,47,0.12)",
              overflow: "hidden",
            }}
          >
            <Animated.View
              entering={FadeInDown.duration(360)}
              style={[{
                height: "100%",
                borderRadius: 999,
                backgroundColor: "rgba(240,179,47,0.55)",
              }, barStyle]}
            />
          </View>
        </View>
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
      <Animated.View
        entering={FadeInDown.duration(320).easing(Easing.bezier(0.22, 1, 0.36, 1))}
        style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(225,100,100,0.1)",
            borderWidth: 1,
            borderColor: "rgba(225,100,100,0.18)",
          }}
        >
          <MaterialIcons name="sync-problem" size={15} color={MOBILE_THEME.danger} />
        </View>
        <Text style={{ color: MOBILE_THEME.danger, lineHeight: 18, flex: 1, fontSize: 13 }}>{message}</Text>
      </Animated.View>
      {onRetry ? <PrimaryAction label="Reintentar" icon="refresh" variant="ghost" onPress={onRetry} /> : null}
    </RealmCard>
  );
}

export function NoticeBanner({
  title,
  message,
  tone = "gold",
  icon = "notifications-active",
}: {
  title: string;
  message?: string;
  tone?: "gold" | "teal" | "danger";
  icon?: IconName;
}) {
  const color = tone === "teal" ? MOBILE_THEME.teal : tone === "danger" ? MOBILE_THEME.danger : MOBILE_THEME.gold;

  return (
    <Animated.View entering={FadeInDown.duration(380).easing(Easing.bezier(0.22, 1, 0.36, 1))}>
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: `${color}66`,
          backgroundColor: tone === "danger" ? "rgba(81,32,32,0.58)" : "rgba(5,5,4,0.78)",
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -32,
            top: -36,
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: color,
            opacity: 0.08,
          }}
        />
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${color}1A`,
            borderWidth: 1,
            borderColor: `${color}33`,
          }}
        >
          <MaterialIcons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: MOBILE_THEME.text, fontSize: 13, fontWeight: "900" }}>{title}</Text>
          {message ? <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, lineHeight: 17, marginTop: 2 }}>{message}</Text> : null}
        </View>
      </View>
    </Animated.View>
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
    <Animated.View
      entering={FadeInDown.delay(62 * index)
        .duration(460)
        .easing(Easing.bezier(0.22, 1, 0.36, 1))}
      layout={LinearTransition.duration(180)}
    >
      {children}
    </Animated.View>
  );
}
