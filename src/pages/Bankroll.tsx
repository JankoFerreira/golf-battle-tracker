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
export default function Bankroll({ data, run }: Ctx) {
  const [adjustment, setAdjustment] = useState<Adjustment | null>(null);
  const entries = ledger(
      data.settings.startingBalance,
      data.matches,
      data.adjustments,
    ),
    balance = entries.at(-1)!.balance,
    s = stats(data.matches),
    rewards = data.adjustments
      .filter((a) => a.kind !== "Correction")
      .reduce((s, a) => s + a.amount, 0),
    corrections = data.adjustments
      .filter((a) => a.kind === "Correction")
      .reduce((s, a) => s + a.amount, 0);
  return (
    <>
      <div className="stats-grid">
        <KPI
          label="CURRENT BALANCE"
          value={coins(balance)}
          caption={`Opening: ${coins(data.settings.startingBalance)}`}
          icon={<Wallet size={19} />}
          color="balance-kpi"
        />
        <KPI
          label="NEW MATCH PROFIT"
          value={<Money n={s.profit} />}
          caption="Since setup · summaries excluded"
          icon={<TrendingUp size={19} />}
        />
        <KPI
          label="REWARDS COLLECTED"
          value={<Money n={rewards} />}
          caption="Chests, daily and other rewards"
          icon={<Coins size={19} />}
        />
        <KPI
          label="BALANCE CORRECTIONS"
          value={<Money n={corrections} />}
          caption="Kept separate from performance"
          icon={<Settings2 size={19} />}
        />
      </div>
      <div className="two-grid">
        <Card
          title="Your risk budget"
          sub="A limit for virtual coins, not a prediction of wins."
        >
          <div className="bank-number">
            {coins(
              Math.max(0, Math.floor((balance * data.settings.risk) / 100)),
            )}
            <small>maximum entry at your current limit</small>
          </div>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const risk = num(e.currentTarget, "risk");
              void run(
                () =>
                  mutate((b) => {
                    b.settings.risk = risk;
                  }),
                "Risk limit updated",
              );
            }}
          >
            <label>
              Entry risk limit (%)
              <input
                name="risk"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                defaultValue={data.settings.risk}
                required
              />
            </label>
            <button className="button secondary">Save limit</button>
          </form>
          <div className="notice">
            An affordable entry is not a guarantee of profit. Move up only when
            your results and bankroll support it.
          </div>
        </Card>
        <Card
          title="Tier affordability"
          sub="Based on your current balance and risk limit."
        >
          <div className="affordability">
            {data.tiers.map((t) => {
              const risk = balance > 0 ? (t.fee / balance) * 100 : Infinity,
                ok = risk <= data.settings.risk && t.fee <= balance;
              return (
                <div key={t.id}>
                  <span className="course-icon">
                    <CourseIcon id={t.courseId} size={19} />
                  </span>
                  <div>
                    <strong>
                      {data.courses.find((c) => c.id === t.courseId)?.name}
                    </strong>
                    <small>
                      {t.name} · {coins(t.fee)} coins
                    </small>
                  </div>
                  <span className={ok ? "tag success" : "tag warning-tag"}>
                    {ok
                      ? "Within limit"
                      : Number.isFinite(risk)
                        ? `${risk.toFixed(1)}% risk`
                        : "No bankroll"}
                  </span>
                </div>
              );
            })}
            {!data.tiers.length && (
              <p className="muted">Add entry tiers in Course analytics.</p>
            )}
          </div>
        </Card>
      </div>
      <Card title="Coin milestones" sub="Keep an eye on the bigger picture.">
        <div className="milestones">
          {[...data.settings.milestones]
            .sort((a, b) => a - b)
            .map((n) => (
              <div key={n} className={balance >= n ? "achieved" : ""}>
                <Trophy size={20} />
                <strong>{coins(n)}</strong>
                <span>
                  {balance >= n
                    ? "Reached"
                    : `${Math.max(0, Math.min(100, (balance / n) * 100)).toFixed(0)}%`}
                </span>
                <div className="progress">
                  <i
                    style={{
                      width: `${Math.max(0, Math.min(100, (balance / n) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget,
              n = num(f, "milestone");
            void run(async () => {
              await mutate((b) => {
                b.settings.milestones = [
                  ...new Set([...b.settings.milestones, n]),
                ];
              });
              f.reset();
            }, "Milestone added");
          }}
        >
          <label>
            Custom milestone
            <input
              name="milestone"
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g. 15,000"
            />
          </label>
          <button className="button secondary">
            <Plus size={16} />
            Add milestone
          </button>
        </form>
      </Card>
      <Card
        title="Rewards & balance adjustments"
        sub="Corrections add or subtract coins; they do not set an absolute balance."
        action={
          <button
            className="button primary"
            onClick={() =>
              setAdjustment({
                id: uid(),
                at: new Date().toISOString(),
                kind: "Daily reward",
                amount: 0,
                notes: "",
              })
            }
          >
            <Plus size={16} />
            Add coins / correction
          </button>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Notes</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...data.adjustments]
                .sort((a, b) => b.at.localeCompare(a.at))
                .map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.at).toLocaleString()}</td>
                    <td>{a.kind}</td>
                    <td>{a.notes}</td>
                    <td>
                      <Money n={a.amount} />
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="icon-btn"
                          aria-label="Edit adjustment"
                          onClick={() => setAdjustment(a)}
                        >
                          <PenLine size={15} />
                        </button>
                        <button
                          className="icon-btn negative"
                          aria-label="Delete adjustment"
                          onClick={() => {
                            if (
                              confirm(
                                "Delete this adjustment and recalculate balances?",
                              )
                            )
                              void run(
                                () =>
                                  mutate((b) => {
                                    b.adjustments = b.adjustments.filter(
                                      (x) => x.id !== a.id,
                                    );
                                  }),
                                "Adjustment deleted",
                              );
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!data.adjustments.length && (
          <Empty
            title="No extra coins recorded"
            text="Add chest rewards, daily rewards, or a balance correction here."
          />
        )}
        <div className="ledger-summary">
          <span>
            Match entries: {coins(data.matches.reduce((s, m) => s + m.fee, 0))}
          </span>
          <span>
            Match prizes: {coins(data.matches.reduce((s, m) => s + m.prize, 0))}
          </span>
          <span>
            Highest balance: {coins(Math.max(...entries.map((e) => e.balance)))}
          </span>
        </div>
      </Card>
      {adjustment && (
        <Modal title="Coin adjustment" close={() => setAdjustment(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget,
                a: Adjustment = {
                  ...adjustment,
                  kind: field(f, "kind") as Adjustment["kind"],
                  amount: num(f, "amount"),
                  notes: field(f, "notes"),
                  at: new Date(field(f, "at")).toISOString(),
                };
              void run(async () => {
                await mutate((b) => {
                  b.adjustments = [
                    ...b.adjustments.filter((x) => x.id !== a.id),
                    a,
                  ];
                });
                setAdjustment(null);
              });
            }}
          >
            <label>
              Type
              <select name="kind" defaultValue={adjustment.kind}>
                {[
                  "Chest reward",
                  "Daily reward",
                  "Other reward",
                  "Correction",
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Date & time
              <input
                name="at"
                type="datetime-local"
                defaultValue={new Date(
                  new Date(adjustment.at).getTime() -
                    new Date(adjustment.at).getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
                required
              />
            </label>
            <label>
              Coins to add or subtract
              <input
                name="amount"
                type="number"
                step="1"
                defaultValue={adjustment.amount}
                required
              />
            </label>
            <p className="fineprint">
              Use a negative number only for a correction. Example: −200 removes
              200 coins.
            </p>
            <label>
              Notes
              <textarea name="notes" defaultValue={adjustment.notes} />
            </label>
            <button className="button primary">Save adjustment</button>
          </form>
        </Modal>
      )}
    </>
  );
}
