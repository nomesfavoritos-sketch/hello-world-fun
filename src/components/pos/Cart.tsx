import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, Sparkles, CreditCard, Printer, Utensils, X } from "lucide-react";
import { printThermalReceipt } from "@/lib/print-receipt";
import { recordSale } from "@/lib/sales-store";
import { useCurrency } from "@/lib/settings-store";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/menu-data";

export type CartLine = { item: MenuItem; qty: number };

export type OpenTable = {
  tableNo: string;
  orderNo: string;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  total: number;
  openedAt: number;
};

const TABLES_KEY = "bj_open_tables";

export function Cart({
  lines,
  onInc,
  onDec,
  onRemove,
  onClear,
}: {
  lines: CartLine[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const sym = useCurrency();
  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const [orderNo, setOrderNo] = useState("0000");
  const [orderType, setOrderType] = useState<"Dine-in" | "Takeaway" | "Delivery">("Dine-in");
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableNo, setTableNo] = useState("");
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setOrderNo((Math.floor(Date.now() / 1000) % 10000).toString().padStart(4, "0"));
    const at = localStorage.getItem("bj_active_table");
    if (at) {
      setActiveTable(at);
      setOrderType("Dine-in");
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const printNow = () => {
    if (!lines.length) return;
    printThermalReceipt({ orderNo, lines, subtotal, tax, total, orderType });
    recordSale({ orderNo, type: orderType, lines, subtotal, tax, total });
  };

  const handleCharge = () => {
    if (!lines.length) return;
    if (orderType === "Dine-in") {
      if (activeTable) {
        saveTableOrder(activeTable);
      } else {
        setShowTableModal(true);
      }
    } else {
      printNow();
      onClear();
    }
  };

  const saveTableOrder = (forcedTable?: string) => {
    const target = (forcedTable ?? tableNo).trim();
    if (!target) return;
    const existing: OpenTable[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(TABLES_KEY) || "[]");
      } catch {
        return [];
      }
    })();
    const idx = existing.findIndex((t) => t.tableNo === target);
    if (idx >= 0) {
      const merged = [...existing[idx].lines];
      lines.forEach((l) => {
        const m = merged.find((x) => x.item.id === l.item.id);
        if (m) m.qty += l.qty;
        else merged.push({ ...l });
      });
      const sub = merged.reduce((s, l) => s + l.item.price * l.qty, 0);
      const tx = sub * 0.05;
      existing[idx] = {
        ...existing[idx],
        lines: merged,
        subtotal: sub,
        tax: tx,
        total: sub + tx,
      };
    } else {
      existing.unshift({
        tableNo: target,
        orderNo,
        lines,
        subtotal,
        tax,
        total,
        openedAt: Date.now(),
      });
    }
    localStorage.setItem(TABLES_KEY, JSON.stringify(existing));
    localStorage.removeItem("bj_active_table");
    setActiveTable(null);
    setShowTableModal(false);
    setTableNo("");
    onClear();
    setToast(idx >= 0 ? `Items added to Table ${target}` : `Order sent to Table ${target}`);
  };

  return (
    <aside className="w-full lg:w-[400px] xl:w-[440px] shrink-0 glass-strong rounded-2xl flex flex-col h-[calc(100vh-2rem)] sticky top-4 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/15 grid place-items-center">
              <ShoppingBag className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-xl tracking-wider leading-none">CURRENT ORDER</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono-num">
              #BJ-{orderNo} · {count} items
              </p>
            </div>
          </div>
          {lines.length > 0 && (
            <button
              onClick={onClear}
              className="text-muted-foreground hover:text-primary transition-colors p-2"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        {/* Order type pills */}
        <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 bg-black/30 rounded-xl">
          {(["Dine-in", "Takeaway", "Delivery"] as const).map((t) => {
            const active = orderType === t;
            return (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`relative py-2 text-xs font-medium rounded-lg transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="order-type"
                    className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
                  />
                )}
                <span className="relative">{t}</span>
              </button>
            );
          })}
        </div>

        {activeTable && (
          <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30">
            <div className="flex items-center gap-2 text-xs">
              <Utensils className="size-3.5 text-gold" />
              <span className="text-gold font-display tracking-wider">ADDING TO TABLE {activeTable}</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("bj_active_table");
                setActiveTable(null);
              }}
              className="text-muted-foreground hover:text-foreground"
              title="Cancel — start a new order"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto scrollbar-luxe p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {lines.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full grid place-items-center text-center px-6 py-20"
            >
              <div>
                <div className="size-16 rounded-2xl glass mx-auto grid place-items-center mb-4">
                  <Sparkles className="size-7 text-gold" />
                </div>
                <p className="font-display text-lg tracking-wider">START AN ORDER</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-[220px]">
                  Tap any menu item to add it to the order. AI suggestions update live.
                </p>
              </div>
            </motion.div>
          ) : (
            lines.map((line) => (
              <motion.div
                key={line.item.id}
                layout
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex items-center gap-3 p-2.5 rounded-xl glass hover:border-primary/20 transition-colors"
              >
                <img
                  src={line.item.image}
                  alt=""
                  loading="lazy"
                  className="size-14 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{line.item.name}</p>
                  <p className="text-xs text-gold font-mono-num mt-0.5">
                    {sym} {(line.item.price * line.qty).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
                  <button
                    onClick={() => onDec(line.item.id)}
                    className="size-7 grid place-items-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-mono-num font-semibold">
                    {line.qty}
                  </span>
                  <button
                    onClick={() => onInc(line.item.id)}
                    className="size-7 grid place-items-center rounded-md hover:bg-primary/20 text-primary"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(line.item.id)}
                  className="text-muted-foreground/50 hover:text-primary transition-colors p-1"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <div className="border-t border-white/5 p-5 space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono-num">{sym} {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT (5%)</span>
            <span className="font-mono-num">{sym} {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-end pt-3 border-t border-white/5">
            <span className="font-display tracking-wider text-base">TOTAL</span>
            <span className="font-mono-num font-bold text-2xl gradient-text-gold">
              {sym} {total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={printNow}
            disabled={lines.length === 0}
            title="Print thermal receipt (80mm)"
            className="h-14 px-4 rounded-xl glass-strong border border-white/10 hover:border-gold/40 text-foreground flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Printer className="size-5 text-gold" />
            <span className="font-display tracking-widest text-xs hidden sm:inline">PRINT</span>
          </button>
          <motion.button
            whileHover={{ scale: lines.length ? 1.01 : 1 }}
            whileTap={{ scale: lines.length ? 0.99 : 1 }}
            disabled={lines.length === 0}
            onClick={handleCharge}
            className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-red disabled:opacity-40 disabled:glow-red-none disabled:cursor-not-allowed transition-opacity"
          >
            {orderType === "Dine-in" ? <Utensils className="size-5" /> : <CreditCard className="size-5" />}
            <span className="font-display tracking-widest text-lg">
              {orderType === "Dine-in" ? (activeTable ? `ADD TO TABLE ${activeTable}` : `SEND TO TABLE`) : `CHARGE ${sym} ${total.toFixed(2)}`}
            </span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showTableModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 grid place-items-center p-4"
            onClick={() => setShowTableModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 w-full max-w-sm border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Utensils className="size-5 text-primary" />
                  <p className="font-display tracking-wider text-lg">ASSIGN TABLE</p>
                </div>
                <button onClick={() => setShowTableModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Order will be sent to kitchen. Bill will print when table is closed.
              </p>
              <input
                autoFocus
                value={tableNo}
                onChange={(e) => setTableNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveTableOrder()}
                placeholder="Table number e.g. 5"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-base focus:border-primary/40 focus:outline-none"
              />
              <div className="grid grid-cols-6 gap-1.5 mt-3">
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map((n) => (
                  <button
                    key={n}
                    onClick={() => setTableNo(n)}
                    className={`py-2 rounded-md text-sm font-mono-num border ${
                      tableNo === n ? "border-primary bg-primary/15 text-primary" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                disabled={!tableNo.trim()}
                onClick={() => saveTableOrder()}
                className="mt-4 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold glow-red disabled:opacity-40 disabled:glow-red-none"
              >
                Send to Table
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong border border-emerald-400/30 rounded-xl px-4 py-3 text-sm text-emerald-300"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
