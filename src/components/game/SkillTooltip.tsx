import type { ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { previewSkill, skillStatsAtRank } from "@/lib/game/engine";
import type { Player, SkillNode } from "@/lib/game/types";

interface Props {
  skill: SkillNode;
  player: Player;
  rank: number;            // current rank (0 = locked / preview rank 1)
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

// HoverCard (not Tooltip) so mobile users get tap-to-toggle instead of
// hover-only. Radix HoverCard opens on pointer enter on desktop AND on
// tap on touch devices, which is exactly the design call for the touch
// fallback. Content styling matches StatTooltip for visual consistency.
export function SkillTooltip({ skill, player, rank, children, side = "top", align = "center" }: Props) {
  const effectiveRank = Math.max(1, rank);
  const current = previewSkill(player, skill, effectiveRank);
  const isLocked = rank === 0;
  const hasNext = rank > 0 && rank < skill.maxRank;
  const next = hasNext ? previewSkill(player, skill, rank + 1) : null;
  const nextCost = hasNext ? skill.rankCosts[rank] : null;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span className="cursor-help">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        className="w-80 bg-card border border-amber-500/40 text-foreground p-3 space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="font-serif text-amber-300 text-base leading-tight">{skill.name}</div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {skill.charClass} · T{skill.position.tier}
          </span>
        </div>

        <p className="text-xs text-foreground/80 leading-snug">{skill.description}</p>
        {skill.flavor && (
          <p className="text-[11px] italic text-muted-foreground leading-snug">"{skill.flavor}"</p>
        )}

        {/* Current rank stats block */}
        <div className="rounded border border-border bg-background/40 p-2 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-serif text-amber-200">
              {isLocked ? "Rank 1 (preview)" : `Rank ${rank} / ${skill.maxRank}`}
            </span>
            <span className="text-muted-foreground">
              Mana {current.manaCost}
              {skill.cooldown > 0 && <span> · CD {skill.cooldown}t</span>}
            </span>
          </div>
          {current.scalingText && (
            <p className="text-foreground/90">{current.scalingText}</p>
          )}
          {current.damage > 0 && (
            <p className="text-rose-300">
              Est. damage: <span className="font-mono">{current.damage}</span>
              <span className="text-muted-foreground"> ({current.damageMin}–{current.damageMax})</span>
            </p>
          )}
          {current.heal > 0 && (
            <p className="text-emerald-300">
              Restores: <span className="font-mono">{current.heal} HP</span>
            </p>
          )}
          {current.shield > 0 && (
            <p className="text-sky-300">
              Shield: <span className="font-mono">{current.shield} dmg absorbed</span>
            </p>
          )}
        </div>

        {/* Next rank preview — the headline of the rank system */}
        {hasNext && next && (
          <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300">Next Rank ({rank + 1})</span>
              <span className="text-amber-400">Cost: {nextCost} SP</span>
            </div>
            {next.scalingText && <p className="text-foreground/90">{next.scalingText}</p>}
            {next.damage > 0 && current.damage > 0 && (
              <p className="text-rose-200">
                Damage: <span className="font-mono">{current.damage}</span> → <span className="font-mono text-rose-100">{next.damage}</span>
                <span className="text-muted-foreground"> (+{next.damage - current.damage})</span>
              </p>
            )}
            {next.heal > 0 && current.heal > 0 && (
              <p className="text-emerald-200">
                Heal: <span className="font-mono">{current.heal}</span> → <span className="font-mono text-emerald-100">{next.heal}</span>
              </p>
            )}
            {next.shield > 0 && current.shield > 0 && (
              <p className="text-sky-200">
                Shield: <span className="font-mono">{current.shield}</span> → <span className="font-mono text-sky-100">{next.shield}</span>
              </p>
            )}
            {next.manaCost !== current.manaCost && (
              <p className="text-muted-foreground">
                Mana cost: {current.manaCost} → {next.manaCost}
              </p>
            )}
          </div>
        )}

        {/* Status footer */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
          {isLocked ? (
            <span className="text-muted-foreground">Locked</span>
          ) : (
            <span className="text-emerald-400">Unlocked</span>
          )}
          {!isLocked && rank >= skill.maxRank && (
            <span className="text-amber-400">Mastered</span>
          )}
          {!isLocked && player.equippedSkills.includes(skill.id) && (
            <span className="text-sky-400">Equipped</span>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Inline helper for places where we only need a one-liner readout (e.g.
// action bar buttons). Returns a compact label like "Cleave (rank 2)".
export function skillButtonLabel(skill: SkillNode, rank: number): string {
  const stats = skillStatsAtRank(skill, rank);
  return `${skill.name} (${stats.manaCost})`;
}
