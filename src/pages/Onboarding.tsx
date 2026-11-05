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
export default function Onboarding({
  run,
  error,
  clear,
}: {
  run: Ctx["run"];
  error: string;
  clear: () => void;
}) {
  return (
    <div className="onboarding">
      <div className="welcome-art">
        <Landscape />
        <div className="eyebrow">YOUR GAME, UNDERSTOOD.</div>
        <h1>
          Less guesswork.
          <br />
          <em>More good rounds.</em>
        </h1>
        <p>
          Your personal Golf Battle playbook. Track the wins, learn from the
          losses, and make every coin count.
        </p>
        <div className="welcome-features">
          <span>
            <Target />
            One-tap match logging
          </span>
          <span>
            <TrendingUp />
            Honest performance insights
          </span>
          <span>
            <ShieldCheck />
            Private, on-device storage
          </span>
        </div>
      </div>
      <Card className="welcome-form">
        <span className="tag">LET’S GET YOU STARTED</span>
        <h2>Welcome to your tracker.</h2>
        <p>Each player starts with their own profile. No account needed.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget;
            void run(
              () => restore(seed(false, num(f, "balance"), field(f, "player"))),
              "You’re ready to play.",
            );
          }}
        >
          <label>
            Player name
            <input
              name="player"
              required
              maxLength={60}
              placeholder="Your name or nickname"
            />
          </label>
          <label>
            Current coin balance
            <input
              name="balance"
              type="number"
              min="0"
              max="1000000000000"
              step="1"
              required
              defaultValue="0"
            />
          </label>
          <button className="button primary full">
            Create my tracker <ArrowRight size={18} />
          </button>
        </form>
        <div className="divider">OR EXPLORE THE PROVIDED HISTORY</div>
        <button
          className="button secondary full"
          onClick={() =>
            run(
              () => restore(seed(true, 3600, "Janko")),
              "Imported 34 historical results",
            )
          }
        >
          Load Janko’s starting history
        </button>
        <p className="fineprint">
          34 results · 3,600 current coins. Historical results are summaries and
          won’t be added to the balance again. You can reset at any time.
        </p>
        <p className="fineprint">
          <Database size={13} /> This browser only. Export backups to keep your
          data safe or move devices.
        </p>
      </Card>
      {error && (
        <Modal title="Check your details" close={clear}>
          <p>{error}</p>
        </Modal>
      )}
    </div>
  );
}
