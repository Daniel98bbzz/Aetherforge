import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TIER_COLORS, TIER_ORDER } from "@/lib/game/types";
import type { DungeonDef, Difficulty, Tier } from "@/lib/game/types";
import { tierWeights } from "@/lib/game/engine";
import { Info } from "lucide-react";

const DIFFS: Difficulty[] = ["Novice", "Adept", "Expert", "Master", "Nightmare"];

function tierStyle(tier: Tier) {
  return tier === "celestial"
    ? { background: "linear-gradient(90deg,#ec4899,#a78bfa,#22d3ee)" }
    : { background: TIER_COLORS[tier] };
}

function tierTextColor(tier: Tier) {
  return tier === "celestial" ? "#ec4899" : TIER_COLORS[tier];
}

function tierLabel(tier: Tier) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function DungeonLootPreview({ dungeon }: { dungeon: DungeonDef }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-amber-300 transition-colors"
          aria-label="Loot preview"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="max-w-md bg-card border border-amber-500/40 text-foreground p-3 space-y-2"
      >
        <div className="font-serif text-amber-300">{dungeon.name} — Loot Bias</div>
        <table className="text-xs w-full border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-normal pr-2">Difficulty</th>
              <th className="text-left font-normal pr-2">Range</th>
              <th className="text-left font-normal pr-2">Most likely</th>
              <th className="text-left font-normal">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {DIFFS.map((d) => {
              const dist = tierWeights(dungeon, d);
              const minTier = dist[0].tier;
              // Max possible = highest tier in bias, optionally bumped one tier up by the 5% upgrade chance.
              const lastBias = dist[dist.length - 1].tier;
              const lastIdx = TIER_ORDER.indexOf(lastBias);
              const maxTier: Tier = lastIdx < TIER_ORDER.length - 1
                ? TIER_ORDER[lastIdx + 1]
                : lastBias;
              // Modal = highest-weighted slot
              const modal = dist.reduce((acc, c) => c.weight > acc.weight ? c : acc, dist[0]);
              return (
                <tr key={d}>
                  <td className="pr-2 text-muted-foreground whitespace-nowrap">{d}</td>
                  <td className="pr-2 whitespace-nowrap">
                    <span style={{ color: tierTextColor(minTier) }} className="capitalize">{tierLabel(minTier)}</span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span style={{ color: tierTextColor(maxTier) }} className="capitalize">{tierLabel(maxTier)}</span>
                  </td>
                  <td className="pr-2 whitespace-nowrap">
                    <span style={{ color: tierTextColor(modal.tier) }} className="capitalize font-serif">{tierLabel(modal.tier)}</span>
                    <span className="text-muted-foreground"> ({modal.pct}%)</span>
                  </td>
                  <td>
                    <div className="flex h-2 rounded overflow-hidden border border-border min-w-[100px]">
                      {dist.map((c, i) => (
                        <div
                          key={i}
                          title={`${tierLabel(c.tier)} ${c.pct}%`}
                          style={{ ...tierStyle(c.tier), width: `${c.pct}%` }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-muted-foreground italic leading-snug">
          The "Range" includes the 5% upgrade-bump chance, so the max can exceed the bias array. After 8 dry runs, your next boss kill guarantees Epic or better.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
