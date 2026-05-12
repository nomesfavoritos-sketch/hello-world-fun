import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, ShoppingBag, Trash2, X, CheckCircle2, Bike, Store, Utensils, Flame } from "lucide-react";
import { MENU, CATEGORIES, type Category, type MenuItem } from "@/lib/menu-data";
import { getSettings, useCurrency, useLogo } from "@/lib/settings-store";
import { placeOnlineOrder, type OnlineOrderType } from "@/lib/online-orders-store";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Order Online · BJ Pizza" },
      { name: "description", content: "Order online for delivery, pickup, or dine-in. Browse our menu and check out in seconds." },
    ],
  }),
  component: OnlineOrderPage,
});

type Line = { item: MenuItem; qty: number };

function OnlineOrderPage() {
  const sym = useCurrency();
  const logo = useLogo();
  const settings = getSettings();

  const [cat, setCat] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [type, setType] = useState<OnlineOrderType>("Delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(
    () =>
      MENU.filter((m) => (cat === "All" ? true : m.category === cat)).filter(
        (m) =>
          !query.trim() ||
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.desc.toLowerCase().includes(query.toLowerCase()),
      ),
    [cat, query],
  );

  const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const tax = subtotal * ((settings.vatPct ?? 5) / 100);
  const total = subtotal + tax;
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const add = (item: MenuItem) =>
    setLines((prev) => {
      const ex = prev.find((l) => l.item.id === item.id);
      if (ex) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { item, qty: 1 }];
    });
  const inc = (id: string) => setLines((p) => p.map((l) => (l.item.id === id ? { ...l, qty: l.qty + 1 } : l)));
  const dec = (id: string) =>
    setLines((p) => p.map((l) => (l.item.id === id ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0));
  const remove = (id: string) => setLines((p) => p.filter((l) => l.item.id !== id));

  const canSubmit =
    lines.length > 0 &&
    name.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    (type !== "Delivery" || address.trim().length >= 5);

  const submit = () => {
    if (!canSubmit) return;
    const order = placeOnlineOrder({
      customer: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      type,
      notes: notes.trim() || undefined,
      lines,
      vatPct: settings.vatPct,
    });
    setSuccess(order.id);
    setLines([]);
    setShowCheckout(false);
    setName("");
    setAddress("");
    setNotes("");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary grid place-items-center glow-red overflow-hidden">
            {logo ? <img src={logo} alt={settings.shopName} className="size-full object-contain" /> : <Flame className="size-5 text-primary-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg leading-none tracking-wider truncate">{settings.shopName}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Order Online</p>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={lines.length === 0}
            className="relative flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-3 sm:px-4 py-2 text-sm font-semibold glow-red disabled:opacity-50 disabled:glow-red-none"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="font-mono-num text-xs bg-black/30 rounded-md px-1.5 py-0.5">{count}</span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Hero */}
        <div className="glass-strong rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Order Online</p>
            <h1 className="font-display text-3xl sm:text-4xl tracking-wider mt-1">{settings.shopName}</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">{settings.shopTagline}</p>
            <p className="text-xs text-muted-foreground mt-1">📍 {settings.shopAddress}</p>
            <p className="text-xs text-muted-foreground">📞 {settings.shopPhone}</p>
          </div>
          <div className="flex gap-2">
            {([
              { v: "Delivery", icon: Bike },
              { v: "Pickup", icon: Store },
              { v: "Dine-in", icon: Utensils },
            ] as const).map(({ v, icon: I }) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-colors ${
                  type === v ? "border-primary bg-primary/15 text-primary" : "border-white/10 hover:border-white/20 text-muted-foreground"
                }`}
              >
                <I className="size-5" />
                <span className="text-[10px] uppercase tracking-widest">{v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search + categories */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-luxe pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-display tracking-widest border ${
                  cat === c.id ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-32">
          {filtered.map((item) => {
            const inCart = lines.find((l) => l.item.id === item.id);
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                className="glass-strong rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-black/30">
                  <img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover" />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 flex-1">{item.desc}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="font-mono-num text-sm gradient-text-gold">
                      {sym} {item.price.toFixed(2)}
                    </span>
                    {inCart ? (
                      <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5">
                        <button onClick={() => dec(item.id)} className="size-7 grid place-items-center rounded-md hover:bg-white/5">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-mono-num font-semibold">{inCart.qty}</span>
                        <button onClick={() => inc(item.id)} className="size-7 grid place-items-center rounded-md hover:bg-primary/20 text-primary">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => add(item)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 flex items-center gap-1"
                      >
                        <Plus className="size-3.5" /> Add
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full glass rounded-2xl p-12 text-center text-muted-foreground text-sm">
              No items match your search.
            </div>
          )}
        </div>
      </main>

      {/* Floating cart bar */}
      {lines.length > 0 && !showCheckout && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 z-30 max-w-2xl mx-auto"
        >
          <button
            onClick={() => setShowCheckout(true)}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-between px-5 glow-red"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-5" />
              <span className="font-display tracking-widest">{count} ITEMS · CHECKOUT</span>
            </span>
            <span className="font-mono-num">
              {sym} {total.toFixed(2)}
            </span>
          </button>
        </motion.div>
      )}

      {/* Checkout modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-display text-2xl tracking-wider">CHECKOUT</p>
                <button onClick={() => setShowCheckout(false)} className="text-muted-foreground hover:text-foreground p-2">
                  <X className="size-5" />
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="glass-strong rounded-2xl p-10 text-center text-muted-foreground">Your cart is empty.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Lines */}
                  <div className="glass-strong rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Items</p>
                    <div className="flex flex-col gap-2">
                      {lines.map((l) => (
                        <div key={l.item.id} className="flex items-center gap-3 glass rounded-xl p-2.5">
                          <img src={l.item.image} alt="" className="size-12 rounded-lg object-cover" loading="lazy" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{l.item.name}</p>
                            <p className="text-xs text-gold font-mono-num">
                              {sym} {(l.item.price * l.qty).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
                            <button onClick={() => dec(l.item.id)} className="size-7 grid place-items-center rounded-md hover:bg-white/5">
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-mono-num font-semibold">{l.qty}</span>
                            <button onClick={() => inc(l.item.id)} className="size-7 grid place-items-center rounded-md hover:bg-primary/20 text-primary">
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <button onClick={() => remove(l.item.id)} className="text-muted-foreground hover:text-primary p-1">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order type */}
                  <div className="glass-strong rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Order Type</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Delivery", "Pickup", "Dine-in"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setType(v)}
                          className={`py-2.5 rounded-lg text-xs font-display tracking-widest border ${
                            type === v ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {v.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="glass-strong rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your Details</p>
                    <Input label="Full Name" value={name} onChange={setName} placeholder="e.g. Ahmed Khan" />
                    <Input label="Phone Number" value={phone} onChange={setPhone} placeholder="03xx-xxxxxxx" />
                    {type === "Delivery" && (
                      <Input label="Delivery Address" value={address} onChange={setAddress} placeholder="House #, street, area" textarea />
                    )}
                    <Input label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Spice level, allergies, etc." textarea />
                  </div>

                  {/* Totals */}
                  <div className="glass-strong rounded-2xl p-4 space-y-1.5 text-sm">
                    <Row label="Subtotal" value={`${sym} ${subtotal.toFixed(2)}`} muted />
                    <Row label={`VAT (${settings.vatPct}%)`} value={`${sym} ${tax.toFixed(2)}`} muted />
                    <div className="border-t border-white/5 pt-2 flex justify-between items-end">
                      <span className="font-display tracking-wider text-base">TOTAL</span>
                      <span className="font-mono-num font-bold text-2xl gradient-text-gold">
                        {sym} {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={!canSubmit}
                    onClick={submit}
                    className="h-14 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-red disabled:opacity-40 disabled:glow-red-none"
                  >
                    <span className="font-display tracking-widest">PLACE ORDER · {sym} {total.toFixed(2)}</span>
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Cash on {type === "Delivery" ? "Delivery" : type === "Pickup" ? "Pickup" : "Dine-in"}. We'll call you to confirm.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 grid place-items-center p-4"
            onClick={() => setSuccess(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-strong rounded-2xl p-8 max-w-sm text-center border border-emerald-400/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="size-16 rounded-2xl bg-emerald-500/15 grid place-items-center mx-auto mb-4">
                <CheckCircle2 className="size-8 text-emerald-400" />
              </div>
              <p className="font-display text-2xl tracking-wider">ORDER PLACED</p>
              <p className="text-xs text-muted-foreground mt-2">Order ID</p>
              <p className="font-mono-num text-lg gradient-text-gold mt-1">#{success}</p>
              <p className="text-sm text-muted-foreground mt-4">
                We've received your order. Our team will call you to confirm.
              </p>
              <button
                onClick={() => setSuccess(null)}
                className="mt-6 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold glow-red"
              >
                Continue Browsing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none"
        />
      )}
    </label>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span className="font-mono-num">{value}</span>
    </div>
  );
}
