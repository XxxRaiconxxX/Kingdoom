import { Crown, Dice5, Flame, Users } from "lucide-react";
import type { HomeStat, JoinStep, KingdomAnnouncement } from "../types";

export const HOME_STATS: HomeStat[] = [
  { value: "En progreso", label: "Personajes", icon: Users },
  { value: "4", label: "Facciones", icon: Flame },
  { value: "24/7", label: "Eventos", icon: Dice5 },
];

export const KINGDOM_STATUS = {
  eyebrow: "Estado del reino",
  title: "Guerra fria",
  description:
    "Las coronas vacilan, los gremios acumulan oro y el trono negro atrae traiciones en cada frontera.",
  icon: Crown,
};

export const KINGDOM_ANNOUNCEMENTS: KingdomAnnouncement[] = [
  {
    title: "Cronicas del consejo",
    content:
      "Esta semana se actualizan los pactos entre casas y se reabre el paso hacia Valdren.",
  },
  {
    title: "Mercader en ruta",
    content:
      "El mercado negro recibe nuevas reliquias, armaduras pesadas y pociones de apoyo.",
  },
];

export const JOIN_STEPS: JoinStep[] = [
  {
    title: "Entra por la web del reino",
    description:
      "Revisa fichas, misiones, eventos, mercado y grimorio desde el portal web oficial de Kingdoom.",
  },
  {
    title: "Conecta tu perfil y crea tu personaje",
    description:
      "Conecta tu jugador, vincula tu nombre del reino y prepara hasta dos fichas para entrar al conflicto.",
  },
  {
    title: "Empieza a rolear y progresar",
    description:
    "Participa en WhatsApp, usa la web para mercado, fichas y grimorio, y deja huella en la historia oficial.",
  },
];
