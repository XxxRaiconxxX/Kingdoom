import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  askArchivistNative,
  fetchArchivistContextNative,
  pickArchivistContextNative,
  type ArchivistMode,
} from "@/src/features/archivist/archivistService";
import type { KnowledgeDocument } from "@/src/features/shared/types";
import {
  ErrorPanel,
  MetricTile,
  Pill,
  PrimaryAction,
  RealmCard,
  SectionHeader,
  StaggerItem,
} from "@/src/components/KingdoomUI";
import { ScreenShell } from "@/src/components/ScreenShell";
import { MOBILE_THEME } from "@/src/theme/colors";

type ChatMessage = {
  id: string;
  role: "user" | "archivist";
  content: string;
  providerLabel?: string;
  sources?: Array<{ title: string; type: string; category: string }>;
};

const MODES: Array<{ id: ArchivistMode; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { id: "canon", label: "Canon", icon: "verified" },
  { id: "deep", label: "Profundo", icon: "travel-explore" },
  { id: "mechanics", label: "Reglas", icon: "tune" },
  { id: "narrator", label: "Narrador", icon: "auto-fix-high" },
  { id: "staff", label: "Staff", icon: "admin-panel-settings" },
];

const TYPE_LABELS: Record<string, string> = {
  lore: "Lore",
  rules: "Reglas",
  magic: "Magias",
  bestiary: "Bestiario",
  flora: "Flora",
  event: "Eventos",
  mission: "Misiones",
  faction: "Facciones",
  other: "Archivo",
};

function groupByType(documents: KnowledgeDocument[]) {
  return documents.reduce<Record<string, number>>((acc, document) => {
    acc[document.type] = (acc[document.type] ?? 0) + 1;
    return acc;
  }, {});
}

function MessageCard({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <RealmCard tone={isUser ? "gold" : "teal"}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Text
          style={{
            color: isUser ? MOBILE_THEME.gold : MOBILE_THEME.teal,
            fontSize: 11,
            fontWeight: "900",
            textTransform: "uppercase",
          }}
        >
          {isUser ? "Consulta" : "Archivista"}
        </Text>
        {message.providerLabel ? (
          <Text
            numberOfLines={1}
            style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "800", maxWidth: 160 }}
          >
            {message.providerLabel}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: MOBILE_THEME.text, fontSize: 15, lineHeight: 23 }}>
        {message.content}
      </Text>
      {message.sources?.length ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>
            Fuentes usadas
          </Text>
          {message.sources.slice(0, 4).map((source, index) => (
            <Text key={`${source.title}-${index}`} style={{ color: MOBILE_THEME.mutedText, fontSize: 12 }}>
              {source.title} - {TYPE_LABELS[source.type] ?? source.type}
            </Text>
          ))}
        </View>
      ) : null}
    </RealmCard>
  );
}

