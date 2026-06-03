# Simulación de Blackjack (Solo y PvP) en Kingdoom

Este documento describe detalladamente el funcionamiento y la interfaz visual en WhatsApp para los modos **Solo (Contra el Crupier)** y **PvP (Multijugador)** del minijuego de cartas **!21 (Blackjack)**.

---

## 🎴 Reglas Generales y Límites del Reino
1. **Límite Diario:** Cada aventurero puede iniciar o participar en un máximo de **5 partidas diarias**.
2. **Límites de Apuesta:**
   - **Entre semana (Lunes a Viernes):** Apuesta máxima de **100.000 oro** por ronda.
   - **Fin de semana (Sábado y Domingo):** Apuesta máxima de **500.000 oro** por ronda.
   - **Mínimo:** **10 oro** por ronda.
3. **Control de Sesiones:** No se puede iniciar una nueva partida si ya se tiene una activa en curso.

---

## 👤 Escenario 1: Modo Solo (Jugador vs. Crupier)
El aventurero **Geralt** decide probar su suerte contra el crupier del reino apostando **500 oro**.

### Paso 1: Inicio de Partida
Geralt escribe el comando en el chat del reino:
> **Geralt:** `!21 500`

El bot verifica su saldo y usos diarios, descuenta el oro e inicia la sesión respondiendo con el tablero inicial (se reparten **2 cartas** al jugador y **2 al crupier**, ocultando una de las del crupier):

> **Reino Bot:**
> ```text
> ╭─〔 🃏 *21 (Blackjack)* 〕
> │ Aventurero: *Geralt*
> │ Apuesta: *500 oro*
> │ ---
> │ 🃏 *TUS CARTAS:*
> │ [10❤️, 8♣️] (Total: *18*)
> │ ---
> │ 🏛️ *CRUPIER:*
> │ [K♦️, ?] (Total: ?)
> │ ---
> │ 💬 *Respondé a este mensaje* con:
> │ • *pedir* (tomar otra carta)
> │ • *plantarse* (quedarte con tus cartas)
> ╰────────────────────
> ```

---

### Paso 2: Decisión del Jugador
Geralt tiene un total de **18**. Decide que es una mano segura y se planta. Responde **citando (reply)** el mensaje del bot:
> **Geralt** *(respondiendo al tablero)*: `plantarse`

---

### Paso 3: Resolución de la Ronda
El bot elimina la sesión activa, ejecuta el turno del crupier (el crupier revela su carta oculta y pide cartas hasta alcanzar al menos 17) y responde con el resultado:
- Carta oculta del crupier: `5♠️` (Total: 15). Como es menor a 17, el crupier pide otra.
- Siguiente carta del crupier: `3❤️` (Total: 18). El crupier se planta en 18.
- **Resultado:** Empate (18 vs 18).

> **Reino Bot:**
> ```text
> ╭─〔 🃏 *21 (Blackjack)* 〕
> │ Aventurero: *Geralt*
> │ Apuesta: *500 oro*
> │ ---
> │ 🃏 *TUS CARTAS:*
> │ [10❤️, 8♣️] (Total: *18*)
> │ ---
> │ 🏛️ *CRUPIER:*
> │ [K♦️, 5♠️, 3❤️] (Total: *18*)
> │ ---
> │ ⚖️ *¡Empate! Reembolso.*
> │ Recibís tus *500 oro* de vuelta.
> │ • *Nuevo total:* 5.000 oro
> │ • *Usos restantes:* 4/5
> ╰────────────────────
> ```

---

## ⚔️ Escenario 2: Modo PvP (Multijugador)
El aventurero **Geralt** desafía a **SirValen** a una partida de Blackjack en un grupo del reino, apostando **500 oro** cada uno. El pozo acumulado será de **1.000 oro**.

### Paso 1: Inicio de Partida
Geralt inicia el desafío etiquetando a SirValen:
> **Geralt:** `!21 500 @SirValen`

El bot descuenta **500 oro** a ambos jugadores, incrementa en **1** su contador diario de usos y reparte **exactamente 1 carta** a cada jugador para iniciar la primera ronda:
- Geralt recibe: `8♣️` (Total: 8)
- SirValen recibe: `A❤️` (Total: 11)

