export const moods = [
  "Focused",
  "Relaxed",
  "Rushed",
  "Frustrated",
  "Distracted",
  "Unspecified",
] as const;
export type Mood = (typeof moods)[number];
export interface Course {
  id: string;
  name: string;
}
export interface Tier {
  id: string;
  courseId: string;
  name: string;
  fee: number;
  prizes: (number | null)[];
}
export interface Club {
  id: string;
  courseId: string;
  name: string;
  level: number;
  power: number;
  accuracy: number;
  guideline: number;
  notes: string;
  image?: string;
}
export interface Match {
  id: string;
  at: string;
  courseId: string;
  tierId: string;
  clubId: string;
  position: number;
  fee: number;
  prize: number;
  mood: Mood;
  strokes?: number;
  shootout: "None" | "Won" | "Lost";
  mistake: boolean;
  rushed: boolean;
  shortcut: boolean;
  notes: string;
}
export interface Adjustment {
  id: string;
  at: string;
  kind: "Chest reward" | "Daily reward" | "Other reward" | "Correction";
  amount: number;
  notes: string;
}
export interface Aggregate {
  id: string;
  courseId: string;
  clubId: string;
  tierId: string;
  positions: number[];
  profit: number;
  fee: number;
  label: string;
}
export interface Settings {
  id: "main";
  initialized: boolean;
  player: string;
  startingBalance: number;
  risk: number;
  milestones: number[];
  theme: "dark" | "light";
  lastTier: string;
  lastClub: string;
}
export interface Backup {
  version: 1;
  settings: Settings;
  courses: Course[];
  tiers: Tier[];
  clubs: Club[];
  matches: Match[];
  adjustments: Adjustment[];
  aggregates: Aggregate[];
}
export const uid = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
export const coins = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });
export const signed = (n: number) =>
  `${n >= 0 ? "+" : "−"}${coins(Math.abs(n))}`;
