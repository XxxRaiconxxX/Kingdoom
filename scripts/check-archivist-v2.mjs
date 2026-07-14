import assert from "node:assert/strict";
import { resolveExactPlayerTargets } from "../src/features/archivist/archivistActionGuards.ts";

const players = [
  { id: "player-ana", username: "Ana" },
  { id: "player-anabel", username: "Anabel" },
  { id: "player-borin", username: "Bor\u00edn" },
];

const exact = resolveExactPlayerTargets(players, ["ana", "BORIN", "player-ana"]);
assert.deepEqual(
  exact.matches.map((player) => player.id).sort(),
  ["player-ana", "player-borin"]
);
assert.deepEqual(exact.missing, []);
assert.deepEqual(exact.ambiguous, []);

const noSubstringMatch = resolveExactPlayerTargets(players, ["nabe"]);
assert.deepEqual(noSubstringMatch.matches, []);
assert.deepEqual(noSubstringMatch.missing, ["nabe"]);

const ambiguous = resolveExactPlayerTargets(
  [...players, { id: "player-ana-2", username: "Ana" }],
  ["ana"]
);
assert.deepEqual(ambiguous.matches, []);
assert.deepEqual(ambiguous.ambiguous, ["ana"]);

console.log("Archivist v2 self-check: OK");
