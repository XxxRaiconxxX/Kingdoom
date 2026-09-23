import { Dice5, ScrollText, Skull } from "lucide-react";
import type { FactionDossier, LoreChapter, LoreRule, RealmFaction } from "../types";

export const LORE_INTRO =
  "Aethelgardia no es un continente de fronteras serenas, sino una masa geológica surcada por cicatrices de fuego, cristal y energía mágica desbordada. Tras el cataclismo de la Fractura de Cristal y la extinción del Sol de Ceniza detrás del Eclipse Eterno hace veinte inviernos, las cuatro grandes potencias continentales —el Imperio de Kaelum-Gard, el Protectorado de Oakhaven, el Nexo de Arcania y la Unión de los Páramos— conviven en una «Paz Tensa» forzada por una interdependencia absoluta de recursos. En las sombras de este equilibrio, cultos clandestinos como la Orden del Eclipse Rúnico cosechan almas para forjar la Runa Madre Inmortal, mientras organizaciones invisibles como Shadow Garden y las expediciones a las ruinas de Valdren compiten por el control del destino del continente.";

export const LORE_RULES: LoreRule[] = [
  {
    title: "Permadeath",
    description:
      "Si un personaje muere de forma canónica, no regresa. Las decisiones arriesgadas importan, tienen consecuencias permanentes y dejan huella real en las crónicas del reino.",
    icon: Skull,
  },
  {
    title: "Uso de dados",
    description:
      "Las acciones clave, maniobras arcanas, emboscadas y hechizos se resuelven con dados. La suerte influye, pero la preparación y el contexto táctico-narrativo son determinantes.",
    icon: Dice5,
  },
  {
    title: "Canon del reino",
    description:
      "Los eventos oficiales y las victorias de campaña alteran alianzas, ciudades, recursos y reputaciones. Todo lo ocurrido repercute en la evolución viva de la temporada.",
    icon: ScrollText,
  },
];

