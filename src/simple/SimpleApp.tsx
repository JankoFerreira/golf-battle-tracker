import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type ReactNode,
} from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Flag,
  Trophy,
  Coins,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Undo2,
  TrendingUp,
  MoreHorizontal,
  Download,
  Upload,
  Share2,
  Moon,
  Sun,
  PenLine,
  ArrowLeft,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { mutate, restore, seed, snapshot } from "../db";
import {
  type Backup,
  type Match,
  type Tier,
  coins,
  signed,
  net,
  stats,
  ledger,
} from "../domain";
import { CourseIcon, Landscape, Trend } from "../components";
import {
  chooseRound,
  currentBalance,
  recordFinish,
  setCurrentBalance,
} from "./actions";
import "./simple.css";

const AdvancedSettings = lazy(() => import("../pages/Settings"));
const AdvancedCourses = lazy(() => import("../pages/Courses"));
const AdvancedClubs = lazy(() => import("../pages/Clubs"));
const AdvancedHistory = lazy(() => import("../pages/HistoryPage"));
const AdvancedBankroll = lazy(() => import("../pages/Bankroll"));
const AdvancedFocus = lazy(() => import("../pages/Focus"));
type Run = (fn: () => Promise<unknown>, message?: string) => Promise<boolean>;
type Context = { data: Backup; run: Run };
const finish = (p: number) =>
  `${p}${p === 1 ? "st" : p === 2 ? "nd" : p === 3 ? "rd" : "th"}`;
