import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DetailSheet } from "@/src/components/DetailSheet";
import {
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  MetricTile,
  Pill,
  PrimaryAction,
  RealmCard,
  SearchInput,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import {
  fetchPlayerEventParticipationsNative,
  fetchPublicEventParticipantsNative,
  fetchRealmEventsNative,
  getEventParticipationStatusLabel,
  joinRealmEventNative,
  leaveRealmEventNative,
} from "@/src/features/events/eventsService";
import {
  claimRealmMissionNative,
  fetchMissionsNative,
  fetchPlayerMissionClaimsNative,
  getMissionClaimStatusLabel,
  submitMissionEvidenceNative,
} from "@/src/features/missions/missionsService";
import { useSessionStore } from "@/src/features/session/sessionStore";
import type {
  EventStatus,
  RealmEvent,
  RealmEventParticipant,
  RealmMission,
  RealmMissionClaim,
} from "@/src/features/shared/types";
import { MOBILE_THEME } from "@/src/theme/colors";

const EVENT_STATUS_FILTERS: Array<{ id: "all" | EventStatus; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "in-production", label: "Produccion" },
  { id: "finished", label: "Cerrados" },
];

type LibraryMode = "events" | "missions";

function ActionButton({
  label,
  icon,
  loading,
  disabled,
  variant,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  variant?: "gold" | "ghost" | "danger";
  onPress: () => void;
}) {
  return (
    <PrimaryAction
      label={label}
      icon={icon}
      loading={loading}
      disabled={disabled}
      variant={variant}
      onPress={onPress}
    />
  );
}

