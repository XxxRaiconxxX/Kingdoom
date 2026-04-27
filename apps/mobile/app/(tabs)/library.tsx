import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { DetailSheet } from "@/src/components/DetailSheet";
import {
  EmptyState,
  ErrorPanel,
  MetricTile,
  Pill,
  RealmCard,
  SearchInput,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchRealmEventsNative } from "@/src/features/events/eventsService";
import { fetchMissionsNative } from "@/src/features/missions/missionsService";
import type { EventStatus, RealmEvent, RealmMission } from "@/src/features/shared/types";
import { MOBILE_THEME } from "@/src/theme/colors";

const EVENT_STATUS_FILTERS: Array<{ id: "all" | EventStatus; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "in-production", label: "Produccion" },
  { id: "finished", label: "Cerrados" },
];

type LibraryMode = "events" | "missions";

export default function LibraryScreen() {
  const [mode, setMode] = useState<LibraryMode>("events");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [selectedEvent, setSelectedEvent] = useState<RealmEvent | null>(null);
  const [selectedMission, setSelectedMission] = useState<RealmMission | null>(null);
  const eventsQuery = useQuery({ queryKey: ["realm-events"], queryFn: fetchRealmEventsNative });
  const missionsQuery = useQuery({ queryKey: ["realm-missions"], queryFn: fetchMissionsNative });

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

  const filteredMissions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return (missionsQuery.data?.missions ?? []).filter((mission) => {
      if (!normalized) {
        return true;
      }
      return (
        mission.title.toLowerCase().includes(normalized) ||
        mission.description.toLowerCase().includes(normalized) ||
        mission.type.toLowerCase().includes(normalized)
      );
    });
  }, [missionsQuery.data?.missions, search]);

  const isRefreshing = eventsQuery.isRefetching || missionsQuery.isRefetching;
  const isLoading = mode === "events" ? eventsQuery.isLoading : missionsQuery.isLoading;
  const activeError = mode === "events" ? eventsQuery.data?.errorMessage : missionsQuery.data?.errorMessage;

  return (
    <ScreenShell
      title="Biblioteca"
      subtitle="Eventos y misiones"
      onRefresh={() => {
        void eventsQuery.refetch();
        void missionsQuery.refetch();
      }}
      refreshing={isRefreshing}
    >
      <StaggerItem index={0}>
        <RealmCard tone="gold">
          <SectionHeader
            eyebrow="Archivo"
            title={mode === "events" ? "Agenda del reino" : "Tablon de misiones"}
            trailing={
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Pill label="Eventos" active={mode === "events"} onPress={() => setMode("events")} />
                <Pill label="Misiones" active={mode === "missions"} onPress={() => setMode("missions")} />
              </View>
            }
          />
          <SearchInput value={search} onChangeText={setSearch} placeholder={mode === "events" ? "Buscar evento" : "Buscar mision"} />
          {mode === "events" ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {EVENT_STATUS_FILTERS.map((chip) => (
                  <Pill key={chip.id} label={chip.label} active={chip.id === statusFilter} onPress={() => setStatusFilter(chip.id)} />
                ))}
              </View>
            </ScrollView>
          ) : null}
        </RealmCard>
      </StaggerItem>

      {isLoading ? (
        <RealmCard>
          <ActivityIndicator color={MOBILE_THEME.gold} />
        </RealmCard>
      ) : null}

      {activeError ? (
        <ErrorPanel
          message={activeError}
          onRetry={() => {
            void eventsQuery.refetch();
            void missionsQuery.refetch();
          }}
        />
      ) : null}

      {mode === "events"
        ? filteredEvents.map((entry, index) => (
            <StaggerItem key={entry.id} index={index + 1}>
              <RealmCard>
                {entry.imageUrl ? (
                  <Image
                    source={{ uri: entry.imageUrl }}
                    resizeMode="cover"
                    style={{ height: 132, borderRadius: 16, borderWidth: 1, borderColor: MOBILE_THEME.border, backgroundColor: MOBILE_THEME.bg }}
                  />
                ) : null}
                <SectionHeader
                  eyebrow={entry.status}
                  title={entry.title}
                  trailing={<MaterialIcons name="event" size={22} color={MOBILE_THEME.gold} />}
                />
                <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={2}>
                  {entry.description}
                </Text>
                <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12 }}>
                  {entry.startDate} / {entry.endDate}
                </Text>
                <Pressable
                  onPress={() => setSelectedEvent(entry)}
                  style={{
                    minHeight: 42,
                    borderRadius: 13,
                    borderWidth: 1,
                    borderColor: MOBILE_THEME.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>Ver evento</Text>
                </Pressable>
              </RealmCard>
            </StaggerItem>
          ))
        : filteredMissions.map((mission, index) => (
            <StaggerItem key={mission.id} index={index + 1}>
              <RealmCard tone={mission.status === "closed" ? "default" : "teal"}>
                <SectionHeader
                  eyebrow={mission.difficulty}
                  title={mission.title}
                  trailing={<Pill label={`${mission.rewardGold} oro`} active />}
                />
                <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={2}>
                  {mission.description}
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <MetricTile label="CUPO" value={mission.maxParticipants} icon="groups" />
                  <MetricTile label="ESTADO" value={mission.status} icon="flag" />
                </View>
                <Pressable
                  onPress={() => setSelectedMission(mission)}
                  style={{
                    minHeight: 42,
                    borderRadius: 13,
                    borderWidth: 1,
                    borderColor: MOBILE_THEME.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: MOBILE_THEME.text, fontWeight: "900" }}>Ver mision</Text>
                </Pressable>
              </RealmCard>
            </StaggerItem>
          ))}

      {!isLoading && mode === "events" && filteredEvents.length === 0 ? (
        <EmptyState title="Sin eventos" message="No hay eventos para ese filtro." icon="event-busy" />
      ) : null}

      {!isLoading && mode === "missions" && filteredMissions.length === 0 ? (
        <EmptyState title="Sin misiones" message="No hay misiones publicadas." icon="flag" />
      ) : null}

      <DetailSheet
        visible={Boolean(selectedEvent)}
        title={selectedEvent?.title ?? "Evento"}
        subtitle={selectedEvent ? `${selectedEvent.status} / ${selectedEvent.startDate}` : ""}
        onClose={() => setSelectedEvent(null)}
      >
        {selectedEvent?.imageUrl ? (
          <Image
            source={{ uri: selectedEvent.imageUrl }}
            resizeMode="cover"
            style={{ width: "100%", height: 190, borderRadius: 16, borderWidth: 1, borderColor: MOBILE_THEME.border, backgroundColor: MOBILE_THEME.bg }}
          />
        ) : null}
        <RealmCard>
          <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>
            {selectedEvent?.longDescription || selectedEvent?.description}
          </Text>
          <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
            Inicio: {selectedEvent?.startDate ?? "-"} / Cierre: {selectedEvent?.endDate ?? "-"}
          </Text>
          {selectedEvent?.rewards ? <Text style={{ color: MOBILE_THEME.gold }}>Recompensas: {selectedEvent.rewards}</Text> : null}
        </RealmCard>
      </DetailSheet>

      <DetailSheet
        visible={Boolean(selectedMission)}
        title={selectedMission?.title ?? "Mision"}
        subtitle={selectedMission ? `${selectedMission.difficulty} / ${selectedMission.type}` : ""}
        onClose={() => setSelectedMission(null)}
      >
        <RealmCard tone="teal">
          <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>{selectedMission?.description}</Text>
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>{selectedMission?.instructions}</Text>
          <Text style={{ color: MOBILE_THEME.gold, fontWeight: "900" }}>
            Recompensa: {selectedMission?.rewardGold ?? 0} oro
          </Text>
        </RealmCard>
      </DetailSheet>
    </ScreenShell>
  );
}