function Amount({ n }: { n: number }) {
  return <span className={n < 0 ? "s-loss" : "s-gain"}>{signed(n)}</span>;
}
function input(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}
function saveFile(data: Backup) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "golf-battle-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Sheet({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog className="s-sheet" ref={ref} onCancel={close}>
      <div className="s-sheet-head">
        <h2>{title}</h2>
        <button className="s-icon" aria-label="Close" onClick={close}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function SimpleApp() {
  const [failure, setFailure] = useState(""),
    [notice, setNotice] = useState(""),
    [storageError, setStorageError] = useState("");
  const data = useLiveQuery(async () => {
    try {
      return await snapshot();
    } catch {
      setStorageError(
        "This browser couldn’t open your saved tracker. Enable website storage and reload.",
      );
      return undefined;
    }
  }, []);
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    document.documentElement.dataset.theme = data?.settings.theme ?? "dark";
  }, [data?.settings.theme]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 3500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  const run: Run = async (fn, message = "Saved") => {
    try {
      await fn();
      setNotice(message);
      return true;
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : "Couldn’t save. Please try again.",
      );
      return false;
    }
  };
  if (!data)
    return (
      <div className="s-loading">
        <Flag size={30} />
        <p>{storageError || "Getting your tracker ready…"}</p>
        {storageError && (
          <button
            className="s-primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        )}
      </div>
    );
  const context = { data, run };
  const oldContext = {
    data,
    run: async (fn: () => Promise<unknown>, message?: string) => {
      await run(fn, message);
    },
    setToast: setNotice,
  };
  const advanced = (title: string, content: ReactNode) => (
    <div className="s-advanced">
      <Link to="/more" className="s-back">
        <ArrowLeft size={17} />
        Back to More
      </Link>
      <h1>{title}</h1>
      <Suspense fallback={<p>Loading…</p>}>{content}</Suspense>
    </div>
  );
  return (
    <div className="simple">
      <header className="s-header">
        <Link to="/" className="s-logo">
          <span>
            <Flag size={23} />
          </span>
          <div>
            golf battle<small>YOUR LITTLE GAME COMPANION</small>
          </div>
        </Link>
        {data.settings.initialized && (
          <>
            <nav className="s-nav" aria-label="Main navigation">
              <NavLink to="/" end>
                <Flag size={18} />
                Play
              </NavLink>
              <NavLink to="/progress">
                <TrendingUp size={18} />
                Progress
              </NavLink>
              <NavLink to="/more">
                <MoreHorizontal size={20} />
                More
              </NavLink>
            </nav>
            <Link to="/more" className="s-profile" aria-label="Your profile">
              {data.settings.player.slice(0, 1).toUpperCase()}
            </Link>
          </>
        )}
      </header>
      <main className="s-main">
        {!data.settings.initialized ? (
          <Welcome run={run} />
        ) : (
          <Routes>
            <Route path="/" element={<Play {...context} />} />
            <Route path="/progress" element={<Progress {...context} />} />
            <Route path="/more" element={<More {...context} />} />
            <Route path="/log" element={<Navigate to="/" replace />} />
            <Route
              path="/history"
              element={<Navigate to="/progress" replace />}
            />
            <Route path="/settings" element={<Navigate to="/more" replace />} />
            <Route
              path="/tools/data"
              element={advanced(
                "Data & settings",
                <AdvancedSettings {...oldContext} />,
              )}
            />
            <Route
              path="/courses"
              element={advanced(
                "Courses & payouts",
                <AdvancedCourses {...oldContext} />,
              )}
            />
            <Route
              path="/clubs"
              element={advanced(
                "Club details",
                <AdvancedClubs {...oldContext} />,
              )}
            />
            <Route
              path="/tools/history"
              element={advanced(
                "Detailed history",
                <AdvancedHistory {...oldContext} />,
              )}
            />
            <Route
              path="/bankroll"
              element={advanced(
                "Coin details",
                <AdvancedBankroll {...oldContext} />,
              )}
            />
            <Route
              path="/focus"
              element={advanced(
                "Focus details",
                <AdvancedFocus {...oldContext} />,
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <footer className="s-footer">
        <span>
          <Flag size={13} /> A little less tracking. A little more playing.
        </span>
        <span>Fan-made · Not affiliated with Miniclip</span>
      </footer>
      {notice && (
        <div className="s-toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {failure && (
        <Sheet title="Just a quick check" close={() => setFailure("")}>
          <p>{failure}</p>
          <button className="s-primary s-full" onClick={() => setFailure("")}>
            Got it
          </button>
        </Sheet>
      )}
    </div>
  );
}

function Welcome({ run }: { run: Run }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="s-welcome">
      <div className="s-welcome-art">
        <Landscape />
        <span className="s-label">LESS TAPPING. MORE GOLF.</span>
        <h1>
          Play a round.
          <br />
          <em>Watch your progress.</em>
        </h1>
        <p>
          A simple home for your Golf Battle results.
          <br />
          Pick your course, tap your finish. That’s it.
        </p>
      </div>
      <div className="s-welcome-form">
        <span className="s-pill">
          <Flag size={14} />
          Made for players
        </span>
        <h2>Let’s get you on the green.</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.currentTarget;
            setBusy(true);
            await run(async () => {
              const b = seed(
                false,
                Number(input(f, "coins")),
                input(f, "name").trim() || "Player",
              );
              b.settings.lastTier = "";
              b.settings.lastClub = "";
              b.clubs = [];
              await restore(b);
            }, "Your tracker is ready");
            setBusy(false);
          }}
        >
          <label>
            Your nickname <span>(optional)</span>
            <input
              name="name"
              placeholder="What should we call you?"
              maxLength={60}
              autoComplete="nickname"
            />
          </label>
          <label>
            How many coins do you have?
            <input
              name="coins"
              type="number"
              min="0"
              step="1"
              max="1000000000000"
              placeholder="Your balance in the game"
              inputMode="numeric"
              required
            />
          </label>
          <button className="s-primary s-full" disabled={busy}>
            Let’s play <ArrowRight size={18} />
          </button>
        </form>
        <p className="s-subtle">
          <ShieldCheck size={14} />
          No account needed. Saved on this device.
        </p>
        <details className="s-quiet-details">
          <summary>
            Just looking around? <ChevronDown size={14} />
          </summary>
          <p>Try the example history: 34 results and a 3,600-coin balance.</p>
          <button
            className="s-secondary s-full"
            onClick={() =>
              run(
                () => restore(seed(true, 3600, "Janko")),
                "Example history loaded",
              )
            }
          >
            Try example stats
          </button>
        </details>
      </div>
    </div>
  );
}

function Play({ data, run }: Context) {
  const tier = data.tiers.find((t) => t.id === data.settings.lastTier),
    club = data.clubs.find((c) => c.id === data.settings.lastClub);
  const valid = !!tier && !!club && tier.courseId === club.courseId;
  const [setup, setSetup] = useState(false),
    [balanceSheet, setBalanceSheet] = useState(false),
    [payout, setPayout] = useState<{
      position: number;
      tier: Tier;
      clubId: string;
    } | null>(null),
    [last, setLast] = useState<Match | null>(null),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const balance = currentBalance(data),
    total = stats(data.matches, data.aggregates);
  const recent = [...data.matches].sort((a, b) => b.at.localeCompare(a.at));
  async function record(
    position: number,
    prize: number,
    remember = false,
    t = tier,
    c = club?.id,
  ) {
    if (lock.current || !t || !c) return;
    lock.current = true;
    setBusy(true);
    await run(
      async () => {
        let saved: Match | undefined;
        await mutate((b) => {
          saved = recordFinish(b, t.id, c, position, prize, remember);
        });
        setLast(saved!);
        setPayout(null);
      },
      `${finish(position)} place saved`,
    );
    setBusy(false);
    lock.current = false;
  }
  function tap(position: number) {
    if (!valid || !tier) {
      setSetup(true);
      return;
    }
    if (balance < tier.fee) {
      setBalanceSheet(true);
      return;
    }
    const prize = tier.prizes[position - 1];
    if (prize === null) setPayout({ position, tier, clubId: club!.id });
    else void record(position, prize);
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.matches("input,select,textarea,button") ||
          e.target.isContentEditable)
      )
        return;
      if (!setup && !payout && !balanceSheet && /^[1-6]$/.test(e.key)) {
        e.preventDefault();
        tap(Number(e.key));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  return (
    <>
      <div className="s-greeting">
        <div>
          <span className="s-label">YOUR NEXT ROUND STARTS HERE</span>
          <h1>
            Hey {data.settings.player}. <span>Let’s play.</span>
          </h1>
          <p>A quick tap after a round. Back to the game.</p>
        </div>
        <span className="s-beta">
          CLAN TEST RUN <span>✦</span>
        </span>
      </div>
      <div className="s-play-grid">
        <section className="s-round-card">
          <button className="s-course-select" onClick={() => setSetup(true)}>
            <span className={`s-course-symbol ${tier?.courseId ?? ""}`}>
              <CourseIcon id={tier?.courseId ?? "pine-forest"} size={27} />
            </span>
            <span>
              <small>YOU’RE PLAYING</small>
              <strong>
                {valid
                  ? data.courses.find((c) => c.id === tier?.courseId)?.name
                  : "Choose your course"}
              </strong>
              <em>
                {valid
                  ? `${club?.name} · ${coins(tier!.fee)} coins to enter`
                  : "Set it once. We’ll remember it."}
              </em>
            </span>
            <span className="s-change">
              {valid ? "Change" : "Choose"}
              <ChevronDown size={15} />
            </span>
          </button>
          <div className="s-finish-heading">
            <h2>Where did you finish?</h2>
            <span>Tap to save</span>
          </div>
          <div className="s-finishes">
            {[1, 2, 3, 4, 5, 6].map((p) => (
              <button
                key={p}
                className={`s-finish s-place-${p}`}
                disabled={busy}
                aria-label={`Log ${finish(p)} place`}
                onClick={() => tap(p)}
              >
                {p <= 3 ? (
                  <span className="s-medal">
                    <Trophy size={p === 1 ? 25 : 22} />
                  </span>
                ) : (
                  <span className="s-dimple">•</span>
                )}
                <strong>
                  {p}
                  <sup>
                    {p === 1 ? "st" : p === 2 ? "nd" : p === 3 ? "rd" : "th"}
                  </sup>
                </strong>
                <small>
                  {valid && tier?.prizes[p - 1] !== null ? (
                    <Amount n={tier!.prizes[p - 1]! - tier!.fee} />
                  ) : p === 1 ? (
                    "Nice one!"
                  ) : p === 2 ? (
                    "So close!"
                  ) : p === 3 ? (
                    "On the podium"
                  ) : (
                    "Next round awaits"
                  )}
                </small>
              </button>
            ))}
          </div>
          <div className="s-saved-row" aria-live="polite">
            {last && data.matches.some((m) => m.id === last.id) ? (
              <>
                <span>
                  <Check size={16} />
                  {finish(last.position)} saved · <Amount n={net(last)} /> coins
                </span>
                <button
                  onClick={() =>
                    run(async () => {
                      await mutate((b) => {
                        b.matches = b.matches.filter((m) => m.id !== last.id);
                      });
                      setLast(null);
                    }, "Last result undone")
                  }
                >
                  <Undo2 size={15} />
                  Undo
                </button>
              </>
            ) : (
              <span>
                <ShieldCheck size={14} />
                Saved here. Just for you.
              </span>
            )}
          </div>
        </section>
        <aside className="s-coins-card">
          <div className="s-coins-top">
            <span>
              <Coins size={17} />
              YOUR COINS
            </span>
            <button
              className="s-icon"
              aria-label="Update your coin balance"
              onClick={() => setBalanceSheet(true)}
            >
              <PenLine size={17} />
            </button>
          </div>
          <strong className="s-balance">{coins(balance)}</strong>
          <button
            className="s-balance-update"
            onClick={() => setBalanceSheet(true)}
          >
            Balance changed in the game? <ArrowRight size={14} />
          </button>
          <Landscape />
          <div className="s-coins-bottom">
            <span>Every round tells a story.</span>
            <Flag size={17} />
          </div>
        </aside>
      </div>
      <div className="s-mini-stats">
        <div>
          <span className="s-stat-icon">
            <Flag size={19} />
          </span>
          <span>
            <strong>{total.total}</strong>
            <small>rounds played</small>
          </span>
        </div>
        <div>
          <span className="s-stat-icon gold">
            <Trophy size={19} />
          </span>
          <span>
            <strong>{total.positions[0]}</strong>
            <small>first-place finishes</small>
          </span>
        </div>
        <div>
          <span className="s-stat-icon">
            <TrendingUp size={19} />
          </span>
          <span>
            <strong>
              <Amount n={total.profit} />
            </strong>
            <small>coins from matches</small>
          </span>
        </div>
      </div>
      <section className="s-recent">
        <div className="s-section-heading">
          <h2>A few recent rounds</h2>
          <Link to="/progress">
            Your progress <ArrowRight size={16} />
          </Link>
        </div>
        {recent.length ? (
          <div className="s-recent-grid">
            {recent.slice(0, 3).map((m) => (
              <Link to="/progress" className="s-recent-tile" key={m.id}>
                <span className={`s-result-badge result-${m.position}`}>
                  {finish(m.position)}
                </span>
                <span>
                  <strong>
                    {data.courses.find((c) => c.id === m.courseId)?.name}
                  </strong>
                  <small>
                    {data.clubs.find((c) => c.id === m.clubId)?.name}
                  </small>
                </span>
                <Amount n={net(m)} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="s-empty-inline">
            <Flag size={22} />
            <span>
              {data.aggregates.length
                ? "Your earlier results are safe in Progress. Log your next round above."
                : "Your first round goes here. Pick a course and tap your finish."}
            </span>
          </div>
        )}
      </section>
      {setup && (
        <RoundSetup data={data} run={run} close={() => setSetup(false)} />
      )}
      {balanceSheet && (
        <BalanceSheet
          data={data}
          run={run}
          close={() => setBalanceSheet(false)}
        />
      )}
      {payout && (
        <Sheet
          title={`${finish(payout.position)} place. How many coins?`}
          close={() => setPayout(null)}
        >
          <p>
            Enter the prize shown in the game, before subtracting your{" "}
            {coins(payout.tier.fee)}-coin entry.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void record(
                payout.position,
                Number(input(e.currentTarget, "prize")),
                input(e.currentTarget, "remember") === "on",
                payout.tier,
                payout.clubId,
              );
            }}
          >
            <label>
              Prize received
              <input
                autoFocus
                name="prize"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                placeholder="Enter 0 if there was no prize"
              />
            </label>
            <label className="s-checkbox">
              <input name="remember" type="checkbox" defaultChecked />
              Remember this prize for {finish(payout.position)} here
            </label>
            <p className="s-help">
              Next time, just tap {finish(payout.position)}. You can change
              saved prizes under Change → Saved prizes.
            </p>
            <button className="s-primary s-full" disabled={busy}>
              Save this round <Check size={18} />
            </button>
          </form>
        </Sheet>
      )}
    </>
  );
}

function RoundSetup({ data, run, close }: Context & { close: () => void }) {
  const selected = data.tiers.find((t) => t.id === data.settings.lastTier);
  const [course, setCourse] = useState(selected?.courseId ?? "");
  const [tierId, setTierId] = useState(selected?.id ?? "");
  const [fee, setFee] = useState(selected ? String(selected.fee) : "");
  const initialClub = data.clubs.find(
    (c) => c.id === data.settings.lastClub && c.courseId === selected?.courseId,
  );
  const [clubId, setClubId] = useState(initialClub?.id ?? ""),
    [name, setName] = useState(initialClub?.name ?? "");
  const [busy, setBusy] = useState(false),
    [editingPrizes, setEditingPrizes] = useState(false);
  const currentTier = data.tiers.find(
    (t) => t.id === tierId && t.courseId === course && String(t.fee) === fee,
  );
  function pickCourse(id: string) {
    setCourse(id);
    const t = data.tiers.find((t) => t.courseId === id);
    setTierId(t?.id ?? "");
    setFee(t ? String(t.fee) : "");
    const c = data.clubs.find((c) => c.courseId === id);
    setClubId(c?.id ?? "");
    setName(c?.name ?? "");
  }
  return (
    <Sheet title="Your round" close={close}>
      <p>Choose once. We’ll keep it ready for next time.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const ok = await run(
            () =>
              mutate((b) =>
                chooseRound(b, course, Number(fee), name, tierId, clubId),
              ),
            "Round ready",
          );
          setBusy(false);
          if (ok) close();
        }}
      >
        <div
          className="s-course-grid"
          role="group"
          aria-label="Choose a course"
        >
          {data.courses.map((c) => (
            <button
              type="button"
              aria-pressed={course === c.id}
              className={course === c.id ? "chosen" : ""}
              key={c.id}
              onClick={() => pickCourse(c.id)}
            >
              <CourseIcon id={c.id} size={21} />
              <span>{c.name}</span>
              {course === c.id && <Check size={14} />}
            </button>
          ))}
        </div>
        {course && (
          <>
            <div className="s-form-pair">
              <label>
                Entry fee
                <input
                  name="fee"
                  inputMode="numeric"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="Coins to play"
                />
              </label>
              <label>
                Your club <span>(optional)</span>
                <input
                  name="club"
                  list="saved-clubs"
                  maxLength={80}
                  placeholder="My club"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setClubId("");
                  }}
                />
                <datalist id="saved-clubs">
                  {data.clubs
                    .filter((c) => c.courseId === course)
                    .map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                </datalist>
              </label>
            </div>
            {data.tiers.filter((t) => t.courseId === course).length > 1 && (
              <label>
                Or use a saved entry
                <select
                  aria-label="Saved entry"
                  value={currentTier?.id ?? ""}
                  onChange={(e) => {
                    const t = data.tiers.find((t) => t.id === e.target.value);
                    if (t) {
                      setTierId(t.id);
                      setFee(String(t.fee));
                    }
                  }}
                >
                  <option value="">New entry amount</option>
                  {data.tiers
                    .filter((t) => t.courseId === course)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} · {coins(t.fee)} coins
                      </option>
                    ))}
                </select>
              </label>
            )}
            <button className="s-primary s-full" disabled={busy}>
              Let’s go <ArrowRight size={18} />
            </button>
            {currentTier && (
              <button
                type="button"
                className="s-sub-action"
                onClick={() => setEditingPrizes(true)}
              >
                Saved prizes <ChevronRight size={14} />
              </button>
            )}
          </>
        )}
      </form>
      {editingPrizes && currentTier && (
        <Sheet title="Saved prizes" close={() => setEditingPrizes(false)}>
          <p>
            Total prize per finish. Leave an amount blank if you don’t know it.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const prizes = [1, 2, 3, 4, 5, 6].map((p) =>
                input(f, `p${p}`) === "" ? null : Number(input(f, `p${p}`)),
              );
              const ok = await run(
                () =>
                  mutate((b) => {
                    const t = b.tiers.find((t) => t.id === currentTier.id);
                    if (!t) throw Error("This entry no longer exists.");
                    t.prizes = prizes;
                  }),
                "Prizes updated",
              );
              if (ok) setEditingPrizes(false);
            }}
          >
            <div className="s-prize-inputs">
              {currentTier.prizes.map((n, i) => (
                <label key={i}>
                  {finish(i + 1)} prize
                  <input
                    name={`p${i + 1}`}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    defaultValue={n ?? ""}
                    placeholder="Unknown"
                  />
                </label>
              ))}
            </div>
            <button className="s-primary s-full">Save prizes</button>
          </form>
        </Sheet>
      )}
    </Sheet>
  );
}

