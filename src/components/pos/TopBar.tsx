import { Search, Bell, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function TopBar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (s: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Point of Sale
        </p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider mt-1">
          GOOD EVENING, <span className="gradient-text-red">CHEF</span>
        </h1>
      </div>

      <div className="flex-1 flex items-center gap-2 sm:justify-end">
        <div className="relative flex-1 sm:flex-none sm:w-72">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu, SKU, deal…"
            className="w-full glass h-11 rounded-xl pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative size-11 grid place-items-center rounded-xl glass hover:border-gold/30 transition-colors"
        >
          <Sparkles className="size-4 text-gold" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative size-11 grid place-items-center rounded-xl glass"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-primary pulse-glow" />
        </motion.button>

        <div className="hidden sm:flex items-center gap-3 pl-2 ml-1 border-l border-white/5">
          <div className="text-right">
            <p className="text-sm font-medium leading-none">Joseph K.</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
              Cashier · Shift 2
            </p>
          </div>
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/40 grid place-items-center font-semibold">
            JK
          </div>
        </div>
      </div>
    </div>
  );
}
