import type { AdminTemplate } from "../types";

export const ADMIN_WEEKLY_TEMPLATES: AdminTemplate[] = [
  {
    id: "standard-week",
    title: "Semana estandar",
    description:
      "Ideal para una semana con una mezcla equilibrada de misiones narrativas, actividad constante y uno o dos eventos oficiales.",
    scoring: [
      { label: "Mision menor", points: 2 },
      { label: "Mision principal", points: 5 },
      { label: "Evento oficial", points: 4 },
      { label: "Bonus narrativo", points: 1 },
    ],
  },
  {
    id: "war-week",
    title: "Semana de guerra",
    description:
      "Pensada para campañas grandes, asedios o enfrentamientos entre facciones donde quieres premiar presencia y constancia.",
    scoring: [
      { label: "Batalla o asedio", points: 6 },
      { label: "Mision tactica", points: 4 },
      { label: "Victoria destacada", points: 8 },
      { label: "Apoyo de faccion", points: 2 },
    ],
  },
  {
    id: "major-event-week",
    title: "Semana de evento mayor",
    description:
      "Para torneos, banquetes, cumbres o eventos unicos donde el protagonismo del rol debe reflejarse mejor en el podio.",
    scoring: [
      { label: "Participacion base", points: 3 },
      { label: "Momento clave", points: 5 },
      { label: "Ganador del evento", points: 9 },
      { label: "Impacto en la cronica", points: 4 },
    ],
  },
];
