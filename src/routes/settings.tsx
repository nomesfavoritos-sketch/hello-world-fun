import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Receipt, Printer, Users, Bell, Globe } from "lucide-react";
import { PageShell } from "@/components/pos/PageShell";

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
  { name: "Layla Hassan", role: "Manager", email: "layla@bjpizza.ae" },
  { name: "Sara Malik", role: "Cashier", email: "sara@bjpizza.ae" },
  { name: "Omar Ahmed", role: "Cashier", email: "omar@bjpizza.ae" },
  { name: "Imran Saeed", role: "Kitchen Lead", email: "imran@bjpizza.ae" },
];

function SettingsPage() {
  const [printer, setPrinter] = useState(true);
  const [kds, setKds] = useState(true);
  const [auto, setAuto] = useState(false);
  const [notif, setNotif] = useState(true);

  return (
    <PageShell
      eyebrow="Configuration"
      title="SETTINGS"
      subtitle="Branch, taxes, devices, team and notifications."
      actions={
        <button className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs uppercase tracking-widest hover:opacity-90">
          Save changes
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card icon={Building2} title="Branch">
          <Field label="Restaurant name">
            <input className={inputCls} defaultValue="BJ Pizza · Downtown" />
          </Field>
          <Field label="Address">
            <input className={inputCls} defaultValue="Sheikh Mohammed Bin Rashid Blvd, Dubai" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              <select className={inputCls} defaultValue="USD">
                <option>USD</option>
                <option>AED</option>
                <option>EUR</option>
              </select>
            </Field>
            <Field label="Timezone">
              <select className={inputCls} defaultValue="Asia/Dubai">
                <option>Asia/Dubai</option>
                <option>Asia/Karachi</option>
                <option>Europe/London</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card icon={Receipt} title="Tax & Receipts">
          <div className="grid grid-cols-2 gap-3">
            <Field label="VAT %">
              <input className={inputCls} type="number" defaultValue={5} />
            </Field>
            <Field label="Service charge %">
              <input className={inputCls} type="number" defaultValue={10} />
            </Field>
          </div>
          <Field label="Receipt footer">
            <input className={inputCls} defaultValue="Thank you for dining with BJ Pizza ❤" />
          </Field>
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">Auto-apply service charge</p>
              <p className="text-xs text-muted-foreground">Adds to dine-in tickets only</p>
            </div>
            <Toggle on={auto} onChange={setAuto} />
          </div>
        </Card>

        <Card icon={Printer} title="Devices">
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">Receipt printer</p>
              <p className="text-xs text-muted-foreground">Epson TM-T88VI · Counter 1</p>
            </div>
            <Toggle on={printer} onChange={setPrinter} />
          </div>
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">Kitchen display</p>
              <p className="text-xs text-muted-foreground">KDS · Pizza station</p>
            </div>
            <Toggle on={kds} onChange={setKds} />
          </div>
        </Card>

        <Card icon={Bell} title="Notifications">
          <div className="flex items-center justify-between glass rounded-xl p-3">
            <div>
              <p className="text-sm">New order alerts</p>
              <p className="text-xs text-muted-foreground">Sound + desktop notification</p>
            </div>
            <Toggle on={notif} onChange={setNotif} />
          </div>
          <Field label="Daily summary email">
            <input className={inputCls} defaultValue="ops@bjpizza.ae" />
          </Field>
          <Field label="Language">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <select className={inputCls + " flex-1"} defaultValue="English">
                <option>English</option>
                <option>العربية</option>
                <option>اردو</option>
              </select>
            </div>
          </Field>
        </Card>
      </div>

      <Card icon={Users} title="Team">
        <ul className="flex flex-col gap-2">
          {STAFF.map((s) => (
            <li key={s.email} className="glass rounded-xl p-3 flex items-center gap-3">
              <span className="size-9 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-xs font-bold">
                {s.name.split(" ").map((n) => n[0]).join("")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.email}</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-md bg-primary/15 text-primary">
                {s.role}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}
