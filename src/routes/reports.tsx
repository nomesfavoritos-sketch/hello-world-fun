import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, TrendingUp, TrendingDown, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/pos/PageShell";
import { getSales, type SaleRecord } from "@/lib/sales-store";
import { getSettings } from "@/lib/settings-store";

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

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function exportCsv(sales: SaleRecord[]) {
  const rows = [["Order", "Date", "Type", "Items", "Subtotal", "VAT", "Total"]];
  sales.forEach((s) => {
    const items = s.lines.map((l) => `${l.qty}x ${l.name}`).join(" | ");
    rows.push([
      `BJ-${s.orderNo}`,
      new Date(s.at).toISOString(),
      s.type,
      items,
      s.subtotal.toFixed(2),
      s.tax.toFixed(2),
      s.total.toFixed(2),
    ]);
  });
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bj-sales-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [sym, setSym] = useState("Rs");

  useEffect(() => {
    setSales(getSales());
    setSym(getSettings().currencySymbol || getSettings().currency || "Rs");
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const cutoff = startOfDay(now - 6 * 24 * 60 * 60 * 1000);
    const recent = sales.filter((s) => s.at >= cutoff);

    const week = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfDay(now - (6 - i) * 24 * 60 * 60 * 1000));
      return { day: DAY_LABELS[day.getDay()], v: 0, ts: day.getTime() };
    });
    recent.forEach((s) => {
      const ds = startOfDay(s.at);
      const slot = week.find((w) => w.ts === ds);
      if (slot) slot.v += s.total;
    });

    const total = week.reduce((a, b) => a + b.v, 0);
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
  }, [sales]);

  const max = Math.max(...stats.week.map((w) => w.v), 1);
  const fmt = (n: number) => `${sym} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <PageShell
      eyebrow="Insights"
      title="REPORTS"
      subtitle="Sales, mix and category performance — last 7 days."
      actions={
        <button
          onClick={() => exportCsv(sales)}
          disabled={sales.length === 0}
          className="glass rounded-xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/5 disabled:opacity-40"
        >
          <Download className="size-3.5" /> Export CSV
        </button>
      }
    >
      {sales.length === 0 ? (
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
              { label: "Weekly Revenue", value: fmt(stats.total), trend: `${stats.orders} orders`, accent: "gold" },
              { label: "Orders (7d)", value: String(stats.orders), trend: "live data" },
              { label: "Avg Ticket", value: fmt(stats.avg), trend: "per order" },
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
              <p className="font-display text-xl tracking-wider mt-1 mb-4">LAST 7 DAYS</p>
              <div className="flex items-end gap-3 h-56">
                {stats.week.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.v / max) * 100}%` }}
                      transition={{ delay: i * 0.06, type: "spring" }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-gold/60 relative min-h-[2px]"
                    >
                      {d.v > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono-num text-muted-foreground whitespace-nowrap">
                          {sym}{(d.v / 1000).toFixed(1)}k
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
              {stats.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No category data yet.</p>
              ) : (
                <>
                  <div className="flex h-2 rounded-full overflow-hidden mb-4">
                    {stats.categories.map((c) => (
                      <div key={c.name} className={c.color} style={{ width: `${c.pct}%` }} />
                    ))}
                  </div>
                  <ul className="space-y-2">
                    {stats.categories.map((c) => (
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
                    <th>Type</th>
                    <th>Items</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 12).map((s) => {
                    const trendUp = s.total >= stats.avg;
                    return (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="py-3 font-mono-num">BJ-{s.orderNo}</td>
                        <td className="text-muted-foreground text-xs">
                          {new Date(s.at).toLocaleString()}
                        </td>
                        <td className="text-xs">{s.type}</td>
                        <td className="font-mono-num text-muted-foreground">
                          {s.lines.reduce((a, b) => a + b.qty, 0)}
                        </td>
                        <td className="text-right">
                          <span className="inline-flex items-center gap-1 font-mono-num gradient-text-gold">
                            {trendUp ? <TrendingUp className="size-3 text-emerald-400" /> : <TrendingDown className="size-3 text-primary" />}
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
      )}
    </PageShell>
  );
}