function ParticipantList({ participants }: { participants: RealmEventParticipant[] }) {
  if (participants.length === 0) {
    return <Text style={{ color: MOBILE_THEME.dimText }}>Sin participantes aun.</Text>;
  }

  return (
    <View style={{ gap: 8 }}>
      {participants.map((participant) => (
        <View
          key={participant.id}
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: "rgba(5,5,4,0.55)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 10,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontWeight: "900", flex: 1 }} numberOfLines={1}>
            {participant.playerName}
          </Text>
          <Text style={{ color: MOBILE_THEME.gold, fontSize: 11, fontWeight: "900" }}>
            {getEventParticipationStatusLabel(participant.status)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function LibraryScreen() {
  const queryClient = useQueryClient();
  const { player } = useSessionStore();
  const [mode, setMode] = useState<LibraryMode>("events");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [selectedEvent, setSelectedEvent] = useState<RealmEvent | null>(null);
  const [selectedMission, setSelectedMission] = useState<RealmMission | null>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busyActionId, setBusyActionId] = useState("");

  const eventsQuery = useQuery({ queryKey: ["realm-events"], queryFn: fetchRealmEventsNative });
  const missionsQuery = useQuery({ queryKey: ["realm-missions"], queryFn: fetchMissionsNative });

  const events = eventsQuery.data?.events ?? [];
  const missions = missionsQuery.data?.missions ?? [];
  const eventIds = useMemo(() => events.map((event) => event.id), [events]);
  const missionIds = useMemo(() => missions.map((mission) => mission.id), [missions]);

  const eventParticipantsQuery = useQuery({
    queryKey: ["realm-event-participants", eventIds],
    queryFn: () => fetchPublicEventParticipantsNative(eventIds),
    enabled: eventIds.length > 0,
  });

  const playerEventQuery = useQuery({
    queryKey: ["player-event-participations", player?.id, eventIds],
    queryFn: () => fetchPlayerEventParticipationsNative(player?.id ?? "", eventIds),
    enabled: Boolean(player?.id) && eventIds.length > 0,
  });

  const playerMissionQuery = useQuery({
    queryKey: ["player-mission-claims", player?.id, missionIds],
    queryFn: () => fetchPlayerMissionClaimsNative(player?.id ?? "", missionIds),
    enabled: Boolean(player?.id) && missionIds.length > 0,
  });

  const filteredEvents = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return events.filter((entry) => {
      const statusOk = statusFilter === "all" || entry.status === statusFilter;
      const searchOk =
        normalized.length === 0 ||
        entry.title.toLowerCase().includes(normalized) ||
        entry.description.toLowerCase().includes(normalized);
      return statusOk && searchOk;
    });
  }, [events, search, statusFilter]);

  const filteredMissions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return missions.filter((mission) => {
      if (!normalized) return true;

      return (
        mission.title.toLowerCase().includes(normalized) ||
        mission.description.toLowerCase().includes(normalized) ||
        mission.type.toLowerCase().includes(normalized)
      );
    });
  }, [missions, search]);

  const selectedMissionClaim = selectedMission
    ? playerMissionQuery.data?.claimsByMissionId[selectedMission.id] ?? null
    : null;
  const selectedEventParticipation = selectedEvent
    ? playerEventQuery.data?.participationsByEventId[selectedEvent.id] ?? null
    : null;
  const selectedEventParticipants = selectedEvent
    ? eventParticipantsQuery.data?.participantsByEventId[selectedEvent.id] ?? []
    : [];
  const isRefreshing =
    eventsQuery.isRefetching ||
    missionsQuery.isRefetching ||
    eventParticipantsQuery.isRefetching ||
    playerEventQuery.isRefetching ||
    playerMissionQuery.isRefetching;
  const isLoading = mode === "events" ? eventsQuery.isLoading : missionsQuery.isLoading;
  const activeError = mode === "events" ? eventsQuery.data?.errorMessage : missionsQuery.data?.errorMessage;

  function invalidateRealmState() {
    void queryClient.invalidateQueries({ queryKey: ["realm-events"] });
    void queryClient.invalidateQueries({ queryKey: ["realm-missions"] });
    void queryClient.invalidateQueries({ queryKey: ["realm-event-participants"] });
    void queryClient.invalidateQueries({ queryKey: ["player-event-participations"] });
    void queryClient.invalidateQueries({ queryKey: ["player-mission-claims"] });
  }

  async function handleClaimMission(mission: RealmMission) {
    if (!player) {
      setFeedback("Conecta tu perfil para postularte.");
      return;
    }

    setBusyActionId(`mission:${mission.id}`);
    const result = await claimRealmMissionNative(mission.id, player.id);
    setBusyActionId("");
    setFeedback(result.message);
    invalidateRealmState();
  }

  async function handleSubmitEvidence(claim: RealmMissionClaim) {
    if (!player) {
      setFeedback("Conecta tu perfil para enviar evidencia.");
      return;
    }

    setBusyActionId(`evidence:${claim.id}`);
    const result = await submitMissionEvidenceNative(claim.id, player.id, evidenceText);
    setBusyActionId("");
    setFeedback(result.message);

    if (result.status === "saved") {
      setEvidenceText("");
      invalidateRealmState();
    }
  }

  async function handleJoinEvent(event: RealmEvent) {
    if (!player) {
      setFeedback("Conecta tu perfil para participar.");
      return;
    }

    setBusyActionId(`event:${event.id}`);
    const result = await joinRealmEventNative(event.id, player.id);
    setBusyActionId("");
    setFeedback(result.message);
    invalidateRealmState();
  }

  async function handleLeaveEvent(event: RealmEvent) {
    if (!player) {
      setFeedback("Conecta tu perfil para salir.");
      return;
    }

    setBusyActionId(`event:${event.id}`);
    const result = await leaveRealmEventNative(event.id, player.id);
    setBusyActionId("");
    setFeedback(result.message);
    invalidateRealmState();
  }

  return (
    <ScreenShell
      title="Biblioteca"
      subtitle="Eventos y misiones"
      onRefresh={() => {
        void eventsQuery.refetch();
        void missionsQuery.refetch();
        void eventParticipantsQuery.refetch();
        void playerEventQuery.refetch();
        void playerMissionQuery.refetch();
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
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder={mode === "events" ? "Buscar evento" : "Buscar mision"}
          />
          {mode === "events" ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {EVENT_STATUS_FILTERS.map((chip) => (
                  <Pill
                    key={chip.id}
                    label={chip.label}
                    active={chip.id === statusFilter}
                    onPress={() => setStatusFilter(chip.id)}
                  />
                ))}
              </View>
            </ScrollView>
          ) : null}
        </RealmCard>
      </StaggerItem>

      {feedback ? (
        <StaggerItem index={1}>
          <RealmCard tone={feedback.toLowerCase().includes("no se") ? "danger" : "teal"}>
            <Text style={{ color: MOBILE_THEME.text, lineHeight: 20 }}>{feedback}</Text>
          </RealmCard>
        </StaggerItem>
      ) : null}

      {isLoading ? (
        <LoadingPanel label={mode === "events" ? "Cargando eventos" : "Cargando misiones"} />
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
        ? filteredEvents.map((entry, index) => {
            const participants = eventParticipantsQuery.data?.participantsByEventId[entry.id] ?? [];
            const participation = playerEventQuery.data?.participationsByEventId[entry.id] ?? null;
            const capacity = entry.maxParticipants > 0 ? `${participants.length}/${entry.maxParticipants}` : participants.length;

            return (
              <StaggerItem key={entry.id} index={index + 2}>
                <RealmCard tone={participation ? "teal" : "default"}>
                  {entry.imageUrl ? (
                    <Image
                      source={{ uri: entry.imageUrl }}
                      resizeMode="cover"
                      style={{
                        height: 132,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: MOBILE_THEME.border,
                        backgroundColor: MOBILE_THEME.bg,
                      }}
                    />
                  ) : null}
                  <SectionHeader
                    eyebrow={entry.status}
                    title={entry.title}
                    trailing={<Pill label={participation ? getEventParticipationStatusLabel(participation.status) : "Abierto"} active={Boolean(participation)} />}
                  />
                  <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={2}>
                    {entry.description}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <MetricTile label="PARTICIPAN" value={capacity} icon="groups" />
                    <MetricTile label="PREMIO" value={entry.participationRewardGold} icon="paid" />
                  </View>
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
            );
          })
        : filteredMissions.map((mission, index) => {
            const claim = playerMissionQuery.data?.claimsByMissionId[mission.id] ?? null;

            return (
              <StaggerItem key={mission.id} index={index + 2}>
                <RealmCard tone={claim ? "teal" : mission.status === "closed" ? "default" : "gold"}>
                  <SectionHeader
                    eyebrow={mission.difficulty}
                    title={mission.title}
                    trailing={<Pill label={claim ? getMissionClaimStatusLabel(claim.status) : `${mission.rewardGold} oro`} active />}
                  />
                  <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }} numberOfLines={2}>
                    {mission.description}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <MetricTile label="CUPO" value={mission.maxParticipants} icon="groups" />
                    <MetricTile label="TIPO" value={mission.type} icon="flag" />
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedMission(mission);
                      setEvidenceText(claim?.proofText ?? "");
                    }}
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
            );
          })}

      {!isLoading && !activeError && mode === "events" && filteredEvents.length === 0 ? (
        <EmptyState title="Sin eventos" message="No hay eventos para ese filtro." icon="event-busy" />
      ) : null}

      {!isLoading && !activeError && mode === "missions" && filteredMissions.length === 0 ? (
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
            style={{
              width: "100%",
              height: 190,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              backgroundColor: MOBILE_THEME.bg,
            }}
          />
        ) : null}
        <RealmCard>
          <Text style={{ color: MOBILE_THEME.text, lineHeight: 22 }}>
            {selectedEvent?.longDescription || selectedEvent?.description}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MetricTile label="PARTICIPAN" value={selectedEventParticipants.length} icon="groups" />
            <MetricTile label="ORO" value={selectedEvent?.participationRewardGold ?? 0} icon="paid" />
          </View>
          <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
            Inicio: {selectedEvent?.startDate ?? "-"} / Cierre: {selectedEvent?.endDate ?? "-"}
          </Text>
          {selectedEvent?.rewards ? <Text style={{ color: MOBILE_THEME.gold }}>Recompensas: {selectedEvent.rewards}</Text> : null}
        </RealmCard>
        <RealmCard tone={selectedEventParticipation ? "teal" : "default"}>
          <SectionHeader
            eyebrow="Participacion"
            title={selectedEventParticipation ? getEventParticipationStatusLabel(selectedEventParticipation.status) : "Sin postulacion"}
          />
          {selectedEventParticipation ? (
            <ActionButton
              label="Salir del evento"
              icon="logout"
              variant="ghost"
              loading={busyActionId === `event:${selectedEvent?.id}`}
              disabled={!selectedEvent || selectedEvent.status === "finished"}
              onPress={() => selectedEvent && void handleLeaveEvent(selectedEvent)}
            />
          ) : (
            <ActionButton
              label="Unirme al evento"
              icon="how-to-reg"
              loading={busyActionId === `event:${selectedEvent?.id}`}
              disabled={!selectedEvent || selectedEvent.status === "finished"}
              onPress={() => selectedEvent && void handleJoinEvent(selectedEvent)}
            />
          )}
        </RealmCard>
        <RealmCard>
          <SectionHeader eyebrow="Lista publica" title="Participantes" />
          <ParticipantList participants={selectedEventParticipants} />
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

        <RealmCard tone={selectedMissionClaim ? "teal" : "gold"}>
          <SectionHeader
            eyebrow="Estado actual"
            title={selectedMissionClaim ? getMissionClaimStatusLabel(selectedMissionClaim.status) : "Disponible"}
          />
          {!selectedMissionClaim ? (
            <ActionButton
              label="Postularme"
              icon="flag"
              loading={busyActionId === `mission:${selectedMission?.id}`}
              disabled={!selectedMission || selectedMission.status === "closed"}
              onPress={() => selectedMission && void handleClaimMission(selectedMission)}
            />
          ) : (
            <View style={{ gap: 10 }}>
              <TextInput
                value={evidenceText}
                onChangeText={setEvidenceText}
                placeholder="Resumen de evidencia"
                placeholderTextColor={MOBILE_THEME.dimText}
                multiline
                style={{
                  minHeight: 92,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: MOBILE_THEME.border,
                  backgroundColor: "rgba(5,5,4,0.72)",
                  color: MOBILE_THEME.text,
                  padding: 12,
                  textAlignVertical: "top",
                }}
              />
              <ActionButton
                label={selectedMissionClaim.status === "completed" ? "Actualizar evidencia" : "Enviar evidencia"}
                icon="assignment-turned-in"
                loading={busyActionId === `evidence:${selectedMissionClaim.id}`}
                disabled={selectedMissionClaim.status === "rewarded"}
                onPress={() => void handleSubmitEvidence(selectedMissionClaim)}
              />
            </View>
          )}
        </RealmCard>
      </DetailSheet>
    </ScreenShell>
  );
}
