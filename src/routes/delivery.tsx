import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, MapPin, Phone, Star, Plus, X, ChevronRight, CheckCircle2, Clock, Package, Navigation } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, getUsers, type AppUser } from "@/lib/users-store";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery · BJ Pizza" }] }),
  component: DeliveryPage,
});

type RiderStatus = "Idle" | "On Trip" | "Returning";
type RiderStats = { rating: number; trips: number };
type Rider = { id: string; name: string; rating: number; trips: number; status: RiderStatus };

type Stage = "Pending" | "Assigned" | "Picked Up" | "On the Way" | "Delivered" | "Cancelled";
const STAGES: Stage[] = ["Pending", "Assigned", "Picked Up", "On the Way", "Delivered"];

type Trip = {
  id: string;
  customer: string;
  phone: string;
  addr: string;
  amount: number;
  riderId: string | null;
  assignedBy?: string | null;
  stage: Stage;
  eta: number; // minutes
  createdAt: number;
};

const INITIAL_TRIPS: Trip[] = [];

const stageProgress = (s: Stage): number => {
  if (s === "Cancelled") return 0;
  const i = STAGES.indexOf(s);
  return Math.round(((i + 1) / STAGES.length) * 100);
};

const stageColor = (s: Stage) => {
  switch (s) {
    case "Pending": return "bg-white/10 text-muted-foreground";
    case "Assigned": return "bg-blue-500/20 text-blue-300";
    case "Picked Up": return "bg-gold/20 text-gold";
    case "On the Way": return "bg-primary/20 text-primary";
    case "Delivered": return "bg-emerald-500/20 text-emerald-300";
    case "Cancelled": return "bg-red-900/40 text-red-300";
  }
};

function buildRiders(trips: Trip[], statsMap: Record<string, RiderStats>): Rider[] {
  const userRiders = getUsers().filter((u) => u.role === "rider" && u.active);
  return userRiders.map((u) => {
    const stats = statsMap[u.id] ?? { rating: 5.0, trips: 0 };
    const active = trips.find((t) => t.riderId === u.id && !["Delivered", "Cancelled"].includes(t.stage));
    const returning = trips.find((t) => t.riderId === u.id && t.stage === "Delivered" && Date.now() - t.createdAt < 5 * 60_000);
    const status: RiderStatus = active ? "On Trip" : returning ? "Returning" : "Idle";
    return { id: u.id, name: u.name, rating: stats.rating, trips: stats.trips, status };
  });
}

