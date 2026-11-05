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
export default function Focus({ data }: Ctx) {
  const dated = [...data.matches].sort((a, b) => a.at.localeCompare(b.at));
  const states = moods
    .filter((m) => m !== "Unspecified")
    .map((name) => ({
      name,
      ...stats(data.matches.filter((m) => m.mood === name)),
    }));
  const st = streak(data.matches),
    entries = ledger(
      data.settings.startingBalance,
      data.matches,
      data.adjustments,
    ),
    balance = entries.at(-1)!.balance,
    peak = Math.max(...entries.map((e) => e.balance)),
    drawdown = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
  const increased = dated
      .slice(1)
      .filter((m, i) => net(dated[i]) < 0 && m.fee > dated[i].fee).length,
    rushed = dated
      .slice(-5)
      .filter((m) => m.rushed || m.mood === "Rushed").length;
  return (
    <>
      <div className="focus-hero">
        <div>
          <span className="tag success">
            <Activity size={13} />
            FOCUS MONITOR
          </span>
          <h2>Your mindset is part of your game.</h2>
          <p>
            Track how you feel, spot patterns, and give yourself permission to
            pause.
          </p>
        </div>
        <div className="focus-orbit">
          <Activity size={44} />
        </div>
      </div>
      <div className="three-grid">
        <KPI
          label="CURRENT COIN STREAK"
          value={`${st.count} ${st.direction < 0 ? "losses" : st.direction > 0 ? "gains" : "break-even"}`}
          caption="Consecutive dated matches"
          icon={<Activity size={18} />}
        />
        <KPI
          label="DRAWDOWN FROM PEAK"
          value={`${drawdown.toFixed(1)}%`}
          caption={`${coins(peak - balance)} coins below your recorded peak`}
          icon={<ArrowDownLeft size={18} />}
        />
        <KPI
          label="RUSHED RECENT MATCHES"
          value={`${rushed} / ${Math.min(5, dated.length)}`}
          caption="Your latest five dated results"
          icon={<Target size={18} />}
        />
      </div>
      {st.direction < 0 && st.count >= 2 && (
        <div className="notice warning">
          You’ve lost coins in {st.count} consecutive matches. Consider taking a
          break before playing again.
        </div>
      )}
      {increased > 0 && (
        <div className="notice warning">
          You increased your entry fee after a loss {increased} time
          {increased === 1 ? "" : "s"}. Avoid raising stakes to recover coins.
        </div>
      )}
      {rushed >= 3 && (
        <div className="notice warning">
          Several recent matches were rushed. Slow down and reset before your
          next game.
        </div>
      )}
      {drawdown >= 20 && (
        <div className="notice warning">
          Your balance is at least 20% below its peak. Review your entry fees
          and any manual corrections.
        </div>
      )}
      <div className="two-grid">
        <Card
          title="Profit by focus state"
          sub="Recorded matches only · mood is self-reported"
        >
          <Bars
            data={states.map((s) => ({ name: s.name, profit: s.profit }))}
          />
        </Card>
        <Card
          title="What your results say"
          sub="Observed patterns, not promises."
        >
          <div className="focus-insights">
            {states
              .filter((s) => s.total)
              .map((s) => (
                <div key={s.name}>
                  <span className="tag neutral">{s.name}</span>
                  <p>
                    <strong>{s.average.toFixed(1)} coins</strong> per match ·{" "}
                    {s.top3.toFixed(1)}% top three
                  </p>
                  <small>
                    {s.total} matches
                    {s.total < 20
                      ? " · Small sample — no reliable conclusion yet."
                      : ""}
                  </small>
                </div>
              ))}
            {!states.some((s) => s.total) && (
              <Empty
                title="Start with a check-in"
                text="Choose your focus state when logging a match. Your patterns will appear here."
              />
            )}
          </div>
        </Card>
      </div>
      <Card title="Your focus breakdown">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>State</th>
                <th>Matches</th>
                <th>First place</th>
                <th>Top three</th>
                <th>Total profit</th>
                <th>Avg. profit</th>
              </tr>
            </thead>
            <tbody>
              {states.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.total}</td>
                  <td>{s.win.toFixed(1)}%</td>
                  <td>{s.top3.toFixed(1)}%</td>
                  <td>
                    <Money n={s.profit} />
                  </td>
                  <td>{s.average.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fineprint">
          Unspecified focus and historical summaries are excluded. Different
          courses, fees and club choices can also explain differences. Twenty
          matches is a caution threshold, not proof of statistical reliability.
        </p>
      </Card>
    </>
  );
}