export const LORE_CHAPTERS: LoreChapter[] = [
  {
    title: "El Eclipse Eterno",
    summary: "El cataclismo del Gran Alineamiento, la Fractura de Cristal y la penumbra del Sol de Ceniza.",
    content:
      "Hace doscientos años, Arcania era una federación pacífica de academias místicas. Todo colapsó durante el experimento del Gran Alineamiento en las Cumbres Místicas, cuando un cónclave de archimagos intentó sintetizar una Runa Madre artificial para canalizar maná infinito. La sobrecarga masiva detonó la Fractura de Cristal: una explosión de energía pura que petrificó cadenas montañosas enteras en cuarzo azul, rasgó la tela de la realidad e interrumpió el flujo del astro divino Sol-Ignis.\n\nDesde entonces, hace veinte inviernos, el Sol de Ceniza emite una iluminación fría y difusa que alteró la fotosíntesis en Oakhaven, congeló los pasos septentrionales de Kaelum-Gard y desató la Cristalopatía Etérea en la fauna. De este cataclismo emergieron dos fuerzas extremas: en la frontera, la Orden del Sol Marchito erigió La Ciudad Calcinada usando Aceite de Fuego Blanco para incinerar toda corrupción mágica; mientras que en los subterráneos imperiales, la Orden del Eclipse Rúnico induce sobrecargas de maná en prisioneros en el Laboratorio Épsilon-Cero para cosechar Ceniza de Éter y forjar la Runa Madre Inmortal.",
  },
  {
    title: "La Corona de Carbón",
    summary: "La traición en Valdren, los doce Búnkeres-Cero y el despertar de la interfaz de mando de la Primera Era.",
    content:
      "Tres siglos antes de la era actual, en la Primera Era de Aethelgardia, el continente vivió su mayor esplendor bajo el mandato de Aurelius Valdren I, el Arconte Vivo. Su capital, Valdren (La Ciudad de las Siete Torres), era una metrópoli levitante de mármol y basalto alimentada por motores de resonancia cero y surcada por naves de titanio rúnico. Para proteger el mundo ante un posible colapso, Aurelius construyó en el manto terrestre la red de Búnkeres-Cero: doce ciudadelas acorazadas que resguardan a más de dos millones de autómatas de combate en estasis criogénica.\n\nEn el año 380 de la Primera Era, durante la Noche de la Traición, siete duques rebeldes envenenaron al monarca con Veneno de Cristal Abisal. Agonizante, Aurelius se despojó de la Corona de Carbón y activó el Protocolo de Bloqueo Absoluto: el reactor colapsó en una implosión que hundió la capital en un abismo de quinientos metros bajo el Velo Negro, transformando a los traidores en Los Centinelas de la Niebla. La Corona de Carbón es la interfaz neural que otorga control telepático sobre los dos millones de autómatas de los Búnkeres-Cero y visión total de las Líneas Ley. Recientemente ha comenzado a emitir pulsos de luz negra, desatando la «Fiebre de las Ruinas» y una carrera continental por reunir los Siete Sellos Arcanos que permiten atravesar el Velo.",
  },
  {
    title: "La Nueva Temporada",
    summary: "Guerra invisible, movilización de legiones, la Sastrería Lux Aeterna y el destino de Grace Chariot.",
    content:
      "El presente de Aethelgardia se dirime en guerras de inteligencias y quiebras bursátiles. En Kaelum-Gard, el anciano Emperador Valerius Kaelen IV sufre de parálisis progresiva por implantes rúnicos, mientras su heredero, el belicista Príncipe Cassian, ha movilizado cinco legiones pesadas hacia las fronteras de Oakhaven proclamando que la paz solo se firma sobre cenizas. En secreto, la Princesa Aurelia financia refugios clandestinos y adquiere trajes de gala en la Sastrería Lux Aeterna —fachada comercial de Shadow Garden— para contrabandear información, mientras el bastardo desterrado Lucian suministra planos militares a los Cuervos del Norte.\n\nShadow Garden libra además una cruenta purga interna contra el Jardín de Espinas, facción renegada liderada por Spina (La Reina de las Espinas), quien huyó a los subterráneos de Mercantia para vender tropas deformadas a la Orden del Eclipse Rúnico. Por último, en el principado costero de Aurelia, el Rey Cassiel mantiene prisionera en la Torre del Sol Naciente a la alquimista Grace Chariot, creadora de la codiciada Poción Dorada capaz de regenerar cualquier herida mortal. Un mensaje cifrado en los bordados de sus vestidos ha llegado a Lux Aeterna, detonando una operación de rescate encubierta que amenaza con quebrar el equilibrio continental.",
  },
];

