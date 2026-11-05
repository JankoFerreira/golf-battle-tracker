import { useEffect, useRef, type ReactNode } from "react";
import {
  X,
  Flag,
  Mountain,
  Snowflake,
  Trees,
  Leaf,
  Wind,
  Flower2,
  Flame,
  Grid2X2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={close}>
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" onClick={close} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Card({
  title,
  sub,
  children,
  action,
  className = "",
}: {
  title?: string;
  sub?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title = "No matches yet",
  text = "Log your first match to start seeing your progress.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <Flag size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function CourseIcon({ id, size = 22 }: { id: string; size?: number }) {
  const Icon =
    (
      {
        "pine-forest": Trees,
        "rocky-mountains": Mountain,
        "snowy-valley": Snowflake,
        "mayan-jungle": Leaf,
        "windy-cliffs": Wind,
        "sakura-garden": Flower2,
        "lava-land": Flame,
      } as Record<string, typeof Mountain>
    )[id] ?? Grid2X2;
  return <Icon size={size} />;
}
export function Landscape({ variant = "green" }: { variant?: string }) {
  return (
    <svg
      className={`landscape ${variant}`}
      viewBox="0 0 600 220"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${variant}`} x2="0" y2="1">
          <stop stopColor="currentColor" stopOpacity=".03" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".2" />
        </linearGradient>
      </defs>
      <rect width="600" height="220" fill={`url(#sky-${variant})`} />
      <circle cx="440" cy="65" r="29" fill="currentColor" opacity=".16" />
      <path
        d="M0 172 100 53 184 155 266 25 390 154 488 81 600 166V220H0Z"
        fill="currentColor"
        opacity=".12"
      />
      <path
        d="m218 83 48-58 51 53-31-11-20 17-18-24Z"
        fill="currentColor"
        opacity=".3"
      />
      <path
        d="M0 184Q110 108 240 181T600 148V220H0Z"
        fill="currentColor"
        opacity=".17"
      />
      <path
        d="M0 208Q170 166 295 204T600 177V220H0Z"
        fill="currentColor"
        opacity=".2"
      />
      <ellipse
        cx="400"
        cy="189"
        rx="76"
        ry="17"
        fill="currentColor"
        opacity=".28"
      />
      <ellipse cx="408" cy="190" rx="11" ry="3" fill="#10191b" />
      <path
        d="M408 188v-79l38 13-38 16"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="333" cy="187" r="5" fill="#f3fff8" />
    </svg>
  );
}
const tooltip = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  color: "var(--text)",
};
export function Trend({
  data,
  value = "balance",
  color = "#5ee8a9",
}: {
  data: Record<string, unknown>[];
  value?: string;
  color?: string;
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`fill-${value}`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor={color} stopOpacity={0.25} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--line)"
            vertical={false}
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={38}
          />
          <YAxis
            width={50}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltip} />
          <Area
            type="monotone"
            dataKey={value}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#fill-${value})`}
            dot={data.length < 3}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Bars({
  data,
  value = "profit",
}: {
  data: Record<string, unknown>[];
  value?: string;
}) {
  return (
    <div className="chart short">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={40}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltip} />
          <Bar dataKey={value} radius={[5, 5, 0, 0]} maxBarSize={45}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  Number(d[value]) < 0
                    ? "#fb808a"
                    : i === 0
                      ? "#e9c978"
                      : "#5ee8a9"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
