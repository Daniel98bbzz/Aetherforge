import { useState, type ReactNode } from "react";
import { Home, Swords, Backpack, User, Hammer, BookOpen, Trophy, Settings, Coins, Sparkles, GraduationCap } from "lucide-react";
import { useGame } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type View = "hub" | "dungeons" | "inventory" | "character" | "forge" | "codex" | "achievements" | "trainer";

const NAV: { id: View; label: string; icon: any }[] = [
  { id:"hub", label:"Eldergate", icon: Home },
  { id:"dungeons", label:"Dungeons", icon: Swords },
  { id:"inventory", label:"Inventory", icon: Backpack },
  { id:"character", label:"Character", icon: User },
  { id:"trainer", label:"Skill Trainer", icon: GraduationCap },
  { id:"forge", label:"Forge", icon: Hammer },
  { id:"codex", label:"Codex", icon: BookOpen },
  { id:"achievements", label:"Achievements", icon: Trophy },
];

export function GameLayout({ view, setView, children, locked }: { view: View; setView: (v: View) => void; children: ReactNode; locked?: boolean }) {
  const { save, power, resetGame } = useGame();
  const [open, setOpen] = useState(false);
  if (!save) return null;
  const p = save.player;

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen flex relative z-10">
      {/* Sidebar */}
      <aside className={cn("fixed md:static z-30 inset-y-0 left-0 w-56 bg-sidebar border-r border-sidebar-border transition-transform md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="font-serif text-xl bg-gradient-to-b from-amber-200 to-amber-600 bg-clip-text text-transparent">Aetherforge</h2>
          <p className="text-[10px] tracking-widest text-muted-foreground">NINE TIERS</p>
        </div>
        <nav className="p-2 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                disabled={locked}
                onClick={() => { setView(n.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-primary/20 text-primary border border-primary/40" : "text-sidebar-foreground hover:bg-sidebar-accent",
                  locked && "opacity-40 cursor-not-allowed",
                )}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </button>
            );
          })}
        </nav>
        {save.activeRun && (
          <div className="m-3 p-2 rounded border border-amber-500/40 bg-amber-500/10 text-xs">
            <div className="font-serif text-amber-400">Run in progress</div>
            <p className="text-muted-foreground text-[11px]">Room {save.activeRun.currentRoom + 1}/{save.activeRun.rooms.length}</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 md:ml-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Button size="sm" variant="ghost" className="md:hidden" onClick={() => setOpen(!open)}>☰</Button>
            <div className="flex-1 flex items-center gap-3 flex-wrap text-sm">
              <span className="font-serif text-primary">{p.name}</span>
              <span className="text-muted-foreground">Lv {p.level}</span>
              <span className="flex items-center gap-1 text-amber-400"><Coins className="w-3.5 h-3.5"/> {p.gold}</span>
              <span className="flex items-center gap-1 text-sky-400"><Sparkles className="w-3.5 h-3.5"/> Power {power}</span>
              {p.hardcore && <span className="px-1.5 py-0.5 text-[10px] rounded bg-destructive/20 text-destructive border border-destructive/40">HARDCORE</span>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Reset game? All progress will be lost.")) resetGame(); }}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
    </TooltipProvider>
  );
}