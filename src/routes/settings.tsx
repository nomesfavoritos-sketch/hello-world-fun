import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Receipt, Printer, Users, Bell, Globe, Check, Database, Trash2 } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";
import { DEFAULT_SETTINGS, getSettings, saveSettings, type ShopSettings } from "@/lib/settings-store";
import { clearSales, getSales } from "@/lib/sales-store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · BJ Pizza" }] }),
  component: SettingsPage,
});

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-white/10"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`}
      />
    </button>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-strong rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="size-8 rounded-lg bg-primary/15 grid place-items-center">
          <Icon className="size-4 text-primary" />
        </span>
        <p className="font-display text-lg tracking-wider">{title}</p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/5 focus:border-primary/50 focus:outline-none";

const STAFF = [
  { name: "Layla Hassan", role: "Manager", email: "layla@bjpizza.com" },
  { name: "Sara Malik", role: "Cashier", email: "sara@bjpizza.com" },
  { name: "Omar Ahmed", role: "Cashier", email: "omar@bjpizza.com" },
  { name: "Imran Saeed", role: "Kitchen Lead", email: "imran@bjpizza.com" },
];

function SettingsPage() {
  const [s, setS] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);
  const [salesCount, setSalesCount] = useState(0);

  useEffect(() => {
    setS(getSettings());
    setSalesCount(getSales().length);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const u = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const onSave = () => {
    saveSettings(s);
    setToast("Settings saved");
  };

  const onReset = () => {
    if (!confirm("Reset all settings to defaults?")) return;
    setS(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setToast("Settings reset to defaults");
  };

  const onClearSales = () => {
    if (!confirm(`Clear ${salesCount} sales records? This cannot be undone.`)) return;
    clearSales();
    setSalesCount(0);
    setToast("Sales history cleared");
  };

  return (
    <PageShell
      eyebrow="Configuration"
      title="SETTINGS"
      subtitle="Branch, taxes, devices, team and notifications."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="glass rounded-xl px-3 py-2 text-xs uppercase tracking-widest hover:bg-white/5"
          >
            Reset
          </button>
          <button
            onClick={onSave}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs uppercase tracking-widest hover:opacity-90 flex items-center gap-2"
          >
            <Check className="size-3.5" /> Save changes
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card icon={Building2} title="Branch">
          <Field label="Restaurant name">
            <input className={inputCls} value={s.shopName} onChange={(e) => u("shopName", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <input className={inputCls} value={s.shopTagline} onChange={(e) => u("shopTagline", e.target.value)} />
          </Field>
          <Field label="Address">
            <input className={inputCls} value={s.shopAddress} onChange={(e) => u("shopAddress", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={s.shopPhone} onChange={(e) => u("shopPhone", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              <select className={inputCls} value={s.currency} onChange={(e) => u("currency", e.target.value)}>
                <option>PKR</option>
                <option>USD</option>
                <option>AED</option>
                <option>EUR</option>
              </select>
            </Field>
            <Field label="Timezone">
              <select className={inputCls} value={s.timezone} onChange={(e) => u("timezone", e.target.value)}>
                <option>Asia/Karachi</option>
                <option>Asia/Dubai</option>
                <option>Europe/London</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card icon={Receipt} title="Tax & Receipts">
          <div className="grid grid-cols-2 gap-3">
            <Field label="VAT %">
              <input
                className={inputCls}
                type="number"
                value={s.vatPct}
                onChange={(e) => u("vatPct", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Service charge %">
              <input
                className={inputCls}
                type="number"
                value={s.servicePct}
                onChange={(e) => u("servicePct", Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Receipt footer">
            <input
              className={inputCls}
              value={s.receiptFooter}
              onChange={(e) => u("receiptFooter", e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">Auto-apply service charge</p>
              <p className="text-xs text-muted-foreground">Adds to dine-in tickets only</p>
            </div>
            <Toggle on={s.autoService} onChange={(v) => u("autoService", v)} />
          </div>
        </Card>

        <Card icon={Printer} title="Devices">
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">Receipt printer</p>
              <p className="text-xs text-muted-foreground">Epson TM-T88VI · Counter 1</p>
            </div>
            <Toggle on={s.printerOn} onChange={(v) => u("printerOn", v)} />
          </div>
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">Kitchen display</p>
              <p className="text-xs text-muted-foreground">KDS · Pizza station</p>
            </div>
            <Toggle on={s.kdsOn} onChange={(v) => u("kdsOn", v)} />
          </div>
        </Card>

        <Card icon={Bell} title="Notifications">
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">New order alerts</p>
              <p className="text-xs text-muted-foreground">Sound + desktop notification</p>
            </div>
            <Toggle on={s.notifOn} onChange={(v) => u("notifOn", v)} />
          </div>
          <Field label="Daily summary email">
            <input
              className={inputCls}
              value={s.notifEmail}
              onChange={(e) => u("notifEmail", e.target.value)}
            />
          </Field>
          <Field label="Language">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <select
                className={inputCls + " flex-1"}
                value={s.language}
                onChange={(e) => u("language", e.target.value)}
              >
                <option>English</option>
                <option>العربية</option>
                <option>اردو</option>
              </select>
            </div>
          </Field>
        </Card>
      </div>

      <Card icon={Database} title="Data">
        <div className="flex items-center justify-between glass rounded-xl p-3">
          <div>
            <p className="text-sm">Sales history</p>
            <p className="text-xs text-muted-foreground">
              {salesCount} order{salesCount === 1 ? "" : "s"} stored locally
            </p>
          </div>
          <button
            onClick={onClearSales}
            disabled={salesCount === 0}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 disabled:opacity-40"
          >
            <Trash2 className="size-3.5" /> Clear
          </button>
        </div>
      </Card>

      <Card icon={Users} title="Team">
        <ul className="flex flex-col gap-2">
          {STAFF.map((st) => (
            <li key={st.email} className="glass rounded-xl p-3 flex items-center gap-3">
              <span className="size-9 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-xs font-bold">
                {st.name.split(" ").map((n) => n[0]).join("")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{st.name}</p>
                <p className="text-[10px] text-muted-foreground">{st.email}</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-md bg-primary/15 text-primary">
                {st.role}
              </span>
            </li>
          ))}
        </ul>
      </Card>

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
