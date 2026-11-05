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
export default function Overview({ data }: Ctx) {
  const [f, setF] = useState(blankFilter),
    [rolling, setRolling] = useState(10);
  const filteredData = filtered(data, f),
    s = stats(filteredData.matches, filteredData.aggregates),
    entries = ledger(
      data.settings.startingBalance,
      data.matches,
      data.adjustments,
    ),
    balance = entries.at(-1)!.balance;
  const best = data.courses
    .map((c) => ({
      ...c,
      ...stats(
        filteredData.matches.filter((m) => m.courseId === c.id),
        filteredData.aggregates.filter((a) => a.courseId === c.id),
      ),
    }))
    .filter((c) => c.total)
    .sort((a, b) => b.profit - a.profit);
  const clubs = data.clubs
    .map((c) => ({
      ...c,
      ...stats(
        filteredData.matches.filter((m) => m.clubId === c.id),
        filteredData.aggregates.filter((a) => a.clubId === c.id),
      ),
    }))
    .filter((c) => c.total)
    .sort((a, b) => b.profit - a.profit);
  const recent = [...filteredData.matches].sort((a, b) =>
    b.at.localeCompare(a.at),
  );
  const st = streak(data.matches);
  const milestone =
    [...data.settings.milestones]
      .sort((a, b) => a - b)
      .find((n) => n > balance) ?? Math.max(...data.settings.milestones);
  const roll = stats(recent.slice(0, rolling));
  let cumulative = 0;
  return (
    <>
      <Filters data={data} value={f} onChange={setF} />
      <div className="stats-grid">
        <KPI
          label="CURRENT BALANCE"
          value={
            <>
              {coins(balance)}
              <small>coins</small>
            </>
          }
          caption={
            <>
              Highest balance{" "}
              <strong>
                {coins(Math.max(...entries.map((e) => e.balance)))}
              </strong>
            </>
          }
          icon={<Coins size={19} />}
          color="balance-kpi"
        />
        <KPI
          label="MATCH PROFIT"
          value={<Money n={s.profit} />}
          caption={<>{s.average.toFixed(1)} coins / match</>}
          icon={<TrendingUp size={19} />}
        />
        <KPI
          label="FIRST-PLACE RATE"
          value={
            <>
              {s.win.toFixed(1)}
              <small>%</small>
            </>
          }
          caption={
            <>
              {s.positions[0]} wins from {s.total} matches
            </>
          }
          icon={<Trophy size={19} />}
        />
        <KPI
          label="TOP-THREE RATE"
          value={
            <>
              {s.top3.toFixed(1)}
              <small>%</small>
            </>
          }
          caption={
            <>
              {s.positions.slice(0, 3).reduce((a, b) => a + b, 0)} podium
              finishes
            </>
          }
          icon={<Target size={19} />}
        />
      </div>
      <div className="dashboard-main">
        <Card
          title="Your coin journey"
          sub="Balance since setup · all matches and rewards"
          action={<span className="tag neutral">ALL-TIME BANKROLL</span>}
        >
          <div className="chart-summary">
            <strong>
              {coins(balance)} <small>coins</small>
            </strong>
            <span className="muted">Historical summaries excluded</span>
          </div>
          <Trend
            data={entries.map((e, i) => ({
              ...e,
              label:
                i === 0
                  ? "Starting"
                  : new Date(e.at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    }),
            }))}
          />
          {entries.length === 1 && (
            <p className="chart-note">
              Your journey starts here. New matches will build this chart.
            </p>
          )}
        </Card>
        <Card className="next-round">
          <div className="eyebrow">PLAY WITH PURPOSE</div>
          <h2>
            A good next round
            <br />
            starts with a clear head.
          </h2>
          <Landscape />
          <p>
            Track your finish in one tap.
            <br />
            Let your results do the talking.
          </p>
          <Link className="button primary full" to="/log">
            <Plus size={18} /> Log your next match <ArrowRight size={17} />
          </Link>
        </Card>
      </div>
      <div className="three-grid">
        <Card
          title="Course performance"
          sub="Total match profit"
          action={
            <Link className="icon-link" to="/courses" aria-label="View courses">
              <ArrowUpRight size={18} />
            </Link>
          }
        >
          {best.length ? (
            <div className="ranking">
              {best.slice(0, 4).map((c) => (
                <div key={c.id}>
                  <span className={`course-icon ${c.id}`}>
                    <CourseIcon id={c.id} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.total} matches · {c.win.toFixed(1)}% wins
                    </small>
                  </div>
                  <Money n={c.profit} />
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Card>
        <Card
          title="Your finishing positions"
          sub={`${s.total} matches in this view`}
        >
          <Bars
            data={s.positions.map((count, i) => ({
              name: positionLabel(i + 1),
              count,
            }))}
            value="count"
          />
        </Card>
        <Card title="The next milestone" sub="Small steps. Bigger bankroll.">
          <div className="milestone-medal">
            <Trophy size={28} />
          </div>
          <div className="milestone-number">
            {coins(milestone)} <span>coins</span>
          </div>
          <div className="progress">
            <i
              style={{
                width: `${Math.min(100, Math.max(0, (balance / milestone) * 100))}%`,
              }}
            />
          </div>
          <div className="split muted">
            <span>
              {coins(balance)} / {coins(milestone)}
            </span>
            <strong>
              {Math.max(0, (balance / milestone) * 100).toFixed(0)}%
            </strong>
          </div>
          <Link className="text-link" to="/bankroll">
            Manage your bankroll <ArrowRight size={15} />
          </Link>
        </Card>
      </div>
      <div className="insight-strip">
        <span className="insight-symbol">
          <Activity size={22} />
        </span>
        <div>
          <strong>
            {st.direction < 0 && st.count >= 2
              ? "Time for a breather?"
              : "Build habits, not hunches."}
          </strong>
          <p>
            {st.direction < 0 && st.count >= 2
              ? `You’ve lost coins in ${st.count} consecutive matches. Consider a break. A win is never “due”.`
              : s.total < 20
                ? "A few matches are a start, not a verdict. Keep logging to understand your patterns."
                : "Compare more than one session before changing clubs or increasing your entry fee."}
          </p>
        </div>
        <Link to="/focus">
          Focus monitor <ArrowRight size={16} />
        </Link>
      </div>
      <div className="two-grid">
        <Card
          title="Club performance"
          sub="Total profit · comparisons are descriptive"
        >
          {clubs.length ? (
            <Bars
              data={clubs.map((c) => ({ name: c.name, profit: c.profit }))}
            />
          ) : (
            <Empty />
          )}
          {clubs.some((c) => c.total < 20) && (
            <p className="fineprint">
              Fewer than 20 matches for at least one club. Too little data for a
              reliable comparison.
            </p>
          )}
        </Card>
        <Card
          title="Recent form"
          sub="Chronological matches only; historical summaries excluded"
          action={
            <select
              aria-label="Rolling window"
              value={rolling}
              onChange={(e) => setRolling(+e.target.value)}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  Last {n}
                </option>
              ))}
            </select>
          }
        >
          <div className="mini-stats">
            <div>
              <strong>{roll.total}</strong>
              <small>Matches</small>
            </div>
            <div>
              <strong>
                <Money n={roll.profit} />
              </strong>
              <small>Profit</small>
            </div>
            <div>
              <strong>{roll.win.toFixed(0)}%</strong>
              <small>Wins</small>
            </div>
          </div>
          <Trend
            data={[...recent.slice(0, rolling)]
              .reverse()
              .map((m, i) => ({
                label: `#${i + 1}`,
                profit: (cumulative += net(m)),
              }))}
            value="profit"
          />
          {!roll.total && (
            <p className="fineprint">
              No dated matches yet. Log a new result to see your recent form.
            </p>
          )}
        </Card>
      </div>
      <Card
        title="Recent matches"
        action={
          <Link className="text-link" to="/history">
            View all <ArrowRight size={14} />
          </Link>
        }
      >
        {recent.length ? (
          <MatchTable data={data} matches={recent.slice(0, 5)} />
        ) : (
          <Empty
            title="Your next chapter starts here"
            text={
              data.aggregates.length
                ? "Your 34 historical results are saved as summaries in Match history. New matches will appear here."
                : "Log your first match using the green button above."
            }
          />
        )}
      </Card>
      {(f.from || f.to) && (
        <p className="fineprint">
          Undated historical summaries are excluded from date filters.
        </p>
      )}
    </>
  );
}
