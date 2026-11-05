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
export default function Clubs({ data, run }: Ctx) {
  const [editing, setEditing] = useState<Club | null>(null),
    [filter, setFilter] = useState(""),
    [image, setImage] = useState("");
  const open = (c: Club) => {
    setEditing(c);
    setImage(c.image ?? "");
  };
  return (
    <>
      <div className="section-toolbar">
        <select
          aria-label="Club course"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All courses</option>
          {data.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          className="button primary"
          onClick={() =>
            open({
              id: uid(),
              name: "",
              courseId: filter || data.courses[0]?.id || "",
              level: 1,
              power: 1,
              accuracy: 1,
              guideline: 1,
              notes: "",
            })
          }
        >
          <Plus size={16} />
          Add club
        </button>
      </div>
      <div className="club-grid">
        {data.clubs
          .filter((c) => !filter || c.courseId === filter)
          .map((c) => {
            const s = stats(
              data.matches.filter((m) => m.clubId === c.id),
              data.aggregates.filter((a) => a.clubId === c.id),
            );
            return (
              <Card className="club-card" key={c.id}>
                <div className="split">
                  <span className="tag neutral">
                    {data.courses.find((x) => x.id === c.courseId)?.name}
                  </span>
                  <button
                    className="icon-btn"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => open(c)}
                  >
                    <PenLine size={16} />
                  </button>
                </div>
                <div className="club-display">
                  {c.image ? (
                    <img src={c.image} alt={c.name} />
                  ) : (
                    <svg viewBox="0 0 200 120" aria-hidden="true">
                      <ellipse
                        cx="100"
                        cy="102"
                        rx="60"
                        ry="6"
                        fill="currentColor"
                        opacity=".06"
                      />
                      <path
                        d="m70 97 65-80"
                        stroke="currentColor"
                        strokeWidth="5"
                      />
                      <path
                        d="m130 22 9-11"
                        stroke="currentColor"
                        strokeWidth="9"
                        strokeLinecap="round"
                      />
                      <path
                        d="m69 87 12 11-38 8q-14-1-9-12l14-12Z"
                        fill="currentColor"
                      />
                      <path
                        d="m38 94 31-1"
                        stroke="var(--bg)"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                  <span>LEVEL {c.level}</span>
                </div>
                <h2>{c.name}</h2>
                <div className="club-bars">
                  {(["power", "accuracy", "guideline"] as const).map((key) => (
                    <div key={key}>
                      <span>{key}</span>
                      <div>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <i className={n <= c[key] ? "filled" : ""} key={n} />
                        ))}
                      </div>
                      <strong>
                        {c[key]}
                        <small>/5</small>
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="mini-stats">
                  <div>
                    <strong>{s.total}</strong>
                    <small>Matches</small>
                  </div>
                  <div>
                    <strong>{s.win.toFixed(0)}%</strong>
                    <small>Wins</small>
                  </div>
                  <div>
                    <strong>
                      <Money n={s.profit} />
                    </strong>
                    <small>Total profit</small>
                  </div>
                </div>
                <div className="split fineprint">
                  <span>Top three: {s.top3.toFixed(1)}%</span>
                  <span>Avg: {s.average.toFixed(1)} coins</span>
                </div>
                {s.total < 20 && (
                  <p className="sample-warning">
                    <Info size={13} /> Small sample · {s.total}/20 matches
                  </p>
                )}
                {c.notes && <p className="club-notes">{c.notes}</p>}
                <details>
                  <summary>Performance by tier</summary>
                  {data.tiers
                    .filter((t) => t.courseId === c.courseId)
                    .map((t) => {
                      const ts = stats(
                        data.matches.filter(
                          (m) => m.clubId === c.id && m.tierId === t.id,
                        ),
                        data.aggregates.filter(
                          (a) => a.clubId === c.id && a.tierId === t.id,
                        ),
                      );
                      return (
                        <div className="split tier-summary" key={t.id}>
                          <span>
                            {t.name} · {ts.total} matches
                          </span>
                          <Money n={ts.profit} />
                        </div>
                      );
                    })}
                </details>
              </Card>
            );
          })}
      </div>
      {!data.clubs.length && (
        <Empty
          title="Your garage is empty"
          text="Add a club to start tracking its performance."
        />
      )}
      {editing && (
        <Modal
          title={editing.name ? "Edit your club" : "Add a club"}
          close={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget,
                c: Club = {
                  ...editing,
                  name: field(f, "name").trim(),
                  courseId: field(f, "course"),
                  level: num(f, "level"),
                  power: num(f, "power"),
                  accuracy: num(f, "accuracy"),
                  guideline: num(f, "guideline"),
                  notes: field(f, "notes"),
                  image: image || undefined,
                };
              void run(async () => {
                await mutate((b) => {
                  b.clubs = [...b.clubs.filter((x) => x.id !== c.id), c];
                });
                setEditing(null);
              });
            }}
          >
            <div className="form-grid">
              <label>
                Club name
                <input name="name" required defaultValue={editing.name} />
              </label>
              <label>
                Course
                <select name="course" defaultValue={editing.courseId} required>
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Level
                <input
                  name="level"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={editing.level}
                  required
                />
              </label>
              {(["power", "accuracy", "guideline"] as const).map((k) => (
                <label key={k} className="capitalize">
                  {k}
                  <input
                    name={k}
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    defaultValue={editing[k]}
                    required
                  />
                </label>
              ))}
            </div>
            <label>
              Club photo (PNG, JPEG or WebP; max 1 MB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    void run(async () => {
                      if (f.size > 1000000)
                        throw Error("Choose an image under 1 MB.");
                      if (
                        !["image/png", "image/jpeg", "image/webp"].includes(
                          f.type,
                        )
                      )
                        throw Error("Use a PNG, JPEG or WebP image.");
                      setImage(
                        await new Promise<string>((resolve, reject) => {
                          const r = new FileReader();
                          r.onload = () => resolve(String(r.result));
                          r.onerror = reject;
                          r.readAsDataURL(f);
                        }),
                      );
                    }, "Image ready");
                }}
              />
            </label>
            {image && (
              <button
                type="button"
                className="text-btn"
                onClick={() => setImage("")}
              >
                Remove image
              </button>
            )}
            <label>
              Personal notes
              <textarea name="notes" defaultValue={editing.notes} />
            </label>
            <p className="fineprint">
              A club with results must stay on its recorded course.
            </p>
            <div className="split">
              <button className="button primary">Save club</button>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  if (
                    confirm(
                      "Delete this club? Clubs with results cannot be deleted.",
                    )
                  )
                    void run(async () => {
                      await mutate((b) => {
                        if (
                          [...b.matches, ...b.aggregates].some(
                            (m) => m.clubId === editing.id,
                          )
                        )
                          throw Error(
                            "This club has records and cannot be deleted.",
                          );
                        b.clubs = b.clubs.filter((c) => c.id !== editing.id);
                      });
                      setEditing(null);
                    }, "Club deleted");
                }}
              >
                Delete club
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
