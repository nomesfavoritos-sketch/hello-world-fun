import { Search, Bell, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, ROLE_LABELS, type AppUser } from "@/lib/users-store";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TopBar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (s: string) => void;
}) {
  const [me, setMe] = useState<AppUser | null>(null);
  const [greet, setGreet] = useState("WELCOME");

  useEffect(() => {
    setMe(getCurrentUser());
    setGreet(greeting());
  }, []);

  const firstName = me?.name?.split(" ")[0] ?? "GUEST";

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] sm:flex sm:items-center gap-3 sm:gap-4 lg:pl-0">
      <div className="col-start-2 min-w-0 sm:col-start-auto">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Point of Sale
        </p>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wider mt-1 truncate">
          {greet},{" "}
          <span className="gradient-text-red">{firstName.toUpperCase()}</span>
        </h1>
      </div>

      <div className="col-span-3 flex-1 flex items-center gap-2 sm:justify-end">
        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-72">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu…"
            className="w-full glass h-11 rounded-xl pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <button
          className="hidden sm:grid relative size-11 place-items-center rounded-xl glass hover:border-gold/30 transition-colors"
        >
          <Sparkles className="size-4 text-gold" />
        </button>

        <button
          className="relative size-11 grid place-items-center rounded-xl glass"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-primary pulse-glow" />
        </button>

        {me && (
          <div className="hidden md:flex items-center gap-3 pl-2 ml-1 border-l border-white/5">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{me.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                {ROLE_LABELS[me.role]}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/40 grid place-items-center font-semibold">
              {initials(me.name)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
