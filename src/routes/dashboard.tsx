import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Clock,
  ArrowUpRight,
  Pizza,
  ChefHat,
  Bike,
  Utensils,
  BarChart3,
  Flame,
} from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";
import { getCurrentUser, ROLE_LABELS, type AppUser } from "@/lib/users-store";
import { getSales } from "@/lib/sales-store";
import { getSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · BJ Pizza" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [me, setMe] = useState<AppUser | null>(null);

  useEffect(() => {
    setMe(getCurrentUser());
  }, []);

  if (!me) return null;

  if (me.role === "kitchen") return <KitchenDash me={me} />;
  if (me.role === "rider") return <RiderDash me={me} />;
  if (me.role === "pos") return <PosDash me={me} />;
  return <AdminDash me={me} />;
}

function Eyebrow({ me }: { me: AppUser }) {
  return `${ROLE_LABELS[me.role].toUpperCase()} · ${me.name}`;
}

/* ---------------- Admin / Manager ---------------- */
function AdminDash({ me }: { me: AppUser }) {
  const sales = getSales();
  const settings = getSettings();
  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.at).toDateString() === today);
  const revenue = todaySales.reduce((a, s) => a + s.total, 0);
  const orders = todaySales.length;
  const avg = orders ? revenue / orders : 0;

  const stats = [
    { label: "Today's Revenue", value: `${settings.currencySymbol} ${revenue.toFixed(0)}`, trend: `${orders} orders`, icon: TrendingUp, accent: "gold" },
    { label: "Orders", value: String(orders), trend: "live today", icon: ShoppingBag, accent: "red" },
    { label: "Avg Ticket", value: `${settings.currencySymbol} ${avg.toFixed(0)}`, trend: "", icon: Users },
    { label: "Lifetime Sales", value: String(sales.length), trend: "all-time", icon: Clock },
  ];

  const HOURLY = Array.from({ length: 12 }, (_, i) => {
    const h = (new Date().getHours() - 11 + i + 24) % 24;
    return todaySales
      .filter((s) => new Date(s.at).getHours() === h)
      .reduce((a, s) => a + s.total, 0);
  });
  const max = Math.max(...HOURLY, 1);

  return (
    <PageShell eyebrow={Eyebrow({ me })} title="DASHBOARD" subtitle="Real-time pulse across the entire operation.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className="glass-strong rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <p className={`font-mono-num text-2xl font-bold mt-2 ${s.accent === "gold" ? "gradient-text-gold" : s.accent === "red" ? "gradient-text-red" : ""}`}>
              {s.value}
            </p>
            {s.trend && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="size-3" /> {s.trend}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="glass-strong rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Hourly revenue</p>
        <p className="font-display text-xl tracking-wider mt-1 mb-4">TODAY · 12H</p>
        <div className="flex items-end gap-2 h-48">
          {HOURLY.map((v, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 80 }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary/80 to-primary/30"
            />
          ))}
        </div>
      </div>

      <QuickLinks
        items={[
          { to: "/", label: "POS", icon: ShoppingBag },
          { to: "/tables", label: "Tables", icon: Utensils },
          { to: "/kitchen", label: "Kitchen", icon: ChefHat },
          { to: "/delivery", label: "Delivery", icon: Bike },
          { to: "/reports", label: "Reports", icon: BarChart3 },
          { to: "/users", label: "Users", icon: Users },
        ]}
      />
    </PageShell>
  );
}

/* ---------------- POS / Cashier ---------------- */
function PosDash({ me }: { me: AppUser }) {
  const sales = getSales();
  const settings = getSettings();
  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.at).toDateString() === today);
  const revenue = todaySales.reduce((a, s) => a + s.total, 0);

  return (
    <PageShell eyebrow={Eyebrow({ me })} title="CASHIER STATION" subtitle="Take orders, manage tables and print receipts.">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="My shift orders" value={String(todaySales.length)} icon={ShoppingBag} />
        <Stat label="Today's revenue" value={`${settings.currencySymbol} ${revenue.toFixed(0)}`} icon={TrendingUp} accent="gold" />
        <Stat label="Branch" value={settings.shopName} icon={Flame} accent="red" />
      </div>
      <QuickLinks
        items={[
          { to: "/", label: "Open POS", icon: ShoppingBag },
          { to: "/tables", label: "Open Tables", icon: Utensils },
          { to: "/menu", label: "Menu", icon: Pizza },
        ]}
      />
    </PageShell>
  );
}

/* ---------------- Kitchen ---------------- */
function KitchenDash({ me }: { me: AppUser }) {
  return (
    <PageShell eyebrow={Eyebrow({ me })} title="KITCHEN STATION" subtitle="Cook, prep and mark orders ready.">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Queued" value="—" icon={Clock} />
        <Stat label="Cooking" value="—" icon={ChefHat} accent="red" />
        <Stat label="Ready" value="—" icon={Pizza} accent="gold" />
      </div>
      <QuickLinks items={[{ to: "/kitchen", label: "Open Kitchen Display", icon: ChefHat }]} />
    </PageShell>
  );
}

/* ---------------- Rider ---------------- */
function RiderDash({ me }: { me: AppUser }) {
  return (
    <PageShell eyebrow={Eyebrow({ me })} title="RIDER STATION" subtitle="Assigned deliveries and live drop-offs.">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Active runs" value="—" icon={Bike} accent="red" />
        <Stat label="Delivered today" value="—" icon={ArrowUpRight} accent="gold" />
        <Stat label="Avg time" value="—" icon={Clock} />
      </div>
      <QuickLinks items={[{ to: "/delivery", label: "Open Delivery Board", icon: Bike }]} />
    </PageShell>
  );
}

/* ---------------- Helpers ---------------- */
function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Clock;
  accent?: "gold" | "red";
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass-strong rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p
        className={`font-mono-num text-2xl font-bold mt-2 ${accent === "gold" ? "gradient-text-gold" : accent === "red" ? "gradient-text-red" : ""}`}
      >
        {value}
      </p>
    </motion.div>
  );
}

function QuickLinks({
  items,
}: {
  items: { to: string; label: string; icon: typeof Clock }[];
}) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Quick access</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
          >
            <span className="size-9 rounded-lg bg-primary/15 grid place-items-center">
              <it.icon className="size-4 text-primary" />
            </span>
            <span className="text-sm font-medium">{it.label}</span>
            <ArrowUpRight className="size-4 ml-auto text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
