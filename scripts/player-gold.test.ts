import { expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  rpc: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(),
  select: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock("../src/utils/supabaseClient", () => ({ supabase: db, publicSupabase: db }));
import { incrementPlayerGold, updatePlayerGold } from "../src/utils/players";

it("does not report rejected, invalid, or unmatched gold writes as successful", async () => {
  for (const method of [db.from, db.update, db.eq, db.select]) method.mockReturnValue(db);
  for (const invalid of [NaN, Infinity, -Infinity, 0.5, 2147483648]) {
    expect(await incrementPlayerGold("player-a", invalid)).toBeNull();
    expect(await updatePlayerGold("player-a", invalid)).toBe(false);
  }
  expect(await updatePlayerGold("player-a", -1)).toBe(false);
  expect(await incrementPlayerGold("player-a", 0)).toBeNull();
  expect(db.rpc).not.toHaveBeenCalled();
  expect(db.from).not.toHaveBeenCalled();

  db.rpc.mockResolvedValue({ data: [{ success: false, new_gold: 10 }], error: null });
  expect(await incrementPlayerGold("player-a", -20)).toBeNull();
  expect(db.from).not.toHaveBeenCalled();
  db.rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
  expect(await incrementPlayerGold("player-a", 20)).toBeNull();
  db.rpc.mockResolvedValue({ data: [{ success: true, new_gold: 30 }], error: null });
  expect(await incrementPlayerGold("player-a", 20)).toBe(30);
  expect(db.rpc).toHaveBeenLastCalledWith("increment_gold", { p_player_id: "player-a", p_amount: 20 });

  for (const malformed of [null, undefined, "", -1, 0.5, 2147483648]) {
    db.rpc.mockResolvedValue({ data: [{ success: true, new_gold: malformed }], error: null });
    expect(await incrementPlayerGold("player-a", 20)).toBeNull();
  }

  db.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await updatePlayerGold("player-a", 50)).toBe(false);
  db.maybeSingle.mockResolvedValue({ data: { id: "player-b" }, error: null });
  expect(await updatePlayerGold("player-a", 50)).toBe(false);
  db.maybeSingle.mockResolvedValue({ data: { id: "player-a" }, error: null });
  expect(await updatePlayerGold("player-a", 0)).toBe(true);
  expect(db.update).toHaveBeenLastCalledWith({ gold: 0 });
});
