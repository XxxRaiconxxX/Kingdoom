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
