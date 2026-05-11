import { motion } from "framer-motion";
import {
  Sparkles,
  Pizza,
  Beef,
  UtensilsCrossed,
  Drumstick,
  Soup,
  CupSoda,
  Sandwich,
} from "lucide-react";
import type { Category } from "@/lib/menu-data";
import { CATEGORIES } from "@/lib/menu-data";

const ICONS = {
  Sparkles,
  Pizza,
  Beef,
  UtensilsCrossed,
  Wrap: Sandwich,
  Drumstick,
  Soup,
  CupSoda,
} as const;

export function CategoryRail({
  active,
  onChange,
}: {
  active: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-luxe pb-2 -mx-1 px-1">
      {CATEGORIES.map((c) => {
        const Icon = ICONS[c.icon as keyof typeof ICONS] ?? Sparkles;
        const isActive = active === c.id;
        return (
          <motion.button
            key={c.id}
            onClick={() => onChange(c.id)}
            whileTap={{ scale: 0.95 }}
            className={`relative shrink-0 flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "text-primary-foreground"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="cat-bg"
                className="absolute inset-0 rounded-xl bg-primary glow-red"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="size-4" />
              {c.id}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
