import type { AbilityLevel, GrimoireCategory, MagicStyle } from "../types";

type AbilityPatch = Partial<Pick<AbilityLevel, "effect" | "cd" | "limit" | "antiManoNegra">>;

const LEVEL_GUARDS: Record<number, string> = {
  1: "Lv1 queda como tecnica inicial: ventaja breve, lectura o utilidad, sin cierre automatico del conflicto.",
  2: "Lv2 permite presion real, pero requiere posicionamiento, lectura o preparacion visible.",
  3: "Lv3 ya cambia una escena, aunque conserva ventana de respuesta y coste fisico o mental.",
  4: "Lv4 es decisivo solo si el usuario sostiene concentracion y acepta una desventaja clara.",
  5: "Lv5 es pinaculo narrativo: exige aviso, coste severo y aprobacion del ritmo de escena; no funciona como instakill gratuito.",
};

const STYLE_ROLES: Record<string, string> = {
  "bestias-divinas": "Invocacion de presencia mayor; fuerte por area y presion, vulnerable por anclaje.",
  "invocación-de-objetos": "Versatilidad logistica; no reemplaza preparacion ni crea reliquias perfectas.",
  "invocación-de-sombras": "Control de vision y emboscada; cae ante luz, calor o revelacion.",
  "espíritus-de-la-naturaleza": "Terreno y apoyo organico; depende del ambiente y del equilibrio natural.",
  "espíritus-heroicos": "Prestamo de tecnica heroica; exige memoria, honor y compatibilidad.",
  "seres-celestiales-demoníacos": "Poder polarizado; cada uso deja marca fisica, social o espiritual.",
  "texto-31-txt": "Hemomancia; muy fuerte en control biologico, inutil contra objetivos sin sangre.",
  "texto-37-txt": "Ferrocinesis; domina metal visible, pero sufre contra aislantes y electricidad.",
  "texto-38-txt": "Plasma; alto dano, alto riesgo, cero sigilo.",
  "texto-35-txt": "Sonido; control de ritmo y desorientacion, mitigable por distancia y barreras.",
  "transmutación-de-materia": "Cambio material; requiere contacto, muestra previa o matriz estable.",
  "creación-de-pociones": "Preparacion alquimica; poderosa antes de la escena, lenta durante combate.",
  "homúnculos-y-vida-artificial": "Aliados fabricados; consumen control mental y recursos persistentes.",
  "creación-de-tulpa": "Construccion psionica; depende de foco emocional y se rompe con interrupciones.",
  "dilatación-temporal": "Velocidad relativa; no permite golpear sin consecuencia ni ignorar defensa.",
  "retroceso-temporal": "Correccion limitada; conserva cicatrices, deuda temporal o memoria rota.",
  "visión-del-futuro": "Prediccion probable; no dicta resultados imposibles.",
  "texto-39-txt": "Cronomancia de asalto; ventaja de timing, no supremacia absoluta.",
  "teletransportación": "Movimiento espacial; requiere linea, marca, portal o tiempo de cierre.",
  "distorsión-espacial": "Geometria defensiva; excelente contra trayectorias, debil ante area y caos.",
  "dimensiones-de-bolsillo": "Dominio logistico; no borra enemigos ni ignora seguridad narrativa.",
  "magia-de-gravedad-el-coloso-deva-full-rush": "Asalto gravitatorio; brutal pero telegrafiado y agotador.",
  "texto-25-txt": "Ilusion mental; gana por percepcion, se rompe con dano, prueba o anclaje sensorial.",
  "texto-26-txt": "Sugestion; persuade o interrumpe, no esclaviza sin coste extremo.",
  "magia-de-soporte-eter-sintonía": "Buffs y sincronizacion; fuerte en equipo, pobre en duelos aislados.",
  "runas-de-protección": "Defensa preparada; poderosa si hay soporte, pobre si se improvisa tarde.",
  "runas-de-ataque": "Ofensiva inscrita; requiere marca, linea o superficie estable.",
  "runas-de-trampa": "Control condicional; visible si se inspecciona y limitada por disparadores.",
  "runas-de-mejora-de-equipo": "Escalado de equipo; se rompe por sobrecarga y mantenimiento.",
  "escritura-rúnica-en-el-aire": "Runas rapidas; flexibles pero fragiles y caras de sostener.",
  "texto-28-txt": "Magia divina; restaura y protege, exige armonia y deja rastros sagrados.",
  "texto-36-txt": "Luz solida; precision y formas, no masa astronomica.",
  "texto-29-txt": "Magia demoniaca; potencia por sacrificio, siempre con deuda.",
  "texto-40-txt": "Acido; corrosion gradual y control de zona, evita ejecuciones directas.",
  "texto-27-txt": "Vacio; entropia controlada, siempre lenta, detectable y limitada por anclaje.",
};

