import { Dice5, ScrollText, Skull } from "lucide-react";
import type { FactionDossier, LoreChapter, LoreRule, RealmFaction } from "../types";

export const LORE_RULES: LoreRule[] = [
  {
    title: "Permadeath",
    description:
      "Si un personaje muere de forma canonica, no regresa. Las decisiones arriesgadas importan y dejan huella real.",
    icon: Skull,
  },
  {
    title: "Uso de dados",
    description:
      "Las acciones clave, emboscadas y hechizos se resuelven con dados. La suerte influye, pero el contexto narrativo tambien pesa.",
    icon: Dice5,
  },
  {
    title: "Canon del reino",
    description:
      "Los eventos oficiales alteran alianzas, ciudades, recursos y reputaciones. Todo lo ocurrido puede repercutir en la temporada.",
    icon: ScrollText,
  },
];

export const LORE_CHAPTERS: LoreChapter[] = [
  {
    title: "El eclipse eterno",
    summary: "El sol desaparecio y el reino entro en una era de sombras.",
    content:
      "Hace veinte inviernos, el Sol de Ceniza desaparecio detras de un eclipse eterno. Desde entonces, el Reino de las Sombras vive dividido entre casas nobles en decadencia, ordenes religiosas quebradas y gremios que comercian con reliquias prohibidas.",
  },
  {
    title: "La Corona de Carbon",
    summary: "Un simbolo antiguo ha vuelto a encender la ambicion del reino.",
    content:
      "La Corona de Carbon, simbolo del antiguo monarca, ha vuelto a emitir un fulgor oscuro bajo las ruinas de Valdren. Quien la reclame podra unir el reino o desatar una guerra total entre vivos, traidores y fantasmas.",
  },
  {
    title: "La nueva temporada",
    summary: "Eventos, alianzas y comercio clandestino marcan el nuevo ciclo.",
    content:
      "La temporada actual gira en torno al control de rutas, favores politicos y reliquias malditas. Cada faccion intenta ganar poder sin quedar expuesta a la inquisicion o al hambre de la corte.",
  },
];

export const REALM_FACTIONS: RealmFaction[] = [
  {
    name: "Cuervos del Norte",
    motto: "Ven primero, golpea despues.",
    description:
      "Exploradores, rastreadores y estrategas de frontera que dominan el bosque y el espionaje.",
  },
  {
    name: "Orden del Sol Marchito",
    motto: "La fe no muere, se endurece.",
    description:
      "Guerreros y fanaticos que usan antiguas liturgias para mantener el orden por la fuerza.",
  },
  {
    name: "Guardianes del Umbral",
    motto: "Lo sellado no debe abrirse.",
    description:
      "Protectores de reliquias, criptas y secretos que nadie deberia tocar.",
  },
  {
    name: "Mercenarios del Hierro",
    motto: "Toda corona paga peaje.",
    description:
      "Comerciantes armados, escoltas y capitanes que venden acero, rutas y favores.",
  },
];

