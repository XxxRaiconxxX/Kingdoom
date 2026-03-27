import type { RealmEvent } from "../types";

export const ACTIVE_EVENTS: RealmEvent[] = [
// active, in-production, finished
  {
    title: "La Caza del Ciervo Negro",
    description:
      "Las facciones compiten por rastrear una criatura sagrada cuya sangre puede bendecir o condenar un linaje entero.",
    longDescription:
      "Los bosques del norte vuelven a agitarse. Quien reclame al ciervo obtendra favor espiritual, influencia sobre clanes fronterizos y recursos unicos para la siguiente temporada.",
    imageUrl:
      "",
    startDate: "pendiente",
    endDate: "pendiente",
    status: "in-production",
    factions: ["Cuervos del Norte", "Guardianes del Umbral"],
    rewards: "Reliquia de caza, prestigio y acceso a un ritual especial.",
    requirements: "Personaje activo y al menos una escena oficial publicada.",
  },
  {
    title: "Asedio de Valdren",
    description:
      "Se prepara una ofensiva sobre las ruinas del viejo bastion. Espias, mercenarios y nobles ya mueven sus piezas.",
    longDescription:
      "Las ruinas esconden la Corona de Carbon y varias rutas subterraneas. El evento definira control territorial, alianzas rotas y reparto de botin.",
    imageUrl:
      "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=1200&q=80",
    startDate: "Pendiente",
    endDate: "Pendiente",
    status: "in-production",
    factions: ["Orden del Sol Marchito", "Mercenarios del Hierro"],
    rewards: "Dominio narrativo, oro de guerra y equipo estrategico.",
    requirements: "Inscripcion previa y personaje con faccion definida.",
  },
  {
    title: "El Banquete de Ceniza",
    description:
      "Una noche de intriga y pactos rotos que redefinio alianzas dentro del reino y dejo dos casas al borde del colapso.",
    longDescription:
      "El evento cerro con un asesinato ceremonial, tres juramentos rotos y un nuevo mapa de favores dentro de la corte. Sus consecuencias siguen vigentes.",
    imageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    startDate: "Pendiente",
    endDate: "Pendiente",
    status: "in-production",
    factions: ["Casa Voss", "Casa Noctis"],
    rewards: "Titulos honorificos, favores y cronicas desbloqueadas.",
    requirements: "Evento cerrado. Solo disponible como referencia historica.",
  },
];
