import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bike, MapPin, Phone, Star } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery · BJ Pizza" }] }),
  component: DeliveryPage,
});

const RIDERS = [
  { name: "Ali Raza", status: "On Trip", trips: 6, rating: 4.9, eta: "8m" },
  { name: "Hassan M.", status: "Idle", trips: 4, rating: 4.8, eta: "—" },
  { name: "Bilal K.", status: "On Trip", trips: 7, rating: 5.0, eta: "14m" },
  { name: "Usman T.", status: "Returning", trips: 5, rating: 4.7, eta: "3m" },
];

const TRIPS = [
  { id: "#1284", customer: "Ahmed K.", addr: "Marina Walk, B-12", phone: "+971 50 123 4567", rider: "Ali Raza", stage: 70, eta: "8m" },
  { id: "#1280", customer: "Sara M.", addr: "JLT, Cluster D", phone: "+971 55 678 1234", rider: "Bilal K.", stage: 45, eta: "14m" },
  { id: "#1278", customer: "John D.", addr: "Downtown, Burj View", phone: "+971 52 998 7766", rider: "Usman T.", stage: 92, eta: "3m" },
];

function DeliveryPage() {
  return (
    <PageShell
      eyebrow="Live Dispatch"
      title="DELIVERY OPS"
      subtitle="Track riders, ETAs and active trips in real time."
      actions={
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <Bike className="size-4 text-gold" />
          <span className="text-xs font-mono-num">{RIDERS.filter((r) => r.status === "On Trip").length} on trip</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-strong rounded-2xl p-5">
          <p className="font-display text-xl tracking-wider mb-4">ACTIVE TRIPS</p>
          <div className="flex flex-col gap-3">
            {TRIPS.map((t) => (
              <motion.div key={t.id} whileHover={{ x: 2 }} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="size-9 rounded-lg bg-primary/15 grid place-items-center">
                      <Bike className="size-4 text-primary" />
                    </span>
                    <div>
                      <p className="font-mono-num text-sm font-bold">{t.id} · {t.customer}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3" /> {t.addr}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ETA</p>
                    <p className="font-mono-num text-lg gradient-text-gold">{t.eta}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.stage}%` }}
                    transition={{ duration: 1.2 }}
                    className="h-full bg-gradient-to-r from-primary to-gold"
                  />
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>Rider: <span className="text-foreground">{t.rider}</span></span>
                  <a href={`tel:${t.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="size-3" /> {t.phone}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <p className="font-display text-xl tracking-wider mb-4">RIDER ROSTER</p>
          <ul className="flex flex-col gap-3">
            {RIDERS.map((r) => (
              <li key={r.name} className="glass rounded-xl p-3 flex items-center gap-3">
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
    </PageShell>
  );
}
