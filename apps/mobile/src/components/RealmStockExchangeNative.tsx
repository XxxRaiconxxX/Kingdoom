import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import {
  REALM_EXCHANGE_ASSETS,
  REALM_EXCHANGE_MAX_STAKE,
  REALM_EXCHANGE_MIN_STAKE,
  REALM_EXCHANGE_PRICE_CEILING,
  REALM_EXCHANGE_TRADE_LOT,
} from "@/src/features/realmExchange/realmExchangeData";
import {
  buildAssetHistory,
  getAssetDelta,
  getAssetPriceAt,
  getNextTickAt,
  resolvePrediction,
} from "@/src/features/realmExchange/realmExchangeSimulation";
import {
  buyAssetShares,
  createEmptyExchangeState,
  findActivePrediction,
  findPosition,
  loadExchangeState,
  openAssetPrediction,
  saveExchangeState,
  sellAssetShares,
} from "@/src/features/realmExchange/realmExchangeStorage";
import type {
  RealmExchangeAsset,
  RealmExchangePlayerState,
  RealmExchangePrediction,
} from "@/src/features/realmExchange/realmExchangeTypes";
import { useSessionStore } from "@/src/features/session/sessionStore";
import { MOBILE_THEME } from "@/src/theme/colors";
import { NoticeBanner, Pill, PrimaryAction, RealmCard, SectionHeader } from "./KingdoomUI";

type Feedback = {
  type: "success" | "error";
  message: string;
};

function formatGold(value: number) {
  return new Intl.NumberFormat("es-PY").format(Math.max(0, Math.floor(value)));
}

