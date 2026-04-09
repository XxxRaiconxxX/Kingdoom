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
    motto: "Ni aqui, ni alla.",
    description:
      "Protectores de reliquias, criptas y secretos que nadie deberia tocar.",
  },
  {
    name: "Mercenarios del Hierro",
    motto: "Nuestra sangre, vuestro acero.",
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
    motto: "Ni aqui, ni alla.",
    alignedRealm: "Arcania (umbrales y grietas)",
    history:
      "Mientras otros buscan cristales en el suelo, los Guardianes observan las grietas en el aire. Esta faccion mistica esta formada por seres con un pie en cada mundo: aasimar, tieflings, ethereals y cuerpos de eter. Su origen se remonta a la Fractura de Cristal, cuando el tejido de la realidad se rasgo. Desde entonces juraron proteger los Umbrales, puntos donde la energia de cristal es tan inestable que abre portales a dimensiones desconocidas. Son vigilantes silenciosos que impiden que entidades del vacio devoren lo que queda del continente.",
    specialization:
      "Manipulacion de espacio-tiempo: parpadeos, gravedad localizada y cierre de anomalías.",
    tactics:
      "Parpadeo tactico para reposicionarse y aparecer a espaldas del objetivo. Crean zonas de gravedad aumentada para inmovilizar criaturas grandes o cortar retiradas.",
    equipment:
      "Tunicas que parecen hechas de estrellas y Laminas de Fase: hojas capaces de volverse intangibles para atravesar armaduras y cortar directamente la energia vital.",
    headquarters:
      "El Observatorio del Vacio: santuario en una dimension de bolsillo, accesible solo por una grieta especifica en las montanas de Arcania.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Los militares los ven como fantasmas peligrosos imposibles de someter a la ley de los hombres.",
      },
      {
        realm: "Oakhaven",
        description:
          "Respeto mutuo: ambos preservan el orden natural, aunque con metodos distintos.",
      },
      {
        realm: "Union de los Paramos",
        description:
          "Interaccion limitada: toleran el comercio mientras no se profanen Umbrales en las rutas.",
      },
    ],
    playerDetails:
      "Un Guardian del Umbral domina el control del terreno y el reposicionamiento. Su firma de poder se nota en el aire: no se mide por fuerza bruta, sino por como decide donde y cuando ocurre el combate.",
    startingItem: "Marca del Umbral (permite detectar fluctuaciones magicas cercanas).",
    bonuses: ["Paso del Umbral (teletransporte corto 1/combate)", "Percepcion arcana"],
  },
  {
    id: "mercenarios-del-hierro",
    name: "Mercenarios del Hierro",
    motto: "Nuestra sangre, vuestro acero.",
    alignedRealm: "Union de los Paramos (rutas y asedio)",
    history:
      "Nacidos de las cenizas de batallas olvidadas, los Mercenarios del Hierro son el pragmatismo puro en un mundo en guerra. Fueron una legion de castigo de Kaelum-Gard compuesta por orcos de hierro y enanos de las montanas que se negaron a ejecutar una orden genocida. Tras desertar, se asentaron en los limites de los Paramos y se convirtieron en la fuerza militar privada mas respetada y temida de Aethelgardia. No luchan por reyes ni por dioses: luchan por el contrato. Se dice que un contrato firmado con el Hierro es mas solido que un muro de castillo.",
    specialization:
      "Guerra de desgaste y asedio. Expertos en escoltar caravanas grandes contra fauna colosal y sostener lineas bajo presion prolongada.",
    tactics:
      "Formaciones cerradas tipo testudo con escudos de acero pesado. Controlan el ritmo, ganan por resistencia y protegen el objetivo hasta que el enemigo se agota.",
    equipment:
      "Armaduras pesadas con remaches de cristal de baja calidad para resistencia fisica aumentada. Hachas a dos manos, martillos de guerra y ballestas de asedio en tripodes.",
    headquarters:
      "El Baluarte de Oxido: fortaleza movil sobre una plataforma de orugas metalicas. Es una ciudad-cuartel que nunca permanece en el mismo lugar, siempre sobre las rutas mas peligrosas.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Odio mutuo, pero el Imperio los contrata en secreto para 'limpiezas' que no puede ejecutar por politica.",
      },
      {
        realm: "Arcania",
        description:
          "Desconfian de la magia, pero compran suministros de energia para sus armas pesadas.",
      },
      {
        realm: "Union de los Paramos",
        description:
          "Socios preferidos: la Union provee combustible y reparaciones; los Mercenarios mantienen los pasos libres de monstruos.",
      },
    ],
    playerDetails:
      "Un Mercenario del Hierro gana por disciplina, cobertura y presion constante. En mesa destaca como muro movil y estratega de asedio: su valor es sostener al grupo cuando la ruta se rompe.",
    startingItem: "Placa de Contrato (sello del Hierro que acredita tu compania).",
    bonuses: ["Piel Curtida (reduccion de dano fisico)", "Intimidacion", "Tacticas de asedio"],
  },
];
