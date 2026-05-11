import { motion } from "framer-motion";
import { Plus, Flame } from "lucide-react";
import type { MenuItem } from "@/lib/menu-data";

const TAG_STYLES: Record<string, string> = {
  Bestseller: "bg-gold/15 text-gold border-gold/30",
  New: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  Hot: "bg-primary/20 text-primary border-primary/40",
  Deal: "bg-violet-400/15 text-violet-300 border-violet-400/30",
};

export function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAdd}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAdd();
        }
      }}
      className="group relative overflow-hidden rounded-2xl glass-strong hover:border-primary/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={768}
          height={768}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />

        {item.tag && (
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border backdrop-blur-md ${
              TAG_STYLES[item.tag]
            }`}
          >
            {item.tag === "Hot" && <Flame className="size-3 inline -mt-0.5 mr-1" />}
            {item.tag}
          </div>
        )}

        <motion.button
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="absolute bottom-3 right-3 size-11 rounded-full bg-primary text-primary-foreground grid place-items-center glow-red shadow-lg shadow-primary/25 opacity-100 transition-opacity"
          aria-label={`Add ${item.name}`}
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </motion.button>
      </div>

      <div className="p-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
          <p className="font-mono-num text-sm font-bold text-gold shrink-0">
            ${item.price.toFixed(2)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.desc}</p>
      </div>
    </div>
  );
}