function formatClock(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getAssetById(assetId: string): RealmExchangeAsset {
  return REALM_EXCHANGE_ASSETS.find((asset) => asset.id === assetId) ?? REALM_EXCHANGE_ASSETS[0];
}

function MiniChart({ asset, now }: { asset: RealmExchangeAsset; now: number }) {
  const points = buildAssetHistory(asset, now, 14);
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);
  const chartWidth = 256;
  const chartHeight = 128;
  const coords = points.map((point, index) => ({
    x: 10 + (index / Math.max(1, points.length - 1)) * (chartWidth - 20),
    y: 12 + (1 - (point.price - min) / range) * (chartHeight - 24),
  }));

  return (
    <View
      style={{
        height: chartHeight,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(49,209,179,0.18)",
        backgroundColor: "rgba(1,12,12,0.78)",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={`grid-${index}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 18 + index * 18,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
      ))}
      {coords.slice(1).map((point, index) => {
        const previous = coords[index];
        const dx = point.x - previous.x;
        const dy = point.y - previous.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = `${Math.atan2(dy, dx)}rad`;

        return (
          <Animated.View
            key={`line-${index}`}
            entering={FadeInDown.delay(index * 24).duration(260).easing(Easing.out(Easing.cubic))}
            style={{
              position: "absolute",
              left: previous.x,
              top: previous.y,
              width: length,
              height: 3,
              borderRadius: 999,
              backgroundColor: asset.accent,
              transform: [{ rotateZ: angle }],
              transformOrigin: "0px 1.5px",
              shadowColor: asset.accent,
              shadowOpacity: 0.55,
              shadowRadius: 8,
            }}
          />
        );
      })}
      {coords.map((point, index) => (
        <View
          key={`dot-${index}`}
          style={{
            position: "absolute",
            left: point.x - 3,
            top: point.y - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: asset.accent,
          }}
        />
      ))}
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: MOBILE_THEME.border,
        backgroundColor: "rgba(5,5,4,0.68)",
        padding: 10,
      }}
    >
      <Text style={{ color: MOBILE_THEME.dimText, fontSize: 9, fontWeight: "900", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ color: MOBILE_THEME.text, fontSize: 16, fontWeight: "900", marginTop: 5 }}>{value}</Text>
    </View>
  );
}

function PredictionCard({ prediction, now }: { prediction: RealmExchangePrediction; now: number }) {
  const asset = getAssetById(prediction.assetId);
  const isActive = prediction.status === "active";
  const tone = prediction.status === "won" ? MOBILE_THEME.teal : prediction.status === "lost" ? MOBILE_THEME.danger : MOBILE_THEME.gold;

  return (
    <View
      style={{
        borderRadius: 15,
        borderWidth: 1,
        borderColor: `${tone}55`,
        backgroundColor: "rgba(5,5,4,0.62)",
        padding: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Text style={{ color: MOBILE_THEME.text, fontWeight: "900", flex: 1 }} numberOfLines={1}>
          {asset.kingdomName}
        </Text>
        <Text style={{ color: tone, fontWeight: "900" }}>{prediction.direction === "up" ? "Sube" : "Baja"}</Text>
      </View>
      <Text style={{ color: MOBILE_THEME.mutedText, marginTop: 6, fontSize: 12 }}>
        {isActive ? formatClock(prediction.settlesAt - now) : prediction.status} / {formatGold(prediction.stakeGold)}
      </Text>
    </View>
  );
}

export function RealmStockExchangeNative() {
  const { player, updateGold } = useSessionStore();
  const [selectedAssetId, setSelectedAssetId] = useState(REALM_EXCHANGE_ASSETS[0].id);
  const [exchangeState, setExchangeState] = useState<RealmExchangePlayerState>(createEmptyExchangeState);
  const [stakeInput, setStakeInput] = useState("500");
  const [lotInput, setLotInput] = useState("1");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(Date.now());

  const selectedAsset = useMemo(() => getAssetById(selectedAssetId), [selectedAssetId]);
  const currentPrice = useMemo(() => getAssetPriceAt(selectedAsset, now), [now, selectedAsset]);
  const delta = useMemo(() => getAssetDelta(selectedAsset, now), [now, selectedAsset]);
  const nextTickAt = useMemo(() => getNextTickAt(selectedAsset, now), [now, selectedAsset]);
  const position = useMemo(() => findPosition(exchangeState, selectedAsset.id), [exchangeState, selectedAsset.id]);
  const activePrediction = useMemo(
    () => findActivePrediction(exchangeState, selectedAsset.id),
    [exchangeState, selectedAsset.id]
  );
  const lots = Math.max(1, Math.floor(Number(lotInput) || 1));
  const stakeGold = Math.max(0, Math.floor(Number(stakeInput) || 0));
  const tradeCost = lots * REALM_EXCHANGE_TRADE_LOT * currentPrice;
  const ownedValue = position ? position.sharesOwned * currentPrice : 0;
  const floatingProfit = position ? ownedValue - position.totalInvested : 0;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      if (!player) {
        setExchangeState(createEmptyExchangeState());
        return;
      }

      const loaded = await loadExchangeState(player.id);
      if (!cancelled) {
        setExchangeState(loaded);
      }
    }

    void loadState();

    return () => {
      cancelled = true;
    };
  }, [player]);

  useEffect(() => {
    if (!player || pending) {
      return;
    }

    const resolved = exchangeState.predictions.map((prediction) =>
      resolvePrediction(prediction, getAssetById(prediction.assetId), now)
    );
    const changed = resolved.some((prediction, index) => prediction.status !== exchangeState.predictions[index]?.status);

    if (!changed) {
      return;
    }

    const payout = resolved.reduce((total, prediction, index) => {
      const previous = exchangeState.predictions[index];
      const justResolved = previous?.status === "active" && prediction.status !== "active";
      return total + (justResolved ? prediction.payoutGold ?? 0 : 0);
    }, 0);
    const nextState = { ...exchangeState, predictions: resolved };

    setExchangeState(nextState);
    void saveExchangeState(player.id, nextState);

    if (payout > 0) {
      void updateGold(player.gold + payout).then((ok) => {
        setFeedback({
          type: ok ? "success" : "error",
          message: ok ? `Prediccion resuelta: +${formatGold(payout)} oro.` : "No se pudo pagar la prediccion.",
        });
      });
    } else {
      setFeedback({ type: "error", message: "Prediccion resuelta sin premio." });
    }
  }, [exchangeState, now, pending, player, updateGold]);

  async function applyOperation(result: {
    status: "success" | "error";
    message: string;
    state: RealmExchangePlayerState;
    nextGold: number;
  }) {
    if (!player) {
      setFeedback({ type: "error", message: "Conecta tu perfil primero." });
      return;
    }

    if (result.status === "error") {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setPending(true);
    const updated = await updateGold(result.nextGold);

    if (!updated) {
      setFeedback({ type: "error", message: "No se pudo actualizar el oro." });
      setPending(false);
      return;
    }

    await saveExchangeState(player.id, result.state);
    setExchangeState(result.state);
    setFeedback({ type: "success", message: result.message });
    setPending(false);
  }

  return (
    <RealmCard tone="teal">
      <SectionHeader
        eyebrow="Bolsa del reino"
        title="Activos reales"
        trailing={<Pill label={`Max ${REALM_EXCHANGE_PRICE_CEILING}`} active />}
      />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {REALM_EXCHANGE_ASSETS.map((asset) => {
          const active = asset.id === selectedAssetId;
          return (
            <Pressable
              key={asset.id}
              onPress={() => setSelectedAssetId(asset.id)}
              style={({ pressed }) => ({
                width: "48%",
                borderRadius: 15,
                borderWidth: 1,
                borderColor: active ? asset.accent : MOBILE_THEME.border,
                backgroundColor: active || pressed ? `${asset.accent}22` : "rgba(5,5,4,0.56)",
                padding: 10,
              })}
            >
              <Text style={{ color: active ? asset.accent : MOBILE_THEME.mutedText, fontSize: 10, fontWeight: "900" }}>
                {asset.kingdomName.toUpperCase()}
              </Text>
              <Text style={{ color: MOBILE_THEME.text, fontWeight: "900", marginTop: 4 }} numberOfLines={1}>
                {asset.assetName}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: MOBILE_THEME.gold, fontSize: 11, fontWeight: "900" }}>{selectedAsset.kingdomName}</Text>
            <Text style={{ color: MOBILE_THEME.text, fontSize: 20, fontWeight: "900" }}>{selectedAsset.assetName}</Text>
            <Text style={{ color: MOBILE_THEME.mutedText, fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
              {selectedAsset.description}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "900" }}>PRECIO</Text>
            <Text style={{ color: selectedAsset.accent, fontSize: 24, fontWeight: "900" }}>{formatGold(currentPrice)}</Text>
            <Text style={{ color: delta >= 0 ? MOBILE_THEME.teal : MOBILE_THEME.danger, fontSize: 12, fontWeight: "900" }}>
              {delta >= 0 ? "+" : ""}{formatGold(delta)}
            </Text>
          </View>
        </View>

        <MiniChart asset={selectedAsset} now={now} />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <StatBox label="Tick" value={formatClock(nextTickAt - now)} />
          <StatBox label="Tienes" value={`${position?.sharesOwned ?? 0}`} />
          <StatBox label="Valor" value={formatGold(ownedValue)} />
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: MOBILE_THEME.border, paddingTop: 10, gap: 9 }}>
        <Text style={{ color: MOBILE_THEME.gold, fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
          Acciones
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={lotInput}
            onChangeText={setLotInput}
            keyboardType="number-pad"
            placeholder="Lotes"
            placeholderTextColor={MOBILE_THEME.dimText}
            style={{
              flex: 1,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              backgroundColor: MOBILE_THEME.bg,
              color: MOBILE_THEME.text,
              paddingHorizontal: 12,
              minHeight: 45,
              fontWeight: "900",
            }}
          />
          <View style={{ flex: 1 }}>
            <PrimaryAction
              label="Comprar"
              icon="trending-up"
              disabled={!player || pending}
              onPress={() =>
                void applyOperation(
                  buyAssetShares({
                    state: exchangeState,
                    asset: selectedAsset,
                    gold: player?.gold ?? 0,
                    lots,
                    at: now,
                  })
                )
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryAction
              label="Vender"
              icon="trending-down"
              variant="ghost"
              disabled={!player || pending || !position}
              onPress={() =>
                void applyOperation(
                  sellAssetShares({
                    state: exchangeState,
                    asset: selectedAsset,
                    gold: player?.gold ?? 0,
                    lots,
                    at: now,
                  })
                )
              }
            />
          </View>
        </View>
        <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11 }}>
          Lote {REALM_EXCHANGE_TRADE_LOT} / costo {formatGold(tradeCost)} / resultado {floatingProfit >= 0 ? "+" : ""}{formatGold(floatingProfit)}
        </Text>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: MOBILE_THEME.border, paddingTop: 10, gap: 9 }}>
        <Text style={{ color: MOBILE_THEME.gold, fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
          Prediccion 2h
        </Text>
        <TextInput
          value={stakeInput}
          onChangeText={setStakeInput}
          keyboardType="number-pad"
          placeholder="Oro a arriesgar"
          placeholderTextColor={MOBILE_THEME.dimText}
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: MOBILE_THEME.border,
            backgroundColor: MOBILE_THEME.bg,
            color: MOBILE_THEME.text,
            paddingHorizontal: 12,
            minHeight: 45,
            fontWeight: "900",
          }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <PrimaryAction
              label="Sube"
              icon="north"
              disabled={!player || pending || Boolean(activePrediction)}
              onPress={() =>
                void applyOperation(
                  openAssetPrediction({
                    state: exchangeState,
                    asset: selectedAsset,
                    gold: player?.gold ?? 0,
                    direction: "up",
                    stakeGold,
                    at: now,
                  })
                )
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryAction
              label="Baja"
              icon="south"
              variant="ghost"
              disabled={!player || pending || Boolean(activePrediction)}
              onPress={() =>
                void applyOperation(
                  openAssetPrediction({
                    state: exchangeState,
                    asset: selectedAsset,
                    gold: player?.gold ?? 0,
                    direction: "down",
                    stakeGold,
                    at: now,
                  })
                )
              }
            />
          </View>
        </View>
        <Text style={{ color: MOBILE_THEME.dimText, fontSize: 11 }}>
          Min {formatGold(REALM_EXCHANGE_MIN_STAKE)} / Max {formatGold(REALM_EXCHANGE_MAX_STAKE)}
        </Text>
        {activePrediction ? <PredictionCard prediction={activePrediction} now={now} /> : null}
      </View>

      {exchangeState.predictions.length > 0 ? (
        <Animated.View layout={LinearTransition.duration(180)} style={{ gap: 8 }}>
          {exchangeState.predictions.slice(-2).reverse().map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} now={now} />
          ))}
        </Animated.View>
      ) : null}

      {feedback ? (
        <NoticeBanner
          title={feedback.type === "success" ? "Bolsa actualizada" : "Operacion detenida"}
          message={feedback.message}
          tone={feedback.type === "success" ? "teal" : "danger"}
          icon={feedback.type === "success" ? "candlestick-chart" : "warning"}
        />
      ) : null}
    </RealmCard>
  );
}
