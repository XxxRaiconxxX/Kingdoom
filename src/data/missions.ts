import type { RealmMission } from "../types";

export const FALLBACK_MISSIONS: RealmMission[] = [
  {
    id: "frontera-en-tension",
    title: "Frontera en tension",
    description: "Investiga rumores de movimiento enemigo en una ruta comercial.",
    instructions: "Resolver por rol en WhatsApp. Un admin valida el cierre.",
    rewardGold: 1200,
    difficulty: "easy",
    type: "investigation",
    status: "available",
    visible: true,
  },
  {
    id: "caza-del-eco-negro",
    title: "Caza del Eco Negro",
    description: "Rastrea una criatura menor que esta alterando aldeas cercanas.",
    instructions: "Coordina escena con un admin antes de reclamar recompensa.",
    rewardGold: 2400,
    difficulty: "medium",
    type: "hunt",
    status: "available",
    visible: true,
  },
];
