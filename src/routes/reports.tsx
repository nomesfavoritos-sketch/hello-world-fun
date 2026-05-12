import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Inbox,
  Users as UsersIcon,
  ChefHat,
  Bike,
  ShoppingBag,
  Crown,
  BarChart3,
  Award,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/pos/PageShell";
import { getSales, type SaleRecord } from "@/lib/sales-store";
import { getKitchenActions, type KitchenAction } from "@/lib/kitchen-store";
import { getSettings } from "@/lib/settings-store";
import { getUsers, ROLE_LABELS, type AppUser, type Role } from "@/lib/users-store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · BJ Pizza" }] }),
  component: ReportsPage,
});

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CAT_COLORS: Record<string, string> = {
  Pizza: "bg-primary",
  Burgers: "bg-gold",
  Wings: "bg-emerald-400",
  Pasta: "bg-violet-400",
  Drinks: "bg-sky-400",
  Shawarma: "bg-orange-400",
  Fries: "bg-yellow-400",
};

type RangeKey = "today" | "7d" | "30d" | "all";
const RANGES: { id: RangeKey; label: string; days: number | null }[] = [
  { id: "today", label: "Today", days: 0 },
  { id: "7d", label: "7 Days", days: 7 },
  { id: "30d", label: "30 Days", days: 30 },
  { id: "all", label: "All Time", days: null },
];

type Trip = {
  id: string;
  customer: string;
  amount: number;
  riderId: string | null;
  assignedBy?: string | null;
  stage: string;
  createdAt: number;
};

function loadTrips(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("bj_trips") || "[]");
  } catch {
    return [];
  }
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function rangeCutoff(r: RangeKey) {
  if (r === "all") return 0;
  const now = Date.now();
  if (r === "today") return startOfDay(now);
  const days = r === "7d" ? 7 : 30;
  return startOfDay(now - (days - 1) * 86400000);
}

const ROLE_ICON: Record<Role, typeof Crown> = {
  admin: Crown,
  manager: BarChart3,
  pos: ShoppingBag,
  kitchen: ChefHat,
  rider: Bike,
};

const ROLE_ACCENT: Record<Role, string> = {
  admin: "from-gold/30 to-primary/20 text-gold",
  manager: "from-violet-400/30 to-sky-400/20 text-violet-300",
  pos: "from-primary/30 to-gold/20 text-primary",
  kitchen: "from-orange-400/30 to-primary/20 text-orange-300",
  rider: "from-emerald-400/30 to-sky-400/20 text-emerald-300",
};

function exportCsv(rows: string[][], filename: string) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportSalesCsv(sales: SaleRecord[]) {
  const rows = [["Order", "Date", "Type", "Staff", "Role", "Items", "Subtotal", "VAT", "Total"]];
  sales.forEach((s) => {
    const items = s.lines.map((l) => `${l.qty}x ${l.name}`).join(" | ");
    rows.push([
      `BJ-${s.orderNo}`,
      new Date(s.at).toISOString(),
      s.type,
      s.userName ?? "—",
      s.userRole ?? "—",
      items,
      s.subtotal.toFixed(2),
      s.tax.toFixed(2),
      s.total.toFixed(2),
    ]);
  });
  exportCsv(rows, `bj-sales-${new Date().toISOString().slice(0, 10)}.csv`);
}

type StaffStat = {
  user: AppUser;
  orders: number;
  revenue: number;
  items: number;
  trips: number;
  delivered: number;
  deliveryRevenue: number;
  kitchenTickets: number;
  kitchenStarts: number;
  lastActive: number;
};

function ReportsPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [kActions, setKActions] = useState<KitchenAction[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [sym, setSym] = useState("Rs");
  const [tab, setTab] = useState<"overview" | "staff">("overview");
  const [range, setRange] = useState<RangeKey>("7d");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    setSales(getSales());
    setTrips(loadTrips());
    setKActions(getKitchenActions());
    setUsers(getUsers());
    setSym(getSettings().currencySymbol || getSettings().currency || "Rs");
  }, []);

  const cutoff = rangeCutoff(range);

  // Overview stats (existing logic, scoped to range)
  const overview = useMemo(() => {
    const recent = sales.filter((s) => s.at >= cutoff);
    const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 7;
    const now = Date.now();
    const week = Array.from({ length: days }, (_, i) => {
      const day = new Date(startOfDay(now - (days - 1 - i) * 86400000));
      return { day: DAY_LABELS[day.getDay()], v: 0, ts: day.getTime() };
    });
    sales.forEach((s) => {
      const ds = startOfDay(s.at);
      const slot = week.find((w) => w.ts === ds);
      if (slot) slot.v += s.total;
    });
    const total = recent.reduce((a, b) => a + b.total, 0);
    const orders = recent.length;
    const avg = orders ? total / orders : 0;
    const byCat: Record<string, number> = {};
    recent.forEach((s) =>
      s.lines.forEach((l) => {
        byCat[l.category] = (byCat[l.category] || 0) + l.price * l.qty;
      }),
    );
    const catSum = Object.values(byCat).reduce((a, b) => a + b, 0) || 1;
    const categories = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([name, v]) => ({
        name,
        pct: Math.round((v / catSum) * 100),
        color: CAT_COLORS[name] || "bg-white/30",
      }));
    return { week, total, orders, avg, categories, recent };
  }, [sales, cutoff, range]);

  // Per-staff stats
  const staffStats = useMemo<StaffStat[]>(() => {
    return users
      .filter((u) => u.active)
      .map((u) => {
        const userSales = sales.filter((s) => s.userId === u.id && s.at >= cutoff);
        const userTrips = trips.filter(
          (t) => (t.riderId === u.id || t.assignedBy === u.id) && t.createdAt >= cutoff,
        );
        const myTrips = trips.filter((t) => t.riderId === u.id && t.createdAt >= cutoff);
        const delivered = myTrips.filter((t) => t.stage === "Delivered");
        const myKitchen = kActions.filter((k) => k.userId === u.id && k.at >= cutoff);
        const lastSale = userSales[0]?.at ?? 0;
        const lastTrip = userTrips[0]?.createdAt ?? 0;
        const lastK = myKitchen[0]?.at ?? 0;
        return {
          user: u,
          orders: userSales.length,
          revenue: userSales.reduce((a, b) => a + b.total, 0),
          items: userSales.reduce(
            (a, b) => a + b.lines.reduce((x, y) => x + y.qty, 0),
            0,
          ),
          trips: myTrips.length,
          delivered: delivered.length,
          deliveryRevenue: delivered.reduce((a, b) => a + b.amount, 0),
          kitchenTickets: myKitchen.filter((k) => k.action === "ready" || k.action === "bump").length,
          kitchenStarts: myKitchen.filter((k) => k.action === "start").length,
          lastActive: Math.max(lastSale, lastTrip, lastK),
        };
      })
      .sort((a, b) => {
        // Sort by relevant metric: rider by delivered, kitchen by tickets, others by revenue
        const score = (s: StaffStat) =>
          s.user.role === "rider"
            ? s.delivered * 100 + s.deliveryRevenue / 100
            : s.user.role === "kitchen"
              ? s.kitchenTickets * 100
              : s.revenue;
        return score(b) - score(a);
      });
  }, [users, sales, trips, kActions, cutoff]);

  const max = Math.max(...overview.week.map((w) => w.v), 1);
  const fmt = (n: number) =>
    `${sym} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const selected = selectedUser ? staffStats.find((s) => s.user.id === selectedUser) : null;

  return (
    <PageShell
      eyebrow="Insights"
      title="REPORTS"
      subtitle="Sales, staff performance and category mix — premium analytics."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex glass rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-widest rounded-lg transition ${
                  range === r.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportSalesCsv(sales)}
            disabled={sales.length === 0}
            className="glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/5 disabled:opacity-40"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex glass rounded-2xl p-1 w-fit mb-1">
        {[
          { id: "overview" as const, label: "Overview", icon: BarChart3 },
          { id: "staff" as const, label: "Staff Performance", icon: UsersIcon },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition ${
              tab === t.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        sales.length === 0 ? (
          <div className="glass-strong rounded-2xl p-16 text-center">
            <div className="size-16 rounded-2xl glass mx-auto grid place-items-center mb-4">
              <Inbox className="size-7 text-gold" />
            </div>
            <p className="font-display text-lg tracking-wider">NO SALES YET</p>
            <p className="text-sm text-muted-foreground mt-2">
              Print a receipt or close a table — reports will populate here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Revenue", value: fmt(overview.total), trend: `${overview.orders} orders`, accent: "gold" },
                { label: "Orders", value: String(overview.orders), trend: "in range" },
                { label: "Avg Ticket", value: fmt(overview.avg), trend: "per order" },
                { label: "Total Logged", value: String(sales.length), trend: "all-time", accent: "red" },
              ].map((s) => (
                <motion.div key={s.label} whileHover={{ y: -2 }} className="glass-strong rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p
                    className={`font-mono-num text-2xl font-bold mt-2 ${s.accent === "gold" ? "gradient-text-gold" : s.accent === "red" ? "gradient-text-red" : ""}`}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.trend}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 glass-strong rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Daily revenue</p>
                <p className="font-display text-xl tracking-wider mt-1 mb-4">TIMELINE</p>
                <div className="flex items-end gap-3 h-56">
                  {overview.week.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.v / max) * 100}%` }}
                        transition={{ delay: i * 0.06, type: "spring" }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-gold/60 relative min-h-[2px]"
                      >
                        {d.v > 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono-num text-muted-foreground whitespace-nowrap">
                            {sym}
                            {(d.v / 1000).toFixed(1)}k
                          </span>
                        )}
                      </motion.div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sales mix</p>
                <p className="font-display text-xl tracking-wider mt-1 mb-4">CATEGORIES</p>
                {overview.categories.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No category data yet.</p>
                ) : (
                  <>
                    <div className="flex h-2 rounded-full overflow-hidden mb-4">
                      {overview.categories.map((c) => (
                        <div key={c.name} className={c.color} style={{ width: `${c.pct}%` }} />
                      ))}
                    </div>
                    <ul className="space-y-2">
                      {overview.categories.map((c) => (
                        <li key={c.name} className="flex items-center gap-3 text-sm">
                          <span className={`size-2.5 rounded-full ${c.color}`} />
                          <span className="flex-1">{c.name}</span>
                          <span className="font-mono-num text-muted-foreground">{c.pct}%</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-5">
              <p className="font-display text-xl tracking-wider mb-4">RECENT ORDERS</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground text-left">
                      <th className="py-2">Order</th>
                      <th>Time</th>
                      <th>Staff</th>
                      <th>Type</th>
                      <th>Items</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 12).map((s) => {
                      const trendUp = s.total >= overview.avg;
                      return (
                        <tr key={s.id} className="border-t border-white/5">
                          <td className="py-3 font-mono-num">BJ-{s.orderNo}</td>
                          <td className="text-muted-foreground text-xs">
                            {new Date(s.at).toLocaleString()}
                          </td>
                          <td className="text-xs">
                            {s.userName ?? <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="text-xs">{s.type}</td>
                          <td className="font-mono-num text-muted-foreground">
                            {s.lines.reduce((a, b) => a + b.qty, 0)}
                          </td>
                          <td className="text-right">
                            <span className="inline-flex items-center gap-1 font-mono-num gradient-text-gold">
                              {trendUp ? (
                                <TrendingUp className="size-3 text-emerald-400" />
                              ) : (
                                <TrendingDown className="size-3 text-primary" />
                              )}
                              {fmt(s.total)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : (
        <StaffSection
          stats={staffStats}
          sym={sym}
          fmt={fmt}
          selected={selected}
          setSelected={setSelectedUser}
          sales={sales}
          trips={trips}
          kActions={kActions}
          cutoff={cutoff}
        />
      )}
    </PageShell>
  );
}

function StaffSection({
  stats,
  sym,
  fmt,
  selected,
  setSelected,
  sales,
  trips,
  kActions,
  cutoff,
}: {
  stats: StaffStat[];
  sym: string;
  fmt: (n: number) => string;
  selected: StaffStat | null | undefined;
  setSelected: (id: string | null) => void;
  sales: SaleRecord[];
  trips: Trip[];
  kActions: KitchenAction[];
  cutoff: number;
}) {
  if (stats.length === 0) {
    return (
      <div className="glass-strong rounded-2xl p-16 text-center">
        <div className="size-16 rounded-2xl glass mx-auto grid place-items-center mb-4">
          <UsersIcon className="size-7 text-gold" />
        </div>
        <p className="font-display text-lg tracking-wider">NO STAFF YET</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add staff in the Users page to start tracking performance.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Leaderboard */}
      <div className="glass-strong rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Live Leaderboard
            </p>
            <p className="font-display text-xl tracking-wider">TOP PERFORMERS</p>
          </div>
          <Award className="size-5 text-gold" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.map((s, i) => {
            const Icon = ROLE_ICON[s.user.role];
            const accent = ROLE_ACCENT[s.user.role];
            const isTop = i === 0;
            const primaryMetric =
              s.user.role === "rider"
                ? { label: "Delivered", value: String(s.delivered) }
                : s.user.role === "kitchen"
                  ? { label: "Tickets", value: String(s.kitchenTickets) }
                  : { label: "Revenue", value: fmt(s.revenue) };
            const secondaryMetric =
              s.user.role === "rider"
                ? { label: "Earned", value: fmt(s.deliveryRevenue) }
                : s.user.role === "kitchen"
                  ? { label: "Started", value: String(s.kitchenStarts) }
                  : { label: "Orders", value: String(s.orders) };
            return (
              <motion.button
                key={s.user.id}
                whileHover={{ y: -3 }}
                onClick={() => setSelected(s.user.id)}
                className="glass rounded-2xl p-4 text-left relative overflow-hidden group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-10 group-hover:opacity-20 transition`}
                />
                {isTop && (
                  <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest bg-gold/20 text-gold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Crown className="size-2.5" /> Top
                  </span>
                )}
                <div className="relative flex items-start gap-3">
                  <div
                    className={`size-11 rounded-xl bg-gradient-to-br ${accent} grid place-items-center shrink-0`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.user.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {ROLE_LABELS[s.user.role]}
                    </p>
                  </div>
                </div>
                <div className="relative mt-4 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {primaryMetric.label}
                    </p>
                    <p className="font-mono-num text-lg font-bold gradient-text-gold">
                      {primaryMetric.value}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {secondaryMetric.label}
                    </p>
                    <p className="font-mono-num text-lg font-bold">{secondaryMetric.value}</p>
                  </div>
                </div>
                <p className="relative text-[10px] text-muted-foreground mt-3">
                  {s.lastActive
                    ? `Last active ${new Date(s.lastActive).toLocaleString()}`
                    : "No activity in range"}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detailed view */}
      {selected && (
        <StaffDetail
          stat={selected}
          sym={sym}
          fmt={fmt}
          sales={sales}
          trips={trips}
          kActions={kActions}
          cutoff={cutoff}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function StaffDetail({
  stat,
  sym,
  fmt,
  sales,
  trips,
  kActions,
  cutoff,
  onClose,
}: {
  stat: StaffStat;
  sym: string;
  fmt: (n: number) => string;
  sales: SaleRecord[];
  trips: Trip[];
  kActions: KitchenAction[];
  cutoff: number;
  onClose: () => void;
}) {
  const Icon = ROLE_ICON[stat.user.role];
  const accent = ROLE_ACCENT[stat.user.role];
  const userSales = sales.filter((s) => s.userId === stat.user.id && s.at >= cutoff);
  const userTrips = trips.filter((t) => t.riderId === stat.user.id && t.createdAt >= cutoff);
  const userK = kActions.filter((k) => k.userId === stat.user.id && k.at >= cutoff);

  const exportUser = () => {
    const rows: string[][] = [["Activity", "ID", "Time", "Detail", "Amount"]];
    userSales.forEach((s) =>
      rows.push([
        "Sale",
        `BJ-${s.orderNo}`,
        new Date(s.at).toISOString(),
        s.type,
        s.total.toFixed(2),
      ]),
    );
    userTrips.forEach((t) =>
      rows.push([
        "Delivery",
        t.id,
        new Date(t.createdAt).toISOString(),
        `${t.customer} · ${t.stage}`,
        t.amount.toFixed(2),
      ]),
    );
    userK.forEach((k) =>
      rows.push(["Kitchen", k.ticketId, new Date(k.at).toISOString(), k.action, ""]),
    );
    exportCsv(
      rows,
      `bj-${stat.user.username}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-5 pointer-events-none`} />
      <div className="relative flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`size-14 rounded-2xl bg-gradient-to-br ${accent} grid place-items-center`}
          >
            <Icon className="size-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {ROLE_LABELS[stat.user.role]} · @{stat.user.username}
            </p>
            <p className="font-display text-2xl tracking-wider">{stat.user.name.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportUser}
            className="glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/5"
          >
            <Download className="size-3.5" /> Export
          </button>
          <button
            onClick={onClose}
            className="glass rounded-xl px-3 py-2 text-xs hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>

      {/* Role-specific KPIs */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stat.user.role === "rider" ? (
          <>
            <KPI label="Trips Assigned" value={String(stat.trips)} />
            <KPI label="Delivered" value={String(stat.delivered)} accent="gold" />
            <KPI label="Cash Handled" value={fmt(stat.deliveryRevenue)} />
            <KPI
              label="Success Rate"
              value={`${stat.trips ? Math.round((stat.delivered / stat.trips) * 100) : 0}%`}
              accent="red"
            />
          </>
        ) : stat.user.role === "kitchen" ? (
          <>
            <KPI label="Tickets Done" value={String(stat.kitchenTickets)} accent="gold" />
            <KPI label="Started" value={String(stat.kitchenStarts)} />
            <KPI label="Total Actions" value={String(userK.length)} />
            <KPI label="Items Cooked" value="—" />
          </>
        ) : (
          <>
            <KPI label="Orders" value={String(stat.orders)} />
            <KPI label="Revenue" value={fmt(stat.revenue)} accent="gold" />
            <KPI label="Items Sold" value={String(stat.items)} />
            <KPI
              label="Avg Ticket"
              value={fmt(stat.orders ? stat.revenue / stat.orders : 0)}
              accent="red"
            />
          </>
        )}
      </div>

      {/* Activity log */}
      <div className="relative">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Activity Log
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground text-left">
                <th className="py-2">Type</th>
                <th>ID</th>
                <th>Time</th>
                <th>Detail</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stat.user.role === "rider" &&
                userTrips.slice(0, 15).map((t) => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <Bike className="size-3" /> Delivery
                      </span>
                    </td>
                    <td className="font-mono-num text-xs">{t.id}</td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="text-xs">
                      {t.customer} · <span className="text-muted-foreground">{t.stage}</span>
                    </td>
                    <td className="text-right font-mono-num gradient-text-gold">
                      {sym} {t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              {stat.user.role === "kitchen" &&
                userK.slice(0, 15).map((k) => (
                  <tr key={k.id} className="border-t border-white/5">
                    <td className="py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1 text-orange-300">
                        <ChefHat className="size-3" /> Kitchen
                      </span>
                    </td>
                    <td className="font-mono-num text-xs">{k.ticketId}</td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(k.at).toLocaleString()}
                    </td>
                    <td className="text-xs uppercase tracking-widest">{k.action}</td>
                    <td className="text-right text-xs text-muted-foreground">—</td>
                  </tr>
                ))}
              {!["rider", "kitchen"].includes(stat.user.role) &&
                userSales.slice(0, 15).map((s) => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ShoppingBag className="size-3" /> Sale
                      </span>
                    </td>
                    <td className="font-mono-num text-xs">BJ-{s.orderNo}</td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(s.at).toLocaleString()}
                    </td>
                    <td className="text-xs">{s.type}</td>
                    <td className="text-right font-mono-num gradient-text-gold">{fmt(s.total)}</td>
                  </tr>
                ))}
              {((stat.user.role === "rider" && userTrips.length === 0) ||
                (stat.user.role === "kitchen" && userK.length === 0) ||
                (!["rider", "kitchen"].includes(stat.user.role) && userSales.length === 0)) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No activity in selected range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function KPI({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "gold" | "red";
}) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`font-mono-num text-2xl font-bold mt-2 ${accent === "gold" ? "gradient-text-gold" : accent === "red" ? "gradient-text-red" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
