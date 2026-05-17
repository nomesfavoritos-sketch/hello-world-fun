import { Sparkles } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-h-screen p-4">
      <div className="flex gap-4 max-w-[1800px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 grid place-items-center">
          <div
            className="glass-strong rounded-3xl p-12 text-center max-w-lg"
          >
            <div className="size-16 rounded-2xl bg-primary/15 mx-auto grid place-items-center mb-6">
              <Sparkles className="size-7 text-gold" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Coming Soon</p>
            <h1 className="font-display text-4xl tracking-wider mt-3">{title}</h1>
            <p className="text-sm text-muted-foreground mt-3">{subtitle}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
