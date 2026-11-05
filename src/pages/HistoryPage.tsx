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
export default function HistoryPage({ data, run }: Ctx) {
  const [f, setF] = useState(blankFilter),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState<Match | null>(null),
    [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const subset = filtered(data, f),
    matches = subset.matches
      .filter((m) =>
        [
          m.notes,
          data.courses.find((c) => c.id === m.courseId)?.name,
          data.clubs.find((c) => c.id === m.clubId)?.name,
          m.mood,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
      .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <Filters data={data} value={f} onChange={setF} />
      <Card
        title="Match log"
        sub={`${matches.length} dated records`}
        action={
          <label className="search">
            <Search size={16} />
            <input
              placeholder="Search matches…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        }
      >
        {matches.length ? (
          <MatchTable
            data={data}
            matches={matches}
            onEdit={setEditing}
            onDelete={(m) => {
              if (
                confirm(
                  "Delete this match? All subsequent balances will be recalculated.",
                )
              )
                void run(
                  () =>
                    mutate((b) => {
                      b.matches = b.matches.filter((x) => x.id !== m.id);
                    }),
                  "Match deleted",
                );
            }}
          />
        ) : (
          <Empty
            title="No matching records"
            text="New matches appear here. Historical summaries are shown below."
          />
        )}
      </Card>
      <Card
        title="Historical summaries"
        sub="Already reflected in your opening balance. Included in all-time performance, never in the balance ledger."
      >
        {subset.aggregates.map((a) => (
          <div className="aggregate" key={a.id}>
            <span className="course-icon">
              <CourseIcon id={a.courseId} />
            </span>
            <div>
              <strong>
                {data.courses.find((c) => c.id === a.courseId)?.name} ·{" "}
                {data.clubs.find((c) => c.id === a.clubId)?.name}
              </strong>
              <p>{a.label}</p>
              <div className="aggregate-positions">
                {a.positions.map((n, i) => (
                  <span key={i}>
                    {positionLabel(i + 1)}: <b>{n}</b>
                  </span>
                ))}
              </div>
            </div>
            <Money n={a.profit} />
            <button
              className="icon-btn"
              aria-label="Edit historical summary"
              onClick={() => setAggregate(a)}
            >
              <PenLine size={16} />
            </button>
            <button
              className="icon-btn negative"
              aria-label="Delete historical summary"
              onClick={() => {
                if (
                  confirm(
                    "Remove this summary from analytics? Your opening balance will stay unchanged.",
                  )
                )
                  void run(
                    () =>
                      mutate((b) => {
                        b.aggregates = b.aggregates.filter(
                          (x) => x.id !== a.id,
                        );
                      }),
                    "Summary removed",
                  );
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {!subset.aggregates.length && (
          <p className="muted">
            No historical summaries in this view. Undated summaries are excluded
            by date filters.
          </p>
        )}
      </Card>
      {editing && (
        <MatchEditor
          data={data}
          match={editing}
          close={() => setEditing(null)}
          save={(m) =>
            run(async () => {
              await mutate((b) => {
                b.matches = b.matches.map((x) => (x.id === m.id ? m : x));
              });
              setEditing(null);
            }, "Match updated; balances recalculated")
          }
        />
      )}
      {aggregate && (
        <Modal title="Edit historical summary" close={() => setAggregate(null)}>
          <p className="fineprint">
            Undated results only. Changes affect performance statistics, not
            your opening balance.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              void run(async () => {
                const a = {
                  ...aggregate,
                  profit: num(f, "profit"),
                  fee: num(f, "fee"),
                  label: field(f, "label"),
                  positions: [1, 2, 3, 4, 5, 6].map((n) => num(f, `p${n}`)),
                };
                await mutate((b) => {
                  b.aggregates = b.aggregates.map((x) =>
                    x.id === a.id ? a : x,
                  );
                });
                setAggregate(null);
              });
            }}
          >
            <label>
              Description
              <input name="label" defaultValue={aggregate.label} required />
            </label>
            <div className="form-grid">
              <label>
                Total net profit
                <input
                  name="profit"
                  type="number"
                  step="1"
                  defaultValue={aggregate.profit}
                  required
                />
              </label>
              <label>
                Entry fee
                <input
                  name="fee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={aggregate.fee}
                  required
                />
              </label>
            </div>
            <div className="form-grid three">
              {aggregate.positions.map((n, i) => (
                <label key={i}>
                  {positionLabel(i + 1)} count
                  <input
                    name={`p${i + 1}`}
                    defaultValue={n}
                    type="number"
                    min="0"
                    step="1"
                    required
                  />
                </label>
              ))}
            </div>
            <button className="button primary">Save summary</button>
          </form>
        </Modal>
      )}
    </>
  );
}
