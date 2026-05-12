import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/pos/Sidebar";
import { TopBar } from "@/components/pos/TopBar";
import { CategoryRail } from "@/components/pos/CategoryRail";
import { MenuCard } from "@/components/pos/MenuCard";
import { Cart, type CartLine } from "@/components/pos/Cart";
import { MENU, type Category, type MenuItem } from "@/lib/menu-data";
import { getSales } from "@/lib/sales-store";
import { getOnlineOrders, onOnlineOrdersChange } from "@/lib/online-orders-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BJ Pizza · Restaurant POS" },
      {
        name: "description",
        content:
          "Ultra-premium AI-powered POS for BJ Pizza Restaurant — luxury menu, live cart, instant checkout.",
      },
      { property: "og:title", content: "BJ Pizza · Restaurant POS" },
      {
        property: "og:description",
        content: "Luxury restaurant operating system. Cinematic POS, menu and cart.",
      },
    ],
  }),
  component: POSPage,
});

function POSPage() {
  const [cat, setCat] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);

  const filtered = useMemo(() => {
    return MENU.filter((m) => (cat === "All" ? true : m.category === cat)).filter(
      (m) =>
        !query.trim() ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.desc.toLowerCase().includes(query.toLowerCase()),
    );
  }, [cat, query]);

  const addItem = (item: MenuItem) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing)
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l,
        );
      return [...prev, { item, qty: 1 }];
    });
  };
  const inc = (id: string) =>
    setLines((p) => p.map((l) => (l.item.id === id ? { ...l, qty: l.qty + 1 } : l)));
  const dec = (id: string) =>
    setLines((p) =>
      p
        .map((l) => (l.item.id === id ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    );
  const remove = (id: string) => setLines((p) => p.filter((l) => l.item.id !== id));
  const clear = () => setLines([]);

  return (
    <div className="min-h-screen p-4">
      <div className="flex gap-4 max-w-[1800px] mx-auto">
        <Sidebar />

        <main className="flex-1 min-w-0 flex flex-col gap-5">
          <TopBar query={query} setQuery={setQuery} />

          {/* Stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Today's Revenue", value: "$4,892", trend: "+12.4%", accent: "gold" },
              { label: "Orders", value: "127", trend: "+8 live", accent: "red" },
              { label: "Avg Ticket", value: "$38.50", trend: "+$2.10" },
              { label: "Kitchen Queue", value: "6", trend: "~4 min", live: true },
            ].map((s) => (
              <motion.div
                key={s.label}
                whileHover={{ y: -2 }}
                className="glass-strong rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </p>
                  {s.live && (
                    <span className="size-2 rounded-full bg-primary pulse-glow" />
                  )}
                </div>
                <p
                  className={`font-mono-num text-2xl font-bold mt-2 ${
                    s.accent === "gold"
                      ? "gradient-text-gold"
                      : s.accent === "red"
                        ? "gradient-text-red"
                        : ""
                  }`}
                >
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.trend}</p>
              </motion.div>
            ))}
          </div>

          <CategoryRail active={cat} onChange={setCat} />

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} onAdd={() => addItem(item)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full glass rounded-2xl p-12 text-center text-muted-foreground">
                No items match your search.
              </div>
            )}
          </div>
        </main>

        <Cart lines={lines} onInc={inc} onDec={dec} onRemove={remove} onClear={clear} />
      </div>
    </div>
  );
}