> **Reino Bot:**
> ```text
> ╭─〔 🃏 *21 (Blackjack PvP)* 〕
> │ Apuesta: *500 oro* por jugador
> │ Pozo acumulado: *1.000 oro*
> │ ---
> │ ⚔️ *ESTADO DE LOS JUGADORES:*
> │ 👤 *Geralt*:
> │    [8♣️] (8) (Esperando 🕒)
> │ 👤 *SirValen*:
> │    [A❤️] (11) (Esperando 🕒)
> │ ---
> │ Esperando respuestas... (0/2)
> │ Falta que respondan: *Geralt*, *SirValen*
> │ ---
> │ 💬 *Respondé a este mensaje* con:
> │ • *pedir* (tomar otra carta)
> │ • *plantarse* (quedarte con tus cartas)
> ╰────────────────────
> ```

---

### Paso 2: Decisiones - Ronda 1
Los dos jugadores deben responder **citando (reply)** directamente el mensaje del bot:

1. Geralt decide pedir otra carta:
   > **Geralt** *(respondiendo al tablero)*: `pedir`
   > *El bot reacciona con un emoji: ✅*

2. SirValen decide pedir otra carta:
   > **SirValen** *(respondiendo al tablero)*: `pedir`
   > *El bot reacciona con un emoji: ✅*

Una vez que ambos han respondido, el bot procesa las cartas de la ronda:
- **Geralt** recibe `Q♠️`. Su mano pasa a ser `[8♣️, Q♠️]` (Total: 18). Sigue en juego.
- **SirValen** recibe `10♦️`. Su mano pasa a ser `[A❤️, 10♦️]` (Total: 21). Al alcanzar 21 exactamente, se planta automáticamente (su estado cambia a `stand`).

El bot envía el tablero actualizado para la **Ronda 2**:

> **Reino Bot:**
> ```text
> ╭─〔 🃏 *21 (Blackjack PvP)* 〕
> │ Apuesta: *500 oro* por jugador
> │ Pozo acumulado: *1.000 oro*
> │ ---
> │ ⚔️ *ESTADO DE LOS JUGADORES:*
> │ 👤 *Geralt*:
> │    [8♣️, Q♠️] (18) (Esperando 🕒)
> │ 👤 *SirValen*:
> │    [A❤️, 10♦️] 🛡️ *Plantado* (21)
> │ ---
> │ Esperando respuestas... (0/1)
> │ Falta que respondan: *Geralt*
> │ ---
> │ 💬 *Respondé a este mensaje* con:
> │ • *pedir* (tomar otra carta)
> │ • *plantarse* (quedarte con tus cartas)
> ╰────────────────────
> ```

---

### Paso 3: Decisiones - Ronda 2
Solo Geralt sigue activo en la mesa (SirValen ya está plantado con 21). Geralt decide no arriesgarse a pasarse de 21 y se planta.

> **Geralt** *(respondiendo al tablero)*: `plantarse`
> *El bot reacciona con un emoji: ✅*

---

### Paso 4: Finalización y Pagos
Al no quedar más jugadores activos con estado `playing`, el bot finaliza la partida y calcula los ganadores:
- **Geralt:** Total 18 (Plantado)
- **SirValen:** Total 21 (Plantado) -> **Ganador** (Mayor puntaje sin pasarse de 21).

#### Cálculo del Pozo y Payout Garantizado:
- El pozo acumulado de las apuestas es de **1.000 oro**.
- Como SirValen ganó con un **Blackjack de 21**, tiene una garantía de pago de **2.5x su apuesta** (`500 * 2.5 = 1.250 oro`).
- El bot otorga el máximo entre la parte proporcional del pozo y la garantía: `Math.max(1000, 1250) = 1.250 oro`.
- SirValen recibe **1.250 oro** en su balance de Supabase (el pozo más una compensación de la casa por haber alcanzado 21).

El bot envía el mensaje final con los resultados:

> **Reino Bot:**
> ```text
> ╭─〔 🏆 *21 (Blackjack PvP) - Fin de Partida* 〕
> │ Apuesta: *500 oro* por jugador
> │ Pozo total: *1.000 oro*
> │ ---
> │ 🏁 *RESULTADOS FINALES:*
> │ 👤 *Geralt*:
> │    [8♣️, Q♠️] 🛡️ *Plantado* (18)
> │ 👤 *SirValen*:
> │    [A❤️, 10♦️] 🛡️ *Plantado* (21)
> │ ---
> │ 🏆 *SirValen* gana *1.250 oro* (Total: 4.350 oro)
> ╰────────────────────
> ```

---

### ⏱️ Control de Timeouts (Inactividad)
Si un jugador tarda más de **5 minutos** en responder, el bot ejecutará un timeout automático:
- Los jugadores inactivos se considerarán automáticamente como **plantados** (`plantarse`).
- La ronda se procesará inmediatamente con ese estado para evitar que una partida bloquee el oro de los demás participantes de forma indefinida.
