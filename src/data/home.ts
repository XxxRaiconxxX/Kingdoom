import { Crown, Dice5, Flame, Users } from "lucide-react";
import type { HomeStat, JoinStep, KingdomAnnouncement } from "../types";

export const WHATSAPP_JOIN_URL =
  "https://chat.whatsapp.com/TU-ENLACE-DE-INVITACION";

export const COMMUNITY_APP_DOWNLOAD_URL = "";

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
    title: "Descarga la app o entra por web",
    description:
      "Usa la app de la comunidad cuando este disponible o entra desde la web para revisar fichas, mercado y novedades.",
  },
  {
    title: "Conecta tu perfil y crea tu personaje",
    description:
      "Conecta tu cuenta segura, vincula tu jugador y prepara hasta dos fichas para entrar al reino.",
  },
  {
    title: "Empieza a rolear y progresar",
    description:
      "Participa en WhatsApp, usa la web para mercado, fichas, ranking y deja huella en la historia oficial.",
  },
];
