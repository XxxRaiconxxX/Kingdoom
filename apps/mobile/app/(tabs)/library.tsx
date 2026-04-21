import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchRealmEventsNative } from "@/src/features/events/eventsService";
import type { EventStatus } from "@/src/features/shared/types";
import { MOBILE_THEME } from "@/src/theme/colors";

const EVENT_STATUS_FILTERS: Array<{ id: "all" | EventStatus; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "in-production", label: "Produccion" },
  { id: "finished", label: "Finalizados" },
];

export default function LibraryScreen() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const eventsQuery = useQuery({
    queryKey: ["realm-events"],
    queryFn: fetchRealmEventsNative,
  });

  const filteredEvents = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return (eventsQuery.data?.events ?? []).filter((entry) => {
      const statusOk = statusFilter === "all" || entry.status === statusFilter;
      const searchOk =
        normalized.length === 0 ||
        entry.title.toLowerCase().includes(normalized) ||
        entry.description.toLowerCase().includes(normalized);
      return statusOk && searchOk;
    });
  }, [eventsQuery.data?.events, search, statusFilter]);

  return (
    <ScreenShell
      title="Biblioteca"
      subtitle="Cronicas, mapa y bestiario"
      onRefresh={() => {
        void eventsQuery.refetch();
      }}
      refreshing={eventsQuery.isRefetching}
    >
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: MOBILE_THEME.border,
          backgroundColor: MOBILE_THEME.surfaceSoft,
          padding: 12,
          gap: 10,
        }}
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          placeholder="Buscar evento"
          placeholderTextColor={MOBILE_THEME.mutedText}
          style={{
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: MOBILE_THEME.text,
            backgroundColor: MOBILE_THEME.bg,
          }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {EVENT_STATUS_FILTERS.map((chip) => {
              const active = chip.id === statusFilter;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setStatusFilter(chip.id)}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? MOBILE_THEME.gold : MOBILE_THEME.border,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    backgroundColor: active ? "rgba(212,166,74,0.14)" : MOBILE_THEME.bg,
                  }}
                >
                  <Text
                    style={{
                      color: active ? MOBILE_THEME.gold : MOBILE_THEME.mutedText,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

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

      {filteredEvents.map((entry) => (
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

      {!eventsQuery.isLoading && filteredEvents.length === 0 ? (
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.surfaceSoft,
            padding: 14,
          }}
        >
          <Text style={{ color: MOBILE_THEME.mutedText }}>
            No hay eventos para ese filtro.
          </Text>
        </View>
      ) : null}
    </ScreenShell>
  );
}