function DeliveryPage() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [trips, setTrips] = useState<Trip[]>(() => loadLS("bj_trips", INITIAL_TRIPS));
  const [stats, setStats] = useState<Record<string, RiderStats>>(() => loadLS("bj_rider_stats", {}));
  const [showNew, setShowNew] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => setMe(getCurrentUser()), []);
  useEffect(() => saveLS("bj_trips", trips), [trips]);
  useEffect(() => saveLS("bj_rider_stats", stats), [stats]);

  // Tick down ETAs every 30s for active trips
  useEffect(() => {
    const t = setInterval(() => {
      setTrips((prev) =>
        prev.map((tr) =>
          ["On the Way", "Picked Up"].includes(tr.stage) && tr.eta > 0
            ? { ...tr, eta: Math.max(0, tr.eta - 1) }
            : tr,
        ),
      );
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const isRider = me?.role === "rider";
  const canDispatch = me && ["admin", "manager", "pos", "kitchen"].includes(me.role);

  const riders = useMemo(() => buildRiders(trips, stats), [trips, stats]);

  const visibleTrips = useMemo(() => {
    if (isRider && me) return trips.filter((t) => t.riderId === me.id);
    return trips;
  }, [trips, isRider, me]);

  const active = useMemo(() => visibleTrips.filter((t) => !["Delivered", "Cancelled"].includes(t.stage)), [visibleTrips]);
  const completed = useMemo(() => visibleTrips.filter((t) => t.stage === "Delivered"), [visibleTrips]);

  const advanceStage = (id: string) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const i = STAGES.indexOf(t.stage);
        if (i < 0 || i >= STAGES.length - 1) return t;
        const next = STAGES[i + 1];
        if (next === "Delivered" && t.riderId) {
          setStats((s) => {
            const cur = s[t.riderId!] ?? { rating: 5.0, trips: 0 };
            return { ...s, [t.riderId!]: { ...cur, trips: cur.trips + 1 } };
          });
        }
        return { ...t, stage: next };
      }),
    );
  };

  const cancelTrip = (id: string) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, stage: "Cancelled" } : t)));
  };

  const assignRider = (tripId: string, riderId: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, riderId, assignedBy: me?.id ?? null, stage: t.stage === "Pending" ? "Assigned" : t.stage }
          : t,
      ),
    );
    setAssigning(null);
  };

  const addTrip = (data: { customer: string; phone: string; addr: string; amount: number; riderId: string | null }) => {
    const id = `BJ-${Math.floor(Date.now() / 1000) % 10000}`;
    setTrips((prev) => [
      {
        id,
        customer: data.customer,
        phone: data.phone,
        addr: data.addr,
        amount: data.amount,
        riderId: data.riderId,
        assignedBy: me?.id ?? null,
        stage: data.riderId ? "Assigned" : "Pending",
        eta: 25,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setShowNew(false);
  };

  const onTripCount = riders.filter((r) => r.status === "On Trip").length;

  return (
    <PageShell
      eyebrow={isRider ? "My Runs" : "Live Dispatch"}
      title={isRider ? "MY DELIVERIES" : "DELIVERY OPS"}
      subtitle={
        isRider
          ? "Deliveries assigned to you. Update status as you go."
          : "Track riders, ETAs and active trips in real time."
      }
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Bike className="size-4 text-gold" />
            <span className="text-xs font-mono-num">{onTripCount} on trip</span>
          </div>
          {canDispatch && (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold glow-red"
            >
              <Plus className="size-4" /> New Delivery
            </button>
          )}
        </div>
      }
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label={isRider ? "My Active" : "Active Trips"} value={active.length.toString()} icon={<Navigation className="size-4 text-primary" />} />
        <Stat label="Pending" value={visibleTrips.filter((t) => t.stage === "Pending").length.toString()} icon={<Clock className="size-4 text-gold" />} />
        <Stat label={isRider ? "My Delivered" : "Delivered Today"} value={completed.length.toString()} icon={<CheckCircle2 className="size-4 text-emerald-400" />} />
        <Stat label="Available Riders" value={riders.filter((r) => r.status === "Idle").length.toString()} icon={<Bike className="size-4 text-blue-300" />} />
      </div>

      <div className={`grid grid-cols-1 ${isRider ? "" : "lg:grid-cols-3"} gap-4`}>
        <div className={`${isRider ? "" : "lg:col-span-2"} glass-strong rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-xl tracking-wider">{isRider ? "ASSIGNED TO ME" : "ACTIVE TRIPS"}</p>
            <span className="text-xs text-muted-foreground font-mono-num">{active.length} live</span>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {active.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground text-sm">
                  {isRider
                    ? "No deliveries assigned to you yet. Hang tight!"
                    : "No active trips. Create a new delivery to get started."}
                </motion.div>
              )}
              {active.map((t) => {
                const rider = riders.find((r) => r.id === t.riderId);
                const i = STAGES.indexOf(t.stage);
                const isLast = i === STAGES.length - 1;
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="size-9 rounded-lg bg-primary/15 grid place-items-center">
                          <Bike className="size-4 text-primary" />
                        </span>
                        <div>
                          <p className="font-mono-num text-sm font-bold">
                            #{t.id} · {t.customer}{" "}
                            <span className={`ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${stageColor(t.stage)}`}>{t.stage}</span>
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3" /> {t.addr}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ETA</p>
                        <p className="font-mono-num text-lg gradient-text-gold">{t.eta}m</p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stageProgress(t.stage)}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-primary to-gold"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        {!isRider && (
                          <span>
                            Rider:{" "}
                            {rider ? (
                              <span className="text-foreground">{rider.name}</span>
                            ) : (
                              <button onClick={() => setAssigning(t.id)} className="text-primary hover:underline">
                                Assign rider
                              </button>
                            )}
                          </span>
                        )}
                        {!isRider && rider && (
                          <button onClick={() => setAssigning(t.id)} className="text-[10px] text-muted-foreground hover:text-primary underline">
                            Reassign
                          </button>
                        )}
                        <a href={`tel:${t.phone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="size-3" /> {t.phone}
                        </a>
                        <span className="font-mono-num text-gold">${t.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isRider && (
                          <button
                            onClick={() => cancelTrip(t.id)}
                            className="text-xs px-2.5 py-1.5 rounded-md hover:bg-red-500/10 hover:text-red-300"
                          >
                            Cancel
                          </button>
                        )}
                        {!isLast && (
                          <button
                            onClick={() => advanceStage(t.id)}
                            disabled={t.stage === "Pending" && !t.riderId}
                            className="text-xs px-3 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1 disabled:opacity-40"
                          >
                            {isRider ? "Mark" : "Next"}: {STAGES[i + 1]} <ChevronRight className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!isRider && assigning === t.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Choose rider</p>
                        <div className="flex flex-wrap gap-2">
                          {riders.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              No riders found. Add a user with role &quot;Rider&quot; in Users.
                            </span>
                          )}
                          {riders.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => assignRider(t.id, r.id)}
                              className={`text-xs px-3 py-1.5 rounded-md glass border ${
                                r.status === "Idle" ? "border-white/10 hover:border-primary/40" : "border-white/5 opacity-70"
                              }`}
                            >
                              {r.name} · ⭐{r.rating.toFixed(1)} · {r.status}
                            </button>
                          ))}
                          <button onClick={() => setAssigning(null)} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground">
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {completed.length > 0 && (
            <div className="mt-6">
              <p className="font-display text-sm tracking-wider mb-2 text-muted-foreground">RECENT DELIVERED</p>
              <div className="flex flex-col gap-1.5">
                {completed.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs glass rounded-lg px-3 py-2">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      <span className="font-mono-num">#{t.id}</span> · {t.customer}
                    </span>
                    <span className="text-gold font-mono-num">${t.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isRider && (
          <div className="glass-strong rounded-2xl p-5">
            <p className="font-display text-xl tracking-wider mb-4">RIDER ROSTER</p>
            {riders.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No riders yet. Go to <span className="text-primary">Users</span> and add a staff member with role
                &quot;Rider&quot;.
              </p>
            )}
            <ul className="flex flex-col gap-3">
              {riders.map((r) => (
                <li key={r.id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <span className="size-9 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-xs font-bold">
                    {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <Star className="size-3 text-gold" /> {r.rating.toFixed(1)} · {r.trips} trips
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${
                      r.status === "On Trip"
                        ? "bg-primary/15 text-primary"
                        : r.status === "Idle"
                          ? "bg-white/5 text-muted-foreground"
                          : "bg-gold/15 text-gold"
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNew && canDispatch && (
          <NewDeliveryModal riders={riders} onClose={() => setShowNew(false)} onCreate={addTrip} />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="font-mono-num text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function NewDeliveryModal({
  riders,
  onClose,
  onCreate,
}: {
  riders: Rider[];
  onClose: () => void;
  onCreate: (data: { customer: string; phone: string; addr: string; amount: number; riderId: string | null }) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [riderId, setRiderId] = useState<string>("");

  const valid = customer && phone && addr && parseFloat(amount) > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/90 grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 w-full max-w-md border border-white/10"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <p className="font-display tracking-wider text-lg">NEW DELIVERY</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Customer Name" value={customer} onChange={setCustomer} placeholder="Ahmed Khan" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="0305-1234567" />
          <Field label="Address" value={addr} onChange={setAddr} placeholder="Old Shujabad Road, Multan" />
          <Field label="Amount ($)" value={amount} onChange={setAmount} placeholder="42.50" type="number" />
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Assign Rider (optional)</span>
            <select
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none"
            >
              <option value="">— Leave Pending —</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.status})
                </option>
              ))}
            </select>
            {riders.length === 0 && (
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Tip: add a user with role &quot;Rider&quot; in Users to assign deliveries.
              </span>
            )}
          </label>
        </div>

        <button
          disabled={!valid}
          onClick={() =>
            onCreate({ customer, phone, addr, amount: parseFloat(amount), riderId: riderId || null })
          }
          className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold glow-red disabled:opacity-40 disabled:glow-red-none"
        >
          Create Delivery
        </button>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none"
      />
    </label>
  );
}

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}