const ABILITY_PATCHES: Record<string, AbilityPatch> = {
  "bestias-divinas::manifestacion-del-primordial": {
    effect:
      "Convoca una fraccion del Primordial para descargar una onda de presion concentrada que puede abrir una brecha en fortificaciones o dispersar una formacion si no se evacua.",
    cd: "Global (una vez por semana de rol).",
    limit:
      "Requiere 3 turnos de materializacion, circulo visible y anclaje inmovil. Al finalizar, el usuario queda en estado critico y no puede canalizar invocacion mayor por 24 horas.",
    antiManoNegra:
      "No borra ejercitos ni mata automaticamente. Jefes, personajes con defensa preparada o quienes salgan del area reciben dano narrativo proporcional y conservan opcion de respuesta.",
  },
  "bestias-divinas::juicio-de-la-bestia-campo-de-ley": {
    effect:
      "Impone una ley fisica parcial en un radio de 20 metros durante 3 turnos: peso alterado, friccion irregular o distorsion luminica.",
    cd: "Global.",
    limit:
      "Solo una ley puede estar activa. El usuario debe nombrarla claramente y sostener concentracion; cambiarla colapsa el campo.",
    antiManoNegra:
      "La ley afecta a aliados y usuario. No anula voluntades, no cancela tecnicas superiores ni transforma la escena en victoria automatica.",
  },
  "bestias-divinas::resurreccion-por-sacrificio-divino": {
    effect:
      "Devuelve a un aliado muerto recientemente a un estado estable, consciente y gravemente debilitado, con una marca divina permanente.",
    cd: "Global (solo una vez en la historia del personaje).",
    limit:
      "Exige sacrificio equivalente y aceptacion narrativa del pacto. No restaura recursos, organos destruidos ni consecuencias sociales.",
    antiManoNegra:
      "No reinicia una derrota ni permite cadena de resurrecciones. El aliado vuelve vulnerable y bajo una condicion impuesta por la entidad.",
  },
  "invocación-de-sombras::reino-de-la-penumbra": {
    effect:
      "Crea un dominio de sombra de 15 metros que reduce visibilidad, enfria el terreno y fortalece tecnicas umbrales durante 3 turnos.",
    antiManoNegra:
      "No garantiza evasion perfecta ni invulnerabilidad. Luz intensa, fuego sostenido o ruptura del anclaje abre zonas seguras dentro del dominio.",
  },
  "invocación-de-sombras::transformacion-en-sombra-pura": {
    effect:
      "El cuerpo se vuelve parcialmente intangible durante 2 turnos, permitiendo atravesar rendijas y reducir dano fisico directo.",
    limit:
      "No puede atacar mientras atraviesa materia. La luz intensa fija su silueta y lo vuelve vulnerable al siguiente impacto.",
    antiManoNegra:
      "No evita dano de area, luz, sonido, gravedad ni efectos mentales. Si abusa del estado, pierde cohesion y cae agotado.",
  },
  "espíritus-de-la-naturaleza::jardin-del-fin-del-mundo": {
    effect:
      "Acelera vida vegetal en un area amplia, creando cobertura, obstaculos y presion territorial durante una escena.",
    limit:
      "Necesita suelo fertil o materia organica. En piedra, metal, hielo o desierto el area se reduce drasticamente.",
    antiManoNegra:
      "No altera el mapa permanentemente sin aprobacion del master. Fuego, sal, acido o corte sistematico abren rutas.",
  },
  "espíritus-de-la-naturaleza::avatar-del-bosque": {
    effect:
      "Otorga comunion vegetal, resistencia a venenos menores y control fino de plantas cercanas durante 3 turnos.",
    limit:
      "Cada orden compleja exige accion completa. Plantas antiguas o sagradas pueden resistirse si el usuario rompe el equilibrio del lugar.",
    antiManoNegra:
      "No manipula toda planta del area como extension perfecta. En entornos urbanos o quemados la tecnica pierde potencia.",
  },
  "espíritus-heroicos::intervencion-del-mito": {
    effect:
      "Invoca un eco heroico para convertir una accion arriesgada en una oportunidad favorable, no en exito garantizado.",
    limit:
      "El eco solo ayuda si la accion coincide con su leyenda. Si el usuario actua contra ese ideal, la intervencion falla.",
    antiManoNegra:
      "No otorga defensa absoluta. Reduce el dano, abre una salida o mejora una tirada narrativa, pero mantiene consecuencias.",
  },
  "texto-31-txt::exanguinacion-total": {
    effect:
      "Provoca shock hematico severo en objetivos organicos ya heridos o marcados, reduciendo fuerza y coordinacion durante 2 turnos.",
    limit:
      "Requiere sangre expuesta, linea de vision y canalizacion bimanual. Objetivos sanos solo sufren sangrado superficial.",
    antiManoNegra:
      "No causa muerte instantanea. No afecta no-muertos, constructos, armaduras selladas ni criaturas sin circulacion compatible.",
  },
  "texto-31-txt::cuerpo-hemo-inmortal": {
    effect:
      "Regenera heridas moderadas usando sangre disponible y reduce hemorragias propias durante 3 turnos.",
    limit:
      "Cada regeneracion consume sangre real del entorno o del usuario. Sin reserva, la tecnica se apaga.",
    antiManoNegra:
      "No repara decapitacion, destruccion organica total ni dano espiritual. Fuego, hielo profundo y sellos cortan la regeneracion.",
  },
  "texto-31-txt::mar-rojo": {
    effect:
      "Cubre hasta 20 metros con sangre cristalizada que ralentiza, corta y contamina heridas abiertas.",
    limit:
      "Necesita una fuente masiva de sangre previa. En suelo seco o limpio, solo crea charcos defensivos.",
    antiManoNegra:
      "No elimina toda vida del area. Personajes con movilidad, vuelo, barreras o proteccion biologica pueden cruzar pagando coste.",
  },
  "texto-37-txt::tormenta-de-limaduras": {
    effect:
      "Levanta limaduras metalicas en un area de 8 metros, cortando vision y causando heridas superficiales acumulativas.",
    antiManoNegra:
      "No tritura enemigos ni desintegra estructuras. Mascaras, viento, magnetismo opuesto o cobertura reducen mucho el efecto.",
  },
  "texto-37-txt::fundicion-absoluta": {
    effect:
      "Bloquea parcialmente piezas metalicas internas o externas durante 1 turno, causando dolor y perdida de precision.",
    limit:
      "Requiere contacto previo con el metal objetivo o una marca ferromagnetica instalada.",
    antiManoNegra:
      "No provoca muerte instantanea. Criaturas sin metal, armaduras aisladas o magia electrica pueden romper el bloqueo.",
  },
  "texto-38-txt::desintegracion-atomica": {
    effect:
      "Dispara un arco de plasma que vaporiza cobertura ligera y causa dano extremo en una linea corta.",
    limit:
      "Requiere 2 turnos de carga visible y sobrecalienta el brazo canalizador.",
    antiManoNegra:
      "No borra enemigos sin respuesta. Barreras termicas, desplazamiento, interrupcion o sacrificio de cobertura mitigan el impacto.",
  },
  "texto-35-txt::cataclismo-sonico": {
    effect:
      "Produce una onda de choque que derriba estructuras fragiles y desorienta grupos en un area amplia.",
    antiManoNegra:
      "No mata ejercitos. Terreno abierto, distancia, aislamiento auditivo y barreras reducen el dano a empuje y sordera temporal.",
  },
  "texto-35-txt::punto-de-silencio-absoluto-cero-sonico": {
    effect:
      "Crea una burbuja de silencio de 6 metros que apaga vibraciones, cancela conjuros verbales y debilita deteccion sonora.",
    limit:
      "El usuario tampoco puede hablar ni usar tecnicas sonoras dentro de la burbuja.",
    antiManoNegra:
      "No anula toda magia. Gestos, runas, telepatia, magia silenciosa o salida del area siguen siendo respuestas validas.",
  },
  "transmutación-de-materia::fision-atomica-controlada": {
    effect:
      "Concentra una reaccion alquimica de alto nivel capaz de perforar una defensa pesada o inutilizar maquinaria grande.",
    limit:
      "Requiere matriz estable, muestra del material y 2 turnos de preparacion. El brazo canalizador queda inutilizado temporalmente.",
    antiManoNegra:
      "No desintegra cualquier objetivo. Seres vivos, reliquias y defensas mayores requieren consentimiento narrativo o condiciones previas.",
  },
  "transmutación-de-materia::fusion-atomica-controlada": {
    effect:
      "Concentra una reaccion alquimica de alto nivel capaz de perforar una defensa pesada o inutilizar maquinaria grande.",
    limit:
      "Requiere matriz estable, muestra del material y 2 turnos de preparacion. El brazo canalizador queda inutilizado temporalmente.",
    antiManoNegra:
      "No desintegra cualquier objetivo. Seres vivos, reliquias y defensas mayores requieren consentimiento narrativo o condiciones previas.",
  },
  "creación-de-pociones::gas-de-nervios-cero-absoluto": {
    effect:
      "Libera un gas criogenico que entumece musculos, ralentiza reacciones y congela humedad superficial en 6 metros.",
    limit:
      "El gas tarda 1 turno en llenar el area y se dispersa con viento, fuego o ventilacion.",
    antiManoNegra:
      "No congela todo al instante. Mascaras, resistencia elemental o retirada rapida evitan el colapso total.",
  },
  "homúnculos-y-vida-artificial::homunculo-perfecto": {
    effect:
      "Crea un aliado avanzado con autonomia limitada y una especialidad magica menor.",
    limit:
      "Solo uno puede existir. Requiere mantenimiento semanal, componentes raros y vinculo mental estable.",
    antiManoNegra:
      "No reemplaza a otro jugador ni actua como segundo personaje completo. Si se independiza, se vuelve PNJ bajo control narrativo.",
  },
  "homúnculos-y-vida-artificial::quimera-de-carne-eterna": {
    effect:
      "Forma una masa viva de asedio que rompe cobertura, absorbe impactos y crea terror en una zona.",
    antiManoNegra:
      "No convierte ejercitos en biomasa. Fuego, acido, sellos vitales o cortar el nucleo de control detienen su avance.",
  },
  "homúnculos-y-vida-artificial::el-primordial-vida-perfecta": {
    effect:
      "Crea un homunculo superior con una especialidad magica basica y autonomia parcial.",
    limit:
      "Solo uno puede existir. Requiere nucleo alquimico raro, mantenimiento constante y ordenes claras.",
    antiManoNegra:
      "No funciona como jugador adicional ni aliado permanente perfecto. Si gana voluntad propia, pasa a control narrativo.",
  },
  "homúnculos-y-vida-artificial::plaga-de-micro-constructos": {
    effect:
      "Libera micro-constructos que degradan estructuras, armaduras y maquinaria durante varios turnos.",
    limit:
      "Necesitan linea de propagacion y se detienen ante fuego, campos magneticos o sellos de esterilizacion.",
    antiManoNegra:
      "No desintegra edificios ni ejercitos en minutos. El efecto es gradual y puede contenerse si se actua rapido.",
  },
  "dilatación-temporal::estasis-cinetica": {
    effect:
      "Congela el impulso de un objetivo u objeto durante 1 turno, dejandolo suspendido y protegido.",
    antiManoNegra:
      "El objetivo en estasis no puede ser danado ni preparado para ejecucion. Al liberarse, conserva una accion defensiva inmediata.",
  },
  "dilatación-temporal::camara-de-evento-eterno": {
    effect:
      "Encierra un punto de impacto en una burbuja temporal de 4 metros durante 2 turnos.",
    limit:
      "El usuario debe permanecer anclado. Cada turno sostenido reduce su movilidad y precision.",
    antiManoNegra:
      "No detiene ataques de nivel dios ni toda una batalla. Solo atrapa una trayectoria o fenomeno ya declarado.",
  },
  "texto-39-txt::condena-del-segundo-eterno": {
    effect:
      "Atrapa la conciencia del objetivo en una repeticion perceptiva durante 1 turno, causando desorientacion severa.",
    limit:
      "Solo funciona contra objetivos previamente marcados por una tecnica temporal del usuario.",
    antiManoNegra:
      "No deja fuera de combate permanentemente. Dolor, ayuda externa o anclajes mentales rompen la repeticion.",
  },
  "texto-39-txt::dominio-del-cronos-berserker-de-tiempo": {
    effect:
      "El usuario acelera su percepcion y ejecuta un combo breve contra un objetivo ya comprometido.",
    limit:
      "Solo puede realizar hasta tres acciones simples y queda con fatiga temporal severa al finalizar.",
    antiManoNegra:
      "No vuelve los golpes inesquivables. Barreras previas, area, reflejos altos o prediccion pueden cortar el combo.",
  },
  "texto-39-txt::paradoja-de-existencia": {
    effect:
      "Desfase temporal que deja al objetivo confundido y con acciones fragmentadas durante 2 turnos.",
    limit:
      "Requiere haber golpeado al objetivo con al menos dos tecnicas temporales previas en la misma escena.",
    antiManoNegra:
      "No deja fuera de combate permanentemente. Dolor, anclajes mentales o intervencion externa estabilizan al objetivo.",
  },
  "teletransportación::exilio-dimensional": {
    effect:
      "Expulsa a una amenaza marcada a una camara dimensional inestable durante 1 turno.",
    limit:
      "Requiere marca espacial, linea de vision y que el objetivo no este anclado al terreno.",
    antiManoNegra:
      "No elimina amenazas no-jefe de forma automatica. El objetivo vuelve con ubicacion alterada y posible dano de desorientacion.",
  },
  "teletransportación::vortice-de-desplazamiento": {
    effect:
      "Abre un vortice que desplaza a una amenaza marcada a una posicion desfavorable durante 1 turno.",
    limit:
      "Necesita marca espacial y canalizacion visible. Objetivos anclados, jefes o jugadores resisten con coste.",
    antiManoNegra:
      "No elimina amenazas. Reubica, separa o interrumpe, pero el objetivo vuelve a la escena con consecuencias proporcionales.",
  },
  "teletransportación::existencia-ubicua": {
    effect:
      "El usuario abre varios puntos de salida para atacar desde angulos alternos durante 1 turno.",
    limit:
      "Cada portal adicional reduce precision. Si un portal es sellado, el usuario recibe retroceso espacial.",
    antiManoNegra:
      "No causa dano inesquivable desde todas las direcciones. Defensa de area, lectura espacial y cerrar portales lo contrarrestan.",
  },
  "dimensiones-de-bolsillo::arsenal-infinito": {
    effect:
      "Permite cambiar de arma preparada una vez por turno sin perder el ritmo de combate.",
    limit:
      "Solo armas registradas y mantenidas en el dominio. Extraer piezas grandes consume accion completa.",
    antiManoNegra:
      "No invoca cualquier arma ni evita desarme magico. Sellos espaciales o perdida de concentracion bloquean el acceso.",
  },
  "dimensiones-de-bolsillo::compresion-del-punto-cero": {
    effect:
      "Comprime espacio alrededor de un objetivo marcado, causando dano severo y reduciendo movilidad durante 1 turno.",
    limit:
      "La marca debe colocarse antes y brilla claramente. Objetivos grandes o anclados solo sufren presion parcial.",
    antiManoNegra:
      "No es inesquivable ni implosion instantanea. Romper la marca, salir del circulo o usar barrera espacial reduce el efecto.",
  },
  "dimensiones-de-bolsillo::colapso-del-vacio-big-crunch": {
    effect:
      "Comprime un espacio marcado, aplastando cobertura y reduciendo movilidad del objetivo durante 1 turno.",
    limit:
      "La marca debe ser visible y colocada antes. El objetivo puede romperla, salir del area o anclarse.",
    antiManoNegra:
      "No implosiona automaticamente ni es inesquivable. Contra personajes actua como dano severo y control temporal.",
  },
  "magia-de-gravedad-el-coloso-deva-full-rush::shinra-tensei-cataclismo": {
    effect:
      "Libera una onda repulsiva que destruye cobertura cercana, separa formaciones y causa dano grave en un radio de 18 metros.",
    limit:
      "Requiere 2 turnos de carga, postura fija y deja al usuario sin tecnicas gravitatorias por 3 turnos.",
    antiManoNegra:
      "No borra todo ni mata automaticamente. La onda se anuncia por compresion del aire; barreras, anclajes y retirada reducen el impacto.",
  },
  "magia-de-gravedad-el-coloso-deva-full-rush::shinra-tensei-maximo-juicio-final": {
    effect:
      "Libera una onda repulsiva maxima que devasta cobertura, separa formaciones y causa dano grave en un radio de 20 metros.",
    limit:
      "Requiere 2 turnos de carga, postura fija y deja al usuario sin tecnicas gravitatorias por 3 turnos.",
    antiManoNegra:
      "No borra todo ni mata automaticamente. La compresion del aire avisa el impacto; barreras, anclajes o retirada reducen el dano.",
  },
  "magia-de-gravedad-el-coloso-deva-full-rush::metrica-de-alcubierre-rush-relativista": {
    effect:
      "El usuario comprime distancia para ejecutar una rafaga corta de golpes contra un objetivo marcado.",
    limit:
      "Solo funciona en linea de avance y consume todo el impulso acumulado. Fallar deja al usuario expuesto.",
    antiManoNegra:
      "No es un combo letal garantizado. Barreras, lectura de trayectoria, gravedad opuesta o terreno irregular cortan la rafaga.",
  },
  "magia-de-gravedad-el-coloso-deva-full-rush::chibaku-tensei-nucleo-de-captura": {
    effect:
      "Crea un nucleo gravitatorio que arrastra escombros y dificulta escapar durante 2 turnos.",
    antiManoNegra:
      "No encierra objetivos sin tirada narrativa. Destruir el nucleo, cortar linea de vision o usar movilidad espacial abre salida.",
  },
  "texto-26-txt::esclavitud-permanente-geas": {
    effect:
      "Impone una orden unica y limitada sobre un objetivo ya quebrado mentalmente o pactado.",
    cd: "Global (una vez por sesion).",
    limit:
      "La orden no puede exigir suicidio, traicion total de identidad ni obediencia indefinida. Dura una escena o hasta cumplirse.",
    antiManoNegra:
      "No crea esclavos permanentes. Dolor, contradiccion moral fuerte o ayuda externa permite resistir o romper el geas.",
  },
  "texto-26-txt::conversion-de-masas": {
    effect:
      "Inclina emocionalmente a un grupo pequeno ya dudoso, provocando vacilacion, retirada o negociacion.",
    antiManoNegra:
      "No cambia de bando a un peloton entero de forma instantanea. Lideres, fanaticos y objetivos informados resisten.",
  },
  "seres-celestiales-demoníacos::arcangel-senor-del-abismo-manifestacion-total": {
    effect:
      "Manifiesta una entidad mayor que impone orden o caos en una zona durante 3 turnos, alterando curacion, miedo y corrupcion.",
    limit:
      "Requiere sello completo, sacrificio de recursos y exposicion del invocador.",
    antiManoNegra:
      "No resucita grupos enteros ni corrompe ciudades de inmediato. Sus efectos son potentes, visibles y resistibles.",
  },
  "seres-celestiales-demoníacos::armagedon-juicio-final": {
    effect:
      "Desata una catastrofe polarizada sobre una zona marcada, destruyendo terreno y forzando retirada o defensa total.",
    limit:
      "Requiere preparacion de escena completa y deja al usuario marcado por la polaridad opuesta.",
    antiManoNegra:
      "No borra toda vida ni destruye un mapa sin arbitraje. Los personajes reciben aviso, rutas de escape y opcion de interrupcion.",
  },
  "texto-31-txt::anemia-universal": {
    effect:
      "Provoca shock hematico severo en objetivos organicos marcados, reduciendo fuerza y coordinacion durante 2 turnos.",
    limit:
      "Requiere sangre expuesta o marca hemomantica previa.",
    antiManoNegra:
      "No causa muerte instantanea. No afecta constructos, no-muertos, objetivos sellados ni criaturas sin sangre compatible.",
  },
  "texto-31-txt::la-gran-purga": {
    effect:
      "Satura un area con presion hemomantica que contamina heridas abiertas y obliga a los organicos a retirarse.",
    limit:
      "Necesita una fuente masiva de sangre y preparacion visible.",
    antiManoNegra:
      "No deja un area libre de vida. Proteccion biologica, barreras, vuelo o sellos permiten resistir.",
  },
  "texto-37-txt::colapso-de-ferromagnetismo-singularidad-metalica": {
    effect:
      "Crea una singularidad metalica menor que atrae, retuerce y rompe piezas metalicas cercanas.",
    limit:
      "Solo afecta metal ferromagnetico visible o marcado. El usuario tambien puede ser arrastrado si lleva metal.",
    antiManoNegra:
      "No tritura enemigos ni desintegra estructuras completas. Aislantes, desprender equipo o electricidad opuesta contrarrestan.",
  },
  "runas-de-protección::sello-del-guardian-eterno": {
    effect:
      "Crea una zona de proteccion mayor de 10 metros durante una escena, con regeneracion limitada del escudo.",
    limit:
      "Requiere preparacion extensa, materiales raros y anclajes visibles. Si se rompen dos anclajes, el sello cae.",
    antiManoNegra:
      "No es proteccion absoluta por 24 horas. Ataques coordinados, caos, corrupcion o sabotaje pueden desgastarlo.",
  },
  "runas-de-protección::runa-de-inmunidad-total-transitoria": {
    effect:
      "Reduce a casi cero el dano recibido durante un instante defensivo, solo contra una fuente declarada.",
    limit:
      "Debe activarse antes del impacto. Quema el soporte y deja al usuario sin acciones ofensivas ese turno.",
    antiManoNegra:
      "No vuelve invulnerable a todo. Dano de area prolongado, control mental, veneno previo o segundo impacto siguen siendo amenaza.",
  },
  "runas-de-ataque::sello-de-gravedad-inversa": {
    effect:
      "Aplasta o eleva con presion localizada a quienes permanezcan dentro de un circulo de 4 metros durante 1 turno.",
    antiManoNegra:
      "No aplasta automaticamente enemigos. El circulo se ilumina antes de activarse y puede salirse, romperse o anclarse.",
  },
  "runas-de-ataque::sello-de-singularidad": {
    effect:
      "Crea presion localizada sobre un circulo marcado, rompiendo cobertura y derribando objetivos que permanezcan dentro.",
    limit:
      "La runa debe cargarse y se ilumina antes de activarse.",
    antiManoNegra:
      "No aplasta estructuras o enemigos automaticamente. Salir del circulo, romper la runa o anclarse reduce el dano.",
  },
  "runas-de-ataque::runa-de-borrado-estructural": {
    effect:
      "Debilita una seccion de material no vivo hasta volverla quebradiza.",
    limit:
      "Requiere contacto con el material y no afecta reliquias, seres vivos ni protecciones activas.",
    antiManoNegra:
      "No pulveriza cualquier armadura al instante. En combate abre una grieta aprovechable, no una ejecucion.",
  },
  "runas-de-ataque::runa-de-descomposicion": {
    effect:
      "Debilita un segmento de material no vivo, volviendolo quebradizo y facil de romper.",
    limit:
      "Requiere contacto directo con la superficie y no afecta reliquias ni armaduras activamente protegidas.",
    antiManoNegra:
      "No convierte cualquier armadura en polvo instantaneo. En combate, solo abre una fisura aprovechable.",
  },
  "runas-de-trampa::sello-de-asfixia": {
    effect:
      "Reduce oxigeno dentro de una celda runica pequena, causando mareo y urgencia de escape en 2 turnos.",
    antiManoNegra:
      "No desmaya automaticamente. Romper la runa, salir del circulo o usar respiracion alternativa cancela el efecto.",
  },
  "runas-de-trampa::glifo-de-desintegracion-de-intrusos": {
    effect:
      "Quema tejido o equipo que toque el objeto protegido, dejando necrosis superficial y alarma visible.",
    antiManoNegra:
      "No desintegra extremidades completas. Guantes, herramientas, dispel o sacrificio de equipo neutralizan el glifo.",
  },
  "runas-de-trampa::sello-de-condena-del-traidor": {
    effect:
      "Activa necrosis superficial y alarma contra quien viole una condicion escrita en el objeto protegido.",
    limit:
      "La condicion debe ser clara y visible en la runa. Solo se activa una vez.",
    antiManoNegra:
      "No desintegra manos completas. Herramientas, guantes, dispel o sacrificar equipo absorben la descarga.",
  },
  "runas-de-mejora-de-equipo::forja-del-mito": {
    effect:
      "Eleva un arma o armadura a calidad mitica durante una escena, permitiendo herir o resistir entidades fuera de fase.",
    limit:
      "Requiere ritual previo, material compatible y mantenimiento constante de runas secundarias.",
    antiManoNegra:
      "No vuelve el equipo indestructible. Cada impacto mayor consume una carga y, al agotarse, el objeto puede fracturarse.",
  },
  "runas-de-mejora-de-equipo::forja-del-vacio-arma-indestructible": {
    effect:
      "Vuelve un arma o armadura capaz de resistir impactos mayores y tocar entidades fuera de fase durante una escena.",
    limit:
      "Tiene cargas limitadas. Cada choque contra una fuerza superior consume una carga y agrieta la matriz.",
    antiManoNegra:
      "No es absolutamente indestructible. Al agotarse las cargas, el objeto puede romperse o quedar inutilizado.",
  },
  "escritura-rúnica-en-el-aire::escritura-de-ley-universal": {
    effect:
      "Traza una ley runica mayor de una sola propiedad en una zona pequena durante 1 turno.",
    limit:
      "Debe elegir un unico efecto simple: oscurecer, sellar sonido, aligerar peso o desviar proyectiles.",
    antiManoNegra:
      "No causa ceguera absoluta ni anula gravedad masiva sin respuesta. Interrumpir el trazo corta la ley.",
  },
  "escritura-rúnica-en-el-aire::comando-del-codigo-fuente": {
    effect:
      "Escribe una regla runica mayor que altera una propiedad concreta del area durante 1 turno.",
    limit:
      "La regla debe ser simple: cegar, aligerar, sellar sonido o invertir empuje. Reglas multiples fallan.",
    antiManoNegra:
      "No anula gravedad masiva ni causa ceguera absoluta sin respuesta. Romper el trazo o interrumpir la mano corta el comando.",
  },
  "escritura-rúnica-en-el-aire::teclado-de-dios": {
    effect:
      "Permite encadenar hasta dos habilidades runicas de Lv1-Lv3 con CD reducido durante 2 turnos.",
    limit:
      "Cada runa escrita aumenta el temblor de manos. Fallar una inscripcion cancela el resto de la cadena.",
    antiManoNegra:
      "No elimina tiempos de reutilizacion por completo. No puede repetir la misma habilidad dos veces seguidas.",
  },
  "texto-28-txt::resurreccion-divina": {
    effect:
      "Revive a un aliado muerto recientemente con HP bajo, agotamiento extremo y una marca sagrada visible.",
    limit:
      "Debe ocurrir dentro de una ventana narrativa corta y exige sacrificio permanente de mana o voto sagrado.",
    antiManoNegra:
      "No restaura al 100% ni borra consecuencias. No funciona si el alma fue sellada, devorada o rechaza volver.",
  },
  "texto-28-txt::juicio-final": {
    effect:
      "Desata una luz purificadora que dana oscuridad, limpia corrupcion menor y cura heridas moderadas aliadas en 20 metros.",
    antiManoNegra:
      "No quema a todos los enemigos ni cura completamente. Tambien puede destruir reliquias inestables y exponer aliados ocultos.",
  },
  "texto-28-txt::sentencia-del-serafin": {
    effect:
      "Desata una luz purificadora que dana oscuridad, limpia corrupcion menor y cura heridas moderadas aliadas en 20 metros.",
    antiManoNegra:
      "No quema a todos los enemigos ni cura completamente. Tambien expone aliados ocultos y puede destruir reliquias inestables.",
  },
  "texto-28-txt::avatar-del-dios-viviente": {
    effect:
      "El usuario canaliza un avatar sagrado durante 2 turnos: vuelo limitado, proteccion alta y mejora de tecnicas Lv1-Lv3.",
    limit:
      "Al terminar, queda exhausto, marcado y sin acceso a magia divina mayor por el resto del evento.",
    antiManoNegra:
      "No otorga invulnerabilidad total ni CDs infinitos. Ataques de vacio, corrupcion o ruptura de fe pueden derribarlo.",
  },
  "texto-36-txt::forma-fotonica": {
    effect:
      "El cuerpo se cubre con luz solida densa, reduciendo dano fisico y aumentando impacto de golpes durante 2 turnos.",
    limit:
      "Cada impacto agrieta la armadura luminica. Sombras densas o vacio aceleran su colapso.",
    antiManoNegra:
      "No tiene masa de estrella ni invulnerabilidad casi total. Ataques de area, gravedad y oscuridad siguen siendo efectivos.",
  },
  "texto-36-txt::armadura-de-fotones-primordiales": {
    effect:
      "Cubre el cuerpo con luz solida densa, reduciendo dano fisico y aumentando impacto de golpes durante 2 turnos.",
    limit:
      "Cada impacto agrieta la armadura. Sombras densas, vacio o gravedad aceleran su colapso.",
    antiManoNegra:
      "No otorga invulnerabilidad fisica casi total ni masa estelar. Ataques de area y contramagia siguen funcionando.",
  },
  "texto-36-txt::corte-del-horizonte-singularidad-luminica": {
    effect:
      "Proyecta un corte de luz solida que atraviesa cobertura alineada y deja una herida luminica grave.",
    limit:
      "La trayectoria se anuncia con una linea brillante antes del disparo.",
    antiManoNegra:
      "No corta todo en 1 kilometro ni es inesquivable. Salir de la linea, dispersar luz o bloquear con vacio reduce el efecto.",
  },
  "texto-29-txt::apocalipsis-infernal": {
    effect:
      "Abre una grieta infernal que calcina cobertura, rompe moral y causa dano grave a quienes permanezcan en 10 metros.",
    limit:
      "Requiere sacrificio previo, 2 turnos de apertura y deja al usuario inconsciente al cerrar la grieta.",
    antiManoNegra:
      "No elimina enemigos automaticamente. Barreras, agua sagrada, retirada o sellos reducen el dano.",
  },
  "texto-29-txt::puerta-al-abismo": {
    effect:
      "Abre una grieta infernal que calcina cobertura, rompe moral y causa dano grave a quienes permanezcan cerca.",
    limit:
      "Requiere sacrificio previo y 2 turnos de apertura visible.",
    antiManoNegra:
      "No elimina enemigos automaticamente. Retirada, agua sagrada, barreras o sellos reducen el dano.",
  },
  "texto-29-txt::pacto-final": {
    effect:
      "Intercambia la vida del usuario por una maldicion final que deja a un enemigo marcado, debilitado y vulnerable al cierre narrativo.",
    limit:
      "Solo puede declararse cuando el usuario ya esta derrotado o al borde de morir.",
    antiManoNegra:
      "No garantiza muerte instantanea de jefes ni jugadores. El objetivo conserva una ultima respuesta o condicion de salvacion.",
  },
  "texto-40-txt::lluvia-corrosiva": {
    effect:
      "Cubre un area con acido persistente que destruye cobertura y degrada armaduras durante varios turnos.",
    antiManoNegra:
      "No elimina a cualquiera sin vuelo. Refugio, neutralizantes, barreras o salir del area reducen el dano.",
  },
  "texto-40-txt::marea-de-disolucion-universal": {
    effect:
      "Inunda un area con acido persistente que degrada estructuras, armaduras y rutas de escape.",
    limit:
      "El acido avanza por gravedad y terreno. Zonas elevadas, barreras o neutralizantes lo contienen.",
    antiManoNegra:
      "No elimina a cualquier enemigo sin proteccion especifica. El efecto castiga permanencia, no movimiento inteligente.",
  },
  "texto-40-txt::desintegracion-acida-molecular": {
    effect:
      "Concentra acido molecular sobre un punto marcado, causando dano extremo y rompiendo una defensa material.",
    limit:
      "Requiere contacto previo o marca corrosiva. El proceso tarda 1 turno en completar la reaccion.",
    antiManoNegra:
      "No causa muerte instantanea. Agua, bases alquimicas, barreras o amputar equipo contaminado pueden salvar al objetivo.",
  },
  "texto-27-txt::singularidad-de-vacio": {
    effect:
      "Forma una esfera de vacio que erosiona materia cercana y atrae proyectiles durante 2 turnos.",
    limit:
      "Tarda 2 turnos de carga y permanece anclada a un punto visible.",
    antiManoNegra:
      "No devora todo. Romper el anclaje, alejarse, usar gravedad opuesta o sellos espaciales la colapsa.",
  },
  "texto-27-txt::singularidad-de-antimateria": {
    effect:
      "Crea una esfera de antimateria sellada que erosiona materia cercana y obliga a evacuar el punto marcado.",
    limit:
      "Requiere 2 turnos de carga, anclaje estable y distancia segura. Si se interrumpe, explota de forma reducida contra el usuario.",
    antiManoNegra:
      "No equivale a una bomba perfecta. Barreras espaciales, vacio opuesto o romper el sello colapsan la esfera antes del contacto.",
  },
  "texto-27-txt::fin-de-la-existencia": {
    effect:
      "Concentra vacio puro para borrar una defensa, barrera o constructo ya debilitado.",
    limit:
      "Uso unico por evento. Requiere objetivo inmovil, marca previa y consentimiento narrativo si afecta a personaje jugador.",
    antiManoNegra:
      "No borra personas de la existencia como ejecucion gratuita. Contra seres vivos actua como herida entrópica extrema, no como eliminacion automatica.",
  },
};

