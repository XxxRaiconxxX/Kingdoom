import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View, ScrollView } from "react-native";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";
import { MetricTile, PrimaryAction, RealmCard, SectionHeader } from "./KingdoomUI";
import {
  createHorseField,
  simulateHorseRace,
  HorseProfile,
  HorseRaceResult,
  HorseRaceFrame,
  HORSE_RACE_DURATION_MS,
  HORSE_RACE_FRAME_MS,
} from "@/src/utils/horseRaceUtils";

type RacePhase = "idle" | "racing" | "finished";
const MAX_DAILY_HORSE_NET_WIN = 350000;
const BET_PRESETS = [100, 500, 1000];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function getDailyWins(playerId: string, key: string) {
  const stored = await AsyncStorage.getItem(`kingdoom.native.horse.${playerId}.${key}`);
  return stored ? Number.parseInt(stored, 10) || 0 : 0;
}

async function setDailyWins(playerId: string, key: string, amount: number) {
  await AsyncStorage.setItem(`kingdoom.native.horse.${playerId}.${key}`, String(Math.max(0, Math.floor(amount))));
}

export function TavernHorseRaceNative() {
  const { player, updateGold, refreshGold } = useSessionStore();
  const day = useMemo(() => dateKey(), []);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<RacePhase>("idle");
  const [bet, setBet] = useState(100);
  const [dailyWins, setDailyWinsState] = useState(0);
  const [lastPrize, setLastPrize] = useState(0);
  const [message, setMessage] = useState("Selecciona tu corcel y haz tu apuesta.");

  const [horses, setHorses] = useState<HorseProfile[]>(() => createHorseField());
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);

  const [raceResult, setRaceResult] = useState<HorseRaceResult | null>(null);
  const [currentFrame, setCurrentFrame] = useState<HorseRaceFrame | null>(null);

  const balance = player?.gold ?? 0;
  const safeBet = clamp(Math.floor(Number.isFinite(bet) ? bet : 0), 1, Math.max(1, balance));
  const remainingDaily = Math.max(0, MAX_DAILY_HORSE_NET_WIN - dailyWins);
  const limitReached = dailyWins >= MAX_DAILY_HORSE_NET_WIN;

  const selectedHorse = horses.find((h) => h.id === selectedHorseId);
  const canStart = Boolean(player && phase === "idle" && selectedHorse && safeBet <= balance && !limitReached);

  useEffect(() => {
    if (!player?.id) {
      setDailyWinsState(0);
      return;
    }
    void getDailyWins(player.id, day).then(setDailyWinsState);
  }, [day, player?.id]);

  useEffect(
    () => () => {
      timerRefs.current.forEach(clearTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  function setBetFromText(value: string) {
    const raw = value.replace(/[^0-9]/g, "");
    setBet(raw ? Number.parseInt(raw, 10) || 0 : 0);
  }

  async function handleRefresh() {
    await refreshGold();
    if (player?.id) {
      setDailyWinsState(await getDailyWins(player.id, day));
    }
  }

  function resetRace() {
    setHorses(createHorseField());
    setSelectedHorseId(null);
    setPhase("idle");
    setRaceResult(null);
    setCurrentFrame(null);
    setMessage("Selecciona tu corcel y haz tu apuesta.");
  }

  async function startRace() {
    if (!player || !canStart || !selectedHorse) {
      setMessage(limitReached ? "Limite diario alcanzado." : "Revisa tu oro o caballo.");
      return;
    }

    const lockedBet = safeBet;
    const result = simulateHorseRace(horses);
    setRaceResult(result);
    setPhase("racing");
    setLastPrize(0);
    setMessage("¡Y arranca la carrera!");

    let elapsed = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Animation tick
    intervalRef.current = setInterval(() => {
      elapsed += HORSE_RACE_FRAME_MS * 1.5; // Slightly faster animation for native
      if (elapsed >= result.durationMs) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        void finishRace(result, lockedBet);
      } else {
        const frameIndex = Math.min(
          result.frames.length - 1,
          Math.floor(elapsed / HORSE_RACE_FRAME_MS)
        );
        setCurrentFrame(result.frames[frameIndex]);
      }
    }, HORSE_RACE_FRAME_MS);
  }

  async function finishRace(result: HorseRaceResult, lockedBet: number) {
    setCurrentFrame(result.frames[result.frames.length - 1]);

    const won = result.winnerId === selectedHorseId;
    const rawPayout = won ? Math.floor(lockedBet * (selectedHorse?.odds ?? 1)) : 0;
    const rawNetWin = Math.max(0, rawPayout - lockedBet);
    const cappedNetWin = Math.min(rawNetWin, remainingDaily);
    const finalPayout = won ? lockedBet + cappedNetWin : 0;

    const nextGold = balance - lockedBet + finalPayout;
    const saved = await updateGold(nextGold);

    if (!saved) {
      setMessage("Error sincronizando oro. Refresca e intenta de nuevo.");
      setPhase("idle");
      return;
    }

    if (cappedNetWin > 0 && player?.id) {
      const nextDailyWins = dailyWins + cappedNetWin;
      await setDailyWins(player.id, day, nextDailyWins);
      setDailyWinsState(nextDailyWins);
    }

    setLastPrize(finalPayout);
    setMessage(
      won
        ? `¡Victoria de ${selectedHorse?.name}! Cobras ${finalPayout.toLocaleString("es-PY")} oro.`
        : "Perdiste. Tu caballo no llego primero."
    );
    setPhase("finished");
  }

  return (
    <RealmCard tone="default">
      <View style={{ gap: 12 }}>
        <SectionHeader
          eyebrow="Hipodromo"
          title="Carrera de Caballos"
          trailing={
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(220,190,100,0.3)",
                paddingHorizontal: 10,
                paddingVertical: 7,
                backgroundColor: "rgba(220,190,100,0.08)",
              }}
            >
              <Text style={{ color: MOBILE_THEME.gold, fontSize: 10, fontWeight: "900" }}>
                PISTA OFFLINE
              </Text>
            </View>
          }
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricTile label="PREMIO" value={lastPrize} icon="emoji-events" />
          <MetricTile
            label="LIMITE"
            value={`${Math.floor((dailyWins / MAX_DAILY_HORSE_NET_WIN) * 100)}%`}
            icon="speed"
          />
        </View>

        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: "#050706",
            padding: 10,
            overflow: "hidden",
            gap: 4,
          }}
        >
          {horses.map((horse) => {
            const progress = currentFrame ? currentFrame.positions[horse.id] ?? 0 : 0;
            const isWinner = phase === "finished" && raceResult?.winnerId === horse.id;
            
            return (
              <View
                key={horse.id}
                style={{
                  height: 32,
                  flexDirection: "row",
                  alignItems: "center",
                  opacity: phase === "finished" && !isWinner ? 0.6 : 1,
                }}
              >
                <View style={{ width: 20, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10 }}>{horse.number}</Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    marginHorizontal: 4,
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      left: `${progress * 90}%`,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: horse.coat,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: horse.accent,
                    }}
                  >
                    {isWinner && <MaterialIcons name="star" size={14} color="#000" />}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: "rgba(5,5,4,0.58)",
            padding: 10,
          }}
        >
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 18, fontSize: 12, marginBottom: 8 }}>
            {message}
          </Text>

          {phase === "idle" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {horses.map((horse) => {
                  const isSelected = selectedHorseId === horse.id;
                  return (
                    <Pressable
                      key={horse.id}
                      onPress={() => setSelectedHorseId(horse.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isSelected ? MOBILE_THEME.gold : MOBILE_THEME.border,
                        backgroundColor: isSelected ? "rgba(240,179,47,0.15)" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? MOBILE_THEME.gold : MOBILE_THEME.text,
                          fontWeight: "bold",
                          fontSize: 13,
                        }}
                      >
                        {horse.number}. {horse.name}
                      </Text>
                      <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11 }}>
                        Cuota: {horse.odds}x
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {selectedHorse && phase === "idle" && (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
              <Text style={{ color: MOBILE_THEME.text, fontSize: 12 }}>
                Has seleccionado a{" "}
                <Text style={{ color: selectedHorse.coat, fontWeight: "bold" }}>{selectedHorse.name}</Text>. Si gana
                recibiras x{selectedHorse.odds} de tu apuesta.
              </Text>
            </View>
          )}
        </View>

        {phase === "idle" && (
          <>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={bet === 0 ? "" : String(bet)}
                onChangeText={setBetFromText}
                editable={phase === "idle"}
                inputMode="numeric"
                keyboardType="number-pad"
                placeholder="Apuesta"
                placeholderTextColor={MOBILE_THEME.dimText}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(240,179,47,0.3)",
                  backgroundColor: "#020202",
                  color: MOBILE_THEME.text,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  fontWeight: "900",
                }}
              />
              <View style={{ flex: 1.1 }}>
                <PrimaryAction
                  label="Correr"
                  icon="flag"
                  disabled={!canStart}
                  onPress={() => void startRace()}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {BET_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setBet(clamp(preset, 1, Math.max(1, balance)))}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 38,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: MOBILE_THEME.border,
                    backgroundColor: pressed ? "rgba(240,179,47,0.12)" : "rgba(5,5,4,0.62)",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, fontWeight: "900" }}>
                    {preset}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setBet(Math.max(1, balance))}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 38,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(240,179,47,0.35)",
                  backgroundColor: pressed ? "rgba(240,179,47,0.18)" : "rgba(240,179,47,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text style={{ color: MOBILE_THEME.gold, fontSize: 12, fontWeight: "900" }}>ALL IN</Text>
              </Pressable>
            </View>
          </>
        )}

        {phase === "finished" && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <PrimaryAction label="Nueva Carrera" icon="refresh" onPress={resetRace} />
            </View>
          </View>
        )}

        <View style={{ gap: 7 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "900" }}>
              GANANCIA DIARIA
            </Text>
            <Text style={{ color: MOBILE_THEME.gold, fontSize: 10, fontWeight: "900" }}>
              {dailyWins.toLocaleString("es-PY")} / {MAX_DAILY_HORSE_NET_WIN.toLocaleString("es-PY")}
            </Text>
          </View>
          <View
            style={{
              height: 7,
              borderRadius: 999,
              backgroundColor: "#020202",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${clamp((dailyWins / MAX_DAILY_HORSE_NET_WIN) * 100, 0, 100)}%`,
                borderRadius: 999,
                backgroundColor: MOBILE_THEME.gold,
              }}
            />
          </View>
          <PrimaryAction
            label="Refrescar oro"
            icon="refresh"
            variant="ghost"
            onPress={() => void handleRefresh()}
          />
        </View>
      </View>
    </RealmCard>
  );
}
