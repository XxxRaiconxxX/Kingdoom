# Bolsa Del Reino - Diseno Funcional V1

Fecha: 04/05/2026  
Autor: Jarvis

## 1. Objetivo

`Bolsa del Reino` sera un nuevo modulo dentro de `Mercado` orientado a especulacion e inversion narrativa. No sera un minijuego de taberna, sino una mesa economica persistente donde el jugador puede operar sobre los recursos principales de cada reino.

El sistema tendra dos capas separadas pero conectadas:

- `Prediccion 2h`: el jugador apuesta a que el precio de un activo subira o bajara al cierre de una ventana de dos horas.
- `Acciones reales`: el jugador compra y vende participaciones del activo para ganar o perder segun el movimiento del precio.

El diseno busca tres metas:

- dar profundidad economica al lore de cada reino
- ofrecer un loop jugable claro tanto en movil como en escritorio
- evitar que la economia de oro se rompa

## 2. Fantasia Del Modulo

La fantasia no es la de una app bursatil moderna, sino la de una mesa de especulacion del reino. Cada territorio expone un recurso estrella y el jugador lee el pulso economico del mundo a traves de su valor.

Ejemplos iniciales:

- `Arcania -> Cristales de Aether`
- `Vyralis -> Sangre Negra`
- `Kaelum-Gard -> Acero volcanico`
- `Aurelia -> Seda Solar`

Cada reino tendra personalidad economica propia:

- mas estable
- mas volatil
- con sesgo alcista, bajista o neutro cuando haga falta

## 3. Estructura General Del Modulo

La estructura visual elegida para la V1 es la `Opcion A`, un panel central fuerte con grafico protagonista y controles alrededor.

Bloques del modulo:

- `Selector de reinos`: lista de reinos y acceso a su activo principal
- `Cabecera del activo`: nombre del reino, nombre del recurso, precio actual y tiempo al proximo tick
- `Grafico principal`: historial reciente del activo, sin etiqueta textual de tendencia
- `Prediccion 2h`: apuesta a `Sube` o `Baja`
- `Acciones`: comprar y vender acciones reales
- `Resumen de cartera`: reinos donde el jugador tiene acciones o predicciones activas
- `Noticias del reino`: no obligatorias en V1, pero previstas para expansion futura

La lectura principal del jugador debe ser:

1. elegir un reino
2. ver el precio actual y la forma de la curva
3. decidir si predecir o invertir
4. pasar a otro reino sin cerrar las posiciones anteriores

## 4. Modelo De Activos

Cada reino tendra `un solo activo principal` en la V1.

Cada activo debera definir:

- `id`
- `kingdomId`
- `kingdomName`
- `assetName`
- `basePrice`
- `currentPrice`
- `volatilityClass`
- `priceFloor`
- `priceCeiling`
- `bias`
- `tickIntervalMinutes`

La primera version no mezclara multiples activos por reino ni sectores globales. Eso se posterga para una fase futura.

## 5. Simulacion Del Precio

El precio real del activo cambiara mediante `ticks discretos`, pero el grafico se animara con `interpolacion suave` entre puntos.

Esto permite:

- control de balance
- sensacion visual premium
- menos ruido aleatorio
- mejor lectura del estado del mercado

Regla elegida:

- el precio real cambia en ticks
- el grafico no salta bruscamente; interpola el movimiento entre un punto y otro

Ejemplo:

- Tick 1: 120
- Tick 2: 124
- Tick 3: 118
- Tick 4: 129
- Tick 5: 135

El jugador percibe una curva viva, pero el sistema sigue trabajando con valores controlables.

## 6. Prediccion 2h

La `Prediccion 2h` es una apuesta de direccion sobre el activo.

Campos necesarios al abrir una prediccion:

- `playerId`
- `assetId`
- `entryPrice`
- `direction` (`up` o `down`)
- `stakeGold`
- `openedAt`
- `settlesAt`
- `lockedPayoutMultiplier`
- `status`

Reglas:

- el jugador puede tener `una sola prediccion activa por reino`
- puede tener predicciones activas en varios reinos al mismo tiempo
- la prediccion no se cancela una vez abierta
- el resultado se resuelve al cierre exacto de las 2 horas
- si el precio final es mayor y la direccion fue `up`, gana
- si el precio final es menor y la direccion fue `down`, gana
- si el precio final es igual al de entrada, la recomendacion de la V1 es `reembolso`

La recompensa de la prediccion se define `segun volatilidad del reino`, no segun la distancia exacta recorrida en esta primera version.

## 7. Acciones Reales

Las acciones reales representan una posicion persistente del jugador sobre el activo.

Campos necesarios:

- `playerId`
- `assetId`
- `sharesOwned`
- `totalInvested`
- `averagePrice`
- `updatedAt`

Operaciones:

- comprar acciones al precio actual
- vender acciones al precio actual
- recomputar promedio si se compran nuevas acciones
- permitir ventas parciales

Reglas:

- no se puede vender mas de lo que se posee
- el valor de la cartera es `sharesOwned * currentPrice`
- la ganancia o perdida flotante se calcula comparando el precio promedio con el precio actual

## 8. Convivencia Entre Prediccion Y Acciones