function normalizeAbilityName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeText(text: string) {
  return text
    .replace(/muerte instant[aá]nea/gi, "derrota critica condicionada")
    .replace(/muerte instant[aá]nea garantizada/gi, "derrota critica condicionada")
    .replace(/eliminaci[oó]n instant[aá]nea/gi, "desplazamiento o neutralizacion condicionada")
    .replace(/eliminaci[oó]n total/gi, "dano extremo condicionado")
    .replace(/fuera de combate permanentemente/gi, "desorientado y vulnerable temporalmente")
    .replace(/da[nñ]o masivo inesquivable/gi, "dano severo con trayectoria anunciada")
    .replace(/inesquivable y letal/gi, "muy dificil de evadir si no se lee la trayectoria")
    .replace(/ataques inesquivables/gi, "ataques de alta presion")
    .replace(/borra toda vida[^.]*\./gi, "devasta la zona marcada y fuerza defensa o retirada inmediata.")
    .replace(/borra al usuario y a sus aliados/gi, "oculta temporalmente al usuario y a sus aliados")
    .replace(/borr(a|ar|ado) todo/gi, "devasta el area marcada")
    .replace(/destruye estructuras y elimina/gi, "degrada estructuras y amenaza gravemente")
    .replace(/desintegra cualquier estructura/gi, "retuerce estructuras metalicas compatibles")
    .replace(/tritura a los enemigos/gi, "derriba a enemigos sin anclaje")
    .replace(/puede desintegrar un edificio o un ej[eé]rcito/gi, "puede degradar estructuras y formaciones")
    .replace(/mapa es destruido/gi, "zona queda devastada")
    .replace(/invulnerabilidad total/gi, "proteccion extrema y breve")
    .replace(/invulnerabilidad f[ií]sica casi total/gi, "proteccion fisica alta y breve")
    .replace(/barrera absoluta/gi, "barrera mayor condicionada")
    .replace(/invulnerable a cualquier forma de da[nñ]o/gi, "protegido contra una fuente declarada")
    .replace(/defensa absoluta/gi, "defensa mayor condicionada")
    .replace(/absolutamente indestructible/gi, "resistente mientras conserve cargas")
    .replace(/resistencia al dolor absoluta/gi, "alta tolerancia al dolor")
    .replace(/pasividad absoluta/gi, "vacilacion o retirada temporal")
    .replace(/ceguera absoluta/gi, "ceguera parcial y breve")
    .replace(/[Ii]nexpugnable/gi, "muy dificil de asaltar")
    .replace(/cualquier enemigo/gi, "enemigos sin proteccion adecuada")
    .replace(/cualquier objetivo/gi, "objetivos compatibles y no protegidos")
    .replace(/\bcualquier arma\b/gi, "armas preparadas")
    .replace(/cualquier habilidad/gi, "habilidades compatibles")
    .replace(/cualquier ataque frontal/gi, "un ataque frontal declarado")
    .replace(/cualquier cosa arrojada aqu[ií] desaparece permanentemente/gi, "objetos no anclados arrojados aqui quedan perdidos hasta recuperacion narrativa")
    .replace(/sin l[ií]mites de distancia/gi, "a larga distancia si existe marca previa")
    .replace(/exito autom[aá]tico/gi, "ventaja decisiva condicionada")
    .replace(/garantizada/gi, "condicionada");
}

