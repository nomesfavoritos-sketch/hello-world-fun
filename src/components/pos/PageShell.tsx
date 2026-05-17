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
    <div className="min-h-screen p-3 sm:p-4">
      <div className="flex flex-col lg:flex-row gap-4 max-w-[1800px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5">
          <header className="glass-strong rounded-2xl p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 flex-wrap pl-16 lg:pl-5">
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
              )}
              <h1 className="font-display text-2xl sm:text-3xl tracking-wider mt-1 break-words">{title}</h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
