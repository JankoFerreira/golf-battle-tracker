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

import Onboarding from "./pages/Onboarding";
import Overview from "./pages/Overview";
import Logger from "./pages/Logger";
import HistoryPage from "./pages/HistoryPage";
import Courses from "./pages/Courses";
import Clubs from "./pages/Clubs";
import Bankroll from "./pages/Bankroll";
import Focus from "./pages/Focus";
import Settings from "./pages/Settings";
const paths = [
  ["/", "Overview", LayoutDashboard],
  ["/log", "Quick logger", Plus],
  ["/history", "Match history", History],
  ["/courses", "Course analytics", Mountain],
  ["/clubs", "Club garage", Flag],
  ["/bankroll", "Coin bankroll", Wallet],
  ["/focus", "Focus monitor", Activity],
  ["/settings", "Settings", Settings2],
] as const;
const titles: Record<string, [string, string]> = {
  "/": [
    "Your game. Your progress.",
    "A clearer view of every match, every club, and every coin.",
  ],
  "/log": [
    "Make every match count.",
    "Pick your finish. We’ll take care of the numbers.",
  ],
  "/history": [
    "The story behind your stats.",
    "Review your results and keep your record accurate.",
  ],
  "/courses": [
    "Find your home advantage.",
    "Compare courses, tune payouts, and choose your next challenge.",
  ],
  "/clubs": [
    "Your club garage.",
    "Know your equipment. Find what works for you.",
  ],
  "/bankroll": [
    "Keep your coins in play.",
    "A little discipline goes a long way.",
  ],
  "/focus": [
    "A clear head. A better game.",
    "See how your mindset shows up in your results.",
  ],
  "/settings": ["Make it yours.", "Your profile, your preferences, your data."],
};
export default function App() {
  const data = useLiveQuery(snapshot, []);
  const [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (data) document.documentElement.dataset.theme = data.settings.theme;
  }, [data?.settings.theme]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  async function run(fn: () => Promise<unknown>, message = "Saved") {
    try {
      await fn();
      setToast(message);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    }
  }
  if (!data)
    return (
      <div className="loading">
        <Flag /> Loading your tracker…
      </div>
    );
  if (!data.settings.initialized)
    return <Onboarding run={run} error={error} clear={() => setError("")} />;
  const totalBalance = ledger(
    data.settings.startingBalance,
    data.matches,
    data.adjustments,
  ).at(-1)!.balance;
  const title = titles[location.pathname] ?? titles["/"];
  const ctx = { data, run, setToast };
  return (
    <div className="app">
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Flag size={25} />
          </span>
          <span>
            GOLF BATTLE<small>PERFORMANCE TRACKER</small>
          </span>
        </Link>
        <span className="nav-label">YOUR PLAYBOOK</span>
        <nav>
          {paths.map(([path, name, Icon]) => (
            <NavLink end={path === "/"} key={path} to={path}>
              <Icon size={19} />
              {name}
              {path === "/log" && <kbd>+</kbd>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={19} />
            <div>
              Just your game.<small>Data stays on this device</small>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">
              {data.settings.player.slice(0, 2).toUpperCase()}
            </div>
            <span>
              {data.settings.player}
              <small>Player profile</small>
            </span>
            <Link to="/settings" aria-label="Profile settings">
              <Settings2 size={17} />
            </Link>
          </div>
        </div>
      </aside>
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle menu"
          >
            {menu ? <X /> : <Menu />}
          </button>
          <span className="breadcrumb">
            Playbook <ChevronRight size={14} />{" "}
            <strong>
              {paths.find((p) => p[0] === location.pathname)?.[1] ?? "Overview"}
            </strong>
          </span>
          <div className="top-right">
            <span className="device-status">
              <i /> Local storage
            </span>
            <button
              className="icon-btn"
              aria-label="Toggle theme"
              onClick={() =>
                run(
                  () =>
                    mutate((b) => {
                      b.settings.theme =
                        b.settings.theme === "dark" ? "light" : "dark";
                    }),
                  "Theme updated",
                )
              }
            >
              {data.settings.theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <span className="balance-chip">
              <Coins size={17} />
              {coins(totalBalance)}
            </span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                GOLF BATTLE TRACKER <span> / </span>{" "}
                {location.pathname === "/"
                  ? "PLAYER OVERVIEW"
                  : (
                      paths.find((p) => p[0] === location.pathname)?.[1] ?? ""
                    ).toUpperCase()}
              </div>
              <h1>{title[0]}</h1>
              <p>{title[1]}</p>
            </div>
            {location.pathname !== "/log" && (
              <Link className="button primary" to="/log">
                <Plus size={18} />
                Log a match
              </Link>
            )}
          </div>
          <Routes>
            <Route path="/" element={<Overview {...ctx} />} />
            <Route path="/log" element={<Logger {...ctx} />} />
            <Route path="/history" element={<HistoryPage {...ctx} />} />
            <Route path="/courses" element={<Courses {...ctx} />} />
            <Route path="/clubs" element={<Clubs {...ctx} />} />
            <Route path="/bankroll" element={<Bankroll {...ctx} />} />
            <Route path="/focus" element={<Focus {...ctx} />} />
            <Route path="/settings" element={<Settings {...ctx} />} />
            <Route
              path="*"
              element={
                <Empty
                  title="Page not found"
                  text="Choose a page from your playbook."
                />
              }
            />
          </Routes>
          <footer>
            <span>
              <Flag size={13} /> Built for a better next round.
            </span>
            <span>Independent fan tool · Not affiliated with Miniclip</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav">
        {paths.slice(0, 4).map(([path, name, Icon]) => (
          <NavLink end={path === "/"} key={path} to={path}>
            <Icon size={20} />
            <span>{name.split(" ")[0]}</span>
          </NavLink>
        ))}
        <button onClick={() => setMenu(true)}>
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {error && (
        <Modal title="Couldn’t save that" close={() => setError("")}>
          <p>{error}</p>
          <button className="button primary" onClick={() => setError("")}>
            Got it
          </button>
        </Modal>
      )}
    </div>
  );
}
