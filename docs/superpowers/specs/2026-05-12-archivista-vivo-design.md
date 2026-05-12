# Archivista Vivo Design

## Objetivo

Convertir el Archivista de Kingdoom en un chat principal para jugadores y staff que:

- responda usando lore y documentos ya cargados,
- conozca el estado vivo de la web,
- recomiende contenido real del mercado, eventos y misiones,
- y, para admins, pueda ejecutar acciones reales tras confirmacion explicita por chat.

## Alcance

Este rediseño aplica solo a la web.

Incluye:

- UI enfocada en chat, sin paneles laterales innecesarios,
- tarjetas compactas dentro del flujo del chat,
- lectura de estado vivo del reino,
- modo admin con confirmacion `si/no`,
- ejecucion de acciones admin soportadas desde el chat.

No incluye:

- cambios en la app movil,
- automatizacion silenciosa sin confirmacion,
- ejecucion libre de SQL,
- ni acceso de jugadores normales a datos internos visibles.

## Arquitectura

### 1. Contexto fijo

Se mantiene la base documental actual:

- lore,
- reglas,
- grimorio,
- bestiario,
- flora,
- facciones,
- documentos del staff.

### 2. Contexto vivo

Se anade una capa viva que resume datos actuales de la web:

- items del mercado,
- eventos activos o en produccion,
- misiones publicas,
- y, en modo admin, jugadores disponibles.

Esto no sustituye al lore; lo complementa.

### 3. Orquestacion del Archivista

El endpoint del Archivista deja de ser solo generacion de texto y pasa a devolver una respuesta estructurada:

- `answer`
- `sources`
- `intent`
- `actionDraft`
- `debug` opcional

La IA puede:

- responder normalmente,
- detectar si el usuario pide operacion admin,
- preparar una accion estructurada,
- y pedir confirmacion.

### 4. Confirmacion admin

Si el usuario autenticado es admin y el Archivista detecta una accion valida:

1. se genera un borrador de accion,
2. se muestra un resumen en el chat,
3. el usuario responde `si` o `no`,
4. solo entonces se ejecuta.

No hay ejecucion sin confirmacion.

### 5. Ejecucion segura

La ejecucion no sera libre ni generica.

Se hara por un registro de acciones soportadas que reutiliza funciones existentes del proyecto:

- jugadores
- misiones
- eventos
- mercado
- magia
- bestiario
- flora
- biblioteca IA

Cada accion convierte el borrador IA en una llamada concreta a utilidades ya existentes.

## Experiencia de usuario

### Publico general

El Archivista debe poder responder preguntas como:

- que arma me recomiendas comprar,
- cual es el item mas caro,
- que eventos estan activos,
- que misiones hay ahora,
- que bestias hay en cierta region,
- o que magia se parece a otra.

Siempre que sea posible, se mostraran tarjetas compactas relacionadas dentro del chat.

### Admin

Ademas de lo anterior, el admin podra pedir:

- dar oro,
- crear, editar o borrar misiones,
- crear, editar o borrar eventos,
- crear, editar o borrar items del mercado,
- crear, editar o borrar entradas de magia, bestiario, flora o biblioteca IA,
- y otras operaciones soportadas por las utilidades existentes.

## UI

La nueva UI del Archivista sera:

- una sola superficie principal de chat,
- tarjetas compactas integradas como respuestas enriquecidas,
- historial legible,
- acciones pendientes destacadas,
- y confirmacion por texto breve.

Se prioriza que no se rompa en movil:

- una sola columna,
- tarjetas cortas,
- chips compactos,
- sin panel derecho obligatorio.

## Riesgos y mitigacion

### Riesgo 1: respuestas demasiado libres

Mitigacion:

- prompt estructurado,
- salida JSON,
- registro de acciones soportadas,
- confirmacion `si/no`.

### Riesgo 2: acoplamiento excesivo del componente

Mitigacion:

- separar contexto vivo,
- separar motor de acciones,
- separar presentacion de tarjetas.

### Riesgo 3: admins ejecutando acciones ambiguas

Mitigacion:

- si faltan datos criticos, el Archivista no ejecuta,
- pide aclaracion o deja borrador incompleto.

## Fases aprobadas

### Fase 1

UI nueva de chat puro.

### Fase 2

Conocimiento vivo del reino y tarjetas compactas.

### Fase 3

Deteccion de intenciones admin y confirmacion `si/no`.

### Fase 4

Ejecucion real de acciones admin soportadas.

### Fase 5

Pulido final, mensajes, feedback, robustez y debug.