export function integer(
  n: unknown,
  name = "Coin amount",
  min = 0,
): asserts n is number {
  if (
    typeof n !== "number" ||
    !Number.isSafeInteger(n) ||
    n < min ||
    Math.abs(n) > 1e12
  )
    throw Error(
      `${name} must be a whole number between ${min} and 1 trillion.`,
    );
}
export function net(m: Match) {
  return m.prize - m.fee;
}
export function ledger(
  start: number,
  matches: Match[],
  adjustments: Adjustment[],
) {
  let balance = start;
  return [
    { id: "opening", at: "", balance, delta: 0, kind: "Opening balance" },
    ...[
      ...matches.map((m) => ({
        id: m.id,
        at: m.at,
        delta: net(m),
        kind: "Match",
      })),
      ...adjustments.map((a) => ({
        id: a.id,
        at: a.at,
        delta: a.amount,
        kind: a.kind,
      })),
    ]
      .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
      .map((e) => ({ ...e, balance: (balance += e.delta) })),
  ];
}
export function stats(matches: Match[], aggregates: Aggregate[] = []) {
  const positions = Array.from(
    { length: 6 },
    (_, i) =>
      matches.filter((m) => m.position === i + 1).length +
      aggregates.reduce((s, a) => s + a.positions[i], 0),
  );
  const total = positions.reduce((s, n) => s + n, 0),
    profit =
      matches.reduce((s, m) => s + net(m), 0) +
      aggregates.reduce((s, a) => s + a.profit, 0);
  return {
    total,
    profit,
    positions,
    win: total ? (positions[0] / total) * 100 : 0,
    top3: total
      ? (positions.slice(0, 3).reduce((s, n) => s + n, 0) / total) * 100
      : 0,
    average: total ? profit / total : 0,
  };
}
export function streak(matches: Match[]) {
  const sorted = [...matches].sort(
    (a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id),
  );
  let count = 0;
  const direction = sorted.length ? Math.sign(net(sorted[0])) : 0;
  for (const m of sorted) {
    if (Math.sign(net(m)) !== direction) break;
    count++;
  }
  return { count, direction };
}
function unique(rows: { id: string }[]) {
  const ids = new Set();
  for (const row of rows) {
    if (typeof row.id !== "string" || !row.id || ids.has(row.id))
      throw Error("Missing or duplicate record IDs.");
    ids.add(row.id);
  }
}
function textField(v: unknown) {
  if (typeof v !== "string" || v.length > 10000)
    throw Error("Invalid text field.");
}
function date(v: unknown) {
  if (typeof v !== "string" || !v || !Number.isFinite(Date.parse(v)))
    throw Error("Invalid date.");
}
export function validateBackup(value: unknown): asserts value is Backup {
  const b = value as Backup;
  if (!b || b.version !== 1 || !b.settings)
    throw Error("Unsupported backup format.");
  for (const key of [
    "courses",
    "tiers",
    "clubs",
    "matches",
    "adjustments",
    "aggregates",
  ] as const) {
    if (!Array.isArray(b[key]) || b[key].length > 100000)
      throw Error(`Invalid ${key}.`);
    unique(b[key]);
  }
  const s = b.settings;
  if (
    s.id !== "main" ||
    typeof s.initialized !== "boolean" ||
    !["dark", "light"].includes(s.theme)
  )
    throw Error("Invalid settings.");
  textField(s.player);
  textField(s.lastTier);
  textField(s.lastClub);
  integer(s.startingBalance);
  if (!Number.isFinite(s.risk) || s.risk <= 0 || s.risk > 100)
    throw Error("Risk must be between 0 and 100%.");
  if (!Array.isArray(s.milestones) || s.milestones.length > 100)
    throw Error("Invalid milestones.");
  s.milestones.forEach((x) => integer(x, "Milestone", 1));
  const course = (id: string) => {
    if (!b.courses.some((x) => x.id === id)) throw Error("Unknown course.");
  };
  const refs = (x: Match | Aggregate) => {
    course(x.courseId);
    if (
      !b.tiers.some((t) => t.id === x.tierId && t.courseId === x.courseId) ||
      !b.clubs.some((c) => c.id === x.clubId && c.courseId === x.courseId)
    )
      throw Error("Club or tier does not belong to this course.");
    integer(x.fee, "Entry fee");
  };
  b.courses.forEach((c) => {
    textField(c.name);
    if (!c.name.trim()) throw Error("Course name is required.");
  });
  b.tiers.forEach((t) => {
    course(t.courseId);
    textField(t.name);
    if (!t.name.trim()) throw Error("Tier name is required.");
    integer(t.fee);
    if (!Array.isArray(t.prizes) || t.prizes.length !== 6)
      throw Error("Six payout slots are required.");
    t.prizes.forEach((p) => {
      if (p !== null) integer(p, "Prize");
    });
  });
  b.clubs.forEach((c) => {
    course(c.courseId);
    textField(c.name);
    if (!c.name.trim()) throw Error("Club name is required.");
    textField(c.notes);
    integer(c.level, "Level", 1);
    for (const n of [c.power, c.accuracy, c.guideline]) {
      integer(n, "Club stat", 1);
      if (n > 5) throw Error("Club stats must be 1–5.");
    }
    if (
      c.image &&
      (!/^data:image\/(png|jpeg|webp);base64,/.test(c.image) ||
        c.image.length > 1500000)
    )
      throw Error("Invalid club image.");
  });
  b.matches.forEach((m) => {
    refs(m);
    date(m.at);
    integer(m.prize);
    integer(m.position, "Position", 1);
    if (
      m.position > 6 ||
      !moods.includes(m.mood) ||
      !["None", "Won", "Lost"].includes(m.shootout)
    )
      throw Error("Invalid match details.");
    if (m.strokes !== undefined) integer(m.strokes, "Strokes", 1);
    for (const v of [m.rushed, m.mistake, m.shortcut])
      if (typeof v !== "boolean") throw Error("Invalid match flags.");
    textField(m.notes);
  });
  b.adjustments.forEach((a) => {
    date(a.at);
    integer(a.amount, "Adjustment", -1e12);
    if (
      !["Chest reward", "Daily reward", "Other reward", "Correction"].includes(
        a.kind,
      ) ||
      (a.kind !== "Correction" && a.amount < 0)
    )
      throw Error("Invalid adjustment.");
    textField(a.notes);
  });
  b.aggregates.forEach((a) => {
    refs(a);
    textField(a.label);
    integer(a.profit, "Historical profit", -1e12);
    if (!Array.isArray(a.positions) || a.positions.length !== 6)
      throw Error("Invalid historical positions.");
    a.positions.forEach((n) => integer(n));
  });
  const allIds = [...b.matches, ...b.adjustments, ...b.aggregates];
  unique(allIds);
  const values = ledger(s.startingBalance, b.matches, b.adjustments);
  if (
    values.some(
      (x) => !Number.isSafeInteger(x.balance) || Math.abs(x.balance) > 1e12,
    )
  )
    throw Error("Balance exceeds supported range.");
}
export function csv(rows: (string | number | boolean | undefined)[][]) {
  return rows
    .map((r) =>
      r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
}
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw Error("Unclosed CSV quote.");
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
