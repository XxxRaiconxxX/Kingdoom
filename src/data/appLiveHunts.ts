import type { AppLiveHuntActionType, AppLiveHuntTemplate } from "../types";

export const APP_LIVE_HUNT_TEMPLATES: AppLiveHuntTemplate[] = [
  {
    id: "ash-mantle",
    title: "Caceria comunal: Manto de ceniza",
    shortLabel: "Manto de ceniza",
    description:
      "Una bestia carbonizada hostiga convoyes. La sala debe coordinar golpes, cobertura y canalizacion para derribarla antes de que reviente el frente.",
    enemyName: "Mantoceniza de Kaelum",
    minLevel: 4,
    recommendedPower: 44,
    maxRounds: 6,
    baseEnemyHp: 240,
    threatCap: 100,
    rewardBase: 900,
    tone: "amber",
  },
  {
    id: "rift-hydra",
    title: "Caceria comunal: Hidra de la grieta",
    shortLabel: "Hidra de la grieta",
    description:
      "Contrato de presion media. Si el grupo se desordena, la amenaza escala rapido y el nido devora la recompensa comunal.",
    enemyName: "Hidra de la grieta lunar",
    minLevel: 8,
    recommendedPower: 78,
    maxRounds: 7,
    baseEnemyHp: 360,
    threatCap: 112,
    rewardBase: 1450,
    tone: "emerald",
  },
  {
    id: "void-jailer",
    title: "Caceria comunal: Carcelero del vacio",
    shortLabel: "Carcelero del vacio",
    description:
      "Evento de presion alta. El host debe llevar el ritmo y la sala necesita rotar defensa y sabotaje con mucha disciplina.",
    enemyName: "Carcelero del umbral negro",
    minLevel: 12,
    recommendedPower: 128,
    maxRounds: 8,
    baseEnemyHp: 520,
    threatCap: 126,
    rewardBase: 2200,
    tone: "rose",
  },
];

export const APP_LIVE_HUNT_ACTION_COPY: Record<
  AppLiveHuntActionType,
  { label: string; summary: string; hint: string }
> = {
  attack: {
    label: "Asaltar",
    summary: "Golpe directo y presion sostenida.",
    hint: "Sube dano de ronda, pero deja mas ruido en el frente.",
  },
  guard: {
    label: "Cubrir",
    summary: "Bajas amenaza y proteges la linea.",
    hint: "Ideal cuando la caceria empieza a desbordarse.",
  },
  channel: {
    label: "Canalizar",
    summary: "Potencias botin y estabilizas el ritmo.",
    hint: "Rinde mejor con fichas ya curtidas.",
  },
  sabotage: {
    label: "Sabotear",
    summary: "Riesgo alto para abrir brecha grande.",
    hint: "Acelera la caza, pero puede disparar la amenaza.",
  },
};

export function getAppLiveHuntTemplate(templateId: string) {
  return (
    APP_LIVE_HUNT_TEMPLATES.find((template) => template.id === templateId) ??
    APP_LIVE_HUNT_TEMPLATES[0]
  );
}
