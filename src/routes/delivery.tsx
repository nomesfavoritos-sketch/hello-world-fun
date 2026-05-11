import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, MapPin, Phone, Star, Plus, X, ChevronRight, CheckCircle2, Clock, Package, Navigation } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery · BJ Pizza" }] }),
  component: DeliveryPage,
});

type RiderStatus = "Idle" | "On Trip" | "Returning";
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
  stage: Stage;
  eta: number; // minutes
  createdAt: number;
};

const INITIAL_RIDERS: Rider[] = [
  { id: "r1", name: "Ali Raza", rating: 4.9, trips: 6, status: "Idle" },
  { id: "r2", name: "Hassan M.", rating: 4.8, trips: 4, status: "Idle" },
  { id: "r3", name: "Bilal K.", rating: 5.0, trips: 7, status: "Idle" },
  { id: "r4", name: "Usman T.", rating: 4.7, trips: 5, status: "Idle" },
];

const INITIAL_TRIPS: Trip[] = [
  { id: "BJ-1284", customer: "Ahmed K.", phone: "0305-7924444", addr: "Marina Walk, B-12", amount: 42.5, riderId: "r1", stage: "On the Way", eta: 8, createdAt: Date.now() - 600000 },
  { id: "BJ-1280", customer: "Sara M.", phone: "0315-7924444", addr: "JLT, Cluster D", amount: 28.0, riderId: "r3", stage: "Picked Up", eta: 14, createdAt: Date.now() - 900000 },
  { id: "BJ-1278", customer: "John D.", phone: "0305-7924444", addr: "Downtown, Burj View", amount: 65.0, riderId: "r4", stage: "On the Way", eta: 3, createdAt: Date.now() - 1500000 },
];

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

function DeliveryPage() {
  const [riders, setRiders] = useState<Rider[]>(() => loadLS("bj_riders", INITIAL_RIDERS));
  const [trips, setTrips] = useState<Trip[]>(() => loadLS("bj_trips", INITIAL_TRIPS));
  const [showNew, setShowNew] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Sync rider statuses based on trips
  useEffect(() => {
    setRiders((prev) =>
      prev.map((r) => {
        const active = trips.find((t) => t.riderId === r.id && !["Delivered", "Cancelled"].includes(t.stage));
        const returning = trips.find((t) => t.riderId === r.id && t.stage === "Delivered" && Date.now() - t.createdAt < 5 * 60_000);
        return { ...r, status: active ? "On Trip" : returning ? "Returning" : "Idle" };
      }),
    );
  }, [trips]);

  useEffect(() => saveLS("bj_riders", riders), [riders]);
  useEffect(() => saveLS("bj_trips", trips), [trips]);

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

  const active = useMemo(() => trips.filter((t) => !["Delivered", "Cancelled"].includes(t.stage)), [trips]);
  const completed = useMemo(() => trips.filter((t) => t.stage === "Delivered"), [trips]);

  const advanceStage = (id: string) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const i = STAGES.indexOf(t.stage);
        if (i < 0 || i >= STAGES.length - 1) return t;
        const next = STAGES[i + 1];
        const trips_inc = next === "Delivered" ? 1 : 0;
        if (trips_inc && t.riderId) {
          setRiders((rs) => rs.map((r) => (r.id === t.riderId ? { ...r, trips: r.trips + 1 } : r)));
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
      prev.map((t) => (t.id === tripId ? { ...t, riderId, stage: t.stage === "Pending" ? "Assigned" : t.stage } : t)),
    );
    setAssigning(null);
  };

  const addTrip = (data: { customer: string; phone: string; addr: string; amount: number }) => {
    const id = `BJ-${Math.floor(Date.now() / 1000) % 10000}`;
    setTrips((prev) => [
      { id, ...data, riderId: null, stage: "Pending", eta: 25, createdAt: Date.now() },
      ...prev,
    ]);
    setShowNew(false);
  };

  const onTripCount = riders.filter((r) => r.status === "On Trip").length;

  return (
    <PageShell
      eyebrow="Live Dispatch"
      title="DELIVERY OPS"
      subtitle="Track riders, ETAs and active trips in real time."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Bike className="size-4 text-gold" />
            <span className="text-xs font-mono-num">{onTripCount} on trip</span>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold glow-red"
          >
            <Plus className="size-4" /> New Delivery
          </button>
        </div>
      }
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Active Trips" value={active.length.toString()} icon={<Navigation className="size-4 text-primary" />} />
        <Stat label="Pending" value={trips.filter((t) => t.stage === "Pending").length.toString()} icon={<Clock className="size-4 text-gold" />} />
        <Stat label="Delivered Today" value={completed.length.toString()} icon={<CheckCircle2 className="size-4 text-emerald-400" />} />
        <Stat label="Available Riders" value={riders.filter((r) => r.status === "Idle").length.toString()} icon={<Bike className="size-4 text-blue-300" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-strong rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-xl tracking-wider">ACTIVE TRIPS</p>
            <span className="text-xs text-muted-foreground font-mono-num">{active.length} live</span>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {active.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground text-sm">
                  No active trips. Create a new delivery to get started.
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
                      <div className="flex items-center gap-3">
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
                        <a href={`tel:${t.phone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="size-3" /> {t.phone}
                        </a>
                        <span className="font-mono-num text-gold">${t.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cancelTrip(t.id)}
                          className="text-xs px-2.5 py-1.5 rounded-md hover:bg-red-500/10 hover:text-red-300"
                        >
                          Cancel
                        </button>
                        {!isLast && (
                          <button
                            onClick={() => advanceStage(t.id)}
                            disabled={t.stage === "Pending" && !t.riderId}
                            className="text-xs px-3 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1 disabled:opacity-40"
                          >
                            Next: {STAGES[i + 1]} <ChevronRight className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {assigning === t.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Available riders</p>
                        <div className="flex flex-wrap gap-2">
                          {riders.filter((r) => r.status === "Idle").map((r) => (
                            <button
                              key={r.id}
                              onClick={() => assignRider(t.id, r.id)}
                              className="text-xs px-3 py-1.5 rounded-md glass hover:border-primary/40 border border-white/10"
                            >
                              {r.name} · ⭐{r.rating}
                            </button>
                          ))}
                          {riders.filter((r) => r.status === "Idle").length === 0 && (
                            <span className="text-xs text-muted-foreground">No idle riders right now.</span>
                          )}
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

        <div className="glass-strong rounded-2xl p-5">
          <p className="font-display text-xl tracking-wider mb-4">RIDER ROSTER</p>
          <ul className="flex flex-col gap-3">
            {riders.map((r) => (
              <li key={r.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <span className="size-9 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-xs font-bold">
                  {r.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <Star className="size-3 text-gold" /> {r.rating} · {r.trips} trips
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
      </div>

      <AnimatePresence>
        {showNew && <NewDeliveryModal onClose={() => setShowNew(false)} onCreate={addTrip} />}
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
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { customer: string; phone: string; addr: string; amount: number }) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [amount, setAmount] = useState("");

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
        </div>

        <button
          disabled={!valid}
          onClick={() => onCreate({ customer, phone, addr, amount: parseFloat(amount) })}
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
