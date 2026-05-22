import { useGame } from "@/lib/game/store";
import { Card } from "@/components/ui/card";
import { MONSTERS, ITEMS } from "@/lib/game/data";
import { TIER_COLORS } from "@/lib/game/types";

export function CodexScreen() {
  const { save } = useGame();
  if (!save) return null;
  const p = save.player;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-amber-200">Codex</h1>
        <p className="text-muted-foreground italic">All you have witnessed and survived.</p>
      </div>
      <Card className="p-4 bg-card/60">
        <h2 className="font-serif text-xl text-amber-300 mb-3">Bestiary ({p.codexMonsters.length}/{MONSTERS.length})</h2>
        <p className="text-xs text-muted-foreground mb-3">Stats shown are <span className="italic">base</span> values. Dungeon difficulty multiplies HP/ATK/DEF, XP, and gold.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MONSTERS.map((m) => {
            const known = p.codexMonsters.includes(m.id);
            return (
              <div key={m.id} className={`p-3 rounded border ${known ? "border-amber-500/40 bg-background/40" : "border-border bg-background/20"}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-serif text-sm">{known ? m.name : "???"}</div>
                  {known && m.special && (
                    <span className="text-[10px] uppercase tracking-wider text-rose-300">{m.special}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground italic mt-1">{known ? m.flavor : "Encounter to reveal."}</p>
                {known && (
                  <div className="mt-2 grid grid-cols-5 gap-1 text-[10px]">
                    <div className="text-center rounded bg-red-500/10 border border-red-500/30 py-1">
                      <div className="text-red-300 font-serif text-xs">{m.hp}</div>
                      <div className="text-muted-foreground uppercase tracking-wider">HP</div>
                    </div>
                    <div className="text-center rounded bg-orange-500/10 border border-orange-500/30 py-1">
                      <div className="text-orange-300 font-serif text-xs">{m.attack}</div>
                      <div className="text-muted-foreground uppercase tracking-wider">ATK</div>
                    </div>
                    <div className="text-center rounded bg-sky-500/10 border border-sky-500/30 py-1">
                      <div className="text-sky-300 font-serif text-xs">{m.defense}</div>
                      <div className="text-muted-foreground uppercase tracking-wider">DEF</div>
                    </div>
                    <div className="text-center rounded bg-purple-500/10 border border-purple-500/30 py-1">
                      <div className="text-purple-300 font-serif text-xs">{m.xp}</div>
                      <div className="text-muted-foreground uppercase tracking-wider">XP</div>
                    </div>
                    <div className="text-center rounded bg-amber-500/10 border border-amber-500/30 py-1">
                      <div className="text-amber-300 font-serif text-xs">{m.gold}</div>
                      <div className="text-muted-foreground uppercase tracking-wider">Gold</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 bg-card/60">
        <h2 className="font-serif text-xl text-amber-300 mb-3">Arms & Relics ({p.codexItems.length}/{ITEMS.length})</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ITEMS.map((it) => {
            const baseKey = it.id;
            const known = p.codexItems.some(k => baseKey.startsWith(k.split("_").slice(0,2).join("_")));
            const color = TIER_COLORS[it.tier];
            return (
              <div key={it.id} className="p-2 rounded border border-border bg-background/30 text-sm">
                <div style={{ color: known ? color : undefined }} className={known ? "font-serif" : "text-muted-foreground italic"}>
                  {known ? it.name : "???"}
                </div>
                <p className="text-[10px] uppercase tracking-wider opacity-60">{it.tier}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}