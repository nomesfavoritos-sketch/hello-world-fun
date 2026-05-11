import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Pizza,
  Bike,
  ChefHat,
  BarChart3,
  Settings,
  Flame,
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: ShoppingBag, label: "POS", to: "/" },
  { icon: Pizza, label: "Menu", to: "/menu" },
  { icon: ChefHat, label: "Kitchen", to: "/kitchen" },
  { icon: Bike, label: "Delivery", to: "/delivery" },
  { icon: BarChart3, label: "Reports", to: "/reports" },
  { icon: Settings, label: "Settings", to: "/settings" },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-20 xl:w-64 shrink-0 glass-strong rounded-2xl p-4 gap-2 h-[calc(100vh-2rem)] sticky top-4">
      <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="relative">
          <div className="size-10 rounded-xl bg-primary grid place-items-center glow-red">
            <Flame className="size-5 text-primary-foreground" />
          </div>
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-gold pulse-glow" />
        </div>
        <div className="hidden xl:block">
          <p className="font-display text-xl leading-none tracking-wider">BJ PIZZA</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Restaurant OS
          </p>
        </div>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map((item) => (
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

      <div className="hidden xl:block glass rounded-xl p-3 mt-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Branch
        </p>
        <p className="text-sm font-medium mt-1">Downtown · DXB</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-muted-foreground">Online · 12 staff</span>
        </div>
      </div>
    </aside>
  );
}