function patchAbility(style: MagicStyle, ability: AbilityLevel): AbilityLevel {
  const key = `${style.id}::${normalizeAbilityName(ability.name)}`;
  const patch = ABILITY_PATCHES[key] ?? {};
  const guard = LEVEL_GUARDS[ability.level] ?? "";
  const role = STYLE_ROLES[style.id] ?? "La tecnica debe conservar coste, lectura y respuesta.";
  const baseAnti = normalizeText(patch.antiManoNegra ?? ability.antiManoNegra);
  const antiParts = [baseAnti, guard, role].filter(Boolean);

  return {
    ...ability,
    ...patch,
    effect: normalizeText(patch.effect ?? ability.effect),
    cd: normalizeText(patch.cd ?? ability.cd),
    limit: normalizeText(patch.limit ?? ability.limit),
    antiManoNegra: antiParts.join(" "),
  };
}

function balanceStyle(style: MagicStyle): MagicStyle {
  const nextLevels: Record<number, AbilityLevel[]> = {};

  for (const rawLevel of Object.keys(style.levels ?? {})) {
    const level = Number(rawLevel);
    const abilities = style.levels[level] ?? [];
    nextLevels[level] = abilities.map((ability) => patchAbility(style, ability));
  }

  return {
    ...style,
    levels: nextLevels,
  };
}

export function applyMagicBalanceToCategories<T extends GrimoireCategory>(categories: T[]): T[] {
  return categories.map((category) => ({
    ...category,
    styles: category.styles.map(balanceStyle),
  }));
}

export function applyMagicBalanceToStyles<T extends MagicStyle>(styles: T[]): T[] {
  return styles.map((style) => balanceStyle(style) as T);
}
