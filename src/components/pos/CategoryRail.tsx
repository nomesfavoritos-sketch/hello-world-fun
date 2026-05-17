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
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`relative shrink-0 flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground glow-red"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="relative flex items-center gap-2">
              <Icon className="size-4" />
              {c.id}
            </span>
          </button>
        );
      })}
    </div>
  );
}
