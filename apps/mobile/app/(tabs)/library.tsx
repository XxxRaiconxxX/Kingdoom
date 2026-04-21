import { ActivityIndicator, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchRealmEventsNative } from "@/src/features/events/eventsService";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function LibraryScreen() {
  const eventsQuery = useQuery({
    queryKey: ["realm-events"],
    queryFn: fetchRealmEventsNative,
  });

  return (
    <ScreenShell title="Biblioteca" subtitle="Cronicas, mapa y bestiario">
      {eventsQuery.isLoading ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 16,
            alignItems: "center",
          }}
        >
          <ActivityIndicator color={MOBILE_THEME.gold} />
        </View>
      ) : null}

      {eventsQuery.data?.errorMessage ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
          }}
        >
          <Text style={{ color: MOBILE_THEME.danger, lineHeight: 20 }}>
            {eventsQuery.data.errorMessage}
          </Text>
        </View>
      ) : null}

      {(eventsQuery.data?.events ?? []).map((entry) => (
        <View
          key={entry.id}
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
            gap: 6,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontSize: 16, fontWeight: "800" }}>
            {entry.title}
          </Text>
          <Text style={{ color: MOBILE_THEME.mutedText }}>{entry.description}</Text>
          <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
            {entry.startDate} - {entry.endDate} | {entry.status}
          </Text>
        </View>
      ))}
    </ScreenShell>
  );
}
