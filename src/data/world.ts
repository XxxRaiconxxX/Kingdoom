import type { DemographicBloc, GeopoliticalNote } from "../types";

export const WORLD_STATUS = {
  title: "Paz Tensa",
  description:
    "Los cuatro grandes poderes continentales coexisten en un equilibrio asfixiante de interdependencia vital donde la caída de uno significaría el colapso inmediato de los demás: Kaelum-Gard aporta la metalurgia pesada y el acero pero carece del Éter refinado de Arcania; Arcania domina la transmutación energética pero requiere los estabilizadores botánicos de Oakhaven para que sus reactores de cristal no detonen; Oakhaven custodia la flora curativa pero depende de las calzadas y transportes de la Unión de los Páramos; y la Unión domina la logística pesada a vapor y el biocemento pero necesita el combustible rúnico de Arcania y las herramientas imperiales. La paz se escribe con tinta invisible sobre pólvora seca.",
};

export const DEMOGRAPHIC_BLOCS: DemographicBloc[] = [
  {
    realm: "El Imperio de Kaelum-Gard",
    epithet: "El Puño del Orden (Capital: Argentis / Kaelmor)",
    groups: [
      {
        title: "Casta de mando",
        races: ["Humanos de alta alcurnia", "Ángeles de las Virtudes", "Serafines Executores"],
      },
      {
        title: "Aristocracia y estrategia",
        races: [
          "Vampiros Sangre Pura (Casa Darkthorne)",
          "Altos Elfos de la Luz",
          "Elfos de Sangre",
        ],
      },
      {
        title: "Fuerza de asalto y choque",
        races: [
          "Orcos de Hierro",
          "Minotauros de Combate",
          "Cíclopes de Asedio",
          "Gigantes de Fuego",
        ],
      },
      {
        title: "Infraestructura y logística",
        races: [
          "Enanos de las Montañas",
          "Autómatas de Vapor",
          "Golems de Piedra",
        ],
      },
    ],
  },
  {
    realm: "El Protectorado de Oakhaven",
    epithet: "El Latido Alquímico (Capital: Yggdras-Sil)",
    groups: [
      {
        title: "Guardianes ancestrales",
        races: [
          "Elfos Silvanos",
          "Elfos de la Noche",
          "Dríadas de Bosque Madre",
          "Ents Ancestrales",
          "Kodamas (Espíritus Arbóreos)",
        ],
      },
      {
        title: "Cazadores y protectores de frontera",
        races: [
          "Lycans (Hombres Lobo / Fenrir)",
          "Hombres Tigre (Weretigers)",
          "Hombres León (Leonin)",
          "Ursine (Hombres Oso)",
        ],
      },
      {
        title: "Alquimia viviente y botánica",
        races: [
          "Hombres Planta (Alraune)",
          "Myconids (Hombres Hongo)",
          "Mandrágoras Sapientes",
          "Ninfas de los Manantiales",
        ],
      },
      {
        title: "Mensajeros del viento",
        races: ["Silfos", "Hadas (Fairies)", "Pixies", "Tengus"],
      },
    ],
  },
  {
    realm: "El Nexo de Arcania",
    epithet: "El Prisma del Saber (Capital: Luminus / Lux-Ley)",
    groups: [
      {
        title: "Entidades de energía y casta intelectual",
        races: [
          "Ethereals",
          "Cuerpos de Éter",
          "Sombras Vivientes",
          "Liches Ancestrales",
        ],
      },
      {
        title: "Maestros del cristal y minería",
        races: [
          "Golems de Cristal",
          "Enanos Oscuros",
          "Svirfneblin (Gnomos Abisales)",
        ],
      },
      {
        title: "Inmortales y linajes planares",
        races: [
          "Aasimar",
          "Tieflings",
          "Nephilim",
          "Súcubos e Íncubos",
          "Cambions",
          "Espectros del Prisma",
        ],
      },
    ],
  },
  {
    realm: "La Unión de los Páramos",
    epithet: "La Senda del Pragmatismo (Capital: Mercantia)",
    groups: [
      {
        title: "Ingeniería y comercio comunal",
        races: [
          "Goblins Ingenieros",
          "Hobgoblins",
          "Trasgos de Forja",
          "Tanukis",
          "Kitsunes",
          "Skaven (Hombres Rata)",
        ],
      },
      {
        title: "Logística de ruta y transporte",
        races: [
          "Centauros",
          "Sleipnir Humanoides",
          "Hombres Jabalí",
          "Hombres Topo",
          "Sátiros y Faunos",
        ],
      },
      {
        title: "Supervivencia en climas extremos",
        races: [
          "Trolls de Hielo",
          "Trolls de Selva",
          "Gigantes de Escarcha",
          "Gnolls",
          "Kobolds de Cañón",
          "Yetis de las Estepas",
        ],
      },
    ],
  },
  {
    realm: "Las Naciones del Agua y Exiliados",
    epithet: "Los Reinos del Borde (Thalassia y Territorios Marginales)",
    groups: [
      {
        title: "Reinos acuáticos (Thalassia la Sumergida)",
        races: [
          "Tritones",
          "Sirenas de Arrecife",
          "Nagas Abisales",
          "Cecaelias (Hombres Pulpo)",
          "Hombres Pez (Kappa)",
          "Hombres Tiburón",
          "Hombres Medusa",
        ],
      },
      {
        title: "Los Ominosos (Exiliados y parias del Velo)",
        races: [
          "Dullahans (Caballeros espectrales sin cabeza)",
          "Ghouls de Cripta",
          "Gorgonas y Lamias",
          "Banshees (Gritonas)",
          "Espectros de la Bruma",
        ],
      },
    ],
  },
];