export const REALM_FACTIONS: RealmFaction[] = [
  {
    name: "Shadow Garden",
    motto: "Caminamos en las sombras para servir a la luz, controlando el destino desde el anonimato.",
    description:
      "Organización clandestina transcontinental que combate a la Orden del Eclipse Rúnico. Dominan la reprogramación de circuitos mágicos y el combate de frecuencia inversa mediante trajes simbióticos de Piel de Sombra.",
  },
  {
    name: "Cuervos del Norte",
    motto: "Ven primero, golpea después.",
    description:
      "Hermandad independiente de exploradores, rastreadores y espías de élite nacida en las fronteras de Kaelum-Gard. Emplean sensores de Éter, capas de plumas de arpía y una estricta red de venta de información verídica.",
  },
  {
    name: "Orden del Sol Marchito",
    motto: "La fe no muere, se endurece.",
    description:
      "Orden teocrática militar con base en La Ciudad Calcinada. Consideran la magia de cristal una herejía que asesinó al Sol e incineran nidos de Miasma y mutantes mediante Aceite de Fuego Blanco incombustible a 1.800 °C.",
  },
  {
    name: "Guardianes del Umbral",
    motto: "Lo que Sophia tejió, el Umbral lo custodia.",
    description:
      "Orden mística fundada por la liche ancestral Morwenna la Demacrada en el Observatorio del Vacío de Arcania. Vigilan las fallas de gravedad cero, sellan criptas de levitación magnética y combaten con Láminas de Fase.",
  },
  {
    name: "Mercenarios del Hierro",
    motto: "Sangre en la arena, Soberanos en la bolsa.",
    description:
      "La compañía militar privada más temida del continente, fundada por Garzhak el Rompe-Ejes en el año 210. Operan desde la fortaleza móvil sobre orugas El Baluarte de Óxido bajo el inquebrantable Mandamiento del Contrato de Sangre.",
  },
  {
    name: "La Falange del Azabache",
    motto: "Ninguna muralla cede si el hierro resiste.",
    description:
      "Gremio de combate pesado y cacería de megafauna fundado en el año 142 en el puesto fronterizo Ferrum-Vigil de Kaelum-Gard. Especialistas en interceptar colosos y extraer osamentas para las Forjas de Almas imperiales.",
  },
  {
    name: "La Hermandad de la Espira Verde",
    motto: "La vida reclama lo herido, la tierra ablanda lo duro.",
    description:
      "Gremio silvano fundado hace tres siglos por Alanon el Viejo en Veridia-Frontera (Oakhaven). Cazadores y botánicos que sanean raíces enfermas y purgan brotes de Miasma sin alterar el equilibrio del bosque.",
  },
  {
    name: "La Hermandad de la Escuadra Rígida",
    motto: "La línea recta no yerra.",
    description:
      "Cuerpo paraestatal de cartografía militar y contrainteligencia fundado por la Alta Elfa Elenariel la Recta en Argentis. Trazadores geométricos que custodian en secreto los «Mapas de la Discordia».",
  },
];

