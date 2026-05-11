import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · BJ Pizza" }] }),
  component: ReportsPage,
});

const WEEK = [
  { day: "Mon", v: 3200 },
  { day: "Tue", v: 4100 },
  { day: "Wed", v: 3800 },
  { day: "Thu", v: 4600 },
  { day: "Fri", v: 6200 },
  { day: "Sat", v: 7100 },
  { day: "Sun", v: 5800 },
];

const CATEGORIES = [
  { name: "Pizza", pct: 42, color: "bg-primary" },
  { name: "Burgers", pct: 21, color: "bg-gold" },
  { name: "Wings", pct: 14, color: "bg-emerald-400" },
  { name: "Pasta", pct: 11, color: "bg-violet-400" },
  { name: "Drinks", pct: 8, color: "bg-sky-400" },
  { name: "Other", pct: 4, color: "bg-white/30" },
];

const STAFF = [
  { name: "Sara M.", role: "Cashier", orders: 84, revenue: 3120, trend: 12 },
  { name: "Omar A.", role: "Cashier", orders: 71, revenue: 2680, trend: 6 },
  { name: "Layla H.", role: "Manager", orders: 63, revenue: 2410, trend: -3 },
  { name: "Imran S.", role: "Cashier", orders: 58, revenue: 2090, trend: 9 },
];

function ReportsPage() {
  const max = Math.max(...WEEK.map((w) => w.v));
  const total = WEEK.reduce((a, b) => a + b.v, 0);
  return (
    <PageShell
      eyebrow="Insights"
      title="REPORTS"
      subtitle="Sales, mix and team performance — last 7 days."
      actions={
        <button className="glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/5">
          <Download className="size-3.5" /> Export CSV
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Weekly Revenue", value: `$${total.toLocaleString()}`, trend: "+18.2%", accent: "gold" },
          { label: "Orders", value: "812", trend: "+9.1%" },
          { label: "Avg Ticket", value: "$42.10", trend: "+$1.40" },
          { label: "Refunds", value: "1.2%", trend: "-0.4%", accent: "red" },
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
          <p className="font-display text-xl tracking-wider mt-1 mb-4">LAST 7 DAYS</p>
          <div className="flex items-end gap-3 h-56">
            {WEEK.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.v / max) * 100}%` }}
                  transition={{ delay: i * 0.06, type: "spring" }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-gold/60 relative"
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono-num text-muted-foreground">
                    ${(d.v / 1000).toFixed(1)}k
                  </span>
                </motion.div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sales mix</p>
          <p className="font-display text-xl tracking-wider mt-1 mb-4">CATEGORIES</p>
          <div className="flex h-2 rounded-full overflow-hidden mb-4">
            {CATEGORIES.map((c) => (
              <div key={c.name} className={c.color} style={{ width: `${c.pct}%` }} />
            ))}
          </div>
          <ul className="space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c.name} className="flex items-center gap-3 text-sm">
                <span className={`size-2.5 rounded-full ${c.color}`} />
                <span className="flex-1">{c.name}</span>
                <span className="font-mono-num text-muted-foreground">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-5">
        <p className="font-display text-xl tracking-wider mb-4">STAFF LEADERBOARD</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground text-left">
                <th className="py-2">Name</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th className="text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {STAFF.map((s) => (
                <tr key={s.name} className="border-t border-white/5">
                  <td className="py-3">{s.name}</td>
                  <td className="text-muted-foreground">{s.role}</td>
                  <td className="font-mono-num">{s.orders}</td>
                  <td className="font-mono-num gradient-text-gold">${s.revenue.toLocaleString()}</td>
                  <td className="text-right">
                    <span className={`inline-flex items-center gap-1 text-xs ${s.trend >= 0 ? "text-emerald-400" : "text-primary"}`}>
                      {s.trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {Math.abs(s.trend)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
