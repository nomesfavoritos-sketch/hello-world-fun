import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Utensils, Printer, X, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/pos/PageShell";
import { printThermalReceipt } from "@/lib/print-receipt";
import type { OpenTable } from "@/components/pos/Cart";

export const Route = createFileRoute("/tables")({
  head: () => ({ meta: [{ title: "Tables · BJ Pizza" }] }),
  component: TablesPage,
});

const TABLES_KEY = "bj_open_tables";

function loadTables(): OpenTable[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TABLES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTables(t: OpenTable[]) {
  localStorage.setItem(TABLES_KEY, JSON.stringify(t));
}

function TablesPage() {
  const [tables, setTables] = useState<OpenTable[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setTables(loadTables());
    const t = setInterval(() => setNow(Date.now()), 30000);
    const onStorage = () => setTables(loadTables());
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const closeAndPrint = (tableNo: string) => {
    const t = tables.find((x) => x.tableNo === tableNo);
    if (!t) return;
    printThermalReceipt({
      orderNo: t.orderNo,
      lines: t.lines,
      subtotal: t.subtotal,
      tax: t.tax,
      total: t.total,
      orderType: `Dine-in · Table ${t.tableNo}`,
    });
    const next = tables.filter((x) => x.tableNo !== tableNo);
    setTables(next);
    saveTables(next);
  };

  const cancelTable = (tableNo: string) => {
    if (!confirm(`Cancel order for Table ${tableNo}?`)) return;
    const next = tables.filter((x) => x.tableNo !== tableNo);
    setTables(next);
    saveTables(next);
  };

  return (
    <PageShell
      eyebrow="Floor Plan"
      title="OPEN TABLES"
      subtitle="Active dine-in orders. Print bill to close a table."
      actions={
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <Utensils className="size-4 text-gold" />
          <span className="text-xs font-mono-num">{tables.length} open</span>
        </div>
      }
    >
      {tables.length === 0 ? (
        <div className="glass-strong rounded-2xl p-16 text-center">
          <div className="size-16 rounded-2xl glass mx-auto grid place-items-center mb-4">
            <Utensils className="size-7 text-gold" />
          </div>
          <p className="font-display text-lg tracking-wider">NO OPEN TABLES</p>
          <p className="text-sm text-muted-foreground mt-2">
            Take a Dine-in order from POS and assign a table — it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {tables.map((t) => {
              const mins = Math.floor((now - t.openedAt) / 60000);
              return (
                <motion.div
                  key={t.tableNo}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-strong rounded-2xl p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-primary/20 grid place-items-center">
                        <span className="font-display text-xl text-primary">{t.tableNo}</span>
                      </div>
                      <div>
                        <p className="font-display tracking-wider text-base">TABLE {t.tableNo}</p>
                        <p className="text-[10px] text-muted-foreground font-mono-num mt-0.5">
                          #BJ-{t.orderNo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {mins}m
                    </div>
                  </div>

                  <div className="mt-4 flex-1 space-y-1.5 max-h-48 overflow-y-auto scrollbar-luxe pr-1">
                    {t.lines.map((l) => (
                      <div key={l.item.id} className="flex justify-between text-xs">
                        <span className="truncate">
                          <span className="text-gold font-mono-num">{l.qty}×</span> {l.item.name}
                        </span>
                        <span className="font-mono-num text-muted-foreground">
                          ${(l.item.price * l.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 mt-4 pt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono-num">${t.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT (5%)</span>
                      <span className="font-mono-num">${t.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end pt-1">
                      <span className="font-display tracking-wider">TOTAL</span>
                      <span className="font-mono-num text-xl gradient-text-gold font-bold">
                        ${t.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => cancelTable(t.tableNo)}
                      className="h-11 px-3 rounded-xl glass border border-white/10 hover:border-red-500/40 text-muted-foreground hover:text-red-300 text-xs"
                    >
                      <X className="size-4" />
                    </button>
                    <button
                      onClick={() => closeAndPrint(t.tableNo)}
                      className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-red"
                    >
                      <Printer className="size-4" />
                      <span className="font-display tracking-widest text-sm">PRINT BILL & CLOSE</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageShell>
  );
}
