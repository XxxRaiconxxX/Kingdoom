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
  minLevel: number;
  recommendedPower: number;
  maxAttemptsPerWindow: number;
  windowHours: number;
  entryFee: number;
  rewardMin: number;
  rewardMax: number;
  expReward: number;
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
    minLevel: 1,
    recommendedPower: 18,
    maxAttemptsPerWindow: 5,
    windowHours: 6,
    entryFee: 70,
    rewardMin: 320,
    rewardMax: 500,
    expReward: 12,
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
    id: "moonfang-hunt",
    title: "Caceria de colmillo lunar",
    enemyName: "Lobo alfa de la grieta",
    difficulty: "controlled",
    minLevel: 3,
    recommendedPower: 34,
    maxAttemptsPerWindow: 4,
    windowHours: 6,
    entryFee: 95,
    rewardMin: 420,
    rewardMax: 640,
    expReward: 14,
    enemyHp: 104,
    enemyAttackMin: 12,
    enemyAttackMax: 19,
    enemyEvasionChance: 0.12,
    enemyGuardChance: 0.2,
    phaseTwoChance: 0.16,
    speed: "steady",
    summary: "Contrato de transicion para salir del farmeo basico y empezar a medir tu ficha.",
  },
  {
    id: "iron-duel",
    title: "Asalto intermedio",
    enemyName: "Veterano del hierro negro",
    difficulty: "medium",
    minLevel: 5,
    recommendedPower: 56,
    maxAttemptsPerWindow: 4,
    windowHours: 6,
    entryFee: 120,
    rewardMin: 650,
    rewardMax: 1000,
    expReward: 18,
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
    id: "ash-siege",
    title: "Sitio de ceniza",
    enemyName: "Centinela carbonizado",
    difficulty: "medium",
    minLevel: 8,
    recommendedPower: 84,
    maxAttemptsPerWindow: 3,
    windowHours: 6,
    entryFee: 165,
    rewardMin: 820,
    rewardMax: 1220,
    expReward: 22,
    enemyHp: 148,
    enemyAttackMin: 17,
    enemyAttackMax: 27,
    enemyEvasionChance: 0.16,
    enemyGuardChance: 0.26,
    phaseTwoChance: 0.24,
    speed: "fast",
    summary: "Ronda seria para fichas que ya aprendieron a pelear y necesitan subir de rango.",
  },
  {
    id: "void-revenant",
    title: "Caza dificil",
    enemyName: "Revenant del vacio",
    difficulty: "hard",
    minLevel: 10,
    recommendedPower: 118,
    maxAttemptsPerWindow: 3,
    windowHours: 6,
    entryFee: 200,
    rewardMin: 980,
    rewardMax: 1500,
    expReward: 28,
    enemyHp: 135,
    enemyAttackMin: 19,
    enemyAttackMax: 25,
    enemyEvasionChance: 0.18,
    enemyGuardChance: 0.28,
    phaseTwoChance: 0.2,
    speed: "chaotic",
    summary: "La presa mas peligrosa: mas oro, mas trucos y una segunda fase real.",
  },
  {
    id: "abyss-tyrant",
    title: "Contrato abisal",
    enemyName: "Tirano de la falla negra",
    difficulty: "hard",
    minLevel: 13,
    recommendedPower: 154,
    maxAttemptsPerWindow: 2,
    windowHours: 6,
    entryFee: 280,
    rewardMin: 1380,
    rewardMax: 2050,
    expReward: 32,
    enemyHp: 178,
    enemyAttackMin: 24,
    enemyAttackMax: 34,
    enemyEvasionChance: 0.22,
    enemyGuardChance: 0.32,
    phaseTwoChance: 0.28,
    speed: "chaotic",
    summary: "Contrato elite para fichas ya curtidas. Mucho castigo, mucha paga y exp de verdad.",
  },
];