export const FACTION_DOSSIERS: FactionDossier[] = [
  {
    id: "shadow-garden",
    name: "Shadow Garden",
    motto: "Caminamos en las sombras para servir a la luz, controlando el destino desde el anonimato.",
    alignedRealm: "Transversal (Sanctum del Vacío / Red Lux Aeterna)",
    history:
      "Nació en el epicentro de la Fractura de Cristal como respuesta a la persecución sistemática de la Inquisición contra las víctimas de la Podredumbre del Circuito (Corrupción Rúnica). Su enigmático fundador, conocido como el Líder Supremo o Programador Rúnico Vivo, descubrió que la corrupción no era un castigo divino sino un desbordamiento de datos mágicos. Mediante inyecciones precisas de Éter puro, reprogramó los circuitos colapsados de las víctimas, restaurando su cordura y desbloqueando capacidades sobrehumanas. Estas rescatadas conformaron el núcleo operativo de las Siete Sombras Primordiales y la red clandestina de las Cifras, jurando extirpar a la Orden del Eclipse Rúnico de la faz del continente.",
    specialization:
      "Guerra asimétrica de frecuencia inversa, anulación de firmas de maná, reprogramación rúnica y asesinato quirúrgico de Núcleos de Aether.",
    tactics:
      "Operaciones celulares compartimentadas. Anulan luz y sonido mediante resonancias inversas, eliminando objetivos sin detonar alarmas mágicas y encubriendo sus asaltos como incidentes aislados.",
    equipment:
      "Traje simbiótico de Piel de Sombra (absorbe 99.8% de energía mágica y cinética, metamórfico), Hojas de Frecuencia Cero de metal líquido retráctil, Hilos de la Parca conductores y esteganografía textil en prendas de gala.",
    headquarters:
      "El Sanctum del Vacío: ciudadela subterránea en una dimensión de bolsillo entre Oakhaven y los Páramos, conectada mediante portales de espejo de azabache en las boutiques de la Sastrería Lux Aeterna.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Clasificados como amenaza criminal Alfa por la Inquisición, pero infiltrados en la corte a través de la clientela de alta costura de la Princesa Aurelia.",
      },
      {
        realm: "Nexo de Arcania",
        description:
          "Infiltrados en los laboratorios de la Academia de Cristal para supervisar y sabotear experimentos que puedan reactivar la Fractura.",
      },
      {
        realm: "Protectorado de Oakhaven",
        description:
          "Tregua tácita con los círculos druídicos: purgan células de la Orden del Eclipse en los bosques a cambio de resinas vírgenes de alta pureza.",
      },
      {
        realm: "Unión de los Páramos",
        description:
          "Comercio logístico clandestino a través de caravanas Skaven y mercaderes Tanukis para transportar reactivos sin control aduanero.",
      },
    ],
    playerDetails:
      "Un agente de Shadow Garden destaca en sigilo absoluto, letalidad de primer impacto y contramedidas contra magia rúnica. Su ventaja radica en operar sin dejar rastro de maná detectable.",
    startingItem: "Fragmento de Traje de Sombra (otorga camuflaje táctico contra detección arcana).",
    bonuses: ["+2 en Sigilo e Infiltración", "+1 en Letalidad de Primer Golpe", "Sobrecarga de Sombra (ignora escudos mágicos Lv1-Lv2)"],
  },
  {
    id: "cuervos-del-norte",
    name: "Cuervos del Norte",
    motto: "Ven primero, golpea después.",
    alignedRealm: "Kaelum-Gard (Fronteras y Picos Septentrionales)",
    history:
      "Nacieron originalmente como unidades de reconocimiento y exploración enviadas a cartografiar pasos dentro de zonas infectadas por la Fractura de Cristal. Al comprender que el Alto Mando imperial los consideraba prescindibles, cortaron la cadena de mando y establecieron una hermandad autónoma de inteligencia. Operan bajo un código de honor estricto donde la información jamás se adultera ni se vende con sesgo. En la actualidad, cuentan con un contacto clandestino de alto nivel en la corte imperial: Lucian, el Príncipe Bastardo desterrado, quien les suministra registros de movimientos militares.",
    specialization:
      "Espionaje de Éter y teledetección: utilizan sensores de cristal facetado que captan vibraciones de maná y pasos de tropas a kilómetros de distancia.",
    tactics:
      "Guerra de guerrillas, emboscadas en terrenos escarpados, sabotaje logístico y evasión sistemática del choque frontal en campo abierto.",
    equipment:
      "Capas de plumas de Arpías de las Cumbres para mimetismo total en roca y nieve, y dagas impregnadas con toxina paralizante de Aracnida Abisal.",
    headquarters:
      "El Nido de Sombras: complejo de puestos de vigía y túneles en los picos más elevados entre Kaelum-Gard y la Unión de los Páramos, con control visual directo sobre las rutas viales.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Oficialmente declarados desertores y traidores, pero contratados de forma encubierta por generales para misiones de reconocimiento que el ejército regular no puede firmar.",
      },
      {
        realm: "Oakhaven",
        description:
          "Pacto de respeto con los Elfos Silvanos: veda de caza en arboledas sagradas a cambio de informes sobre patrullas imperiales.",
      },
      {
        realm: "Unión de los Páramos",
        description:
          "Sus clientes comerciales más fieles: las caravanas pagan cuantiosos peajes en oro por informes actualizados de nidos de monstruos antes de avanzar.",
      },
      {
        realm: "Nexo de Arcania",
        description:
          "Relación puramente transaccional; venden lecturas de fluctuación de Líneas Ley a los eruditos del Prisma.",
      },
    ],
    playerDetails:
      "Un Cuervo del Norte sobresale en supervivencia en terrenos hostiles, reconocimiento y anticipación táctica. Rara vez se ve sorprendido en combate y siempre cuenta con una vía de escape prevista.",
    startingItem: "Cristal de Resonancia Rúnica (detección de monstruos y magia en radio corto).",
    bonuses: ["+2 en Rastreo y Supervivencia", "+1 en Percepción e Iniciativa", "Camuflaje de Cumbres"],
  },
  {
    id: "orden-del-sol-marchito",
    name: "La Orden del Sol Marchito",
    motto: "La fe no muere, se endurece.",
    alignedRealm: "Frontera Arcania / Kaelum-Gard (La Ciudad Calcinada)",
    history:
      "Orden nacida en los límites exteriores de Arcania tras la detonación de la Fractura de Cristal. Formada por clérigos, templarios y supervivientes que consideran la energía del cristal como una aberración corruptora que 'asesinó' al sol original (Sol-Ignis), transformándolo en el Sol de Ceniza. Su misión es la purga total de la corrupción mágica en el continente, erradicando abominaciones cristalizadas, mutaciones de Éter y laboratorios clandestinos sin titubeos.",
    specialization:
      "Piromancia estática y combate de choque pesado de primera línea. Emplean resonancias acústicas que sobrecargan y fracturan cristales de Éter cercanos.",
    tactics:
      "Tácticas de tierra quemada. Despliegan estandartes rúnicos que emiten frecuencias de disrupción mágica que provocan fallos críticos o explosiones en armas arcanas enemigas.",
    equipment:
      "Armaduras completas de placas refractarias con grabados del sol eclipsado, mazas bendecidas y Aceite de Fuego Blanco (compuesto alquímico que arde a 1.800 °C y niega la regeneración biológica).",
    headquarters:
      "La Ciudad Calcinada: fortaleza erigida con piedra volcánica y basalto refractario en la frontera entre Arcania y Kaelum-Gard, funcionando como cordón sanitario no oficial frente a brotes de cristal.",
    relations: [
      {
        realm: "Nexo de Arcania",
        description:
          "Hostilidad absoluta: consideran a los magos y eruditos del Prisma como los pecadores originales responsables de la caída del Sol.",
      },
      {
        realm: "Kaelum-Gard",
        description:
          "Tolerancia pragmática: el Imperio los deja operar porque purgan nidos de monstruos y mutaciones fronterizas sin costo para el erario militar.",
      },
      {
        realm: "Oakhaven",
        description:
          "Conflicto recurrente: la Orden incinera bosques enteros si sospecha presencia de miasma o cristal, desatando enfrentamientos directos con dríadas y silvanos.",
      },
      {
        realm: "Unión de los Páramos",
        description:
          "Compran metales refractarios a las fundiciones de la Unión, pero inspeccionan rigurosamente las caravanas para evitar tráfico de reliquias corruptas.",
      },
    ],
    playerDetails:
      "Un templario del Sol Marchito posee una devoción fanática y una resistencia sobrehumana al fuego y al dolor. Su presencia inspira pavor tanto en enemigos como en aliados.",
    startingItem: "Vial de Aceite de Fuego Blanco (incinera estructuras y anula curación o regeneración enemiga).",
    bonuses: ["+2 en Resistencia al Fuego/Calor", "+1 en Intimidación Teocrática", "Daño sagrado contra infectados y aberraciones de Éter"],
  },
  {
    id: "guardianes-del-umbral",
    name: "Guardianes del Umbral",
    motto: "Lo que Sophia tejió, el Umbral lo custodia.",
    alignedRealm: "Nexo de Arcania (Cumbres Místicas y Grietas)",
    history:
      "Orden mística y hermética fundada hace tres siglos por la liche ancestral Morwenna la Demacrada. Su propósito original fue confiscar textos prohibidos de transmutación y sellar las criptas ancestrales de la Primera Era cuyos mecanismos de levitación magnética comenzaron a degradarse. Tras la Fractura de Cristal, sus miembros hicieron el Voto del Guardián: habitar en el límite entre el plano material y el etéreo para impedir que entidades del Vacío devoren lo que resta de la creación.",
    specialization:
      "Manipulación gravitatoria, parpadeo de fase interdimensional, contención de estática arcana y recuperación de reliquias proscritas.",
    tactics:
      "Combate de reposicionamiento constante. Utilizan la intangibilidad breve para deslizarse a través de barreras físicas y escudos, congelando el flujo de maná del adversario en segundos.",
    equipment:
      "Láminas de Fase (hojas forjadas en aleación de plata rúnica y cuarzo de refracción que atraviesan armaduras sólidas y cortan la energía vital), báculos de cuarzo ahumado y mantos de obsidiana estelar.",
    headquarters:
      "El Observatorio del Vacío: santuario erigido en una anomalía de gravedad cero en las Cumbres Místicas de Arcania, suspendido sobre abismos de cuarzo.",
    relations: [
      {
        realm: "Nexo de Arcania",
        description:
          "El Senado de los Nueve Prismas los considera un mal necesario para resellar las grietas y evitar el colapso de las islas flotantes.",
      },
      {
        realm: "Kaelum-Gard",
        description:
          "Ocultos de los radares imperiales; el clero de Kaelum-Gard los cataloga como espectros saboteadores fuera de la ley.",
      },
      {
        realm: "Oakhaven",
        description:
          "Fricción diplomática debido a incursiones de los Guardianes en túmulos botánicos ancestrales en busca de sellos arcanos.",
      },
      {
        realm: "Unión de los Páramos",
        description:
          "Hostilidad abierta hacia los Buscadores de Chatarra, a quienes acusan de activar artefactos apocalípticos por codicia mercantil.",
      },
    ],
    playerDetails:
      "Un Guardián del Umbral altera las leyes físicas del entorno. No depende de la fuerza bruta, sino de determinar con precisión matemática dónde y cuándo se desarrolla el combate.",
    startingItem: "Daga de Lámina de Fase (ignora armaduras físicas y escudos materiales).",
    bonuses: ["+2 en Manipulación Espacial y Gravedad", "+1 en Conocimiento Arcano", "Parpadeo de Fase (intangibilidad 1 turno/combate)"],
  },
  {
    id: "mercenarios-del-hierro",
    name: "Mercenarios del Hierro",
    motto: "Sangre en la arena, Soberanos en la bolsa.",
    alignedRealm: "Unión de los Páramos (El Baluarte de Óxido)",
    history:
      "Compañía militar y de seguridad privada nacida en el año 210 de la Fragmentación, cuando el caudillo orco Garzhak el Rompe-Ejes unificó las bandas de armas pagadas tras el colapso de las rutas orientales a manos de Gnolls salvajes. Sus raíces se remontan a la Séptima Legión de Castigo que desertó de Kaelum-Gard. Rigen su conducta bajo el dios Kaldor y el Mandamiento del Contrato de Sangre: una palabra empeñada o un contrato firmado con sangre es inquebrantable; el desertor o perjuro es declarado 'Sin Yunque' y ejecutado sin piedad.",
    specialization:
      "Guerra de asedio, defensa perimetral ante megafauna de tormenta, escolta blindada de convoyes y artillería móvil pesada.",
    tactics:
      "Formaciones acorazadas cerradas tipo testudo con paveses de hierro remachados con biocemento. Absorben la carga enemiga y contraatacan con descargas coordinadas de proyectiles pesados.",
    equipment:
      "Armaduras pesadas de placas remachadas, escudos de biocemento, hachas de doble filo, martillos de demolición y torretas ballesteras montadas en plataformas móviles a vapor.",
    headquarters:
      "El Baluarte de Óxido: colosal fortaleza rodante impulsada por orugas de vapor que recorre incesantemente las calzadas de la Unión de los Páramos y cotiza en la Bolsa de Mercantia ($BAL).",
    relations: [
      {
        realm: "Unión de los Páramos",
        description:
          "Simbiosis perfecta: constituyen el brazo militar privado y la garantía de seguridad de las rutas de la Liga de Mercaderes.",
      },
      {
        realm: "Kaelum-Gard",
        description:
          "Desprecio institucional: el Imperio los ve como bárbaros indisciplinados, pero los contrata secretamente para operaciones de limpieza en zonas grises.",
      },
      {
        realm: "Nexo de Arcania",
        description:
          "Clientes habituales: Arcania paga altos aranceles en Soberanos de Éter para escoltar convoyes terrestres de cristal bruto hacia las refinerías.",
      },
      {
        realm: "Oakhaven",
        description:
          "Relación comercial distante pero respetuosa: escoltan cargamentos de resina y madera noble a través del desierto.",
      },
    ],
    playerDetails:
      "Un Mercenario del Hierro es el ancla del equipo: un baluarte inamovible capaz de sostener la línea cuando las defensas colapsan y dictar el ritmo del enfrentamiento a fuerza de acero.",
    startingItem: "Sello del Contrato de Sangre (garantiza inmunidad y auxilio en todas las caravanas de la Unión).",
    bonuses: ["+2 en Defensa de Posición y Escudos", "+1 en Armamento Pesado Mecánico", "Inmunidad a efectos de miedo en formación"],
  },
  {
    id: "falange-del-azabache",
    name: "La Falange del Azabache",
    motto: "Ninguna muralla cede si el hierro resiste.",
    alignedRealm: "Kaelum-Gard (Ferrum-Vigil / Bastión del Sur)",
    history:
      "Fundado en el año 142 de la Fragmentación por el Capitán Executor Marcus Valer tras una devastadora embestida de colosos que estuvo a punto de arrasar las fundiciones del sur. Se instituyó como la fuerza civil-militar de contención de primera línea del Imperio de Kaelum-Gard, encargada de interceptar depredadores alfa, proteger minas de carbón y suministrar osamentas colosales a la Gran Forja de Almas de Argentis.",
    specialization:
      "Cacería de megafauna, defensa perimetral estática, demolición y extracción pesada de osamentas de monstruos.",
    tactics:
      "Fijación y anclaje: clavan picas de basalto con arpones neumáticos en las articulaciones de bestias colosales para inmovilizarlas antes de asestar el golpe de gracia.",
    equipment:
      "Paveses de basalto negro facetado, martillos de impacto neumático, arpones de tracción mecánica y placas con refuerzos de hueso mineralizado.",
    headquarters:
      "Ferrum-Vigil: bastión acorazado y puesto militar fronterizo avanzado en los desfiladeros del sur de Kaelum-Gard.",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Brazo de choque y orgullo defensivo del ejército regular; mantienen el pacto secreto 'Vigilia de Sangre' con la Casa noble vampírica Darkthorne.",
      },
      {
        realm: "Unión de los Páramos",
        description:
          "Compran biocemento para reforzar murallas y contratan mecánicos para el mantenimiento de sus arpones de vapor.",
      },
      {
        realm: "Oakhaven",
        description:
          "Fricción continua: sus partidas de caza con frecuencia persiguen presas hasta las arboledas protegidas del Protectorado.",
      },
    ],
    playerDetails:
      "Un miembro de la Falange del Azabache es un cazador de bestias pesadas por excelencia, entrenado para resistir embestidas colosales y mantener la compostura bajo presión extrema.",
    startingItem: "Grillete de Anclaje de Basalto (fija la posición contra derribos y empujes de fuerza bruta).",
    bonuses: ["+2 en Combate vs Megafauna", "+1 en Fortaleza Física", "Resistencia a Derribo"],
  },
  {
    id: "hermandad-espira-verde",
    name: "La Hermandad de la Espira Verde",
    motto: "La vida reclama lo herido, la tierra ablanda lo duro.",
    alignedRealm: "Protectorado de Oakhaven (Veridia-Frontera)",
    history:
      "Gremio silvano fundado hace tres siglos por el elfo Alanon el Viejo tras la primera gran plaga de Miasma en el norte. Surgió como un cuerpo selecto de rastreadores y botánicos con la misión de purgar las infecciones de cristal en la fauna de forma quirúrgica, evitando la degradación del biocampo del bosque y custodiando las reservas de la Savia Sagrada de Gaya.",
    specialization:
      "Rastreo forestal profundo, alquimia botánica, sanación de raíces y contención de esporas corruptoras.",
    tactics:
      "Emboscar desde el dosel arbóreo utilizando camuflaje fúngico y toxinas anestésicas; neutralizan a los agresores sin dañar la vegetación circundante.",
    equipment:
      "Arcos de madera de raíz de hierro, carcajes con flechas de espino cáustico, viales de resina estabilizadora y mantos de musgo vivo fotosintético.",
    headquarters:
      "Veridia-Frontera: santuario arbóreo edificado en el linde exterior de las selvas de Oakhaven.",
    relations: [
      {
        realm: "Protectorado de Oakhaven",
        description:
          "Venerados como los guardianes indispensables de la salud del Árbol Padre y del equilibrio biológico.",
      },
      {
        realm: "Orden del Sol Marchito",
        description:
          "Enemistad a muerte: la Hermandad combate a los templarios del fuego cada vez que estos intentan incendiar arboledas infectadas.",
      },
      {
        realm: "Shadow Garden",
        description:
          "Intercambio confidencial de reactivos botánicos y resinas puras a cambio de la neutralización de agentes de la Orden del Eclipse.",
      },
    ],
    playerDetails:
      "Un hermano de la Espira Verde domina la herbolaria de combate, el tiro de precisión y el sigilo en entornos naturales. Es el sanador y rastreador supremo en cualquier expedición.",
    startingItem: "Bolsa de Esporas de Veridia (crea una nube de niebla curativa para aliados y cegadora para enemigos).",
    bonuses: ["+2 en Alquimia y Herbolaria", "+1 en Puntería a Distancia", "Sanación Acelerada en entorno natural"],
  },
  {
    id: "hermandad-escuadra-rigida",
    name: "La Hermandad de la Escuadra Rígida",
    motto: "La línea recta no yerra.",
    alignedRealm: "Kaelum-Gard (Argentis / Sector del Yugo Central)",
    history:
      "Institución paraestatal de cartografía militar, geometría sagrada y contrainteligencia fundada en los primeros años del Imperio por la Alta Elfa Elenariel la Recta. Su labor oficial es trazar con precisión matemática las calzadas y defensas del reino bajo los edictos de Aethelgard. En secreto, operan como el servicio de espionaje del clero imperial y custodian los «Mapas de la Discordia»: documentos topográficos deliberadamente alterados para legitimar futuras anexiones territoriales.",
    specialization:
      "Cartografía estratégica, topografía de precisión, contrainteligencia de Estado y detección de anomalías espaciales.",
    tactics:
      "Análisis del terreno previo a la batalla; modifican la arquitectura del campo de combate mediante barricadas prefabricas y fuego de cobertura balístico.",
    equipment:
      "Compases de hierro de precisión, pergaminos de medición rúnica, teodolitos de cuarzo y dagas de geometría recta ocultas en el uniforme de escriba.",
    headquarters:
      "La Torre de la Plomada: complejo anexo al Gran Consistorio en Argentis (Kaelum-Gard).",
    relations: [
      {
        realm: "Kaelum-Gard",
        description:
          "Instrumento confidencial directo del Emperador y de la Inquisición para auditar la lealtad de nobles y gobernadores.",
      },
      {
        realm: "Protectorado de Oakhaven",
        description:
          "Alerta máxima: los espías élficos intentan permanentemente infiltrar la Torre de la Plomada para destruir los Mapas de la Discordia.",
      },
      {
        realm: "Unión de los Páramos",
        description:
          "Compran planos de caminos e infraestructura vial a los ingenieros de la Unión para mantener actualizado el registro cartográfico continental.",
      },
    ],
    playerDetails:
      "Un miembro de la Escuadra Rígida sobresale en análisis táctico, lectura de planos y deducción. En batalla otorga ventajas posicionales y anula tácticas de engaño o emboscada enemigas.",
    startingItem: "Compás de la Plomada Imperial (revela pasajes secretos, trampas mecánicas y rutas óptimas de escape).",
    bonuses: ["+2 en Análisis Táctico y Cartografía", "+1 en Desactivación de Mecanismos", "Inmunidad a desorientación geográfica"],
  },
];
