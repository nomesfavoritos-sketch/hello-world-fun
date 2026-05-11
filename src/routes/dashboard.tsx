import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingBag, Users, Clock, ArrowUpRight, Pizza } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · BJ Pizza" }] }),
  component: DashboardPage,
});

const STATS = [
  { label: "Today's Revenue", value: "$4,892", trend: "+12.4%", icon: TrendingUp, accent: "gold" },
  { label: "Orders", value: "127", trend: "+8 live", icon: ShoppingBag, accent: "red" },
  { label: "New Customers", value: "34", trend: "+18%", icon: Users },
  { label: "Avg Prep Time", value: "11m", trend: "-2m", icon: Clock },
];

const HOURLY = [12, 18, 22, 28, 35, 44, 52, 48, 60, 72, 64, 58];

const TOP_ITEMS = [
  { name: "Pepperoni Inferno", qty: 42, revenue: 609 },
  { name: "Wagyu Smash", qty: 31, revenue: 341 },
  { name: "Margherita Royale", qty: 28, revenue: 336 },
  { name: "Buffalo Wings", qty: 24, revenue: 216 },
  { name: "Truffle Fries", qty: 22, revenue: 121 },
];

const RECENT = [
  { id: "#1284", customer: "Ahmed K.", total: 48.5, status: "Ready", time: "2m" },
  { id: "#1283", customer: "Sara M.", total: 23.0, status: "Cooking", time: "5m" },
  { id: "#1282", customer: "John D.", total: 67.0, status: "Delivered", time: "12m" },
  { id: "#1281", customer: "Fatima R.", total: 19.5, status: "Delivered", time: "18m" },
];

function DashboardPage() {
  const max = Math.max(...HOURLY);
  return (
    <PageShell
      eyebrow="Live Operations"
      title="DASHBOARD"
      subtitle="Real-time pulse across revenue, kitchen and delivery."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className="glass-strong rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <p
              className={`font-mono-num text-2xl font-bold mt-2 ${s.accent === "gold" ? "gradient-text-gold" : s.accent === "red" ? "gradient-text-red" : ""}`}
            >
              {s.value}
            </p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="size-3" /> {s.trend}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-strong rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Hourly revenue</p>
              <p className="font-display text-xl tracking-wider mt-1">TODAY · 12H</p>
            </div>
            <span className="text-xs text-muted-foreground">USD</span>
          </div>
          <div className="flex items-end gap-2 h-48">
            {HOURLY.map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(v / max) * 100}%` }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 80 }}
                className="flex-1 rounded-t-md bg-gradient-to-t from-primary/80 to-primary/30 relative group"
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono-num text-muted-foreground opacity-0 group-hover:opacity-100">
                  ${v * 10}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono-num">
            {HOURLY.map((_, i) => (
              <span key={i}>{(10 + i) % 24}h</span>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Top items</p>
          <p className="font-display text-xl tracking-wider mt-1 mb-4">BESTSELLERS</p>
          <ul className="flex flex-col gap-3">
            {TOP_ITEMS.map((it, i) => (
              <li key={it.name} className="flex items-center gap-3">
                <span className="size-7 rounded-lg bg-primary/15 grid place-items-center text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{it.name}</p>
                  <p className="text-[10px] text-muted-foreground">{it.qty} sold</p>
                </div>
                <span className="font-mono-num text-sm gradient-text-gold">${it.revenue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-xl tracking-wider">RECENT ORDERS</p>
          <Pizza className="size-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground text-left">
                <th className="py-2">Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((o) => (
                <tr key={o.id} className="border-t border-white/5">
                  <td className="py-3 font-mono-num">{o.id}</td>
                  <td>{o.customer}</td>
                  <td className="font-mono-num gradient-text-gold">${o.total.toFixed(2)}</td>
                  <td>
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${
                        o.status === "Ready"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : o.status === "Cooking"
                            ? "bg-primary/15 text-primary"
                            : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="text-right text-muted-foreground">{o.time} ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
