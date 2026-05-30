# Checklist QA Manual - Mobile

Usar esta lista para una pasada manual en emulador Android o dispositivo real.

## Sesion

- iniciar sesion por username valido
- validar mensaje claro para username inexistente
- confirmar que el oro inicial visible coincide entre `home`, `market` y `profile`
- cerrar sesion y volver a abrir sin estado roto

## Misiones y Eventos

- abrir `library`
- comprobar que misiones y eventos cargan sin estado fantasma
- postular a una mision o entrar a un evento si el entorno lo permite
- confirmar refresh de estado al volver a `profile`
- revisar que el detalle no se quede con datos nulos o ids rotos

## Mercado e Inventario

- comprar un item con `purchase_market_item`
- confirmar que el oro baja una sola vez
- confirmar que el inventario se actualiza
- confirmar que `market` y `profile` muestran el mismo saldo despues de la compra
- revisar manejo de error cuando no alcanza el oro

## Bolsa del Reino

- abrir `RealmStockExchangeNative`
- ejecutar una compra o venta
- confirmar que el saldo cambia por delta, no por sobrescritura
- confirmar que no queda desincronizacion visible al volver a `profile`

## Minijuegos

- ejecutar una ronda de `TavernSlotsNative`
- ejecutar una ronda de `TavernHorseRaceNative`
- ejecutar una ronda de `TavernScratchNative`
- comprobar que el oro refleja el resultado correctamente
- comprobar que no hay doble premio ni doble descuento
- comprobar que los limites diarios se respetan

## Notificaciones

- abrir la campana en `home`
- abrir la campana en `profile`
- comprobar que las notificaciones no leidas muestran badge
- comprobar que el modal marca como leido sin romper la UI

## Ergonomia

- revisar taps en filtros, chips y acciones rapidas
- confirmar que los elementos clickeables se sienten comodos en Android
- revisar `Archivist` y `Anime` como superficies compactas, no saturadas

## Cierre QA

- correr `npm run mobile:typecheck`
- correr `npx tsc --noEmit`
- correr `npm run build` si hubo cambios funcionales
- registrar hallazgos o dejar constancia explicita de QA limpia