export const DIPLOMATIC_TENSIONS: GeopoliticalNote[] = [
  {
    title: "La Guerra de la Resina (Kaelum-Gard vs. Oakhaven)",
    description:
      "El Imperio necesita la Resina de Veridia (savia de árboles ancestrales) para refrigerar sus forjas e implantes de guerra sin que exploten por volatilidad del Éter. Oakhaven mantiene un embargo estricto y responde con la amenaza del biosuicidio forestal: si un solo batallón imperial cruza la frontera, los elfos quemarán sus propios bosques, desatando la detonación en cadena de los cristales mágicos de todo el continente.",
  },
  {
    title: "El Monopolio de Refinamiento de Éter (Nexo de Arcania)",
    description:
      "Arcania controla las únicas refinerías alquímicas capaces de transformar el Éter bruto en Lágrimas de Éter refinadas al 99% de pureza. Ningún otro reino puede replicar el proceso sin provocar explosiones de escala nuclear mágica. Arcania utiliza este monopolio como herramienta de chantaje diplomático, imponiendo apagones energéticos a Kaelum-Gard cada vez que el Imperio despliega tropas en sus fronteras.",
  },
  {
    title: "Extorsión de Peajes y Biocemento (Unión de los Páramos)",
    description:
      "La Unión domina la Autopista del Biocemento (fabricado con huesos triturados de megafauna y savia cáustica) y cobra un arancel obligatorio del 8% sobre todas las cargas comerciales que transitan entre los reinos. Kaelum-Gard considera esta práctica una extorsión intolerable pero se ve incapaz de patrullar y pavimentar las estepas desérticas por sí solo.",
  },
  {
    title: "Los Mapas de la Discordia (Falsificación de Kaelum-Gard)",
    description:
      "La Hermandad de la Escuadra Rígida custodia en secreto documentos topográficos deliberadamente alterados que sitúan tres valles de Oakhaven ricos en vetas de Aether dentro de territorio imperial, listos para fingir un hallazgo fortuito que justifique formalmente una invasión armada.",
  },
  {
    title: "Los Anales de la Resina Negra (Contrabando y Corrupción)",
    description:
      "El Gremio de las Hebras de Seda descubrió registros contables que prueban que altos dignatarios corruptos del Consejo Real de Oakhaven desvían resina sagrada de contrabando hacia las fundiciones de Kaelum-Gard y la Orden del Eclipse Rúnico a cambio de oro imperial.",
  },
  {
    title: "La Guerra de la Seda y Crisis del Acero",
    description:
      "La introducción de prendas de alta costura con micro-runas de frecuencia inversa y metamateriales autorreparables producidos por la Sastrería Lux Aeterna (fachada de Shadow Garden) ha desatado la quiebra de Fundiciones Valerius en Kaelum-Gard, acumulando armaduras pesadas obsoletas sin comprador.",
  },
];

export const COMMON_THREATS: GeopoliticalNote[] = [
  {
    title: "Fauna Cristalizada (Cristalopatía Etérea)",
    description:
      "Hipersaturación de Éter silíceo proveniente de las fallas de la Fractura de Cristal. No es una enfermedad biológica, sino la petrificación del calcio en los esqueletos animales, haciendo que púas de cuarzo conductor atraviesen la piel en especímenes como el Lobo de Agujas de Resonancia, el Ursoide Cuarzoso (capaz de acumular descargas de 10.000 V) y las Arpías Vítreas que asaltan líneas de suministros.",
  },
  {
    title: "Corrupción Rúnica / Podredumbre del Circuito",
    description:
      "Ocurre cuando un hechicero o combatiente sufre un desbordamiento masivo de maná en su núcleo bioenergético al canalizar circuitos mágicos incompatibles. La carne muta con patrones geométricos deformes y la mente colapsa en la locura. Mientras la Inquisición de Kaelum-Gard persigue a las víctimas para ejecutarlas en piras o experimentar con ellas, Shadow Garden las rescata y reprograma sus circuitos.",
  },
  {
    title: "Espionaje Industrial y Robo de Fórmulas",
    description:
      "Redes de agentes y asesinos operan implacablemente para sustraer los secretos del refinamiento de Éter en Arcania, robar los planos de las calderas de biocemento de la ingeniera Mezli en los Páramos (quien instaló sistemas de autodestrucción alquímica en sus motores), o raptar a la alquimista Grace Chariot en Aurelia para arrebatarle el secreto de la legendaria Poción Dorada.",
  },
  {
    title: "La Orden del Eclipse Rúnico y el Proyecto Épsilon",
    description:
      "La amenaza suprema de Aethelgardia. Una cábala clandestina transcontinental dirigida por los Doce Prelados del Ocaso (incluyendo al Gran Inquisidor Ignatius y aristócratas de Arcania). En complejos subterráneos como el Laboratorio Épsilon-Cero, inducen sobrecargas de maná en cautivos para cosechar Ceniza de Éter (polvo violeta de almas caídas) con el fin de forjar el Núcleo del Eclipse y sintetizar la Runa Madre Inmortal para controlar el Éter de todo el planeta.",
  },
];
