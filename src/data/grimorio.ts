import type { GrimoireCategory } from "../types";

/**
 * --- GUÍA PARA AÑADIR NUEVAS MAGIAS ---
 * 
 * Para añadir una nueva categoría:
 * 1. Agrega un objeto al array `GRIMOIRE_DATA`.
 * 2. Define un `id` único y un `title`.
 * 3. En `styles`, añade los diferentes estilos de esa categoría (ej: "Magia de Fuego" dentro de "Elemental").
 * 
 * Para añadir un nuevo Estilo de Magia:
 * 1. Cada estilo tiene un `title` y una `description` (Lore científico/místico).
 * 2. En `levels`, usa el número del nivel (1-5) como llave.
 * 3. Cada nivel es un array de habilidades con: name, effect, cd, limit y antiManoNegra.
 */

export const GRIMOIRE_DATA: GrimoireCategory[] = [
  {
    id: "invocacion",
    title: "Magia de Invocación",
    styles: [
      {
        id: "espiritus-elementales",
        title: "Espíritus Elementales",
        description: `La Magia de Invocación de Espíritus Elementales se explica mediante la **física de plasmones** y la **teoría de campos cuánticos de baja energía**. El invocador no crea vida biológica, sino que actúa como un puente de entrelazamiento entre el plano material y el plano elemental, una dimensión donde la energía existe en estado de conciencia pura sin soporte orgánico. Al emitir una frecuencia de maná específica, el usuario "captura" una porción de energía elemental y le otorga una **estructura de confinamiento magnético**, permitiendo que dicha energía interactúe con el mundo físico como un ente semi-autónomo.

Científicamente, el espíritu invocado es una acumulación de **plasma altamente ionizado** o materia en un estado cuántico coherente (como un condensado de Bose-Einstein). La estabilidad del espíritu depende de la **ecuación de continuidad del maná**: el invocador debe proveer un flujo constante de electrones o energía potencial para evitar que la entidad sufra una descompresión termodinámica (se disipe). A niveles altos, el invocador puede programar algoritmos de comportamiento en la matriz energética del espíritu, permitiéndole realizar cálculos de combate avanzados y manipular la entropía del entorno a gran escala.`,
        levels: {
          1: [
            {
              level: 1,
              name: "Familiar Elemental Menor",
              effect: "El usuario manifiesta una pequeña esfera de energía elemental (fuego, agua, aire o tierra) con conciencia básica. Sirve para tareas de utilidad simple: iluminar (fuego), enfriar (agua/hielo), generar una brisa (aire) o remover 1kg de tierra.",
              cd: "2 turnos tras disiparse",
              limit: "El espíritu es intangible y no puede atacar; tiene el tamaño de una pelota de tenis.",
              antiManoNegra: "No puede usarse para espiar ni atravesar paredes; es puramente una herramienta de utilidad visible."
            },
            {
              level: 1,
              name: "Ignición/Condensación de Pulso",
              effect: "El espíritu realiza una única descarga de su elemento antes de desaparecer. Una chispa que quema tela, un chorro de agua de 1 litro o una ráfaga que apaga una antorcha.",
              cd: "3 turnos",
              limit: "El alcance máximo es de 2 metros desde el usuario.",
              antiManoNegra: "El daño físico es nulo (<10 J); solo sirve para interactuar con el ambiente o causar una distracción leve."
            }
          ],
          2: [
            {
              level: 2,
              name: "Espíritu de Apoyo (Forma Animal)",
              effect: "Invoca un espíritu con forma de animal pequeño (halcón, gato, serpiente) hecho de energía elemental. Puede moverse de forma autónoma hasta 20 metros y realizar ataques débiles (picotazos de fuego, mordidas de hielo).",
              cd: "4 turnos",
              limit: "Tiene 1 HP; cualquier ataque lo devuelve a su plano de origen.",
              antiManoNegra: "El usuario debe dar órdenes verbales, permitiendo que el enemigo anticipe los movimientos del espíritu."
            },
            {
              level: 2,
              name: "Aura Elemental Compartida",
              effect: "El espíritu se fusiona con una parte del cuerpo del usuario. Otorga resistencia térmica (50%) contra el elemento opuesto o aumenta la fricción del golpe.",
              cd: "3 turnos",
              limit: "Dura solo 3 turnos y causa fatiga muscular en la zona fusionada.",
              antiManoNegra: "No aumenta el daño base, solo añade un efecto cosmético y de resistencia situacional."
            }
          ],
          3: [
            {
              level: 3,
              name: "Guardián Elemental Medio",
              effect: "Invoca una entidad humanoide de 1.5 metros de altura compuesta puramente del elemento. Posee capacidad ofensiva real (200 N de fuerza) y puede recibir hasta 3 golpes antes de disiparse.",
              cd: "5 turnos",
              limit: "El usuario no puede alejarse más de 10 metros del Guardián o la conexión se rompe.",
              antiManoNegra: "El espíritu es lento (10 km/h); un enemigo ágil puede rodearlo fácilmente para atacar directamente al invocador."
            },
            {
              level: 3,
              name: "Sincronía de Sentidos (Ojo del Elemental)",
              effect: "El usuario ve y oye a través del espíritu invocado. Permite reconocimiento avanzado hasta a 100 metros de distancia.",
              cd: "4 turnos",
              limit: "Mientras el usuario usa los sentidos del espíritu, su propio cuerpo queda sordo y ciego al entorno.",
              antiManoNegra: "Si el espíritu es destruido mientras los sentidos están vinculados, el usuario sufre una migraña que anula su magia por 1 turno."
            }
          ],
          4: [
            {
              level: 4,
              name: "Coloso Elemental Transitorio",
              effect: "Invoca una masa elemental masiva de 3 metros de altura con gran inercia. Puede derribar puertas, muros de piedra o aplastar enemigos con una fuerza de 5000 N.",
              cd: "7 turnos",
              limit: "Solo puede realizar 3 acciones antes de colapsar por inestabilidad molecular.",
              antiManoNegra: "El coloso emite un ruido masivo (terremoto, rugido de fuego, etc.) 1 turno antes de aparecer, advirtiendo a todos de su llegada."
            },
            {
              level: 4,
              name: "Tormenta Elemental Vinculada",
              effect: "El espíritu se disipa en un área para alterar el clima local. Crea una zona de 15 metros de diámetro con lluvia ácida, granizo pesado o calor abrasador (60°C).",
              cd: "6 turnos",
              limit: "El usuario también sufre los efectos del clima si está dentro del área.",
              antiManoNegra: "La tormenta es estática y tarda 1 turno en cargarse, permitiendo la huida de los oponentes."
            },
            {
              level: 4,
              name: "Fusión Álmica (Avatar)",
              effect: "El usuario y el espíritu se convierten en una sola entidad. El usuario puede transformar partes de su cuerpo en el elemento (brazos de lava, pies de viento) durante 3 turnos.",
              cd: "8 turnos",
              limit: "Al terminar la fusión, el usuario sufre una bajada de temperatura corporal peligrosa o quemaduras internas (estrés térmico).",
              antiManoNegra: "La transformación no es invulnerabilidad; el usuario sigue teniendo un núcleo físico que puede ser herido."
            }
          ],
          5: [
            {
              level: 5,
              name: "Señor Elemental (Avatar de la Dimensión)",
              effect: "Invoca a una entidad de rango supremo con conciencia superior. El espíritu puede manipular la física del mapa (crear ríos, incendios forestales o grietas tectónicas) con un poder de salida de 10^6 Joules.",
              cd: "Global (una vez por sesión)",
              limit: "El usuario debe permanecer en un círculo ritual y no puede realizar ninguna otra acción.",
              antiManoNegra: "El espíritu tiene una personalidad propia y puede negarse a atacar a ciertos objetivos si considera que el equilibrio elemental se rompe."
            },
            {
              level: 5,
              name: "Aniquilación por Retroalimentación",
              effect: "El espíritu se sobrecarga de maná y explota en un vector definido. Una explosión termobarica o de presión hidráulica que genera 50,000 Newtons de fuerza expansiva.",
              cd: "Global (destruye al espíritu y agota al usuario)",
              limit: "Requiere que el espíritu esté a menos de 5 metros del objetivo.",
              antiManoNegra: "La carga de explosión es visible (el espíritu brilla intensamente), dando 1 turno de reacción para protegerse o alejarse."
            },
            {
              level: 5,
              name: "Puerta de la Gnosis Elemental",
              effect: "Abre un portal estable al plano elemental del que emergen hordas de pequeños entes. Crea un caos absoluto en el campo de batalla, con múltiples fuentes de daño elemental aleatorio en un radio de 50 metros.",
              cd: "Global",
              limit: "El portal es incontrolable; los entes atacan a cualquier ser vivo que no posea la firma de maná del invocador.",
              antiManoNegra: "El portal puede ser cerrado prematuramente si el usuario es golpeado o si se aplica Antimagia directamente sobre el nodo central del portal."
            }
          ]
        }
      }
    ]
  },
  // -- AÑADIR NUEVAS CATEGORÍAS AQUÍ (Elemental, Control, Luz, Oscuridad) --
  {
    id: "elemental",
    title: "Magia Elemental",
    styles: [
      /* { id: 'fuego', title: 'Piroquinesis', ... } */
    ]
  },
  {
    id: "control",
    title: "Magia de Control",
    styles: []
  },
  {
    id: "luz",
    title: "Magia de Luz",
    styles: []
  },
  {
    id: "oscuridad",
    title: "Magia de Oscuridad",
    styles: []
  }
];
