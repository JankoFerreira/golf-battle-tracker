import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { NavLink, Route, Routes, useLocation, Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Coins,
  Download,
  Flag,
  History,
  LayoutDashboard,
  Plus,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  Undo2,
  Wallet,
  Sun,
  Moon,
  Menu,
  X,
  PenLine,
  Trash2,
  Upload,
  SlidersHorizontal,
  Mountain,
  CheckCircle2,
  Info,
  Search,
  Database,
  TrendingUp,
} from "lucide-react";
import { db, defaults, mutate, restore, seed, snapshot } from "../db";
import {
  type Backup,
  type Match,
  type Tier,
  type Club,
  type Aggregate,
  type Adjustment,
  coins,
  signed,
  net,
  stats,
  streak,
  ledger,
  moods,
  uid,
  csv,
  parseCSV,
} from "../domain";
import {
  Card,
  Modal,
  Empty,
  CourseIcon,
  Landscape,
  Trend,
  Bars,
} from "../components";
import type { Ctx } from "../context";
import {
  blankFilter,
  download,
  field,
  num,
  positionLabel,
  Money,
  Filters,
  filtered,
  KPI,
  MatchTable,
  MatchEditor,
} from "../shared";
const csvKeys = [
  "id",
  "at",
  "courseId",
  "tierId",
  "clubId",
  "position",
  "fee",
  "prize",
  "mood",
  "strokes",
  "shootout",
  "mistake",
  "rushed",
  "shortcut",
  "notes",
] as const;

