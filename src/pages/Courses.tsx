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
export default function Courses({ data, run }: Ctx) {
  const [editing, setEditing] = useState<Tier | null>(null),
    [courseEdit, setCourseEdit] = useState<{ id: string; name: string } | null>(
      null,
    );
  return (
    <>
      <div className="section-toolbar">
        <p>
          <span className="status-dot" /> {data.courses.length} courses in your
          playbook
        </p>
        <button
          className="button secondary"
          onClick={() => setCourseEdit({ id: uid(), name: "" })}
        >
          <Plus size={16} />
          Add course
        </button>
      </div>
      <div className="course-grid">
        {data.courses.map((c, i) => {
          const s = stats(
            data.matches.filter((m) => m.courseId === c.id),
            data.aggregates.filter((a) => a.courseId === c.id),
          );
          return (
            <Card className="course-card" key={c.id}>
              <div className={`course-cover cover-${i % 4}`}>
                <Landscape
                  variant={["green", "gold", "blue", "purple"][i % 4]}
                />
                <span className="course-cover-icon">
                  <CourseIcon id={c.id} size={30} />
                </span>
                <span className="tag">
                  {s.total ? `${s.total} MATCHES` : "UNEXPLORED"}
                </span>
              </div>
              <div className="course-body">
                <div className="split">
                  <h3>{c.name}</h3>
                  <div className="actions">
                    <button
                      className="icon-btn"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => setCourseEdit(c)}
                    >
                      <PenLine size={15} />
                    </button>
                    <button
                      className="icon-btn negative"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this course and its tiers and clubs? Courses with recorded results cannot be deleted.",
                          )
                        )
                          void run(
                            () =>
                              mutate((b) => {
                                if (
                                  [...b.matches, ...b.aggregates].some(
                                    (m) => m.courseId === c.id,
                                  )
                                )
                                  throw Error(
                                    "This course has recorded results. Remove those records first, or rename the course.",
                                  );
                                b.courses = b.courses.filter(
                                  (x) => x.id !== c.id,
                                );
                                b.tiers = b.tiers.filter(
                                  (t) => t.courseId !== c.id,
                                );
                                b.clubs = b.clubs.filter(
                                  (t) => t.courseId !== c.id,
                                );
                              }),
                            "Course deleted",
                          );
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="course-profit">
                  <Money n={s.profit} />
                  <small>total profit</small>
                </div>
                <div className="mini-stats">
                  <div>
                    <strong>{s.win.toFixed(1)}%</strong>
                    <small>Win rate</small>
                  </div>
                  <div>
                    <strong>{s.top3.toFixed(1)}%</strong>
                    <small>Top three</small>
                  </div>
                  <div>
                    <strong>{s.average.toFixed(1)}</strong>
                    <small>Coins / match</small>
                  </div>
                </div>
                <div className="tier-list">
                  {data.tiers
                    .filter((t) => t.courseId === c.id)
                    .map((t) => (
                      <button key={t.id} onClick={() => setEditing(t)}>
                        <span>
                          {t.name}
                          <small>
                            {t.prizes.filter((p) => p === null).length}{" "}
                            unconfirmed payouts
                          </small>
                        </span>
                        <strong>
                          <Coins size={13} />
                          {coins(t.fee)}
                        </strong>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                </div>
                <button
                  className="text-link"
                  onClick={() =>
                    setEditing({
                      id: uid(),
                      courseId: c.id,
                      name: "",
                      fee: 0,
                      prizes: [null, null, null, null, null, null],
                    })
                  }
                >
                  <Plus size={15} />
                  Add entry tier
                </button>
                {s.total > 0 && s.total < 20 && (
                  <p className="fineprint">
                    Small sample · keep logging before drawing conclusions.
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {courseEdit && (
        <Modal
          title={courseEdit.name ? "Edit course" : "Add a course"}
          close={() => setCourseEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = field(e.currentTarget, "name").trim();
              void run(async () => {
                await mutate((b) => {
                  const c = { ...courseEdit, name };
                  b.courses = [...b.courses.filter((x) => x.id !== c.id), c];
                });
                setCourseEdit(null);
              });
            }}
          >
            <label>
              Course name
              <input
                name="name"
                defaultValue={courseEdit.name}
                required
                maxLength={80}
              />
            </label>
            <button className="button primary">Save course</button>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal
          title={`${data.courses.find((c) => c.id === editing.courseId)?.name} · entry tier`}
          close={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget,
                t = {
                  ...editing,
                  name: field(f, "name").trim(),
                  fee: num(f, "fee"),
                  prizes: [1, 2, 3, 4, 5, 6].map((n) =>
                    field(f, `p${n}`) === "" ? null : num(f, `p${n}`),
                  ),
                };
              void run(async () => {
                await mutate((b) => {
                  b.tiers = [...b.tiers.filter((x) => x.id !== t.id), t];
                });
                setEditing(null);
              }, "Tier saved; existing match amounts unchanged");
            }}
          >
            <div className="form-grid">
              <label>
                Tier name
                <input name="name" required defaultValue={editing.name} />
              </label>
              <label>
                Entry fee
                <input
                  name="fee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editing.fee}
                  required
                />
              </label>
            </div>
            <p className="notice">
              Enter the total prize for each position. Leave unknown amounts
              blank; enter 0 only for a confirmed zero prize.
            </p>
            <div className="form-grid three">
              {editing.prizes.map((p, i) => (
                <label key={i}>
                  {positionLabel(i + 1)} prize
                  <input
                    name={`p${i + 1}`}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Unknown"
                    defaultValue={p ?? ""}
                  />
                </label>
              ))}
            </div>
            <div className="split">
              <button className="button primary">Save tier</button>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  if (
                    confirm(
                      "Delete this tier? Tiers with records cannot be deleted.",
                    )
                  )
                    void run(async () => {
                      await mutate((b) => {
                        if (
                          [...b.matches, ...b.aggregates].some(
                            (m) => m.tierId === editing.id,
                          )
                        )
                          throw Error(
                            "This tier has records and cannot be deleted.",
                          );
                        b.tiers = b.tiers.filter((t) => t.id !== editing.id);
                      });
                      setEditing(null);
                    }, "Tier deleted");
                }}
              >
                Delete tier
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
