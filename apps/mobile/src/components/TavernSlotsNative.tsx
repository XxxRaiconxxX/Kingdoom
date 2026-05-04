import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";
import { MetricTile, PrimaryAction, RealmCard, SectionHeader } from "./KingdoomUI";

type SlotPhase = "idle" | "spinning" | "resolved";
type SlotSymbolId = "crown" | "gem" | "sword" | "potion" | "shield" | "skull";

type SlotSymbol = {
  id: SlotSymbolId;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  background: string;
};

type SlotOutcome = {
  reels: [SlotSymbolId, SlotSymbolId, SlotSymbolId];
  multiplier: number;
};

const SYMBOLS: SlotSymbol[] = [
  { id: "crown", label: "Corona", icon: "workspace-premium", color: "#140d00", background: "#f0b32f" },
  { id: "gem", label: "Gema", icon: "diamond", color: "#02110e", background: "#31d1b3" },
  { id: "sword", label: "Espada", icon: "hardware", color: "#080706", background: "#e8e0cf" },
  { id: "potion", label: "Pocion", icon: "science", color: "#12040b", background: "#f472b6" },
  { id: "shield", label: "Escudo", icon: "shield", color: "#031006", background: "#42b883" },
  { id: "skull", label: "Marca", icon: "dangerous", color: "#f4f1e8", background: "#2a2620" },
];

const SYMBOL_IDS = SYMBOLS.map((symbol) => symbol.id);
const INITIAL_REELS: [SlotSymbolId, SlotSymbolId, SlotSymbolId] = ["sword", "crown", "shield"];
const BET_PRESETS = [100, 500, 1000];
const MAX_DAILY_SLOTS_NET_WIN = 350000;
const REEL_STOP_DELAYS = [760, 1100, 1460];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function randomSymbol(excluded: SlotSymbolId[] = []) {
  const available = SYMBOL_IDS.filter((symbol) => !excluded.includes(symbol));
  return available[Math.floor(Math.random() * available.length)] ?? "shield";
}

function getSymbol(id: SlotSymbolId) {
  return SYMBOLS.find((symbol) => symbol.id === id) ?? SYMBOLS[0];
}

function buildStrip(center: SlotSymbolId): [SlotSymbolId, SlotSymbolId, SlotSymbolId] {
  return [randomSymbol([center]), center, randomSymbol([center])];
}

function buildLosingReels(): [SlotSymbolId, SlotSymbolId, SlotSymbolId] {
  const first = randomSymbol();
  const second = randomSymbol([first]);
  const third = randomSymbol([first, second]);
  return [first, second, third];
}

function buildPairReels(): [SlotSymbolId, SlotSymbolId, SlotSymbolId] {
  const pair = randomSymbol(["skull"]);
  const odd = randomSymbol([pair]);
  const shuffled = [pair, pair, odd].sort(() => Math.random() - 0.5);
  return shuffled as [SlotSymbolId, SlotSymbolId, SlotSymbolId];
}

function resolveMultiplier(reels: [SlotSymbolId, SlotSymbolId, SlotSymbolId]) {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === "crown") return 12;
    if (a === "gem") return 8;
    if (a === "sword") return 5;
    if (a === "potion") return 3;
    if (a === "shield") return 2;
  }

  const pair = a === b || a === c || b === c;
  return pair && !reels.every((symbol) => symbol === "skull") ? 1.25 : 0;
}

function generateOutcome(): SlotOutcome {
  const roll = Math.random();
  let reels: [SlotSymbolId, SlotSymbolId, SlotSymbolId];

  if (roll < 0.008) reels = ["crown", "crown", "crown"];
  else if (roll < 0.02) reels = ["gem", "gem", "gem"];
  else if (roll < 0.045) reels = ["sword", "sword", "sword"];
  else if (roll < 0.085) reels = ["potion", "potion", "potion"];
  else if (roll < 0.145) reels = ["shield", "shield", "shield"];
  else if (roll < 0.325) reels = buildPairReels();
  else reels = buildLosingReels();

  return { reels, multiplier: resolveMultiplier(reels) };
}

async function getDailyWins(playerId: string, key: string) {
  const stored = await AsyncStorage.getItem(`kingdoom.native.slots.${playerId}.${key}`);
  return stored ? Number.parseInt(stored, 10) || 0 : 0;
}

async function setDailyWins(playerId: string, key: string, amount: number) {
  await AsyncStorage.setItem(`kingdoom.native.slots.${playerId}.${key}`, String(Math.max(0, Math.floor(amount))));
}