export default function Settings({ data, run }: Ctx) {
  const jsonInput = useRef<HTMLInputElement>(null),
    csvInput = useRef<HTMLInputElement>(null);
  async function importJSON(file: File) {
    if (file.size > 30000000) throw Error("Backup is too large (30 MB limit).");
    const b: unknown = JSON.parse(await file.text());
    if (
      !confirm(
        "Replace ALL data on this device with this backup? Export your current backup first. Reimporting the same file will not duplicate records.",
      )
    )
      return;
    await restore(b as Backup);
  }
  async function importCSV(file: File) {
    if (file.size > 10000000) throw Error("CSV is too large (10 MB limit).");
    const rows = parseCSV(await file.text());
    const header = rows.shift();
    if (!header || csvKeys.some((k) => !header.includes(k)))
      throw Error(
        "Use a match CSV exported by this tracker. All match columns are required.",
      );
    const incoming = rows.map((row) => {
      if (row.length !== header.length) throw Error("Invalid CSV row length.");
      const v = Object.fromEntries(header.map((k, i) => [k, row[i]]));
      for (const k of ["mistake", "rushed", "shortcut"])
        if (!["true", "false"].includes(v[k]))
          throw Error("Boolean columns must contain true or false.");
      for (const k of ["position", "fee", "prize"])
        if (v[k].trim() === "") throw Error("Required numeric field is blank.");
      return {
        ...v,
        position: Number(v.position),
        fee: Number(v.fee),
        prize: Number(v.prize),
        strokes: v.strokes ? Number(v.strokes) : undefined,
        mistake: v.mistake === "true",
        rushed: v.rushed === "true",
        shortcut: v.shortcut === "true",
      } as unknown as Match;
    });
    if (
      !confirm(
        `Import ${incoming.length} match rows? Existing identical IDs will be skipped. New matches affect your current balance; this is not a historical-summary import.`,
      )
    )
      return;
    await mutate((b) => {
      const same = (m: Match) => JSON.stringify(csvKeys.map((k) => m[k] ?? ""));
      for (const m of incoming) {
        const old = b.matches.find((x) => x.id === m.id);
        if (old) {
          if (same(old) !== same(m))
            throw Error(
              `Conflicting match ID ${m.id}. Import cancelled; use JSON restore for a full replacement.`,
            );
        } else b.matches.push(m);
      }
    });
  }
  return (
    <div className="settings-layout">
      <div>
        <Card title="Player profile" sub="Saved only in this browser.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              void run(
                () =>
                  mutate((b) => {
                    b.settings.player = field(f, "player").trim();
                    b.settings.startingBalance = num(f, "balance");
                  }),
                "Profile updated",
              );
            }}
          >
            <div className="form-grid">
              <label>
                Player name
                <input
                  name="player"
                  defaultValue={data.settings.player}
                  required
                  maxLength={60}
                />
              </label>
              <label>
                Opening balance
                <input
                  name="balance"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={data.settings.startingBalance}
                  required
                />
              </label>
            </div>
            <p className="fineprint">
              Changing the opening balance recalculates your full balance
              history. To correct today’s balance, add a correction in Coin
              bankroll.
            </p>
            <button className="button primary">Save profile</button>
          </form>
        </Card>
        <Card
          title="Your data, in your hands"
          sub="Keep a backup before switching devices or clearing browser data."
        >
          <div className="data-action">
            <div className="action-icon">
              <Database size={20} />
            </div>
            <div>
              <strong>Full JSON backup</strong>
              <p>Profile, clubs, courses, matches, rewards and summaries.</p>
            </div>
            <button
              className="button secondary"
              onClick={() =>
                download(
                  "golf-battle-backup.json",
                  JSON.stringify(data, null, 2),
                )
              }
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="data-action">
            <div className="action-icon">
              <Upload size={20} />
            </div>
            <div>
              <strong>Restore JSON backup</strong>
              <p>
                Replaces this device’s data. IDs prevent duplicate restores.
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => jsonInput.current?.click()}
            >
              Restore
            </button>
            <input
              ref={jsonInput}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void run(() => importJSON(file), "Backup restore complete");
                e.target.value = "";
              }}
            />
          </div>
          <div className="data-action">
            <div className="action-icon">
              <History size={20} />
            </div>
            <div>
              <strong>Match CSV</strong>
              <p>
                Dated matches only. Round-trip import uses course and club IDs.
              </p>
            </div>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() =>
                  download(
                    "golf-battle-matches.csv",
                    csv([
                      Array.from(csvKeys),
                      ...data.matches.map((m) => csvKeys.map((k) => m[k])),
                    ]),
                    "text/csv",
                  )
                }
              >
                <Download size={16} />
                Export
              </button>
              <button
                className="button secondary"
                onClick={() => csvInput.current?.click()}
              >
                Import
              </button>
            </div>
            <input
              ref={csvInput}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void run(() => importCSV(file), "CSV import complete");
                e.target.value = "";
              }}
            />
          </div>
          <div className="data-action">
            <div className="action-icon">
              <TrendingUp size={20} />
            </div>
            <div>
              <strong>Analytics report</strong>
              <p>Course totals including historical summaries.</p>
            </div>
            <button
              className="button secondary"
              onClick={() =>
                download(
                  "golf-battle-analytics.csv",
                  csv([
                    [
                      "Course",
                      "Matches",
                      "Profit",
                      "Win rate (%)",
                      "Top three (%)",
                      "Average profit",
                    ],
                    ...data.courses.map((c) => {
                      const s = stats(
                        data.matches.filter((m) => m.courseId === c.id),
                        data.aggregates.filter((a) => a.courseId === c.id),
                      );
                      return [
                        c.name,
                        s.total,
                        s.profit,
                        s.win.toFixed(2),
                        s.top3.toFixed(2),
                        s.average.toFixed(2),
                      ];
                    }),
                  ]),
                  "text/csv",
                )
              }
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </Card>
        <Card
          title="Start over"
          sub="This clears this device’s profile and records."
          className="danger-card"
        >
          <p>Export a JSON backup first if you want to keep your progress.</p>
          <button
            className="button danger"
            onClick={() => {
              if (
                prompt("Type RESET to erase all records on this device.") ===
                "RESET"
              )
                void run(async () => {
                  await restore({ ...seed(false), settings: { ...defaults } });
                }, "Tracker reset");
            }}
          >
            <Trash2 size={16} />
            Reset this tracker
          </button>
        </Card>
      </div>
      <div>
        <Card title="Local-first by design">
          <ShieldCheck className="positive" size={30} />
          <h3 className="spaced-title">Your stats stay yours.</h3>
          <p>
            Other players opening this link get their own tracker. There’s no
            shared database, leaderboard, or cloud account.
          </p>
          <p>
            Data is tied to this browser and website address. Use JSON backups
            to transfer it.
          </p>
          <div className="notice">
            Offline ready after the first complete load. On iPhone, use Safari →
            Share → Add to Home Screen.
          </div>
          <p className="fineprint">
            Private browsing and clearing site data can erase your records.
            Export regularly.
          </p>
        </Card>
        <Card title="About this tracker">
          <span className="tag success">VERSION 1.0 · MVP</span>
          <p>
            Built with React, TypeScript and IndexedDB. An independent fan-made
            tool for Golf Battle players.
          </p>
          <p className="fineprint">
            All coins are virtual game currency. Payouts are entered by you and
            may change with game versions.
          </p>
        </Card>
      </div>
    </div>
  );
}
