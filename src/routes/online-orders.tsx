import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Phone, MapPin, Clock, CheckCircle2, X, ChevronRight, Bike, Store, Utensils, ExternalLink, Trash2 } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";
import { useCurrency } from "@/lib/settings-store";
import { getCurrentUser } from "@/lib/users-store";
import {
  pushToDeliveryTrips,
  type OnlineOrder,
  type OnlineOrderStatus,
} from "@/lib/online-orders-store";
import { fetchOnlineOrders, removeOnlineOrder, setOnlineOrderStatus } from "@/lib/online-orders.functions";

export const Route = createFileRoute("/online-orders")({
  head: () => ({ meta: [{ title: "Online Orders · BJ Pizza" }] }),
  component: OnlineOrdersPage,
});

const FLOW: OnlineOrderStatus[] = ["New", "Accepted", "Preparing", "Ready", "Out for Delivery", "Completed"];

const statusColor = (s: OnlineOrderStatus) => {
  switch (s) {
    case "New": return "bg-primary/20 text-primary";
    case "Accepted": return "bg-blue-500/20 text-blue-300";
    case "Preparing": return "bg-gold/20 text-gold";
    case "Ready": return "bg-emerald-500/20 text-emerald-300";
    case "Out for Delivery": return "bg-purple-500/20 text-purple-300";
    case "Completed": return "bg-white/10 text-muted-foreground";
    case "Cancelled": return "bg-red-900/40 text-red-300";
  }
};

const typeIcon = (t: OnlineOrder["type"]) => (t === "Delivery" ? Bike : t === "Pickup" ? Store : Utensils);

