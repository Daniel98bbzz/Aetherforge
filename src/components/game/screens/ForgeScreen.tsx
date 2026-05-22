import { useGame } from "@/lib/game/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ItemCard } from "../ItemCard";
import { shardsForTier, upgradeChance, upgradeCost } from "@/lib/game/engine";

export function ForgeScreen() {
  const { save, dismantle, upgradeItem } = useGame();
  if (!save) return null;
  const p = save.player;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-amber-200">The Forge</h1>
        <p className="text-muted-foreground italic">Shatter, smelt, reforge. The hammer remembers.</p>
      </div>

      <Card className="parchment p-4 flex flex-wrap gap-4">
        <div><span className="text-sm text-muted-foreground">Aether Shards</span><div className="font-serif text-2xl text-sky-300">{p.shards}</div></div>
        <div><span className="text-sm text-muted-foreground">Essence</span><div className="font-serif text-2xl text-purple-300">{p.essence}</div></div>
      </Card>

      {p.inventory.length === 0 ? (
        <p className="text-muted-foreground italic">No items in your bag. Bring loot to the forge.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {p.inventory.map((it) => {
            const r = shardsForTier(it.tier);
            const c = upgradeCost(it.tier);
            const ch = upgradeChance(it.tier);
            return (
              <div key={it.id} className="space-y-2">
                <ItemCard item={it} compact />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => dismantle(it.id)}>
                    Dismantle (+{r.shards}s {r.essence ? `+${r.essence}e` : ""})
                  </Button>
                  <Button size="sm" className="flex-1" disabled={p.shards < c.shards || p.essence < c.essence} onClick={() => upgradeItem(it.id)}>
                    Upgrade {ch}% ({c.shards}s{c.essence?` ${c.essence}e`:""})
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}