import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  ErrorPanel,
  MetricTile,
  PrimaryAction,
  RealmCard,
  SearchInput,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import { fetchRealmEventsNative } from "@/src/features/events/eventsService";
import { fetchMissionsNative } from "@/src/features/missions/missionsService";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";

export default function HomeScreen() {
  const [usernameInput, setUsernameInput] = useState("");
  const { player, isLoading, errorMessage, connectByUsername, clearError } = useSessionStore();
  const eventsQuery = useQuery({ queryKey: ["realm-events", "home"], queryFn: fetchRealmEventsNative });
  const missionsQuery = useQuery({ queryKey: ["realm-missions", "home"], queryFn: fetchMissionsNative });
  const activeEvents = (eventsQuery.data?.events ?? []).filter((event) => event.status !== "finished");
  const openMissions = (missionsQuery.data?.missions ?? []).filter((mission) => mission.status !== "closed");

  async function handleConnect() {
    clearError();
    await connectByUsername(usernameInput);
  }

  return (
    <ScreenShell
      title="Kingdoom Native"
      subtitle="Perfil, oro y pulso del reino"
      rightSlot={
        player ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              backgroundColor: "rgba(17,16,13,0.86)",
              padding: 10,
              alignItems: "center",
              minWidth: 70,
            }}
          >
            <MaterialIcons name="account-circle" size={22} color={MOBILE_THEME.gold} />
            <Text style={{ color: MOBILE_THEME.text, fontSize: 11, fontWeight: "900", marginTop: 4 }} numberOfLines={1}>
              {player.username}
            </Text>
          </View>
        ) : null
      }
    >
      <StaggerItem index={0}>
        <RealmCard tone={player ? "teal" : "gold"}>
          <SectionHeader eyebrow="Sesion" title={player ? "Perfil conectado" : "Conecta tu perfil"} />
          {player ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>{player.username}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <MetricTile label="ORO" value={player.gold} icon="account-balance-wallet" />
                <MetricTile label="ACTIVIDAD" value={activeEvents.length + openMissions.length} icon="local-fire-department" />
              </View>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <SearchInput value={usernameInput} onChangeText={setUsernameInput} placeholder="Nombre registrado" />
              <PrimaryAction
                label="Conectar"
                icon="login"
                loading={isLoading}
                disabled={usernameInput.trim().length === 0}
                onPress={() => void handleConnect()}
              />
            </View>
          )}
        </RealmCard>
      </StaggerItem>

      {errorMessage ? (
        <StaggerItem index={1}>
          <ErrorPanel message={errorMessage} />
        </StaggerItem>
      ) : null}

      <StaggerItem index={2}>
        <RealmCard>
          <SectionHeader
            eyebrow="Reino"
            title="Actividad abierta"
            trailing={eventsQuery.isLoading || missionsQuery.isLoading ? <ActivityIndicator color={MOBILE_THEME.gold} /> : null}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MetricTile label="EVENTOS" value={activeEvents.length} icon="event" />
            <MetricTile label="MISIONES" value={openMissions.length} icon="flag" />
          </View>
        </RealmCard>
      </StaggerItem>

      {eventsQuery.data?.errorMessage || missionsQuery.data?.errorMessage ? (
        <StaggerItem index={3}>
          <ErrorPanel
            message={eventsQuery.data?.errorMessage || missionsQuery.data?.errorMessage || ""}
            onRetry={() => {
              void eventsQuery.refetch();
              void missionsQuery.refetch();
            }}
          />
        </StaggerItem>
      ) : null}
    </ScreenShell>
  );
}