export function TavernSlotsNative() {
  const { player, updateGold, refreshGold } = useSessionStore();
  const day = useMemo(() => dateKey(), []);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pulse = useSharedValue(0);
  const [phase, setPhase] = useState<SlotPhase>("idle");
  const [bet, setBet] = useState(100);
  const [dailyWins, setDailyWinsState] = useState(0);
  const [lastPrize, setLastPrize] = useState(0);
  const [message, setMessage] = useState("Tres carretes. La apuesta se pierde si no hay premio.");
  const [visibleReels, setVisibleReels] = useState<[SlotSymbolId[], SlotSymbolId[], SlotSymbolId[]]>([
    buildStrip(INITIAL_REELS[0]),
    buildStrip(INITIAL_REELS[1]),
    buildStrip(INITIAL_REELS[2]),
  ]);

  const balance = player?.gold ?? 0;
  const safeBet = clamp(Math.floor(Number.isFinite(bet) ? bet : 0), 1, Math.max(1, balance));
  const remainingDaily = Math.max(0, MAX_DAILY_SLOTS_NET_WIN - dailyWins);
  const limitReached = dailyWins >= MAX_DAILY_SLOTS_NET_WIN;
  const canSpin = Boolean(player && phase !== "spinning" && safeBet <= balance && !limitReached);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.26 + pulse.value * 0.34,
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }));

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

  async function spin() {
    if (!player || !canSpin) {
      setMessage(limitReached ? "Limite diario alcanzado." : "Conecta perfil o revisa tu oro.");
      return;
    }

    const lockedBet = safeBet;
    const outcome = generateOutcome();
    setPhase("spinning");
    setLastPrize(0);
    setMessage("Los sellos giran...");
    pulse.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) })
    );

    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const spinInterval = setInterval(() => {
      setVisibleReels([
        buildStrip(randomSymbol()),
        buildStrip(randomSymbol()),
        buildStrip(randomSymbol()),
      ]);
    }, 88);

    REEL_STOP_DELAYS.forEach((delay, reelIndex) => {
      const timer = setTimeout(() => {
        setVisibleReels((current) => {
          const next = [...current] as [SlotSymbolId[], SlotSymbolId[], SlotSymbolId[]];
          next[reelIndex] = buildStrip(outcome.reels[reelIndex]);
          return next;
        });
      }, delay);
      timerRefs.current.push(timer);
    });

    const finalTimer = setTimeout(async () => {
      clearInterval(spinInterval);
      setVisibleReels([
        buildStrip(outcome.reels[0]),
        buildStrip(outcome.reels[1]),
        buildStrip(outcome.reels[2]),
      ]);

      const rawPayout = Math.floor(lockedBet * outcome.multiplier);
      const rawNetWin = Math.max(0, rawPayout - lockedBet);
      const cappedNetWin = Math.min(rawNetWin, remainingDaily);
      const finalPayout = outcome.multiplier > 0 ? lockedBet + cappedNetWin : 0;
      const nextGold = balance - lockedBet + finalPayout;
      const saved = await updateGold(nextGold);

      if (!saved) {
        setMessage("No se pudo guardar el oro. Refresca e intenta otra vez.");
        setPhase("idle");
        return;
      }

      if (cappedNetWin > 0) {
        const nextDailyWins = dailyWins + cappedNetWin;
        await setDailyWins(player.id, day, nextDailyWins);
        setDailyWinsState(nextDailyWins);
      }

      setLastPrize(finalPayout);
      setMessage(
        outcome.multiplier > 0
          ? `Premio x${outcome.multiplier}. Cobras ${finalPayout.toLocaleString("es-PY")} oro.`
          : "Sin premio. La apuesta queda en la maquina."
      );
      setPhase("resolved");
    }, 1720);
    timerRefs.current.push(finalTimer);
  }

  return (
    <RealmCard tone="teal">
      <View style={{ gap: 12 }}>
        <SectionHeader
          eyebrow="Taberna"
          title="Slots del Tesoro"
          trailing={
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(49,209,179,0.3)",
                paddingHorizontal: 10,
                paddingVertical: 7,
                backgroundColor: "rgba(49,209,179,0.08)",
              }}
            >
              <Text style={{ color: MOBILE_THEME.teal, fontSize: 10, fontWeight: "900" }}>x12 max</Text>
            </View>
          }
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricTile label="PREMIO" value={lastPrize} icon="emoji-events" />
          <MetricTile label="LIMITE" value={`${Math.floor((dailyWins / MAX_DAILY_SLOTS_NET_WIN) * 100)}%`} icon="speed" />
        </View>

        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(49,209,179,0.25)",
            backgroundColor: "#050706",
            padding: 10,
            overflow: "hidden",
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: -20,
                right: -20,
                top: "48%",
                height: 3,
                backgroundColor: MOBILE_THEME.teal,
                shadowColor: MOBILE_THEME.teal,
                shadowOpacity: 0.8,
                shadowRadius: 12,
              },
              glowStyle,
            ]}
          />
          <View style={{ flexDirection: "row", gap: 8, height: 178 }}>
            {visibleReels.map((strip, index) => (
              <Reel key={index} symbols={strip} spinning={phase === "spinning"} index={index} />
            ))}
          </View>
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
          <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 18, fontSize: 12 }}>{message}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={bet === 0 ? "" : String(bet)}
            onChangeText={setBetFromText}
            editable={phase !== "spinning"}
            inputMode="numeric"
            keyboardType="number-pad"
            placeholder="Apuesta"
            placeholderTextColor={MOBILE_THEME.dimText}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(49,209,179,0.3)",
              backgroundColor: "#020202",
              color: MOBILE_THEME.text,
              paddingHorizontal: 12,
              fontSize: 16,
              fontWeight: "900",
            }}
          />
          <View style={{ flex: 1.1 }}>
            <PrimaryAction label="Girar" icon="casino" loading={phase === "spinning"} disabled={!canSpin} onPress={() => void spin()} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {BET_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => setBet(clamp(preset, 1, Math.max(1, balance)))}
              disabled={phase === "spinning"}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 38,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: pressed ? "rgba(240,179,47,0.12)" : "rgba(5,5,4,0.62)",
                alignItems: "center",
                justifyContent: "center",
                opacity: phase === "spinning" ? 0.5 : 1,
              })}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, fontWeight: "900" }}>{preset}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setBet(Math.max(1, balance))}
            disabled={phase === "spinning"}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 38,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(240,179,47,0.35)",
              backgroundColor: pressed ? "rgba(240,179,47,0.18)" : "rgba(240,179,47,0.08)",
              alignItems: "center",
              justifyContent: "center",
              opacity: phase === "spinning" ? 0.5 : 1,
            })}
          >
            <Text style={{ color: MOBILE_THEME.gold, fontSize: 12, fontWeight: "900" }}>ALL IN</Text>
          </Pressable>
        </View>

        <View style={{ gap: 7 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "900" }}>GANANCIA DIARIA</Text>
            <Text style={{ color: MOBILE_THEME.teal, fontSize: 10, fontWeight: "900" }}>
              {dailyWins.toLocaleString("es-PY")} / {MAX_DAILY_SLOTS_NET_WIN.toLocaleString("es-PY")}
            </Text>
          </View>
          <View style={{ height: 7, borderRadius: 999, backgroundColor: "#020202", overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${clamp((dailyWins / MAX_DAILY_SLOTS_NET_WIN) * 100, 0, 100)}%`,
                borderRadius: 999,
                backgroundColor: MOBILE_THEME.teal,
              }}
            />
          </View>
          <PrimaryAction label="Refrescar oro" icon="refresh" variant="ghost" onPress={() => void handleRefresh()} />
        </View>
      </View>
    </RealmCard>
  );
}

function Reel({ symbols, spinning, index }: { symbols: SlotSymbolId[]; spinning: boolean; index: number }) {
  return (
    <Animated.View
      entering={SlideInDown.delay(index * 80).duration(360)}
      layout={LinearTransition.duration(160)}
      style={{
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: spinning ? "rgba(49,209,179,0.44)" : MOBILE_THEME.border,
        backgroundColor: "rgba(10,10,9,0.94)",
        padding: 6,
        gap: 6,
        shadowColor: spinning ? MOBILE_THEME.teal : MOBILE_THEME.black,
        shadowOpacity: spinning ? 0.2 : 0.08,
        shadowRadius: 14,
      }}
    >
      {symbols.map((symbolId, symbolIndex) => (
        <SymbolTile
          key={`${symbolId}-${symbolIndex}-${index}`}
          symbolId={symbolId}
          center={symbolIndex === 1}
          muted={symbolIndex !== 1}
        />
      ))}
    </Animated.View>
  );
}

function SymbolTile({ symbolId, center, muted }: { symbolId: SlotSymbolId; center: boolean; muted: boolean }) {
  const symbol = getSymbol(symbolId);

  return (
    <Animated.View
      entering={FadeInDown.duration(220).easing(Easing.bezier(0.22, 1, 0.36, 1))}
      layout={LinearTransition.duration(120)}
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: center ? "rgba(244,241,232,0.18)" : "rgba(255,255,255,0.04)",
        backgroundColor: center ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.34)",
        alignItems: "center",
        justifyContent: "center",
        opacity: muted ? 0.46 : 1,
        gap: 4,
      }}
    >
      <View
        style={{
          width: center ? 39 : 30,
          height: center ? 39 : 30,
          borderRadius: 12,
          backgroundColor: symbol.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name={symbol.icon} size={center ? 24 : 18} color={symbol.color} />
      </View>
      {center ? (
        <Text numberOfLines={1} style={{ color: MOBILE_THEME.text, fontSize: 9, fontWeight: "900" }}>
          {symbol.label}
        </Text>
      ) : null}
    </Animated.View>
  );
}
