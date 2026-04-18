import type {
  AppLiveHuntActionType,
  AppLiveHuntMutator,
  AppLiveHuntSpecialization,
  AppLiveHuntTemplate,
} from "../types";

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
    mutatorPool: ["emberstorm", "royal-bounty", "shattered-wards"],
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
    mutatorPool: ["royal-bounty", "moon-tide", "void-static"],
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
    mutatorPool: ["void-static", "shattered-wards", "blood-drums"],
  },
];

export const APP_LIVE_HUNT_MUTATORS: AppLiveHuntMutator[] = [
  {
    id: "emberstorm",
    title: "Tormenta de brasas",
    summary: "La bestia queda expuesta, pero cada ronda mete mas presion en la linea.",
    effectLine: "+12% dano de cuadrilla · +7 amenaza por ronda",
    tone: "amber",
    damageMod: 1.12,
    threatMod: 7,
    rewardMod: 1.02,
  },
  {
    id: "royal-bounty",
    title: "Edicto de botin",
    summary: "La corona subvenciona la caceria y el grupo exprime mejor la recompensa comunal.",
    effectLine: "+18% botin · amenaza estable",
    tone: "emerald",
    damageMod: 1,
    threatMod: 0,
    rewardMod: 1.18,
  },
  {
    id: "shattered-wards",
    title: "Guardas fracturadas",
    summary: "El frente vibra con runas rotas: cubrir rinde mucho mas, atacar se vuelve mas tosco.",
    effectLine: "Cobertura premium · dano directo mas corto",
    tone: "amber",
    damageMod: 0.92,
    threatMod: -4,
    rewardMod: 1.06,
  },
  {
    id: "moon-tide",
    title: "Marea lunar",
    summary: "La sala respira mejor entre rondas y la canalizacion encuentra reliquias con facilidad.",
    effectLine: "Canalizar sube botin · -6 amenaza global",
    tone: "emerald",
    damageMod: 1.03,
    threatMod: -6,
    rewardMod: 1.1,
  },
  {
    id: "void-static",
    title: "Estatica del vacio",
    summary: "Las acciones de riesgo pegan mas fuerte, pero cualquier fallo dispara el contrato.",
    effectLine: "+15% dano tactico · +10 amenaza por ronda",
    tone: "rose",
    damageMod: 1.15,
    threatMod: 10,
    rewardMod: 1.08,
  },
  {
    id: "blood-drums",
    title: "Tambores de sangre",
    summary: "La caza entra en ritmo brutal: mas golpe, mas botin y un margen mucho mas fino.",
    effectLine: "+18% dano · +12 amenaza · +12% botin",
    tone: "rose",
    damageMod: 1.18,
    threatMod: 12,
    rewardMod: 1.12,
  },
];

export const APP_LIVE_HUNT_SPECIALIZATIONS: Record<
  AppLiveHuntSpecialization,
  { title: string; summary: string; cue: string }
> = {
  vanguard: {
    title: "Vanguardia",
    summary: "Rompe linea y exprime mejor las acciones ofensivas.",
    cue: "Ataque y sabotaje reciben empuje extra.",
  },
  bastion: {
    title: "Bastion",
    summary: "Amarra la presion del contrato y convierte cobertura en supervivencia real.",
    cue: "Cubrir baja mucho mas la amenaza.",
  },
  warden: {
    title: "Custodio",
    summary: "Asegura el ritmo del grupo con lectura defensiva y control del frente.",
    cue: "Cobrir y sabotear castigan menos a la cuadrilla.",
  },
  strategist: {
    title: "Estratega",
    summary: "Aprovecha huecos del contrato y mejora el valor tactico de la sala.",
    cue: "Canalizar y repartir tempo rinden mejor.",
  },
};

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

export function getAppLiveHuntMutator(mutatorId: string) {
  return (
    APP_LIVE_HUNT_MUTATORS.find((mutator) => mutator.id === mutatorId) ??
    APP_LIVE_HUNT_MUTATORS[0]
  );
}
