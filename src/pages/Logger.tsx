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
export default function Logger({ data, run }: Ctx) {
  const [tierId, setTierId] = useState(data.settings.lastTier),
    [clubId, setClubId] = useState(data.settings.lastClub),
    [mood, setMood] = useState<Match["mood"]>("Unspecified"),
    [pending, setPending] = useState<number | null>(null),
    [undo, setUndo] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false),
    details = useRef<HTMLFormElement>(null);
  const tier = data.tiers.find((t) => t.id === tierId),
    club = data.clubs.find((c) => c.id === clubId),
    balance = ledger(
      data.settings.startingBalance,
      data.matches,
      data.adjustments,
    ).at(-1)!.balance;
  const risk = tier ? (balance > 0 ? (tier.fee / balance) * 100 : Infinity) : 0;
  const st = streak(data.matches);
  const selectTier = (id: string) => {
    setTierId(id);
    const t = data.tiers.find((t) => t.id === id);
    if (club?.courseId !== t?.courseId)
      setClubId(data.clubs.find((c) => c.courseId === t?.courseId)?.id ?? "");
  };
  async function log(position: number, prize?: number) {
    if (lock.current || !tier || !club || club.courseId !== tier.courseId)
      return;
    if (prize === undefined && tier.prizes[position - 1] === null) {
      setPending(position);
      return;
    }
    lock.current = true;
    setBusy(true);
    await run(
      async () => {
        const id = uid(),
          f = details.current;
        const match: Match = {
          id,
          at: new Date().toISOString(),
          courseId: tier.courseId,
          tierId: tier.id,
          clubId: club.id,
          position,
          fee: tier.fee,
          prize: prize ?? tier.prizes[position - 1]!,
          mood,
          strokes: f && field(f, "strokes") ? num(f, "strokes") : undefined,
          shootout: (f ? field(f, "shootout") : "None") as Match["shootout"],
          mistake: !!f && field(f, "mistake") === "on",
          rushed: mood === "Rushed" || (!!f && field(f, "rushed") === "on"),
          shortcut: !!f && field(f, "shortcut") === "on",
          notes: f ? field(f, "notes") : "",
        };
        await mutate((b) => {
          const current = ledger(
            b.settings.startingBalance,
            b.matches,
            b.adjustments,
          ).at(-1)!.balance;
          if (current < tier.fee)
            throw Error(
              "Not enough tracked coins for this entry fee. Check your balance or choose a cheaper tier.",
            );
          b.matches.push(match);
          b.settings.lastTier = tier.id;
          b.settings.lastClub = club.id;
        });
        setUndo(id);
        setPending(null);
        details.current?.reset();
      },
      `${positionLabel(position)} place recorded`,
    );
    lock.current = false;
    setBusy(false);
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName) ||
          e.target.isContentEditable)
      )
        return;
      if (!pending && /^[1-6]$/.test(e.key)) {
        e.preventDefault();
        void log(Number(e.key));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  return (
    <div className="logger-layout">
      <div>
        <Card
          title="Set up your round"
          sub="We remember your last-used course and club."
        >
          <div className="form-grid">
            <label>
              Course & entry tier
              <select
                value={tierId}
                onChange={(e) => selectTier(e.target.value)}
              >
                <option value="">Choose a tier</option>
                {data.tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {data.courses.find((c) => c.id === t.courseId)?.name} ·{" "}
                    {t.name} · {coins(t.fee)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Your club
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
              >
                <option value="">Choose a club</option>
                {data.clubs
                  .filter((c) => c.courseId === tier?.courseId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {!data.clubs.some((c) => c.courseId === tier?.courseId) && (
            <p className="notice">
              Add a club for this course in the{" "}
              <Link to="/clubs">Club garage</Link>.
            </p>
          )}
          <div className="split logger-meta">
            <span>
              <Coins size={16} /> Entry fee{" "}
              <strong>{coins(tier?.fee ?? 0)}</strong>
            </span>
            <Link className="text-link" to="/courses">
              Edit tiers & payouts <ArrowUpRight size={14} />
            </Link>
          </div>
        </Card>
        <Card className="position-card">
          <div className="split">
            <div>
              <span className="eyebrow">HOW DID YOU FINISH?</span>
              <h2>One tap. Match logged.</h2>
            </div>
            {undo && (
              <button
                className="button secondary"
                onClick={() =>
                  run(async () => {
                    await mutate((b) => {
                      b.matches = b.matches.filter((m) => m.id !== undo);
                    });
                    setUndo("");
                  }, "Last entry undone")
                }
              >
                <Undo2 size={16} />
                Undo
              </button>
            )}
          </div>
          <div className="position-grid">
            {[1, 2, 3, 4, 5, 6].map((p) => (
              <button
                disabled={
                  busy ||
                  !tier ||
                  !club ||
                  club.courseId !== tier.courseId ||
                  balance < (tier?.fee ?? 0)
                }
                key={p}
                className={`position p${p}`}
                onClick={() => log(p)}
              >
                {p === 1 ? (
                  <Trophy size={24} />
                ) : (
                  <span className="position-dot">{p < 4 ? "●" : "○"}</span>
                )}
                <strong>{positionLabel(p)}</strong>
                <small>
                  {tier?.prizes[p - 1] === null ? (
                    "Enter payout"
                  ) : tier ? (
                    <Money n={tier.prizes[p - 1]! - tier.fee} />
                  ) : (
                    "Select tier"
                  )}
                </small>
              </button>
            ))}
          </div>
          <p className="fineprint">
            Desktop shortcut: press 1–6. Unknown prizes are requested before
            saving.
          </p>
          <div className="mood-picker">
            <span>How’s your focus?</span>
            <div>
              {moods.map((m) => (
                <button
                  key={m}
                  className={mood === m ? "chip active" : "chip"}
                  onClick={() => setMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <details>
            <summary>
              Optional match details <Plus size={15} />
            </summary>
            <form ref={details} onSubmit={(e) => e.preventDefault()}>
              <div className="form-grid">
                <label>
                  Total strokes
                  <input type="number" min="1" step="1" name="strokes" />
                </label>
                <label>
                  Shootout
                  <select name="shootout">
                    <option>None</option>
                    <option>Won</option>
                    <option>Lost</option>
                  </select>
                </label>
              </div>
              <div className="checks">
                <label>
                  <input type="checkbox" name="mistake" /> Made a mistake
                </label>
                <label>
                  <input type="checkbox" name="rushed" /> Rushed shots
                </label>
                <label>
                  <input type="checkbox" name="shortcut" /> Attempted shortcuts
                </label>
              </div>
              <label>
                Notes
                <textarea
                  name="notes"
                  maxLength={1000}
                  placeholder="What would you do differently?"
                />
              </label>
            </form>
          </details>
        </Card>
      </div>
      <div>
        <Card title="Round check" sub="Protect your next round.">
          <div className="bank-number">
            <Coins size={23} />
            {coins(balance)}
            <small>coins available</small>
          </div>
          <div className="risk-meter">
            <div className="split">
              <span>Entry risk</span>
              <strong
                className={risk > data.settings.risk ? "negative" : "positive"}
              >
                {Number.isFinite(risk) ? risk.toFixed(1) : "∞"}%
              </strong>
            </div>
            <div className="progress">
              <i
                className={risk > data.settings.risk ? "danger-bg" : ""}
                style={{ width: `${Math.min(risk, 100)}%` }}
              />
            </div>
            <small>Your limit: {data.settings.risk}%</small>
          </div>
          {risk > data.settings.risk && (
            <div className="notice warning">
              This entry exceeds your risk limit. Consider a lower-fee tier.
            </div>
          )}
          {balance < (tier?.fee ?? 0) && (
            <div className="notice warning">
              Your tracked balance is below this entry fee.
            </div>
          )}
          {st.direction < 0 && st.count >= 2 && (
            <div className="notice warning">
              {st.count} consecutive coin losses. Take a breather before another
              round.
            </div>
          )}
          <Link className="text-link" to="/bankroll">
            Review bankroll <ArrowRight size={15} />
          </Link>
        </Card>
        <div className="quiet-tip">
          <ShieldCheck size={22} />
          <h3>A loss doesn’t make a win due.</h3>
          <p>Keep the same calm routine, even after a tough game.</p>
        </div>
      </div>
      {pending !== null && (
        <Modal
          title={`${positionLabel(pending)} place — prize received`}
          close={() => setPending(null)}
        >
          <p>
            This tier has no confirmed prize for this position. Enter the total
            prize shown in the game, before subtracting the fee.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void log(pending, num(e.currentTarget, "prize"));
            }}
          >
            <label>
              Prize received (coins)
              <input
                name="prize"
                type="number"
                min="0"
                step="1"
                required
                autoFocus
              />
            </label>
            <p className="fineprint">
              Set repeat payouts in Course analytics to enable one-tap logging.
            </p>
            <button disabled={busy} className="button primary">
              Save match
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
