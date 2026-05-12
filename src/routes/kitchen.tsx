import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, Flame } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";
import { recordKitchenAction } from "@/lib/kitchen-store";

export const Route = createFileRoute("/kitchen")({
  head: () => ({ meta: [{ title: "Kitchen Display · BJ Pizza" }] }),
  component: KitchenPage,
});

type Status = "queued" | "cooking" | "ready";
type Ticket = {
  id: string;
  table: string;
  items: { name: string; qty: number }[];
  minutes: number;
  status: Status;
};

const SEED: Ticket[] = [
  { id: "#1284", table: "Table 4", items: [{ name: "Pepperoni Inferno", qty: 1 }, { name: "Cola Glacé", qty: 2 }], minutes: 2, status: "queued" },
  { id: "#1285", table: "Takeaway", items: [{ name: "Wagyu Smash", qty: 2 }, { name: "Truffle Fries", qty: 1 }], minutes: 4, status: "queued" },
  { id: "#1283", table: "Table 7", items: [{ name: "Margherita Royale", qty: 1 }, { name: "Buffalo Wings", qty: 1 }], minutes: 6, status: "cooking" },
  { id: "#1282", table: "Delivery", items: [{ name: "BBQ Smokehouse", qty: 1 }, { name: "Alfredo Bianco", qty: 1 }], minutes: 9, status: "cooking" },
  { id: "#1281", table: "Table 2", items: [{ name: "Chicken Shawarma", qty: 3 }], minutes: 11, status: "ready" },
];

const COLUMNS: { id: Status; label: string; icon: typeof Clock; accent: string }[] = [
  { id: "queued", label: "Queued", icon: Clock, accent: "text-muted-foreground" },
  { id: "cooking", label: "Cooking", icon: Flame, accent: "text-primary" },
  { id: "ready", label: "Ready", icon: CheckCircle2, accent: "text-emerald-400" },
];

function KitchenPage() {
  const [tickets, setTickets] = useState<Ticket[]>(SEED);

  const advance = (id: string) => {
    setTickets((p) =>
      p.map((t) => {
        if (t.id !== id) return t;
        const next: Status = t.status === "queued" ? "cooking" : "ready";
        recordKitchenAction(id, next === "cooking" ? "start" : "ready");
        return { ...t, status: next };
      }),
    );
  };

  const clear = (id: string) => {
    recordKitchenAction(id, "bump");
    setTickets((p) => p.filter((t) => t.id !== id));
  };

  return (
    <PageShell
      eyebrow="Live Stations"
      title="KITCHEN DISPLAY"
      subtitle="Bump tickets through queue, cooking and ready lanes."
      actions={
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <ChefHat className="size-4 text-gold" />
          <span className="text-xs font-mono-num">{tickets.length} active</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const list = tickets.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="glass-strong rounded-2xl p-4 flex flex-col gap-3 min-h-[60vh]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <col.icon className={`size-4 ${col.accent}`} />
                  <p className="text-[10px] uppercase tracking-[0.3em]">{col.label}</p>
                </div>
                <span className="text-xs font-mono-num text-muted-foreground">{list.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {list.map((t) => (
                  <motion.div
                    layout
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono-num text-sm font-bold">{t.id}</p>
                      <span className="text-[10px] text-muted-foreground">{t.table}</span>
                    </div>
                    <ul className="text-xs mt-2 space-y-1">
                      {t.items.map((i) => (
                        <li key={i.name} className="flex justify-between">
                          <span className="text-muted-foreground">{i.qty}× {i.name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-mono-num text-gold">{t.minutes}m</span>
                      {t.status !== "ready" ? (
                        <button
                          onClick={() => advance(t.id)}
                          className="text-[10px] uppercase tracking-widest bg-primary/15 hover:bg-primary/25 text-primary px-2 py-1 rounded-md"
                        >
                          {t.status === "queued" ? "Start" : "Mark Ready"}
                        </button>
                      ) : (
                        <button
                          onClick={() => clear(t.id)}
                          className="text-[10px] uppercase tracking-widest bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-2 py-1 rounded-md"
                        >
                          Bump
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {list.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8 border border-dashed border-white/10 rounded-xl">
                    No tickets
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
