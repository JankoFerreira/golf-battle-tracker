import Dexie, { type Table } from "dexie";
import {
  type Backup,
  type Course,
  type Tier,
  type Club,
  type Match,
  type Adjustment,
  type Aggregate,
  type Settings,
  validateBackup,
} from "./domain";
class TrackerDB extends Dexie {
  courses!: Table<Course>;
  tiers!: Table<Tier>;
  clubs!: Table<Club>;
  matches!: Table<Match>;
  adjustments!: Table<Adjustment>;
  aggregates!: Table<Aggregate>;
  settings!: Table<Settings>;
  constructor() {
    super("golf-battle-tracker-v1");
    this.version(1).stores({
      courses: "id",
      tiers: "id,courseId",
      clubs: "id,courseId",
      matches: "id,at,courseId,clubId,tierId",
      adjustments: "id,at",
      aggregates: "id,courseId,clubId",
      settings: "id",
    });
  }
}
export const db = new TrackerDB();
export const defaults: Settings = {
  id: "main",
  initialized: false,
  player: "Player",
  startingBalance: 0,
  risk: 5,
  milestones: [5000, 10000, 25000, 50000, 100000, 250000, 1000000],
  theme: "dark",
  lastTier: "snowy-standard",
  lastClub: "white-bear",
};
export function seed(
  history = false,
  startingBalance = 0,
  player = "Player",
): Backup {
  const names = [
    "Pine Forest",
    "Rocky Mountains",
    "Snowy Valley",
    "Mayan Jungle",
    "Windy Cliffs",
    "Sakura Garden",
    "Lava Land",
    "Custom Greens",
  ];
  const courses = names.map((name) => ({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
  }));
  const clubs: Club[] = [
    {
      id: "white-bear",
      name: "White Bear",
      courseId: "snowy-valley",
      level: 1,
      power: 4,
      accuracy: 1,
      guideline: 3,
      notes: "Level is a placeholder — update to your actual level.",
    },
    {
      id: "alaska",
      name: "Alaska",
      courseId: "snowy-valley",
      level: 1,
      power: 2,
      accuracy: 2,
      guideline: 3,
      notes: "Level is a placeholder — update to your actual level.",
    },
    {
      id: "rocky-placeholder",
      name: "Rocky club (edit me)",
      courseId: "rocky-mountains",
      level: 1,
      power: 1,
      accuracy: 1,
      guideline: 1,
      notes: "Placeholder. Enter your actual club and stats.",
    },
  ];
  return {
    version: 1,
    settings: {
      ...defaults,
      initialized: true,
      player,
      startingBalance: history ? 3600 : startingBalance,
    },
    courses,
    clubs,
    tiers: [
      {
        id: "rocky-standard",
        courseId: "rocky-mountains",
        name: "Standard",
        fee: 225,
        prizes: [500, null, null, null, null, null],
      },
      {
        id: "snowy-standard",
        courseId: "snowy-valley",
        name: "Standard",
        fee: 700,
        prizes: [null, null, null, null, null, null],
      },
    ],
    matches: [],
    adjustments: [],
    aggregates: history
      ? [
          {
            id: "historical-rocky-30",
            courseId: "rocky-mountains",
            clubId: "rocky-placeholder",
            tierId: "rocky-standard",
            positions: [7, 7, 4, 5, 6, 1],
            profit: 675,
            fee: 225,
            label: "30 verified matches • order and dates unknown",
          },
          {
            id: "historical-alaska-2",
            courseId: "snowy-valley",
            clubId: "alaska",
            tierId: "snowy-standard",
            positions: [0, 0, 1, 1, 0, 0],
            profit: -400,
            fee: 700,
            label: "4th, then 3rd • individual payouts and dates unknown",
          },
          {
            id: "historical-white-bear-2",
            courseId: "snowy-valley",
            clubId: "white-bear",
            tierId: "snowy-standard",
            positions: [1, 0, 0, 1, 0, 0],
            profit: 200,
            fee: 700,
            label: "4th, then 1st • individual payouts and dates unknown",
          },
        ]
      : [],
  };
}
export async function snapshot(): Promise<Backup> {
  return db.transaction("r", db.tables, async () => ({
    version: 1,
    settings: (await db.settings.get("main")) ?? defaults,
    courses: await db.courses.toArray(),
    tiers: await db.tiers.toArray(),
    clubs: await db.clubs.toArray(),
    matches: await db.matches.toArray(),
    adjustments: await db.adjustments.toArray(),
    aggregates: await db.aggregates.toArray(),
  }));
}
export async function restore(b: Backup) {
  validateBackup(b);
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
    await db.settings.put(b.settings);
    for (const key of [
      "courses",
      "tiers",
      "clubs",
      "matches",
      "adjustments",
      "aggregates",
    ] as const)
      await db.table(key).bulkPut(b[key]);
  });
}
export async function mutate(change: (b: Backup) => void) {
  await db.transaction("rw", db.tables, async () => {
    const b = await snapshot();
    change(b);
    validateBackup(b);
    await db.settings.put(b.settings);
    for (const key of [
      "courses",
      "tiers",
      "clubs",
      "matches",
      "adjustments",
      "aggregates",
    ] as const) {
      await db.table(key).clear();
      await db.table(key).bulkPut(b[key]);
    }
  });
}