function BalanceSheet({ data, run, close }: Context & { close: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="Update your coins" close={close}>
      <p>
        Got a reward, or played a few rounds without logging? Enter the balance
        you see in the game.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const target = Number(input(e.currentTarget, "balance"));
          setBusy(true);
          const ok = await run(
            () => mutate((b) => setCurrentBalance(b, target)),
            "Coin balance updated",
          );
          setBusy(false);
          if (ok) close();
        }}
      >
        <label>
          Current coins
          <input
            autoFocus
            name="balance"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            required
            defaultValue={currentBalance(data)}
          />
        </label>
        <button disabled={busy} className="s-primary s-full">
          Update balance <Check size={18} />
        </button>
        <p className="s-help">Your match results stay exactly as they are.</p>
      </form>
    </Sheet>
  );
}

function Progress({ data, run }: Context) {
  const total = stats(data.matches, data.aggregates),
    [limit, setLimit] = useState(10),
    [editing, setEditing] = useState<Match | null>(null);
  const recent = [...data.matches].sort((a, b) => b.at.localeCompare(a.at));
  const courses = data.courses
    .map((c) => ({
      ...c,
      ...stats(
        data.matches.filter((m) => m.courseId === c.id),
        data.aggregates.filter((a) => a.courseId === c.id),
      ),
    }))
    .filter((c) => c.total)
    .sort((a, b) => b.profit - a.profit);
  return (
    <div className="s-narrow">
      <div className="s-page-title">
        <span className="s-label">A LITTLE BETTER EVERY ROUND</span>
        <h1>Look how you’re doing.</h1>
        <p>Your results, without the spreadsheet.</p>
      </div>
      <div className="s-progress-stats">
        <div>
          <Flag size={22} />
          <strong>{total.total}</strong>
          <span>Rounds played</span>
        </div>
        <div>
          <Trophy size={22} />
          <strong>
            {total.win.toFixed(0)}
            <small>%</small>
          </strong>
          <span>First-place wins</span>
        </div>
        <div>
          <Coins size={22} />
          <strong>
            <Amount n={total.profit} />
          </strong>
          <span>Coins from matches</span>
        </div>
      </div>
      {courses.length > 0 && (
        <section className="s-panel">
          <h2>Your courses</h2>
          {courses.map((c) => (
            <div className="s-course-result" key={c.id}>
              <span className="s-course-symbol">
                <CourseIcon id={c.id} size={21} />
              </span>
              <span>
                <strong>{c.name}</strong>
                <small>
                  {c.total} rounds · {c.win.toFixed(0)}% wins
                  {c.total < 20 ? " · Early days" : ""}
                </small>
              </span>
              <Amount n={c.profit} />
            </div>
          ))}
        </section>
      )}
      <section className="s-panel">
        <div className="s-section-heading">
          <h2>Your rounds</h2>
          <span className="s-muted">Tap a round to edit</span>
        </div>
        {recent.slice(0, limit).map((m) => (
          <button
            className="s-history-row"
            key={m.id}
            onClick={() => setEditing(m)}
          >
            <span className={`s-result-badge result-${m.position}`}>
              {finish(m.position)}
            </span>
            <span>
              <strong>
                {data.courses.find((c) => c.id === m.courseId)?.name}
              </strong>
              <small>
                {data.clubs.find((c) => c.id === m.clubId)?.name} ·{" "}
                {new Date(m.at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </small>
            </span>
            <Amount n={net(m)} />
            <ChevronRight size={16} />
          </button>
        ))}
        {!recent.length && (
          <div className="s-empty">
            <Flag size={28} />
            <h3>Your next round starts the story.</h3>
            <p>Results you log will appear here.</p>
            <Link to="/" className="s-primary">
              Log a round <ArrowRight size={16} />
            </Link>
          </div>
        )}
        {recent.length > limit && (
          <button
            className="s-sub-action"
            onClick={() => setLimit((n) => n + 20)}
          >
            Show more rounds <ChevronDown size={15} />
          </button>
        )}
        {data.aggregates.length > 0 && (
          <details className="s-quiet-details">
            <summary>
              {data.aggregates.reduce(
                (n, a) => n + a.positions.reduce((n, p) => n + p, 0),
                0,
              )}{" "}
              earlier results <ChevronDown size={15} />
            </summary>
            <p>
              These are included in your totals. They’re already accounted for
              in your starting coins.
            </p>
            {data.aggregates.map((a) => (
              <div className="s-summary-row" key={a.id}>
                <span>
                  {data.courses.find((c) => c.id === a.courseId)?.name}
                  <small>
                    {a.positions.reduce((n, p) => n + p, 0)} rounds ·{" "}
                    {data.clubs.find((c) => c.id === a.clubId)?.name}
                  </small>
                </span>
                <Amount n={a.profit} />
              </div>
            ))}
          </details>
        )}
      </section>
      <details className="s-panel s-chart-details">
        <summary>
          See your coin journey <TrendingUp size={18} />
        </summary>
        <p>All coins since setup, including rewards and updates.</p>
        <Trend
          data={ledger(
            data.settings.startingBalance,
            data.matches,
            data.adjustments,
          ).map((e, i) => ({
            ...e,
            label: i
              ? new Date(e.at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })
              : "Start",
          }))}
        />
      </details>
      {editing && (
        <Sheet title="Edit this round" close={() => setEditing(null)}>
          <p>
            {data.courses.find((c) => c.id === editing.courseId)?.name} ·{" "}
            {data.clubs.find((c) => c.id === editing.clubId)?.name}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const updated = {
                ...editing,
                position: Number(input(f, "position")),
                fee: Number(input(f, "fee")),
                prize: Number(input(f, "prize")),
              };
              const ok = await run(
                () =>
                  mutate((b) => {
                    b.matches = b.matches.map((m) =>
                      m.id === updated.id ? updated : m,
                    );
                  }),
                "Round updated",
              );
              if (ok) setEditing(null);
            }}
          >
            <label>
              Finishing position
              <select name="position" defaultValue={editing.position}>
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <option key={p} value={p}>
                    {finish(p)}
                  </option>
                ))}
              </select>
            </label>
            <div className="s-form-pair">
              <label>
                Entry fee
                <input
                  name="fee"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={editing.fee}
                />
              </label>
              <label>
                Prize received
                <input
                  name="prize"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={editing.prize}
                />
              </label>
            </div>
            <button className="s-primary s-full">Save changes</button>
            <button
              type="button"
              className="s-sub-action s-loss"
              onClick={async () => {
                if (
                  confirm(
                    "Delete this round? Your balance will be recalculated.",
                  )
                ) {
                  const ok = await run(
                    () =>
                      mutate((b) => {
                        b.matches = b.matches.filter(
                          (m) => m.id !== editing.id,
                        );
                      }),
                    "Round deleted",
                  );
                  if (ok) setEditing(null);
                }
              }}
            >
              <Trash2 size={14} />
              Delete this round
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}

