import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, KeyRound, User as UserIcon } from "lucide-react";
import { login, ROLE_HOME } from "@/lib/users-store";
import { useLogo, getSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · BJ Pizza" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const logo = useLogo();
  const shopName = getSettings().shopName;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const u = login(username.trim(), pin.trim());
    if (!u) return setErr("Invalid username or PIN");
    nav({ to: ROLE_HOME[u.role] });
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="glass-strong rounded-3xl p-8 w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-primary grid place-items-center glow-red">
            <Flame className="size-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-2xl tracking-wider">BJ PIZZA</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Restaurant OS · Sign in
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Username
          </span>
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-white/5 focus-within:border-primary/50">
            <UserIcon className="size-4 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5 mb-4">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            PIN
          </span>
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-white/5 focus-within:border-primary/50">
            <KeyRound className="size-4 text-muted-foreground" />
            <input
              type="password"
              inputMode="numeric"
              className="flex-1 bg-transparent outline-none text-sm font-mono-num tracking-widest"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>
        </label>

        {err && (
          <p className="text-xs text-primary mb-3 text-center">{err}</p>
        )}

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm uppercase tracking-widest font-medium hover:opacity-90"
        >
          Sign in
        </button>

        <p className="text-[10px] text-center text-muted-foreground mt-5">
          Default admin · <span className="font-mono-num">admin / 1234</span>
        </p>
      </motion.form>
    </div>
  );
}
