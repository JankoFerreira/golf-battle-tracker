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
import { db, defaults, mutate, restore, seed, snapshot } from "./db";
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
} from "./domain";
import {
  Card,
  Modal,
  Empty,
  CourseIcon,
  Landscape,
  Trend,
  Bars,
} from "./components";
import type { Ctx } from "./context";
export type Filter = {
  course: string;
  club: string;
  tier: string;
  from: string;
  to: string;
};
export const blankFilter: Filter = {
  course: "",
  club: "",
  tier: "",
  from: "",
  to: "",
};
export const download = (
  name: string,
  body: string,
  type = "application/json",
) => {
  const u = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
export function field(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}
export function num(form: HTMLFormElement, name: string) {
  return Number(field(form, name));
}
export const positionLabel = (n: number) =>
  `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
export function Money({ n }: { n: number }) {
  return <span className={n >= 0 ? "positive" : "negative"}>{signed(n)}</span>;
}
export function Filters({
  data,
  value,
  onChange,
}: {
  data: Backup;
  value: Filter;
  onChange: (f: Filter) => void;
}) {
  const update = (key: keyof Filter, v: string) =>
    onChange({
      ...value,
      [key]: v,
      ...(key === "course" ? { club: "", tier: "" } : {}),
    });
  return (
    <div className="filters">
      <span>
        <SlidersHorizontal size={16} />
        Filters
      </span>
      <select
        aria-label="Filter course"
        value={value.course}
        onChange={(e) => update("course", e.target.value)}
      >
        <option value="">All courses</option>
        {data.courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter club"
        value={value.club}
        onChange={(e) => update("club", e.target.value)}
      >
        <option value="">All clubs</option>
        {data.clubs
          .filter((c) => !value.course || c.courseId === value.course)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
      <select
        aria-label="Filter tier"
        value={value.tier}
        onChange={(e) => update("tier", e.target.value)}
      >
        <option value="">All entry tiers</option>
        {data.tiers
          .filter((t) => !value.course || t.courseId === value.course)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {data.courses.find((c) => c.id === t.courseId)?.name} · {t.name} (
              {coins(t.fee)})
            </option>
          ))}
      </select>
      <input
        aria-label="From date"
        type="date"
        value={value.from}
        onChange={(e) => update("from", e.target.value)}
      />
      <span className="date-to">to</span>
      <input
        aria-label="To date"
        type="date"
        value={value.to}
        onChange={(e) => update("to", e.target.value)}
      />
      {Object.values(value).some(Boolean) && (
        <button className="text-btn" onClick={() => onChange(blankFilter)}>
          Reset
        </button>
      )}
    </div>
  );
}
export function filtered(data: Backup, f: Filter) {
  const common = (m: Match | Aggregate) =>
    (!f.course || m.courseId === f.course) &&
    (!f.club || m.clubId === f.club) &&
    (!f.tier || m.tierId === f.tier);
  return {
    matches: data.matches.filter(
      (m) =>
        common(m) &&
        (!f.from || new Date(m.at) >= new Date(f.from + "T00:00:00")) &&
        (!f.to || new Date(m.at) <= new Date(f.to + "T23:59:59.999")),
    ),
    aggregates: f.from || f.to ? [] : data.aggregates.filter(common),
  };
}
export function KPI({
  label,
  value,
  caption,
  icon,
  color = "",
}: {
  label: string;
  value: ReactNode;
  caption: ReactNode;
  icon: ReactNode;
  color?: string;
}) {
  return (
    <Card className={`kpi ${color}`}>
      <div className="kpi-label">
        {label}
        <span>{icon}</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-caption">{caption}</div>
    </Card>
  );
}
export function MatchTable({
  data,
  matches,
  onEdit,
  onDelete,
}: {
  data: Backup;
  matches: Match[];
  onEdit?: (m: Match) => void;
  onDelete?: (m: Match) => void;
}) {
  const balances = new Map(
    ledger(data.settings.startingBalance, data.matches, data.adjustments).map(
      (e) => [e.id, e.balance],
    ),
  );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Course / tier</th>
            <th>Club</th>
            <th>Finish</th>
            <th>Entry</th>
            <th>Prize</th>
            <th>Profit</th>
            <th>Balance</th>
            <th>Focus</th>
            {onEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <td>
                {new Date(m.at).toLocaleDateString()}
                <small>
                  {new Date(m.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </td>
              <td>
                <span className="table-course">
                  <CourseIcon id={m.courseId} size={15} />
                  {data.courses.find((c) => c.id === m.courseId)?.name}
                </span>
                <small>{data.tiers.find((t) => t.id === m.tierId)?.name}</small>
              </td>
              <td>{data.clubs.find((c) => c.id === m.clubId)?.name}</td>
              <td>
                <span className={`finish finish-${m.position}`}>
                  {positionLabel(m.position)}
                </span>
              </td>
              <td>{coins(m.fee)}</td>
              <td>{coins(m.prize)}</td>
              <td>
                <Money n={net(m)} />
              </td>
              <td>{coins(balances.get(m.id) ?? 0)}</td>
              <td>
                <span className="tag neutral">{m.mood}</span>
              </td>
              {onEdit && (
                <td>
                  <div className="actions">
                    <button
                      className="icon-btn"
                      aria-label="Edit match"
                      onClick={() => onEdit(m)}
                    >
                      <PenLine size={15} />
                    </button>
                    <button
                      className="icon-btn negative"
                      aria-label="Delete match"
                      onClick={() => onDelete?.(m)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function MatchEditor({
  data,
  match,
  close,
  save,
}: {
  data: Backup;
  match: Match;
  close: () => void;
  save: (m: Match) => Promise<void>;
}) {
  const [course, setCourse] = useState(match.courseId);
  const localTime = new Date(
    new Date(match.at).getTime() -
      new Date(match.at).getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  return (
    <Modal title="Edit match" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          void save({
            ...match,
            courseId: course,
            tierId: field(f, "tier"),
            clubId: field(f, "club"),
            at: new Date(field(f, "at")).toISOString(),
            position: num(f, "position"),
            fee: num(f, "fee"),
            prize: num(f, "prize"),
            mood: field(f, "mood") as Match["mood"],
            notes: field(f, "notes"),
            strokes: field(f, "strokes") ? num(f, "strokes") : undefined,
            shootout: field(f, "shootout") as Match["shootout"],
            mistake: field(f, "mistake") === "on",
            rushed: field(f, "rushed") === "on",
            shortcut: field(f, "shortcut") === "on",
          });
        }}
      >
        <div className="form-grid">
          <label>
            Date & time
            <input
              type="datetime-local"
              name="at"
              defaultValue={localTime}
              required
            />
          </label>
          <label>
            Course
            <select value={course} onChange={(e) => setCourse(e.target.value)}>
              {data.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tier
            <select
              key={course + "tier"}
              name="tier"
              defaultValue={match.tierId}
              required
            >
              {data.tiers
                .filter((t) => t.courseId === course)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Club
            <select
              key={course + "club"}
              name="club"
              defaultValue={match.clubId}
              required
            >
              {data.clubs
                .filter((c) => c.courseId === course)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Finish
            <select name="position" defaultValue={match.position}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {positionLabel(n)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Focus
            <select name="mood" defaultValue={match.mood}>
              {moods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Entry fee
            <input
              name="fee"
              type="number"
              min="0"
              step="1"
              defaultValue={match.fee}
              required
            />
          </label>
          <label>
            Prize received
            <input
              name="prize"
              type="number"
              min="0"
              step="1"
              defaultValue={match.prize}
              required
            />
          </label>
          <label>
            Strokes
            <input
              name="strokes"
              type="number"
              min="1"
              step="1"
              defaultValue={match.strokes}
            />
          </label>
          <label>
            Shootout
            <select name="shootout" defaultValue={match.shootout}>
              <option>None</option>
              <option>Won</option>
              <option>Lost</option>
            </select>
          </label>
        </div>
        <div className="checks">
          {(["mistake", "rushed", "shortcut"] as const).map((k) => (
            <label key={k}>
              <input name={k} type="checkbox" defaultChecked={match[k]} />
              {k}
            </label>
          ))}
        </div>
        <label>
          Notes
          <textarea name="notes" defaultValue={match.notes} />
        </label>
        <button className="button primary">Save & recalculate</button>
      </form>
    </Modal>
  );
}
