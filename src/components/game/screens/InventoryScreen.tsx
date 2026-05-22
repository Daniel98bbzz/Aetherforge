import { useGame, CONSUMABLES } from "@/lib/game/store";
import { ItemCard } from "../ItemCard";
import { StatTooltip } from "../StatTooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIER_COLORS, TIER_VALUE } from "@/lib/game/types";
import type { Item, Slot } from "@/lib/game/types";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { computeStats } from "@/lib/game/engine";
import { Coins } from "lucide-react";

const SLOTS: Slot[] = ["weapon","helmet","chest","boots","ring","amulet"];
type SortKey = "tier_desc" | "tier_asc" | "power_desc" | "value_desc" | "recent";
type SlotFilter = "all" | Slot;

const SORT_LABELS: Record<SortKey, string> = {
  tier_desc: "Tier (high → low)",
  tier_asc:  "Tier (low → high)",
  power_desc:"Power (high → low)",
  value_desc:"Value (high → low)",
  recent:    "Recent",
};

export function InventoryScreen() {
  const { save, equip, unequip, dismantle, sellItem, useConsumable } = useGame();
  const [selected, setSelected] = useState<Item | null>(null);
  const [tab, setTab] = useState<"gear" | "consumables">("gear");
  const [sortKey, setSortKey] = useState<SortKey>("tier_desc");
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");

  const sortedInv = useMemo(() => {
    if (!save) return [] as Item[];
    const list = slotFilter === "all"
      ? save.player.inventory
      : save.player.inventory.filter(i => i.slot === slotFilter);
    const copy = [...list];
    switch (sortKey) {
      case "tier_desc":  return copy.sort((a, b) => TIER_VALUE[b.tier] - TIER_VALUE[a.tier] || b.power - a.power);
      case "tier_asc":   return copy.sort((a, b) => TIER_VALUE[a.tier] - TIER_VALUE[b.tier] || a.power - b.power);
      case "power_desc": return copy.sort((a, b) => b.power - a.power);
      case "value_desc": return copy.sort((a, b) => b.value - a.value);
      case "recent":     return copy.reverse();
    }
  }, [save, sortKey, slotFilter]);

  if (!save) return null;
  const p = save.player;
  const stats = computeStats(p);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-amber-200">Inventory</h1>

      <div>
        <h2 className="font-serif text-xl text-amber-300 mb-3">Equipped</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SLOTS.map((slot) => {
            const it = p.equipped[slot];
            if (!it) return (
              <Card key={slot} className="p-3 bg-card/30 border-dashed border-border text-muted-foreground text-sm">
                <div className="font-serif capitalize">{slot}</div>
                <p className="text-xs italic">Empty</p>
              </Card>
            );
            return <ItemCard key={slot} item={it} equipped onClick={() => setSelected(it)} />;
          })}
        </div>
      </div>

      <Card className="p-4 bg-card/60 border-border">
        <h2 className="font-serif text-xl text-amber-300 mb-2">Active Bonuses</h2>
        <p className="text-xs text-muted-foreground mb-2">Hover any stat for details.</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <StatTooltip stat="str" charClass={p.charClass}><span className="px-2 py-1 rounded bg-secondary">STR {stats.str}</span></StatTooltip>
          <StatTooltip stat="agi" charClass={p.charClass}><span className="px-2 py-1 rounded bg-secondary">AGI {stats.agi}</span></StatTooltip>
          <StatTooltip stat="int" charClass={p.charClass}><span className="px-2 py-1 rounded bg-secondary">INT {stats.int}</span></StatTooltip>
          <StatTooltip stat="vit" charClass={p.charClass}><span className="px-2 py-1 rounded bg-secondary">VIT {stats.vit}</span></StatTooltip>
          <StatTooltip stat="defense"><span className="px-2 py-1 rounded bg-secondary">DEF {Math.round(stats.vit * 0.6)}</span></StatTooltip>
          <StatTooltip stat="weaponPower"><span className="px-2 py-1 rounded bg-secondary">Weapon Power {stats.weaponPower}</span></StatTooltip>
          <StatTooltip stat="crit"><span className="px-2 py-1 rounded bg-secondary">Crit {stats.critChance.toFixed(1)}%</span></StatTooltip>
          {stats.lifesteal > 0 && <StatTooltip stat="lifesteal"><span className="px-2 py-1 rounded bg-secondary">Lifesteal {stats.lifesteal}%</span></StatTooltip>}
          {stats.fireBonus > 0 && <StatTooltip stat="fire"><span className="px-2 py-1 rounded bg-secondary text-orange-300">Fire +{stats.fireBonus}%</span></StatTooltip>}
        </div>
      </Card>

      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Button size="sm" variant={tab === "gear" ? "default" : "outline"} onClick={() => setTab("gear")}>
          Gear ({p.inventory.length})
        </Button>
        <Button size="sm" variant={tab === "consumables" ? "default" : "outline"} onClick={() => setTab("consumables")}>
          Consumables ({p.consumables.reduce((a, c) => a + c.qty, 0)})
        </Button>
      </div>

      {tab === "gear" && (
        <div className="space-y-3">
          {p.inventory.length === 0 ? (
            <p className="text-muted-foreground italic">Your bag is empty. Go find some loot.</p>
          ) : (
            <>
              <Card className="p-3 bg-card/40 border-border">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort:</span>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="bg-background/60 border border-border rounded px-2 py-1 text-xs"
                    >
                      {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                        <option key={k} value={k}>{SORT_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-1">Filter:</span>
                    <Button size="sm" variant={slotFilter === "all" ? "default" : "outline"} onClick={() => setSlotFilter("all")}>All</Button>
                    {SLOTS.map((s) => (
                      <Button key={s} size="sm" variant={slotFilter === s ? "default" : "outline"} onClick={() => setSlotFilter(s)} className="capitalize">
                        {s}
                      </Button>
                    ))}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {sortedInv.length} / {p.inventory.length} shown
                  </span>
                </div>
              </Card>

              {sortedInv.length === 0 ? (
                <p className="text-muted-foreground italic text-sm">No items match that filter.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedInv.map((it) => <ItemCard key={it.id} item={it} onClick={() => setSelected(it)} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "consumables" && (
        <div>
          {p.consumables.length === 0 ? (
            <p className="text-muted-foreground italic">No consumables. Visit Sera at the Market.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {p.consumables.map((s) => {
                const cd = CONSUMABLES.find(c => c.id === s.itemId);
                if (!cd) return null;
                const color = cd.rarity ? TIER_COLORS[cd.rarity] : "#a8a29e";
                return (
                  <Card key={s.itemId} className="p-3 border-2 bg-card/60" style={{ borderColor: color }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-serif" style={{ color }}>{cd.name}</div>
                        <div className="text-[11px] uppercase tracking-wider opacity-70" style={{ color }}>
                          consumable
                        </div>
                      </div>
                      <span className="text-xs">× {s.qty}</span>
                    </div>
                    <p className="text-xs mt-2 text-foreground/80">{cd.description}</p>
                    {cd.flavor && <p className="text-[11px] italic text-muted-foreground mt-1">"{cd.flavor}"</p>}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      disabled={!!cd.combatOnly}
                      onClick={() => useConsumable(cd.id)}
                    >
                      {cd.combatOnly ? "Combat Only" : "Use"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif">{selected.name}</DialogTitle>
              </DialogHeader>
              <ItemCard item={selected} />
              <div className="flex flex-wrap gap-2 mt-2">
                {p.equipped[selected.slot]?.id === selected.id ? (
                  <Button variant="outline" onClick={() => { unequip(selected.slot); setSelected(null); }}>Unequip</Button>
                ) : (
                  <Button onClick={() => { equip(selected); setSelected(null); }}>Equip</Button>
                )}
                {p.equipped[selected.slot]?.id !== selected.id && (
                  <>
                    <Button variant="outline" onClick={() => { sellItem(selected.id); setSelected(null); }}>
                      <Coins className="w-3.5 h-3.5 mr-1" />
                      Sell — {Math.max(1, Math.round(selected.value * 0.4))}g
                    </Button>
                    <Button variant="destructive" onClick={() => { dismantle(selected.id); setSelected(null); }}>Dismantle</Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