function More({ data, run }: Context) {
  const file = useRef<HTMLInputElement>(null),
    [profile, setProfile] = useState(false),
    [share, setShare] = useState(false);
  const shareUrl = window.location.origin + window.location.pathname;
  async function copy() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      setShare(true);
    }
  }
  return (
    <div className="s-narrow s-more">
      <div className="s-page-title">
        <span className="s-label">THE LITTLE EXTRAS</span>
        <h1>Make yourself at home.</h1>
        <p>Everything else lives here. Only when you need it.</p>
      </div>
      <section className="s-panel">
        <button className="s-option" onClick={() => setProfile(true)}>
          <span className="s-profile">
            {data.settings.player.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{data.settings.player}</strong>
            <small>Edit your nickname</small>
          </span>
          <PenLine size={18} />
        </button>
        <button
          className="s-option"
          onClick={() =>
            run(
              () =>
                mutate((b) => {
                  b.settings.theme =
                    b.settings.theme === "dark" ? "light" : "dark";
                }),
              "Theme changed",
            )
          }
        >
          {data.settings.theme === "dark" ? (
            <Sun size={22} />
          ) : (
            <Moon size={22} />
          )}
          <span>
            <strong>
              {data.settings.theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"}
            </strong>
          </span>
          <ChevronRight size={18} />
        </button>
        <button
          className="s-option"
          onClick={() =>
            run(
              copy,
              navigator.clipboard
                ? "Link copied — send it to your clan"
                : "Share link ready",
            )
          }
        >
          <Share2 size={22} />
          <span>
            <strong>Share with your clan</strong>
            <small>Everyone gets their own tracker</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </section>
      <section className="s-panel">
        <h2>Keep your progress</h2>
        <p>
          Your results live on this device. A backup lets you keep them or move
          them to another phone.
        </p>
        <div className="s-backup-actions">
          <button className="s-secondary" onClick={() => saveFile(data)}>
            <Download size={17} />
            Save backup
          </button>
          <button className="s-secondary" onClick={() => file.current?.click()}>
            <Upload size={17} />
            Restore backup
          </button>
        </div>
        <input
          hidden
          type="file"
          ref={file}
          accept=".json,application/json"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            e.target.value = "";
            if (
              selected &&
              confirm(
                "Replace the results on this device with this backup? Save a backup first if you want to keep them.",
              )
            )
              void run(async () => {
                if (selected.size > 30000000)
                  throw Error("Choose a backup under 30 MB.");
                const b: unknown = JSON.parse(await selected.text());
                await restore(b as Backup);
              }, "Backup restored");
          }}
        />
      </section>
      <details className="s-panel s-quiet-details">
        <summary>
          Can I connect my Golf Battle profile? <ChevronDown size={17} />
        </summary>
        <p>
          Not yet. We haven’t found a public, documented way to read your
          results from Golf Battle. This tracker doesn’t connect to Miniclip or
          ask for your game password.
        </p>
        <p>
          For now, choose your round once, confirm prizes as you go, and tap
          your finish after each match.
        </p>
      </details>
      <details className="s-panel s-quiet-details">
        <summary>
          Advanced tools <ChevronDown size={17} />
        </summary>
        <p>You don’t need these for everyday tracking.</p>
        <div className="s-tool-links">
          {[
            ["/courses", "Courses & saved prizes"],
            ["/clubs", "Club details"],
            ["/tools/history", "Full match history"],
            ["/bankroll", "Rewards & coin details"],
            ["/focus", "Focus details"],
            ["/tools/data", "CSV export, settings & reset"],
          ].map(([to, title]) => (
            <Link key={to} to={to}>
              {title}
              <ChevronRight size={16} />
            </Link>
          ))}
        </div>
      </details>
      <p className="s-privacy">
        <ShieldCheck size={15} />
        No shared accounts. No automatic game sync. Just your results.
      </p>
      {profile && (
        <Sheet title="What should we call you?" close={() => setProfile(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = input(e.currentTarget, "name").trim();
              const ok = await run(
                () =>
                  mutate((b) => {
                    b.settings.player = name || "Player";
                  }),
                "Nickname updated",
              );
              if (ok) setProfile(false);
            }}
          >
            <label>
              Nickname
              <input
                name="name"
                defaultValue={data.settings.player}
                maxLength={60}
                required
                autoFocus
              />
            </label>
            <button className="s-primary s-full">Save nickname</button>
          </form>
        </Sheet>
      )}
      {share && (
        <Sheet title="Send this to your clan" close={() => setShare(false)}>
          <p>Copy this link. Each player starts with their own tracker.</p>
          <input
            aria-label="Share link"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
          />
        </Sheet>
      )}
    </div>
  );
}
