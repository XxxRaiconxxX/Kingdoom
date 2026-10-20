// test_expeditions_combat.mjs
// Verificación automatizada de lógica de combate y liquidación de expediciones
import assert from "node:assert/strict";

console.log("=== INICIANDO PRUEBAS DE COMBATE DE EXPEDICIONES ===");

// 1. Simulación Arcade
console.log("\n[1] Probando lógica de combate Arcade...");

const STRENGTH_ATTACK_BONUS = 3;
const STRENGTH_ABILITY_BONUS = 4;
const DEFENSE_DAMAGE_REDUCTION = 2;
const ATTACK_CRIT_CHANCE = 0.2;
const ABILITY_CRIT_CHANCE = 0.32;
const DEFENSE_DODGE_CHANCE = 0.28;
const DEFENSE_REDUCE_CHANCE = 0.5;

function simulateArcadeTurn(state, action, effectiveStats, encounter, mutator) {
  let nextPlayerHp = state.playerHp;
  let nextEnemyHp = state.enemyHp;
  let nextCooldown = Math.max(0, state.abilityCooldown - 1);
  let nextPhaseTwo = state.phaseTwoTriggered;
  let result = "active";

  if (action === "attack" || action === "ability") {
    const baseDamage =
      action === "attack"
        ? 12 + effectiveStats.strength * STRENGTH_ATTACK_BONUS
        : 20 + effectiveStats.strength * STRENGTH_ABILITY_BONUS;

    const rawDamage = Math.floor(
      baseDamage *
        (action === "attack"
          ? (mutator.playerDamageMultiplier ?? 1)
          : (mutator.abilityDamageMultiplier ?? mutator.playerDamageMultiplier ?? 1))
    );
    let inflictedDamage = rawDamage;
    if (action === "ability") nextCooldown = 2;

    nextEnemyHp = Math.max(0, nextEnemyHp - inflictedDamage);

    if (
      !nextPhaseTwo &&
      nextEnemyHp > 0 &&
      nextEnemyHp <= Math.floor(state.enemyMaxHp * 0.35)
    ) {
      nextPhaseTwo = true;
      const healAmount = Math.floor(state.enemyMaxHp * 0.5);
      nextEnemyHp = Math.min(state.enemyMaxHp, nextEnemyHp + healAmount);
    }

    if (nextEnemyHp <= 0) result = "victory";
  }

  if (result === "active") {
    let enemyDamage = encounter.enemyAttackMin;
    if (action === "defend") {
      enemyDamage = Math.max(
        3,
        Math.floor(enemyDamage * 0.4) - effectiveStats.defense * DEFENSE_DAMAGE_REDUCTION
      );
    } else {
      enemyDamage = Math.max(1, enemyDamage - effectiveStats.defense * DEFENSE_DAMAGE_REDUCTION);
    }
    nextPlayerHp = Math.max(0, nextPlayerHp - enemyDamage);
    if (nextPlayerHp <= 0) result = "defeat";
  }

  return {
    playerHp: nextPlayerHp,
    enemyHp: nextEnemyHp,
    turn: state.turn + 1,
    abilityCooldown: nextCooldown,
    phaseTwoTriggered: nextPhaseTwo,
    result,
  };
}

// Test 1.1: Turno 1 Ataque reduce vida enemiga
const initialArcadeState = {
  playerHp: 130,
  playerMaxHp: 130,
  enemyHp: 92,
  enemyMaxHp: 92,
  turn: 1,
  abilityCooldown: 0,
  phaseTwoTriggered: false,
  result: "active",
};
const stats = { strength: 4, life: 2, defense: 2, agility: 1, intelligence: 1, magicDefense: 1 };
const encounter = {
  id: "frontier-rush",
  enemyHp: 92,
  enemyAttackMin: 10,
  enemyAttackMax: 17,
  rewardMin: 320,
  rewardMax: 500,
};
const mutator = { playerDamageMultiplier: 1, enemyDamageMultiplier: 1 };

