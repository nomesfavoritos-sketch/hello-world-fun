import { motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Pizza,
  Bike,
  ChefHat,
  BarChart3,
  Settings,
  Flame,
  Utensils,
  Users,
  LogOut,
} from "lucide-react";
import {
  getCurrentUser,
  logout,
  ROLE_LABELS,
  ROLE_NAV,
  type AppUser,
} from "@/lib/users-store";
import { useLogo, getSettings } from "@/lib/settings-store";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" as const },
  { icon: ShoppingBag, label: "POS", to: "/" as const },
  { icon: Utensils, label: "Tables", to: "/tables" as const },
  { icon: Pizza, label: "Menu", to: "/menu" as const },
  { icon: ChefHat, label: "Kitchen", to: "/kitchen" as const },
  { icon: Bike, label: "Delivery", to: "/delivery" as const },
  { icon: BarChart3, label: "Reports", to: "/reports" as const },
  { icon: Users, label: "Users", to: "/users" as const },
  { icon: Settings, label: "Settings", to: "/settings" as const },
];

export function Sidebar() {
  const [me, setMe] = useState<AppUser | null>(null);
  const nav = useNavigate();
  const logo = useLogo();
  const shopName = getSettings().shopName;

  useEffect(() => {
    setMe(getCurrentUser());
  }, []);

  const allowed = me ? ROLE_NAV[me.role] : [];
  const items = NAV.filter((i) => allowed.includes(i.to));

  const onLogout = () => {
    logout();
    nav({ to: "/login" });
  };

  return (
    <aside className="hidden lg:flex flex-col w-20 xl:w-64 shrink-0 glass-strong rounded-2xl p-4 gap-2 h-[calc(100vh-2rem)] sticky top-4">
      <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="relative">
          <div className="size-10 rounded-xl bg-primary grid place-items-center glow-red overflow-hidden">
            {logo ? (
              <img src={logo} alt={shopName} className="size-full object-contain" />
            ) : (
              <Flame className="size-5 text-primary-foreground" />
            )}
          </div>
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-gold pulse-glow" />
        </div>
        <div className="hidden xl:block">
          <p className="font-display text-xl leading-none tracking-wider">{shopName}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Restaurant OS
          </p>
        </div>
      </Link>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            activeOptions={{ exact: true }}
            className="group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-white/[0.03] data-[status=active]:bg-primary/15 data-[status=active]:text-foreground"
          >
            {({ isActive }) => (
              <motion.span
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 w-full"
              >
                {isActive && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                  />
                )}
                <item.icon className="size-5 shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
                {isActive && (
                  <span className="hidden xl:inline ml-auto text-[10px] font-mono-num text-primary">
                    LIVE
                  </span>
                )}
              </motion.span>
            )}
          </Link>
        ))}
      </nav>

      {me && (
        <div className="hidden xl:block glass rounded-xl p-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-[10px] font-bold">
              {me.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{me.name}</p>
              <p className="text-[10px] text-primary uppercase tracking-widest">
                {ROLE_LABELS[me.role]}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="size-7 grid place-items-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      )}
      {me && (
        <button
          onClick={onLogout}
          className="xl:hidden size-10 mx-auto grid place-items-center rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary"
          title="Logout"
        >
          <LogOut className="size-5" />
        </button>
      )}
    </aside>
  );
}
