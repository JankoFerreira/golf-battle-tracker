import { describe, it, expect } from "vitest";
import { seed } from "../db";
import { stats, validateBackup } from "../domain";
import {
  recordFinish,
  chooseRound,
  currentBalance,
  setCurrentBalance,
} from "./actions";

describe("simplified play flow", () => {
  it("remembers a confirmed payout and records subsequent rounds without another amount", () => {
    const b = seed(true);
    recordFinish(b, "snowy-standard", "white-bear", 4, 0, true);
    expect(currentBalance(b)).toBe(2900);
    expect(b.tiers.find((t) => t.id === "snowy-standard")!.prizes[3]).toBe(0);
    recordFinish(
      b,
      "snowy-standard",
      "white-bear",
      4,
      b.tiers[1].prizes[3]!,
      false,
    );
    expect(currentBalance(b)).toBe(2200);
    validateBackup(b);
  });
  it("does not change payouts when remember is off", () => {
    const b = seed(true);
    recordFinish(b, "snowy-standard", "white-bear", 1, 1600, false);
    expect(b.tiers[1].prizes[0]).toBeNull();
    expect(currentBalance(b)).toBe(4500);
  });
  it("blocks unaffordable matches before remembering a payout", () => {
    const b = seed(false, 100);
    expect(() =>
      recordFinish(b, "snowy-standard", "white-bear", 1, 1600, true),
    ).toThrow(/below/);
    expect(b.matches).toHaveLength(0);
    expect(b.tiers[1].prizes[0]).toBeNull();
  });
  it("updates current balance as a correction without altering match stats", () => {
    const b = seed(true);
    recordFinish(b, "snowy-standard", "white-bear", 1, 1600, true);
    const profit = stats(b.matches, b.aggregates).profit;
    setCurrentBalance(b, 5000);
    expect(currentBalance(b)).toBe(5000);
    expect(b.adjustments[0].amount).toBe(500);
    expect(stats(b.matches, b.aggregates).profit).toBe(profit);
    setCurrentBalance(b, 5000);
    expect(b.adjustments).toHaveLength(1);
    validateBackup(b);
  });
  it("creates an optional club and new fee without rewriting existing tiers", () => {
    const b = seed(true);
    chooseRound(b, "pine-forest", 100, "");
    expect(b.clubs.find((c) => c.id === b.settings.lastClub)?.name).toBe(
      "My club",
    );
    const t = b.tiers.find((t) => t.id === b.settings.lastTier)!;
    expect(t.prizes).toEqual([null, null, null, null, null, null]);
    chooseRound(b, "pine-forest", 200, "My club");
    expect(b.tiers).toHaveLength(4);
    expect(b.clubs.filter((c) => c.courseId === "pine-forest")).toHaveLength(1);
    validateBackup(b);
  });
  it("reuses a saved club and tier on repeated setup", () => {
    const b = seed(true);
    chooseRound(b, "snowy-valley", 700, "White Bear");
    chooseRound(b, "snowy-valley", 700, "white bear");
    expect(b.tiers).toHaveLength(2);
    expect(b.clubs).toHaveLength(3);
    expect(b.settings.lastClub).toBe("white-bear");
  });
  it("keeps all older records when a player selects another round", () => {
    const b = seed(true);
    const original = structuredClone(b.aggregates);
    recordFinish(b, "snowy-standard", "white-bear", 1, 1600, true);
    chooseRound(b, "snowy-valley", 1400, "White Bear");
    expect(b.matches[0].fee).toBe(700);
    expect(b.aggregates).toEqual(original);
    expect(currentBalance(b)).toBe(4500);
  });
});
