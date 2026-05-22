import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ItemCard } from "./ItemCard";
import { CONSUMABLES, TRADERS, useGame } from "@/lib/game/store";
import { TIER_COLORS } from "@/lib/game/types";
import type { Tier, TraderDef } from "@/lib/game/types";
import { Coins, Hammer, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  traderId: string | null;
  onClose: () => void;
}

const SELL_BATCHES: { label: string; tiers: Tier[] }[] = [
  { label: "Common + Uncommon", tiers: ["common", "uncommon"] },
  { label: "Rare and below",    tiers: ["common", "uncommon", "rare"] },
];

export function TraderModal({ traderId, onClose }: Props) {
  const { save, refreshTraderStock, buyItem, buyConsumable, sellItem, sellAll } = useGame();
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const tdef: TraderDef | undefined = useMemo(
    () => TRADERS.find((t) => t.id === traderId),
    [traderId]
  );

  useEffect(() => {
    if (traderId) refreshTraderStock(traderId);
  }, [traderId, refreshTraderStock]);

  if (!save || !tdef || !traderId) return null;
  const tstate = save.traders[traderId];
  if (!tstate) return null;
  const p = save.player;
  const isSmith = tdef.type === "blacksmith";

  return (
    <Dialog open={!!traderId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            {isSmith ? <Hammer className="w-5 h-5 text-amber-400" /> : <FlaskConical className="w-5 h-5 text-emerald-400" />}
            {tdef.name}
          </DialogTitle>
        </DialogHeader>

        <Card className="parchment p-3 space-y-2">
          <p className="text-sm italic text-muted-foreground">"{tdef.flavor}"</p>
          <div className="flex items-center justify-between text-xs">
            <span className="font-serif text-amber-300">Level {tstate.level} / 20</span>
            <span className="text-muted-foreground">{tstate.xp} / {tstate.xpToNext} xp</span>
          </div>
          <Progress value={(tstate.xp / tstate.xpToNext) * 100} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground">
            Spending gold here trains the trader. Most stock caps at Epic; a Legendary jackpot slot rolls only at very high trader levels.
          </p>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button size="sm" variant={tab === "buy" ? "default" : "outline"} onClick={() => setTab("buy")}>Buy</Button>
            <Button size="sm" variant={tab === "sell" ? "default" : "outline"} onClick={() => setTab("sell")}>Sell</Button>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-amber-400"><Coins className="w-4 h-4" /> {p.gold}</span>
            <Button size="sm" variant="ghost" onClick={() => refreshTraderStock(traderId, true)}>↻ Refresh</Button>
          </div>
        </div>

        {tab === "buy" && (
          isSmith ? (
            <div className="space-y-2">
              {tstate.stockItems.length === 0 && (
                <p className="text-sm italic text-muted-foreground">The forge is cold today. Come back tomorrow.</p>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {tstate.stockItems.map((it) => (
                  <div key={it.id} className="space-y-2">
                    <ItemCard item={it} />
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={p.gold < it.value}
                      onClick={() => buyItem(traderId, it.id)}
                    >
                      Buy — {it.value}g
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {tstate.stockConsumables.length === 0 && (
                <p className="text-sm italic text-muted-foreground">Sera is restocking. Come back tomorrow.</p>
              )}
              <div className="grid sm:grid-cols-2 gap-2">
                {tstate.stockConsumables.map((st) => {
                  const cd = CONSUMABLES.find(c => c.id === st.itemId);
                  if (!cd) return null;
                  const color = cd.rarity ? TIER_COLORS[cd.rarity] : "#a8a29e";
                  return (
                    <div
                      key={st.itemId}
                      className="rounded-lg border-2 p-3 bg-card/60 space-y-2"
                      style={{ borderColor: color }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-serif" style={{ color }}>{cd.name}</div>
                          <div className="text-[11px] uppercase tracking-wider opacity-70" style={{ color }}>
                            consumable · stock {st.qty}
                          </div>
                        </div>
                        <span className="text-xs text-amber-400 whitespace-nowrap">{cd.price}g</span>
                      </div>
                      <p className="text-xs text-foreground/80">{cd.description}</p>
                      {cd.flavor && <p className="text-[11px] italic text-muted-foreground">"{cd.flavor}"</p>}
                      <div className="flex gap-2">
                        <Button size="sm" disabled={p.gold < cd.price} onClick={() => buyConsumable(traderId, cd.id, 1)}>Buy ×1</Button>
                        <Button size="sm" variant="outline" disabled={p.gold < cd.price * 5 || st.qty < 5} onClick={() => buyConsumable(traderId, cd.id, 5)}>Buy ×5</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {tab === "sell" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sells at 40% of item value. Equipped items cannot be sold — unequip first.</p>

            {isSmith && p.inventory.length > 0 && (
              <Card className="p-3 bg-card/40 border-amber-500/30">
                <div className="text-xs font-serif text-amber-300 mb-2">Bulk Sell</div>
                <div className="flex flex-wrap gap-2">
                  {SELL_BATCHES.map((b) => {
                    const tset = new Set(b.tiers);
                    const matches = p.inventory.filter(i => tset.has(i.tier));
                    const total = matches.reduce((s, it) => s + Math.max(1, Math.round(it.value * 0.4)), 0);
                    return (
                      <Button
                        key={b.label}
                        size="sm"
                        variant="outline"
                        disabled={matches.length === 0}
                        onClick={() => {
                          if (matches.length >= 10) {
                            if (!confirm(`Sell ${matches.length} items for ${total}g?`)) return;
                          }
                          sellAll(b.tiers, traderId);
                        }}
                      >
                        Sell all {b.label} — {matches.length} for {total}g
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}

            {p.inventory.length === 0 && (
              <p className="text-sm italic text-muted-foreground">Your bag is empty.</p>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {p.inventory.map((it) => (
                <div key={it.id} className="space-y-2">
                  <ItemCard item={it} compact />
                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    onClick={() => sellItem(it.id, traderId)}
                  >
                    Sell — {Math.max(1, Math.round(it.value * 0.4))}g
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TraderCard({ trader, onOpen }: { trader: TraderDef; onOpen: () => void }) {
  const { save } = useGame();
  if (!save) return null;
  const t = save.traders[trader.id];
  if (!t) return null;
  const isSmith = trader.type === "blacksmith";
  const Icon = isSmith ? Hammer : FlaskConical;
  const accent = isSmith ? "border-amber-500/40 text-amber-300" : "border-emerald-500/40 text-emerald-300";
  return (
    <button
      onClick={onOpen}
      className={cn("glow-card text-left rounded-lg border-2 p-4 bg-card/60 w-full", accent)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <div className="font-serif">{trader.name}</div>
        </div>
        <span className="text-[10px] uppercase tracking-widest opacity-70">Lv {t.level}</span>
      </div>
      <p className="text-xs text-muted-foreground italic mt-1">"{trader.flavor}"</p>
      <div className="mt-2 text-[11px] text-muted-foreground">
        {isSmith ? "Gear, weapons, armor." : "Potions, elixirs, scrolls."}
      </div>
    </button>
  );
}
