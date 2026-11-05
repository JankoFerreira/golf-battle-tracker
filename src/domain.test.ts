import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  ledger,
  stats,
  validateBackup,
  parseCSV,
  csv,
  type Match,
  streak,
} from "./domain";
import { db, seed, restore, snapshot, mutate } from "./db";
const match = (overrides: Partial<Match> = {}): Match => ({
  id: "m1",
  at: "2026-11-05T10:00:00.000Z",
  courseId: "snowy-valley",
  tierId: "snowy-standard",
  clubId: "white-bear",
  position: 1,
  fee: 700,
  prize: 1600,
  mood: "Focused",
  shootout: "None",
  mistake: false,
  rushed: false,
  shortcut: false,
  notes: "",
  ...overrides,
});
beforeEach(async () => {
  await db.delete();
  await db.open();
});
describe("historical accounting", () => {
  it("preserves 34 real aggregate results without fabricating matches or applying profits twice", () => {
    const b = seed(true);
    validateBackup(b);
    expect(b.matches).toHaveLength(0);
    expect(stats(b.matches, b.aggregates)).toMatchObject({
      total: 34,
      profit: 475,
      positions: [8, 7, 5, 7, 6, 1],
    });
    expect(
      ledger(b.settings.startingBalance, b.matches, b.adjustments).at(-1)
        ?.balance,
    ).toBe(3600);
  });
  it("restores the same backup twice without duplication", async () => {
    const b = seed(true);
    await restore(b);
    await restore(b);
    const result = await snapshot();
    expect(result.aggregates).toHaveLength(3);
    expect(result.settings.startingBalance).toBe(3600);
  });
});
describe("ledger", () => {
  it("orders events and recalculates after historical edits and deletions", () => {
    const a = {
      id: "reward",
      at: "2026-11-05T11:00:00.000Z",
      kind: "Daily reward" as const,
      amount: 100,
      notes: "",
    };
    const m2 = match({
      id: "m2",
      at: "2026-11-05T12:00:00.000Z",
      prize: 0,
      position: 4,
    });
    expect(ledger(3600, [m2, match()], [a]).map((e) => e.balance)).toEqual([
      3600, 4500, 4600, 3900,
    ]);
    expect(
      ledger(3600, [m2, match({ prize: 1000 })], [a]).at(-1)?.balance,
    ).toBe(3300);
    expect(ledger(3600, [m2], [a]).at(-1)?.balance).toBe(3000);
  });
  it("does not confuse podium positions with coin gains", () => {
    expect(streak([match({ prize: 500, position: 3 })])).toEqual({
      count: 1,
      direction: -1,
    });
  });
  it("stores snapshot fees even after tier price changes", async () => {
    const b = seed(true);
    b.matches = [match()];
    await restore(b);
    await mutate((x) => {
      x.tiers[1].fee = 1000;
    });
    expect((await snapshot()).matches[0].fee).toBe(700);
  });
});
describe("validation and transactions", () => {
  it("rejects fractional coins, invalid dates, missing references and duplicate IDs", () => {
    for (const overrides of [
      { fee: 1.5 },
      { at: "invalid" },
      { clubId: "unknown" },
      { position: 7 },
      { prize: -1 },
    ]) {
      const b = seed(true);
      b.matches = [match(overrides)];
      expect(() => validateBackup(b)).toThrow();
    }
    const b = seed(true);
    b.matches = [match(), match()];
    expect(() => validateBackup(b)).toThrow(/duplicate/);
  });
  it("rejects a mismatched club course", () => {
    const b = seed();
    b.matches = [match({ clubId: "rocky-placeholder" })];
    expect(() => validateBackup(b)).toThrow(/belong/);
  });
  it("rolls back all changes after invalid mutation", async () => {
    await restore(seed(true));
    await expect(
      mutate((b) => {
        b.settings.startingBalance = 9999;
        b.matches.push(match({ fee: 0.5 }));
      }),
    ).rejects.toThrow();
    expect((await snapshot()).settings.startingBalance).toBe(3600);
  });
  it("keeps an existing dataset intact on invalid restore", async () => {
    await restore(seed(true));
    const invalid = seed();
    invalid.tiers[0].prizes = [1];
    await expect(restore(invalid)).rejects.toThrow();
    expect((await snapshot()).aggregates).toHaveLength(3);
  });
  it("keeps unknown payouts distinct from confirmed zero", () => {
    const b = seed();
    expect(b.tiers[1].prizes[0]).toBeNull();
    b.tiers[1].prizes[0] = 0;
    expect(() => validateBackup(b)).not.toThrow();
  });
  it("serializes concurrent writes", async () => {
    await restore(seed());
    await Promise.all([
      mutate((b) => b.matches.push(match({ id: "a" }))),
      mutate((b) => b.matches.push(match({ id: "b" }))),
    ]);
    expect((await snapshot()).matches).toHaveLength(2);
  });
});
describe("CSV", () => {
  it("round trips commas, multiline notes, quotes and unicode", () => {
    const rows = [
      ["id", "notes"],
      ["123", 'Great, "calm"\nround — yes'],
    ];
    expect(parseCSV(csv(rows))).toEqual(rows);
  });
  it("rejects malformed quoted content", () =>
    expect(() => parseCSV('id,"unfinished')).toThrow());
});
