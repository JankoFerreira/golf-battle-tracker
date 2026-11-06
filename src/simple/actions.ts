import { integer, ledger, uid, type Backup, type Match } from "../domain";

export function currentBalance(data: Backup) {
  return ledger(
    data.settings.startingBalance,
    data.matches,
    data.adjustments,
  ).at(-1)!.balance;
}

/** Create a result and optionally remember a user-confirmed payout atomically. */
export function recordFinish(
  data: Backup,
  tierId: string,
  clubId: string,
  position: number,
  prize: number,
  remember: boolean,
): Match {
  const tier = data.tiers.find((t) => t.id === tierId);
  const club = data.clubs.find((c) => c.id === clubId);
  if (!tier || !club || club.courseId !== tier.courseId)
    throw Error("Choose your course and club first.");
  integer(position, "Finish", 1);
  if (position > 6) throw Error("Choose a finish from 1st to 6th.");
  integer(prize, "Prize");
  if (currentBalance(data) < tier.fee)
    throw Error(
      "Your tracked coins are below the entry fee. Update your balance or choose a cheaper round.",
    );
  const match: Match = {
    id: uid(),
    at: new Date().toISOString(),
    courseId: tier.courseId,
    tierId,
    clubId,
    position,
    fee: tier.fee,
    prize,
    mood: "Unspecified",
    shootout: "None",
    mistake: false,
    rushed: false,
    shortcut: false,
    notes: "",
  };
  if (remember) tier.prizes[position - 1] = prize;
  data.matches.push(match);
  data.settings.lastTier = tierId;
  data.settings.lastClub = clubId;
  return match;
}

/** Correct the current balance without changing recorded match performance. */
export function setCurrentBalance(data: Backup, target: number) {
  integer(target, "Current coins");
  const amount = target - currentBalance(data);
  if (amount)
    data.adjustments.push({
      id: uid(),
      at: new Date().toISOString(),
      kind: "Correction",
      amount,
      notes: "Updated current balance from the Play screen",
    });
}

/** Remember a course/fee combination, preserving existing tiers and past matches. */
export function chooseRound(
  data: Backup,
  courseId: string,
  fee: number,
  clubName: string,
  existingTierId?: string,
  existingClubId?: string,
) {
  integer(fee, "Entry fee");
  if (!data.courses.some((c) => c.id === courseId))
    throw Error("Choose a course.");
  const name = clubName.trim() || "My club";
  let tier =
    data.tiers.find(
      (t) =>
        t.id === existingTierId && t.courseId === courseId && t.fee === fee,
    ) ?? data.tiers.find((t) => t.courseId === courseId && t.fee === fee);
  if (!tier) {
    tier = {
      id: uid(),
      courseId,
      name: `${fee.toLocaleString()} coins`,
      fee,
      prizes: [null, null, null, null, null, null],
    };
    data.tiers.push(tier);
  }
  let club =
    data.clubs.find(
      (c) =>
        c.id === existingClubId && c.courseId === courseId && c.name === name,
    ) ??
    data.clubs.find(
      (c) =>
        c.courseId === courseId && c.name.toLowerCase() === name.toLowerCase(),
    );
  if (!club) {
    club = {
      id: uid(),
      courseId,
      name,
      level: 1,
      power: 1,
      accuracy: 1,
      guideline: 1,
      notes: "Stats not entered. Level and ratings are placeholders.",
    };
    data.clubs.push(club);
  }
  data.settings.lastTier = tier.id;
  data.settings.lastClub = club.id;
}