export default function ArchivistScreen() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<ArchivistMode>("canon");
  const [topicMemory, setTopicMemory] = useState<string[]>([]);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "archivist",
      content:
        "Pregunta por lore, magias, bestias, flora, misiones o eventos.",
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);
  const [feedback, setFeedback] = useState("");

  const contextQuery = useQuery({
    queryKey: ["archivist-context"],
    queryFn: fetchArchivistContextNative,
  });

  const documents = contextQuery.data?.documents ?? [];
  const documentsByType = useMemo(() => groupByType(documents), [documents]);
  const selectedMode = MODES.find((entry) => entry.id === mode) ?? MODES[0];
  const likelySources = useMemo(
    () => pickArchivistContextNative(documents, question || topicMemory.join(" "), 5),
    [documents, question, topicMemory]
  );

  function addTopicMemory() {
    const normalized = memoryDraft.trim();
    if (!normalized || topicMemory.includes(normalized)) return;
    setTopicMemory((current) => [...current, normalized].slice(-5));
    setMemoryDraft("");
  }

  async function handleAsk() {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      setFeedback("Escribe una consulta primero.");
      return;
    }
    if (documents.length === 0) {
      setFeedback("Aun no hay fuentes cargadas para consultar.");
      return;
    }

    const selectedDocuments = pickArchivistContextNative(documents, normalizedQuestion, 10);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: normalizedQuestion,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setFeedback("");
    setIsAsking(true);

    const result = await askArchivistNative({
      question: normalizedQuestion,
      documents: selectedDocuments,
      mode,
      topicMemory,
    });

    setIsAsking(false);
    if (result.status === "error") {
      setFeedback(result.message);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `archivist-${Date.now()}`,
        role: "archivist",
        content: result.answer || "No encontre una respuesta clara con las fuentes actuales.",
        providerLabel: result.providerLabel,
        sources: result.sources,
      },
    ]);
  }

  return (
    <ScreenShell
      title="Archivista"
      subtitle="Consulta nativa del lore, reglas y registros del reino."
      eyebrow="Archivo IA"
      refreshing={contextQuery.isRefetching}
      onRefresh={() => void contextQuery.refetch()}
      rightSlot={
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(49,209,179,0.34)",
            backgroundColor: "rgba(49,209,179,0.09)",
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: MOBILE_THEME.teal, fontWeight: "900", fontSize: 11 }}>
            {documents.length} fuentes
          </Text>
        </View>
      }
    >
      {contextQuery.data?.errorMessage ? (
        <ErrorPanel message={contextQuery.data.errorMessage} onRetry={() => void contextQuery.refetch()} />
      ) : null}

      <StaggerItem index={0}>
        <RealmCard tone="teal">
          <SectionHeader eyebrow="Contexto vivo" title="Fuentes cargadas" />
          {contextQuery.isLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <ActivityIndicator color={MOBILE_THEME.gold} />
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <MetricTile label="Magias" value={documentsByType.magic ?? 0} icon="auto-stories" />
                <MetricTile label="Bestias" value={documentsByType.bestiary ?? 0} icon="pets" />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <MetricTile label="Flora" value={documentsByType.flora ?? 0} icon="grass" />
                <MetricTile label="Rol" value={(documentsByType.event ?? 0) + (documentsByType.mission ?? 0)} icon="flag" />
              </View>
            </>
          )}
        </RealmCard>
      </StaggerItem>

      <StaggerItem index={1}>
        <RealmCard>
          <SectionHeader eyebrow="Modo de respuesta" title={selectedMode.label} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MODES.map((entry) => (
              <Pill
                key={entry.id}
                label={entry.label}
                icon={entry.icon}
                active={entry.id === mode}
                onPress={() => setMode(entry.id)}
              />
            ))}
          </ScrollView>
        </RealmCard>
      </StaggerItem>

      <StaggerItem index={2}>
        <RealmCard>
          <SectionHeader eyebrow="Memoria corta" title="Temas de la consulta" />
          {topicMemory.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {topicMemory.map((topic) => (
                <Pill
                  key={topic}
                  label={topic}
                  icon="close"
                  onPress={() => setTopicMemory((current) => current.filter((entry) => entry !== topic))}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 20 }}>
              Opcional: agrega nombres como Gravedad, Argentis o una faccion.
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={memoryDraft}
              onChangeText={setMemoryDraft}
              placeholder="Tema"
              placeholderTextColor={MOBILE_THEME.dimText}
              onSubmitEditing={addTopicMemory}
              style={{
                flex: 1,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: MOBILE_THEME.border,
                backgroundColor: "rgba(5,5,4,0.76)",
                color: MOBILE_THEME.text,
                paddingHorizontal: 12,
                paddingVertical: 11,
              }}
            />
            <Pressable
              onPress={addTopicMemory}
              style={({ pressed }) => ({
                width: 46,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(49,209,179,0.12)",
                borderWidth: 1,
                borderColor: "rgba(49,209,179,0.34)",
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <MaterialIcons name="add" size={22} color={MOBILE_THEME.teal} />
            </Pressable>
          </View>
        </RealmCard>
      </StaggerItem>

      <StaggerItem index={3}>
        <RealmCard tone="gold">
          <SectionHeader eyebrow="Consulta" title="Pregunta al Archivista" />
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ej: explicame la magia de gravedad sin romper el balance"
            placeholderTextColor={MOBILE_THEME.dimText}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 100,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              backgroundColor: "rgba(5,5,4,0.78)",
              color: MOBILE_THEME.text,
              padding: 12,
              lineHeight: 21,
            }}
          />
          {likelySources.length ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: MOBILE_THEME.dimText, fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>
                Posibles fuentes
              </Text>
              <Text style={{ color: MOBILE_THEME.mutedText, lineHeight: 19 }} numberOfLines={3}>
                {likelySources.map((source) => source.title).join(" - ")}
              </Text>
            </View>
          ) : null}
          <PrimaryAction
            label={isAsking ? "Consultando" : "Consultar"}
            icon="auto-awesome"
            loading={isAsking}
            disabled={contextQuery.isLoading || isAsking}
            onPress={handleAsk}
          />
          {feedback ? <Text style={{ color: MOBILE_THEME.danger, lineHeight: 20 }}>{feedback}</Text> : null}
        </RealmCard>
      </StaggerItem>

      <View style={{ gap: 12 }}>
        {messages.map((message, index) => (
          <StaggerItem key={message.id} index={index + 4}>
            <MessageCard message={message} />
          </StaggerItem>
        ))}
      </View>
    </ScreenShell>
  );
}
