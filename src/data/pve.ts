export type NarrativeEncounter = {
  id: string;
  title: string;
  enemyName: string;
  realm: string;
  summary: string;
  atmosphere: string;
  entryFee: number;
  rewardMin: number;
  rewardMax: number;
  enemyHp: number;
  enemyAttackMin: number;
  enemyAttackMax: number;
  enemyTrait: string;
  enemyThreat: "low" | "medium" | "high";
};

export const NARRATIVE_ENCOUNTERS: NarrativeEncounter[] = [
  {
    id: "warg-scout",
    title: "Bosque de presagios",
    enemyName: "Explorador warg cristalizado",
    realm: "Oakhaven",
    summary:
      "Un rastreador deformado por eter caza a cualquiera que cruce la senda vieja.",
    atmosphere:
      "La maleza cruje por si sola y un aliento helado marca que algo te sigue de cerca.",
    entryFee: 80,
    rewardMin: 170,
    rewardMax: 260,
    enemyHp: 82,
    enemyAttackMin: 11,
    enemyAttackMax: 18,
    enemyTrait: "Golpea rapido y castiga a quien baje la guardia.",
    enemyThreat: "low",
  },
  {
    id: "ash-knight",
    title: "Murallas quemadas",
    enemyName: "Caballero de ceniza",
    realm: "Kaelum-Gard",
    summary:
      "Una armadura vacia sigue cumpliendo ordenes antiguas entre ruinas calcinadas.",
    atmosphere:
      "Las brasas muertas se reavivan cuando el hierro maldito reconoce pasos vivos.",
    entryFee: 120,
    rewardMin: 240,
    rewardMax: 360,
    enemyHp: 105,
    enemyAttackMin: 14,
    enemyAttackMax: 24,
    enemyTrait: "Resiste bien y lanza contraataques feroces.",
    enemyThreat: "medium",
  },
  {
    id: "void-scribe",
    title: "Camara del vacio",
    enemyName: "Escriba del umbral",
    realm: "Arcania",
    summary:
      "Una entidad de tinta astral protege textos prohibidos y desgarra la mente ajena.",
    atmosphere:
      "Las paredes susurran ecuaciones imposibles mientras la luz se dobla alrededor del altar.",
    entryFee: 170,
    rewardMin: 320,
    rewardMax: 470,
    enemyHp: 128,
    enemyAttackMin: 18,
    enemyAttackMax: 30,
    enemyTrait: "Puede desestabilizar la batalla con golpes de eter impredecibles.",
    enemyThreat: "high",
  },
];

export type ArcadeEncounter = {
  id: string;
  title: string;
  enemyName: string;
  difficulty: "controlled" | "medium" | "hard";
  entryFee: number;
  rewardMin: number;
  rewardMax: number;
  enemyHp: number;
  enemyAttackMin: number;
  enemyAttackMax: number;
  enemyEvasionChance: number;
  enemyGuardChance: number;
  phaseTwoChance: number;
  speed: "steady" | "fast" | "chaotic";
  summary: string;
};

export const ARCADE_ENCOUNTERS: ArcadeEncounter[] = [
  {
    id: "frontier-rush",
    title: "Frontera controlada",
    enemyName: "Acechador del matorral",
    difficulty: "controlled",
    entryFee: 70,
    rewardMin: 320,
    rewardMax: 500,
    enemyHp: 92,
    enemyAttackMin: 10,
    enemyAttackMax: 17,
    enemyEvasionChance: 0.1,
    enemyGuardChance: 0.18,
    phaseTwoChance: 0.12,
    speed: "steady",
    summary: "Duelo compacto para farmear oro sin entrar a un riesgo excesivo.",
  },
  {
    id: "iron-duel",
    title: "Asalto intermedio",
    enemyName: "Veterano del hierro negro",
    difficulty: "medium",
    entryFee: 120,
    rewardMin: 650,
    rewardMax: 1000,
    enemyHp: 126,
    enemyAttackMin: 14,
    enemyAttackMax: 24,
    enemyEvasionChance: 0.14,
    enemyGuardChance: 0.22,
    phaseTwoChance: 0.2,
    speed: "fast",
    summary: "Ritmo agresivo, defensa inteligente y mejores pagos por victoria.",
  },
  {
    id: "void-revenant",
    title: "Caza dificil",
    enemyName: "Revenant del vacio",
    difficulty: "hard",
    entryFee: 200,
    rewardMin: 980,
    rewardMax: 1500,
    enemyHp: 168,
    enemyAttackMin: 19,
    enemyAttackMax: 25,
    enemyEvasionChance: 0.18,
    enemyGuardChance: 0.28,
    phaseTwoChance: 0.2,
    speed: "chaotic",
    summary: "La presa mas peligrosa: mas oro, mas trucos y una segunda fase real.",
  },
];