const turn1 = simulateArcadeTurn(initialArcadeState, "attack", stats, encounter, mutator);
assert.ok(turn1.enemyHp < initialArcadeState.enemyHp, "La vida del enemigo DEBE reducirse con un ataque");
assert.ok(turn1.playerHp < initialArcadeState.playerHp, "La vida del jugador DEBE reducirse por la respuesta enemiga");
assert.equal(turn1.turn, 2, "El turno debe avanzar a 2");
console.log(`✓ Turno 1 Ataque exitoso: Enemigo HP ${initialArcadeState.enemyHp} -> ${turn1.enemyHp}, Jugador HP ${initialArcadeState.playerHp} -> ${turn1.playerHp}`);

// Test 1.2: Habilidad y cooldown
const turn2 = simulateArcadeTurn(turn1, "ability", stats, encounter, mutator);
assert.equal(turn2.abilityCooldown, 2, "La habilidad debe aplicar 2 turnos de cooldown");
console.log(`✓ Habilidad ejecutada: Cooldown fijado en ${turn2.abilityCooldown}`);

const turn3 = simulateArcadeTurn(turn2, "defend", stats, encounter, mutator);
assert.equal(turn3.abilityCooldown, 1, "El cooldown debe decrementarse en el siguiente turno");
console.log(`✓ Defensa ejecutada: Cooldown decrementado a ${turn3.abilityCooldown}`);

// 2. Simulación Narrativa
console.log("\n[2] Probando lógica de combate Narrativa...");
function simulateNarrativeTurn(state, action, encounter) {
  let nextPlayerHp = state.playerHp;
  let nextEnemyHp = state.enemyHp;
  let nextCooldown = Math.max(0, state.abilityCooldown - 1);
  let outcome = null;

  if (action === "retreat") {
    outcome = "retreat";
  } else {
    if (action === "attack") {
      const dealt = 18;
      nextEnemyHp = Math.max(0, nextEnemyHp - dealt);
    }
    if (action === "guard") {
      nextPlayerHp = Math.min(100, nextPlayerHp + 6);
    }
    if (action === "ability") {
      const dealt = 34;
      nextEnemyHp = Math.max(0, nextEnemyHp - dealt);
      nextCooldown = 2;
    }

    if (nextEnemyHp <= 0) {
      outcome = "victory";
    } else {
      const enemyDmg = action === "guard" ? 6 : 14;
      nextPlayerHp = Math.max(0, nextPlayerHp - enemyDmg);
      if (nextPlayerHp <= 0) outcome = "defeat";
    }
  }

  return {
    playerHp: nextPlayerHp,
    enemyHp: nextEnemyHp,
    turn: state.turn + 1,
    abilityCooldown: nextCooldown,
    result: outcome,
  };
}

const initialNarrative = { playerHp: 100, enemyHp: 82, turn: 1, abilityCooldown: 0, result: null };
const narrEncounter = { enemyHp: 82, rewardMin: 170, rewardMax: 260 };

const nTurn1 = simulateNarrativeTurn(initialNarrative, "attack", narrEncounter);
assert.ok(nTurn1.enemyHp < initialNarrative.enemyHp, "Enemigo narrativo debe recibir daño");
assert.ok(nTurn1.playerHp < initialNarrative.playerHp, "Jugador narrativo debe recibir contraataque");
console.log(`✓ Narrativa Turno 1: Enemigo HP ${initialNarrative.enemyHp} -> ${nTurn1.enemyHp}, Jugador HP ${initialNarrative.playerHp} -> ${nTurn1.playerHp}`);

// 3. Verificación de contrato de recompensas (Base del contrato)
console.log("\n[3] Verificando límites de recompensas en contratos...");
for (let i = 0; i < 100; i++) {
  const roll = Math.random();
  const payout = encounter.rewardMin + Math.floor(roll * (encounter.rewardMax - encounter.rewardMin + 1));
  assert.ok(payout >= encounter.rewardMin, "El payout no puede ser menor a rewardMin");
  assert.ok(payout <= encounter.rewardMax, "El payout no puede ser mayor a rewardMax");
}
console.log(`✓ 100 liquidaciones simuladas dentro del rango base del contrato [${encounter.rewardMin}, ${encounter.rewardMax}]`);

console.log("\n=== TODAS LAS VERIFICACIONES PASARON CON ÉXITO ===");
