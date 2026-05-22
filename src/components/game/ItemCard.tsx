import type { Item } from "@/lib/game/types";
import { TIER_COLORS } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function tierClass(tier: Item["tier"]) {
  return tier === "celestial" ? "tier-celestial" : "";
}

export function ItemCard({ item, onClick, equipped, compact }: { item: Item; onClick?: () => void; equipped?: boolean; compact?: boolean }) {
  const color = TIER_COLORS[item.tier];
  const isCelestial = item.tier === "celestial";
  return (
    <button
      onClick={onClick}
      style={{ borderColor: isCelestial ? undefined : color, color }}
      className={cn(
        "glow-card group text-left rounded-lg p-3 bg-card/80 backdrop-blur border-2 w-full",
        isCelestial && "tier-celestial-border",
        equipped && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={cn("font-serif font-semibold truncate", isCelestial && "tier-celestial")} style={!isCelestial ? { color } : undefined}>
            {item.name}
          </div>
          <div className="text-xs uppercase tracking-wider opacity-70" style={{ color }}>
            {item.tier} · {item.slot}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">⚔ {item.power}</div>
      </div>
      {!compact && (
        <>
          <div className="mt-2 flex flex-wrap gap-1 text-xs text-foreground/80">
            {Object.entries(item.stats).map(([k,v]) => v ? (
              <span key={k} className="px-1.5 py-0.5 rounded bg-secondary">{k.toUpperCase()} +{v}</span>
            ) : null)}
          </div>
          {item.affixes.length > 0 && (
            <ul className="mt-2 text-xs space-y-0.5 text-emerald-400">
              {item.affixes.map((a, i) => <li key={i}>• {a.name}</li>)}
            </ul>
          )}
          <div className="mt-2 italic text-[11px] text-muted-foreground">"{item.flavor}"</div>
        </>
      )}
    </button>
  );
}