function OnlineOrdersPage() {
  const sym = useCurrency();
  const loadOnlineOrders = useServerFn(fetchOnlineOrders);
  const saveOnlineOrderStatus = useServerFn(setOnlineOrderStatus);
  const deleteOnlineOrder = useServerFn(removeOnlineOrder);
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const list = await loadOnlineOrders();
      if (alive) setOrders(list);
    };
    load();
    const timer = window.setInterval(load, 8000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [loadOnlineOrders]);

  const me = getCurrentUser();

  const visible = useMemo(() => {
    if (filter === "active") return orders.filter((o) => !["Completed", "Cancelled"].includes(o.status));
    if (filter === "completed") return orders.filter((o) => o.status === "Completed");
    return orders;
  }, [orders, filter]);

  const counts = useMemo(() => ({
    new: orders.filter((o) => o.status === "New").length,
    active: orders.filter((o) => !["Completed", "Cancelled"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "Completed").length,
    revenue: orders.filter((o) => o.status === "Completed").reduce((s, o) => s + o.total, 0),
  }), [orders]);

  const refresh = async () => setOrders(await loadOnlineOrders());

  const advance = async (o: OnlineOrder) => {
    const next = nextStatus(o);
    if (!next) return;
    await saveOnlineOrderStatus({ data: { id: o.id, status: next } });
    if (o.status === "New" && next === "Accepted" && o.type === "Delivery") {
      pushToDeliveryTrips(o, me?.id);
    }
    refresh();
  };

  const cancel = async (id: string) => {
    await saveOnlineOrderStatus({ data: { id, status: "Cancelled" } });
    refresh();
  };

  return (
    <PageShell
      eyebrow="Web Orders"
      title="ONLINE ORDERS"
      subtitle="Customer orders placed from your online storefront. Accept, track and dispatch."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/order"
            target="_blank"
            className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-xs hover:border-primary/40"
          >
            <ExternalLink className="size-3.5" /> View Storefront
          </Link>
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Globe className="size-4 text-gold" />
            <span className="text-xs font-mono-num">{counts.new} new</span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="New" value={counts.new.toString()} accent="text-primary" />
        <Stat label="Active" value={counts.active.toString()} accent="text-blue-300" />
        <Stat label="Completed" value={counts.completed.toString()} accent="text-emerald-300" />
        <Stat label="Online Revenue" value={`${sym} ${counts.revenue.toFixed(2)}`} accent="gradient-text-gold" />
      </div>

      <div className="flex gap-2 mb-3">
        {(["active", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-display tracking-widest border ${
              filter === f ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="glass-strong rounded-2xl p-5">
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {visible.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No {filter} online orders. Share your <Link to="/order" className="text-primary hover:underline">storefront link</Link> with customers.
              </div>
            )}
            {visible.map((o) => {
              const TIcon = typeIcon(o.type);
              const next = nextStatus(o);
              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="size-9 rounded-lg bg-primary/15 grid place-items-center">
                        <TIcon className="size-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-mono-num text-sm font-bold">
                          #{o.id} · {o.customer}{" "}
                          <span className={`ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${statusColor(o.status)}`}>
                            {o.status}
                          </span>
                          <span className="ml-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-muted-foreground">
                            {o.type}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5 flex-wrap">
                          <a href={`tel:${o.phone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="size-3" /> {o.phone}
                          </a>
                          {o.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" /> {o.address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {timeAgo(o.createdAt)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
                      <p className="font-mono-num text-lg gradient-text-gold">{sym} {o.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.lines.map((l) => (
                      <span key={l.id} className="text-xs px-2 py-1 rounded-md bg-black/30 border border-white/5">
                        {l.qty}× {l.name}
                      </span>
                    ))}
                  </div>

                  {o.notes && (
                    <p className="mt-2 text-xs text-muted-foreground italic">Note: {o.notes}</p>
                  )}

                  <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress(o)}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-primary to-gold"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3">
                    {!["Completed", "Cancelled"].includes(o.status) && (
                      <button
                        onClick={() => cancel(o.id)}
                        className="text-xs px-2.5 py-1.5 rounded-md hover:bg-red-500/10 hover:text-red-300 flex items-center gap-1"
                      >
                        <X className="size-3" /> Cancel
                      </button>
                    )}
                    {o.type === "Delivery" && o.status === "New" && (
                      <Link
                        to="/delivery"
                        className="text-xs px-3 py-1.5 rounded-md bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 flex items-center gap-1"
                      >
                        Open in Delivery <ChevronRight className="size-3" />
                      </Link>
                    )}
                    {next && (
                      <button
                        onClick={() => advance(o)}
                        className="text-xs px-3 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1"
                      >
                        {nextLabel(o)}: {next} <ChevronRight className="size-3" />
                      </button>
                    )}
                    {(o.status === "Completed" || o.status === "Cancelled") && (
                      <button
                        onClick={() => deleteOnlineOrder(o.id)}
                        className="text-xs px-2.5 py-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground flex items-center gap-1"
                        title="Remove from list"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}

function nextStatus(o: OnlineOrder): OnlineOrderStatus | null {
  if (o.status === "Cancelled" || o.status === "Completed") return null;
  if (o.type !== "Delivery" && o.status === "Ready") return "Completed";
  const i = FLOW.indexOf(o.status);
  if (i < 0 || i >= FLOW.length - 1) return null;
  let next = FLOW[i + 1];
  if (o.type !== "Delivery" && next === "Out for Delivery") next = "Completed";
  return next;
}

function nextLabel(o: OnlineOrder) {
  if (o.status === "New") return "Accept";
  return "Next";
}

function progress(o: OnlineOrder): number {
  if (o.status === "Cancelled") return 0;
  const order: OnlineOrderStatus[] = o.type === "Delivery"
    ? ["New", "Accepted", "Preparing", "Ready", "Out for Delivery", "Completed"]
    : ["New", "Accepted", "Preparing", "Ready", "Completed"];
  const i = order.indexOf(o.status);
  return Math.round(((i + 1) / order.length) * 100);
}

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-strong rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-mono-num text-2xl font-bold mt-2 ${accent || ""}`}>{value}</p>
    </div>
  );
}
