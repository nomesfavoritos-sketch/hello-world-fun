import { Sidebar } from "./Sidebar";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-4">
      <div className="flex gap-4 max-w-[1800px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col gap-5">
          <header className="glass-strong rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              {eyebrow && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
              )}
              <h1 className="font-display text-3xl tracking-wider mt-1">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
