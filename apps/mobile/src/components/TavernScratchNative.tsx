import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";
import { MetricTile, PrimaryAction, RealmCard, SectionHeader } from "./KingdoomUI";
import {
  buildScratchDateKey,
  getDailyScratchConfig,
  NORMAL_MAX_PRIZE,
  NORMAL_MIN_PRIZE,
  VIP_JACKPOT_CHANCE,
  VIP_JACKPOT_PRIZE,
} from "../../../../src/utils/scratchUtils";

function randomPrize() {
  return Math.floor(Math.random() * (NORMAL_MAX_PRIZE - NORMAL_MIN_PRIZE + 1)) + NORMAL_MIN_PRIZE;
}

export function TavernScratchNative() {
  const player = useSessionStore((state) => state.player);
  const addGold = useSessionStore((state) => state.addGold);
  
  const [quantity, setQuantity] = useState("1");
  const [isScratching, setIsScratching] = useState(false);
  const [dailyGrossWins, setDailyGrossWins] = useState(0);
  const [message, setMessage] = useState("");
  const [lastResult, setLastResult] = useState<{
    totalPrize: number;
    winningTickets: number;
    losingTickets: number;
    jackpotWins: number;
    refundedGold: number;
    cost: number;
  } | null>(null);

  const config = getDailyScratchConfig();
  const SCRATCH_KEY = player ? `kingdoom.native.scratch.${player.id}.${config.dateKey}` : "";

  useEffect(() => {
    async function loadDailyWins() {
      if (!SCRATCH_KEY) return;
      try {
        const stored = await AsyncStorage.getItem(SCRATCH_KEY);
        if (stored) {
          setDailyGrossWins(Number(stored));
        }
      } catch {
        // fail silent
      }
    }
    loadDailyWins();
  }, [SCRATCH_KEY]);

  if (!player) {
    return (
      <RealmCard>
        <Text style={{ color: MOBILE_THEME.mutedText }}>Conecta tu cuenta para jugar.</Text>
      </RealmCard>
    );
  }

  const handleScratch = async () => {
    if (isScratching) return;

    const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    const totalCost = config.cost * safeQuantity;

    if (player.gold < totalCost) {
      setMessage("No tienes suficiente oro.");
      return;
    }

    setIsScratching(true);
    setMessage("");
    setLastResult(null);

    // Give it a tiny delay for "feel"
    await new Promise((res) => setTimeout(res, 600));

    let currentGrossWins = dailyGrossWins;
    let usedTickets = 0;
    let winningTickets = 0;
    let jackpotWins = 0;
    let totalPrize = 0;

    for (let index = 0; index < safeQuantity; index += 1) {
      if (currentGrossWins >= config.maxDailyLimit) {
        break;
      }

      usedTickets += 1;
      let ticketPrize = 0;

      if (Math.random() < VIP_JACKPOT_CHANCE) {
        ticketPrize = VIP_JACKPOT_PRIZE;
        jackpotWins += 1;
        winningTickets += 1;
      } else if (Math.random() < config.winChance) {
        ticketPrize = randomPrize();
        winningTickets += 1;
      }

      ticketPrize = Math.min(ticketPrize, Math.max(0, config.maxDailyLimit - currentGrossWins));
      totalPrize += ticketPrize;
      currentGrossWins += ticketPrize;

      if (currentGrossWins >= config.maxDailyLimit) {
        break;
      }
    }

    const refundedTickets = Math.max(0, safeQuantity - usedTickets);
    const losingTickets = Math.max(0, usedTickets - winningTickets);
    let refundedGold = refundedTickets * config.cost;

    if (losingTickets > 0) {
      if (safeQuantity > 50) {
        if (Math.random() < 0.5) {
          refundedGold += losingTickets * config.cost;
        }
      } else {
        refundedGold += Math.floor(losingTickets * config.cost * 0.5);
      }
    }

    const netDelta = totalPrize + refundedGold - totalCost;
    const success = await addGold(netDelta);

    if (success) {
      try {
        await AsyncStorage.setItem(SCRATCH_KEY, String(currentGrossWins));
        setDailyGrossWins(currentGrossWins);
      } catch {
        // fail silent
      }
      setLastResult({
        totalPrize,
        winningTickets,
        losingTickets,
        jackpotWins,
        refundedGold,
        cost: totalCost,
      });
    } else {
      setMessage("Error al sincronizar tu oro. Intenta de nuevo.");
    }

    setIsScratching(false);
  };

  const isLimitReached = dailyGrossWins >= config.maxDailyLimit;

  return (
    <View style={{ gap: 16 }}>
      <SectionHeader
        title="Rasca y Gana"
        trailing={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialIcons name="casino" size={14} color={MOBILE_THEME.gold} />
            <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
              {Math.floor((dailyGrossWins / config.maxDailyLimit) * 100)}% límite
            </Text>
          </View>
        }
      />

      <RealmCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <MetricTile
            label="Precio/Ticket"
            value={config.cost.toString()}
            icon="payments"
          />
          <MetricTile
            label="Premio Max"
            value={VIP_JACKPOT_PRIZE.toString()}
            icon="stars"
          />
        </View>

        {!isLimitReached ? (
          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: MOBILE_THEME.surfaceSoft,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: MOBILE_THEME.mutedText, marginRight: 8 }}>Cantidad:</Text>
              <TextInput
                style={{
                  flex: 1,
                  color: MOBILE_THEME.text,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
                keyboardType="numeric"
                value={quantity}
                onChangeText={(val) => setQuantity(val.replace(/[^0-9]/g, ""))}
                editable={!isScratching}
                selectTextOnFocus
              />
              <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
                Costo total: {Number(quantity || 0) * config.cost} 🪙
              </Text>
            </View>

            <PrimaryAction
              label={isScratching ? "Rascando..." : "Comprar y Rascar"}
              onPress={handleScratch}
              disabled={isScratching || !quantity || Number(quantity) < 1}
            />
            {isScratching && (
              <ActivityIndicator size="small" color={MOBILE_THEME.gold} style={{ marginTop: 8 }} />
            )}
            {!!message && (
              <Text style={{ color: MOBILE_THEME.danger, textAlign: "center", fontSize: 14 }}>
                {message}
              </Text>
            )}
          </View>
        ) : (
          <View style={{ padding: 16, backgroundColor: MOBILE_THEME.surfaceSoft, borderRadius: 12 }}>
            <Text style={{ color: MOBILE_THEME.text, textAlign: "center" }}>
              Has alcanzado el límite diario de ganancias. ¡Vuelve mañana!
            </Text>
          </View>
        )}
      </RealmCard>

      {lastResult && (
        <Animated.View
          entering={FadeInDown}
          layout={LinearTransition}
        >
          <RealmCard>
            <View style={{ alignItems: "center", gap: 8, paddingVertical: 8 }}>
              <MaterialIcons
                name={lastResult.totalPrize > lastResult.cost ? "emoji-events" : "mood-bad"}
                size={32}
                color={lastResult.totalPrize > lastResult.cost ? MOBILE_THEME.gold : MOBILE_THEME.mutedText}
              />
              <Text style={{ color: MOBILE_THEME.text, fontSize: 18, fontWeight: "bold" }}>
                Resultado de {lastResult.winningTickets + lastResult.losingTickets} tickets
              </Text>
              
              <View style={{ width: "100%", gap: 4, marginTop: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: MOBILE_THEME.mutedText }}>Premio Total:</Text>
                  <Text style={{ color: MOBILE_THEME.gold, fontWeight: "bold" }}>+{lastResult.totalPrize} 🪙</Text>
                </View>
                {lastResult.refundedGold > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: MOBILE_THEME.mutedText }}>Reembolsos (perdedores):</Text>
                    <Text style={{ color: MOBILE_THEME.goldBright, fontWeight: "bold" }}>+{lastResult.refundedGold} 🪙</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: MOBILE_THEME.mutedText }}>Costo Tanda:</Text>
                  <Text style={{ color: MOBILE_THEME.danger }}>-{lastResult.cost} 🪙</Text>
                </View>
                
                <View style={{ height: 1, backgroundColor: MOBILE_THEME.border, marginVertical: 4 }} />
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: MOBILE_THEME.text, fontWeight: "bold" }}>Balance Neto:</Text>
                  <Text style={{ 
                    color: (lastResult.totalPrize + lastResult.refundedGold - lastResult.cost) >= 0 ? MOBILE_THEME.gold : MOBILE_THEME.danger, 
                    fontWeight: "bold",
                    fontSize: 16 
                  }}>
                    {(lastResult.totalPrize + lastResult.refundedGold - lastResult.cost) >= 0 ? "+" : ""}
                    {lastResult.totalPrize + lastResult.refundedGold - lastResult.cost} 🪙
                  </Text>
                </View>
              </View>

              {lastResult.jackpotWins > 0 && (
                <View style={{ backgroundColor: `${MOBILE_THEME.gold}20`, padding: 8, borderRadius: 8, width: "100%", marginTop: 8 }}>
                  <Text style={{ color: MOBILE_THEME.gold, textAlign: "center", fontWeight: "bold" }}>
                    ¡GANASTE {lastResult.jackpotWins} JACKPOT(S) VIP!
                  </Text>
                </View>
              )}
            </View>
          </RealmCard>
        </Animated.View>
      )}
    </View>
  );
}
