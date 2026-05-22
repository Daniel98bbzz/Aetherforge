import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useGame } from "@/lib/game/store";
import type { CharClass } from "@/lib/game/types";
import { Swords, Crosshair, Sparkles } from "lucide-react";

const CLASSES: { id: CharClass; name: string; desc: string; icon: any; color: string }[] = [
  { id:"warrior", name:"Warrior", desc:"Steel-borne. Strikes hard, endures harder.", icon: Swords, color:"#f59e0b" },
  { id:"ranger",  name:"Ranger",  desc:"Patient eyes, lethal arrows. Strikes from shadow.", icon: Crosshair, color:"#22c55e" },
  { id:"sorcerer",name:"Sorcerer",desc:"Bends arcane currents. Frail but devastating.", icon: Sparkles, color:"#a855f7" },
];

export function StartScreen() {
  const { hasSave, loadGame, newGame, resetGame, save } = useGame();
  const [mode, setMode] = useState<"menu" | "new">("menu");
  const [name, setName] = useState("Aether Warden");
  const [cls, setCls] = useState<CharClass>("warrior");
  const [hardcore, setHardcore] = useState(false);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h1 className="font-serif text-6xl md:text-7xl tracking-wider bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            Aetherforge
          </h1>
          <p className="font-serif text-xl text-muted-foreground">Nine Tiers</p>
        </div>

        {mode === "menu" && (
          <Card className="parchment p-8 space-y-4">
            {hasSave && save && (
              <Button size="lg" className="w-full" onClick={() => loadGame()}>
                Continue — {save.player.name}, Level {save.player.level}
              </Button>
            )}
            <Button size="lg" variant={hasSave ? "outline" : "default"} className="w-full" onClick={() => setMode("new")}>
              New Game
            </Button>
            {hasSave && (
              <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={() => { if (confirm("Delete save and start fresh?")) resetGame(); }}>
                Delete Save
              </Button>
            )}
          </Card>
        )}

        {mode === "new" && (
          <Card className="parchment p-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-serif text-lg">Your Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50" maxLength={32} />
            </div>
            <div className="space-y-2">
              <Label className="font-serif text-lg">Choose Your Path</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CLASSES.map((c) => {
                  const Icon = c.icon;
                  const active = cls === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCls(c.id)}
                      style={{ borderColor: active ? c.color : undefined }}
                      className={`text-left rounded-lg border-2 p-4 transition-all ${active ? "bg-card/80 shadow-lg" : "border-border bg-card/40 hover:bg-card/60"}`}
                    >
                      <Icon className="w-7 h-7 mb-2" style={{ color: c.color }} />
                      <div className="font-serif font-semibold" style={{ color: c.color }}>{c.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/30 p-3">
              <div>
                <div className="font-serif">Hardcore Mode</div>
                <p className="text-xs text-muted-foreground">Permadeath. For the brave.</p>
              </div>
              <Switch checked={hardcore} onCheckedChange={setHardcore} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setMode("menu")}>Back</Button>
              <Button className="flex-1" onClick={() => newGame(name.trim() || "Aether Warden", cls, hardcore)}>Begin</Button>
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">A single-player dark fantasy of loot, glory, and dust.</p>
      </div>
    </div>
  );
}