Decision validada:

- el jugador puede tener acciones y tambien una prediccion del mismo reino
- pero solo `una prediccion activa por reino`

Esto crea dos loops separados:

- `prediccion`: tactica de 2 horas
- `acciones`: inversion de cartera

Tambien permite operar en varios reinos a la vez, reforzando la fantasia de mercado del mundo.

## 9. Estados De UX

La interfaz debe dejar clarisimo el estado actual del jugador en cada reino.

Estados minimos:

- sin prediccion activa
- prediccion activa
- prediccion ganada
- prediccion perdida
- prediccion empatada y reembolsada
- sin acciones
- con acciones en cartera
- posicion en ganancia
- posicion en perdida

La vista no debe depender de texto excesivo. El estado debe apoyarse en:

- color
- iconografia
- indicadores numericos
- temporizadores
- feedback breve

## 10. Reglas Economicas Y Antiabuso

La bolsa no debe convertirse en una maquina de oro.

Protecciones base:

- congelar el `payout` al abrir la prediccion
- no permitir doble resolucion de una misma prediccion
- no tomar precios del cliente como fuente de verdad
- registrar compras, ventas y resoluciones
- bloquear multiples predicciones simultaneas en un mismo reino

Limpieza economica recomendada:

- monto minimo por prediccion
- monto maximo por prediccion
- posible tope de acciones por reino en la V1
- posibilidad futura de limite diario de ganancia neta si el sistema se dispara

Recomendacion de V1:

- no introducir comisiones visibles todavia
- usar limites por monto y volatilidad
- introducir comisiones mas adelante solo si la economia las necesita

## 11. Perfil De Volatilidad

Clases sugeridas para la V1:

- `low`
- `medium`
- `high`
- `extreme` reservada para futuras fases

Payouts de referencia:

- `low -> x1.40`
- `medium -> x1.65`
- `high -> x1.95`
- `extreme -> x2.25`

Estos valores son semilla de balance, no definitivos. La implementacion debe dejarlos parametrizados.

## 12. Alcance De La V1

La primera version debe incluir:

- 4 reinos iniciales
- 1 activo principal por reino
- grafico con historial corto
- simulacion por ticks discretos
- interpolacion suave del grafico
- prediccion `Sube/Baja` a 2 horas
- compra y venta de acciones
- cartera del jugador
- 1 prediccion activa por reino
- historial basico de operaciones

No debe incluir aun:

- multiples activos por reino
- eventos mundiales automaticos que alteren precios
- IA
- ranking de inversionistas
- apalancamiento
- shorting
- spreads complejos
- noticias generadas dinamicamente

## 13. Arquitectura Tecnica Recomendada

La implementacion deberia separarse en cuatro capas:

### 13.1 Catalogo de activos

Define los activos iniciales y sus propiedades estaticas:

- nombre
- reino
- precio base
- volatilidad
- limites

### 13.2 Motor de mercado

Responsabilidades:

- calcular ticks de precio
- aplicar sesgo y volatilidad
- guardar historial reciente
- exponer el precio vigente

### 13.3 Sistema del jugador

Responsabilidades:

- abrir y cerrar predicciones
- comprar y vender acciones
- recalcular cartera
- registrar movimientos
- impactar el oro real del jugador

### 13.4 UI del modulo

Responsabilidades:

- render del selector de reinos
- grafico principal
- panel de prediccion
- panel de acciones
- resumen de cartera
- feedback de estados

## 14. Ejemplo Narrativo De Flujo

Jugador entra a `Bolsa del Reino`.

Selecciona `Arcania`.

Ve:

- precio actual: 124
- grafico reciente en ascenso irregular
- payout de prediccion alto por volatilidad

El jugador:

- compra 10 acciones
- abre una prediccion de 500 oro a `Sube`

Durante las siguientes dos horas:

- conserva su cartera
- la prediccion queda bloqueada
- puede pasar a Kaelum-Gard y abrir otra posicion alli

Al cierre:

- si Arcania sube, cobra la prediccion
- si decide vender acciones mas tarde, gana o pierde segun precio real

## 15. Orden Recomendado De Implementacion

1. Definir catalogo de activos y parametros base
2. Construir simulador local de ticks e historial
3. Crear UI base del panel
4. Implementar prediccion 2h
5. Implementar acciones reales
6. Persistir posiciones y resoluciones
7. Ajustar balance

## 16. Riesgos Principales

- que la economia quede demasiado rentable
- que el jugador no entienda la diferencia entre prediccion y acciones
- que el grafico parezca “falso” si la interpolacion no se siente bien
- que el sistema quede demasiado tecnico para movil

Mitigaciones:

- separar visualmente `Prediccion` y `Acciones`
- mantener un solo activo por reino en V1
- usar feedback simple y directo
- parametrizar volatilidad y payouts desde el inicio

## 17. Decision Final De Diseno

La V1 de `Bolsa del Reino` sera un modulo economico hibrido dentro de `Mercado`, con un activo principal por reino, operaciones paralelas en varios territorios, prediccion de direccion a 2 horas y compra/venta real de acciones. Su tono sera el de una mesa narrativa de especulacion del mundo de Kingdoom, no el de una bolsa moderna generica.