export const FACTION_DOSSIERS: FactionDossier[] = [
  {
    id: "cuervos-del-norte",
    name: "Cuervos del Norte",
    motto: "Ven primero, golpea despues.",
    alignedRealm: "Kaelum-Gard (Fronteras)",
    history:
      "Nacieron como unidades de reconocimiento de elite enviadas a marcar rutas seguras dentro de zonas infectadas por la Fractura de Cristal. Con el tiempo entendieron que el Imperio los consideraba prescindibles, asi que cortaron la cadena de mando y se volvieron una hermandad independiente. Hoy operan desde las sombras, vendiendo informacion al mejor postor con un codigo de honor estricto: la informacion nunca se falsea.",
    specialization:
      "Espionaje de Eter: usan fragmentos de cristal refinado para crear sensores que detectan vibraciones magicas a gran distancia.",
    tactics:
      "Evitan el choque frontal. Prefieren sabotaje, asesinato selectivo y guerra de guerrillas, siempre con rutas de escape preparadas.",
    equipment:
      "Capas de plumas de Arpias de las Cumbres para camuflaje en nieve y roca. Dagas con veneno de Aracnida, capaces de paralizar a objetivos grandes en segundos.",
    headquarters:
      "El Nido de Sombras: tuneles y puestos de vigia en los picos mas altos entre Kaelum-Gard y los Paramos, con control visual sobre rutas comerciales terrestres.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Oficialmente son traidores, pero se los contrata en secreto para misiones que el ejercito regular no puede realizar sin hacer ruido.",
      },
      {
        realm: "Oakhaven",
        description:
          "Tregua tacita con los Elfos Silvanos: no cazan en el bosque a cambio de informacion sobre movimientos imperiales.",
      },
      {
        realm: "Union de los Paramos",
        description:
          "Sus mejores clientes: las caravanas pagan por reportes de nidos de monstruos activos antes de avanzar.",
      },
    ],
    playerDetails:
      "Un Cuervo del Norte destaca en rastreo, infiltracion y lectura del terreno. Su ventaja real es la informacion: saber por donde entrar, por donde salir y a quien evitar.",
    startingItem: "Cristal de Resonancia (deteccion de monstruos o magia en radio corto).",
    bonuses: ["Supervivencia", "Sigilo", "Percepcion"],
  },
  {
    id: "orden-del-sol-marchito",
    name: "La Orden del Sol Marchito",
    motto: "La fe no muere, se endurece.",
    alignedRealm: "Frontera Arcania / Kaelum-Gard",
    history:
      "La orden nacio en los limites exteriores de Arcania, formada por clerigos y guerreros que sobrevivieron a la Fractura. Consideran la energia del cristal una enfermedad sagrada: el sol 'murio' ese dia y la luz actual es solo un reflejo palido. Su mision es limpiar el mundo de corrupcion magica, lo que los lleva a incinerar monstruos mutantes y experimentos fallidos por igual.",
    specialization:
      "Piromancia estatica y combate de primera linea. Emplean resonancias que desestabilizan cristales cercanos.",
    tactics:
      "Tierra quemada. Entran con estandartes que emiten una frecuencia capaz de hacer fallar o explotar armas magicas cercanas.",
    equipment:
      "Armaduras de placas con soles eclipsados. Maza y mandoble bendecidos con aceites alquimicos de Oakhaven que arden con fuego blanco, dificil de extinguir.",
    headquarters:
      "La Ciudad Calcinada: asentamiento reconstruido con piedra refractaria en la frontera entre Arcania y Kaelum-Gard, una cuarentena no oficial frente a brotes de cristal.",
    relations: [
      {
        realm: "Arcania",
        description:
          "Los considera fanatismo peligroso; la orden responde tratando a los magos como pecadores originales.",
      },
      {
        realm: "Kaelum-Gard",
        description:
          "El Imperio los tolera porque purgan nidos de monstruos sin costo y ahorran recursos militares.",
      },
      {
        realm: "Oakhaven",
        description:
          "Relacion hostil: la orden quema bosques enteros si detecta infeccion magica, chocando con driadas y elfos.",
      },
    ],
    playerDetails:
      "Un miembro suele tener voluntad de hierro y disciplina marcial. Es temido por su determinacion: la purga primero, las preguntas despues.",
    bonuses: ["Resistencia a fuego/quemadura", "Ventaja vs. control mental"],
  },
  {
    id: "guardianes-del-umbral",
    name: "Guardianes del Umbral",
    motto: "Lo sellado no debe abrirse.",
    alignedRealm: "Catacumbas y enclaves sellados",
    history:
      "Pendiente: comparte el lore e historia de esta faccion y lo integro con el mismo formato que las demas.",
    specialization:
      "Guardiania de reliquias y sellos antiguos.",
    tactics:
      "Pendiente: tacticas y estilo de combate.",
    equipment:
      "Pendiente: equipo y artefactos caracteristicos.",
    headquarters:
      "Pendiente: sede y presencia en el mapa.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Pendiente: relacion con el Imperio.",
      },
      {
        realm: "Oakhaven",
        description:
          "Pendiente: relacion con el Protectorado.",
      },
      {
        realm: "Union de los Paramos",
        description:
          "Pendiente: relacion con la Union.",
      },
    ],
    playerDetails:
      "Pendiente: detalles mecanicos para el jugador (bonos, item inicial, etc.).",
  },
  {
    id: "mercenarios-del-hierro",
    name: "Mercenarios del Hierro",
    motto: "Toda corona paga peaje.",
    alignedRealm: "Rutas comerciales y peajes",
    history:
      "Pendiente: comparte el lore e historia de esta faccion y lo integro con el mismo formato que las demas.",
    specialization:
      "Escolta, comercio armado y control de rutas.",
    tactics:
      "Pendiente: tacticas y estilo de combate.",
    equipment:
      "Pendiente: equipo, marcas de compania y arsenal.",
    headquarters:
      "Pendiente: sede y presencia en el mapa.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Pendiente: relacion con el Imperio.",
      },
      {
        realm: "Arcania",
        description:
          "Pendiente: relacion con el Nexo.",
      },
      {
        realm: "Union de los Paramos",
        description:
          "Pendiente: relacion con la Union.",
      },
    ],
    playerDetails:
      "Pendiente: detalles mecanicos para el jugador (bonos, item inicial, etc.).",
  },
];
