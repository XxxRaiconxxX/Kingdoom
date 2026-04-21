# Kingdoom Native (Fase 0)

Base nativa de la app movil de Kingdoom usando Expo + React Native + Expo Router.

## Requisitos

- Node 20+
- Android Studio (si quieres emulador)

## Configuracion

1. Copia `.env.example` a `.env`.
2. Completa:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Comandos desde raiz del repo

- `npm run mobile:start`
- `npm run mobile:android`
- `npm run mobile:web`
- `npm run mobile:typecheck`

## Alcance de Fase 0

- Navegacion por tabs: Inicio, Grimorio, Biblioteca, Mercado, Perfil.
- Sesion basica por username contra tabla `players` de Supabase.
- Estado persistido localmente con Zustand + AsyncStorage.
- Estructura inicial para evolucionar a features nativas reales sin WebView.

## Fase 2 - Compra segura de mercado

- El cliente movil usa RPC `purchase_market_item` para evitar descontar oro en cliente.
- SQL listo en `apps/mobile/supabase_purchase_market_rpc.sql`.
- Tras compra exitosa se refresca oro y se invalida inventario local.

## Fase 3 - Historial nativo de compras

- Cada compra segura exitosa se registra localmente en la app (con `orderRef`, item, cantidad, total y saldo restante).
- El perfil muestra una lista compacta de movimientos recientes por jugador.
- Incluye accion para limpiar historial local del jugador sin tocar datos de Supabase.

## Fase 4 - UX nativa compacta y refresco rapido

- Pull-to-refresh habilitado en Mercado, Biblioteca y Perfil.
- Mercado ahora incluye buscador + filtros de categoria en chips horizontales.
- Biblioteca ahora incluye buscador + filtros por estado de evento en chips horizontales.
- Se mantiene compatibilidad total con Fase 1-3 sin cambios de economia ni SQL.

## Fase 5 - Detalle expandible con tarjetas compactas

- Se agrego `DetailSheet` nativo reutilizable para abrir informacion completa sin saturar la vista principal.
- Mercado y Biblioteca pasan a tarjetas compactas con boton `Ver detalle`.
- El detalle muestra informacion extendida (descripcion completa, metadatos, imagen si existe) en panel inferior.

## Fase 6 - Estado de compra por item (UX transaccional)

- El mercado ya no bloquea toda la pantalla al comprar; el estado pendiente se aplica solo al item en curso.
- Se agrega feedback visual contextual por compra (`success`/`error`) con color semantico.
- Se evita doble accion sobre el mismo item mientras la operacion segura esta en progreso.

## Fase 7 - Historial filtrable y export rapido

- El historial de compras en Perfil ahora permite filtrar por ventana de tiempo (`7 dias`, `30 dias`, `Todo`).
- Se agrego buscador por nombre de item o referencia de pedido.
- El usuario puede compartir/exportar el resumen en texto desde el movil con un solo boton.

## Fase 8 - Inventario compacto con detalle expandible

- Inventario en Perfil suma buscador y filtros por categoria para revisar objetos rapido.
- Cada item incluye accion `Ver detalle` y abre `DetailSheet` nativo con informacion completa.
- Se muestran imagen, descripcion, habilidad, cantidad e ID del objeto sin saturar la lista principal.
