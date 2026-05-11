import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, Trash2, Shield, Check, X, Power } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";
import {
  addUser,
  deleteUser,
  getCurrentUser,
  getUsers,
  ROLE_LABELS,
  updateUser,
  type AppUser,
  type Role,
} from "@/lib/users-store";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users · BJ Pizza" }] }),
  component: UsersPage,
});

const ROLES: Role[] = ["admin", "manager", "pos", "kitchen", "rider"];

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-primary/15 text-primary",
  manager: "bg-gold/15 text-gold",
  pos: "bg-emerald-500/15 text-emerald-400",
  kitchen: "bg-amber-500/15 text-amber-400",
  rider: "bg-sky-500/15 text-sky-400",
};

function UsersPage() {
  const nav = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    pin: "",
    role: "pos" as Role,
    phone: "",
  });

  useEffect(() => {
    const me = getCurrentUser();
    if (!me) {
      nav({ to: "/login" });
      return;
    }
    if (me.role !== "admin") {
      nav({ to: "/dashboard" });
      return;
    }
    setUsers(getUsers());
  }, [nav]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = () => setUsers(getUsers());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || form.pin.length < 4) {
      return setToast("Fill all fields. PIN min 4 digits.");
    }
    try {
      addUser({ ...form, active: true });
      setForm({ name: "", username: "", pin: "", role: "pos", phone: "" });
      setOpen(false);
      refresh();
      setToast("User created");
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const toggle = (u: AppUser) => {
    updateUser(u.id, { active: !u.active });
    refresh();
  };

  const remove = (u: AppUser) => {
    if (u.username === "admin") return setToast("Cannot delete owner admin");
    if (!confirm(`Delete user ${u.name}?`)) return;
    deleteUser(u.id);
    refresh();
    setToast("User deleted");
  };

  const counts = ROLES.map((r) => ({
    role: r,
    n: users.filter((u) => u.role === r).length,
  }));

  return (
    <PageShell
      eyebrow="Access Control"
      title="USERS & ROLES"
      subtitle="Add staff, assign roles and control module access."
      actions={
        <button
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs uppercase tracking-widest hover:opacity-90 flex items-center gap-2"
        >
          <UserPlus className="size-3.5" /> Add user
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {counts.map((c) => (
          <div key={c.role} className="glass-strong rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {ROLE_LABELS[c.role]}
            </p>
            <p className="font-mono-num text-2xl font-bold mt-2">{c.n}</p>
          </div>
        ))}
      </div>

      <div className="glass-strong rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-4 text-primary" />
          <p className="font-display text-lg tracking-wider">TEAM ROSTER</p>
        </div>
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li key={u.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <span className="size-10 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-xs font-bold">
                {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm truncate">{u.name}</p>
                  {!u.active && (
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      disabled
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  @{u.username} {u.phone ? `· ${u.phone}` : ""}
                </p>
              </div>
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${ROLE_COLORS[u.role]}`}
              >
                {ROLE_LABELS[u.role]}
              </span>
              <button
                onClick={() => toggle(u)}
                className="size-8 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground"
                title={u.active ? "Disable" : "Enable"}
              >
                <Power className="size-4" />
              </button>
              <button
                onClick={() => remove(u)}
                className="size-8 grid place-items-center rounded-lg hover:bg-primary/10 text-primary"
                title="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={submit}
              className="glass-strong rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="font-display text-xl tracking-wider">NEW USER</p>
                <button type="button" onClick={() => setOpen(false)}>
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/5"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/5"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
                <input
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/5 font-mono-num"
                  placeholder="PIN (min 4 digits)"
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                />
                <input
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/5"
                  placeholder="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <select
                  className="glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/5"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full mt-5 bg-primary text-primary-foreground rounded-xl py-3 text-sm uppercase tracking-widest"
              >
                Create user
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong border border-emerald-400/30 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-center gap-2"
          >
            <Check className="size-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
