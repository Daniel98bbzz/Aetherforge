import { useMemo, useState } from "react";
import { useGame, SKILL_TREE } from "@/lib/game/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SKILL_RESPEC_GOLD_PER_SP } from "@/lib/game/types";
import type { SkillNode } from "@/lib/game/types";
import { skillRankUpBlocker, skillStatsAtRank, totalSpentSP } from "@/lib/game/engine";
import { SkillTooltip } from "../SkillTooltip";
import { Sparkles, RotateCcw, BookOpen } from "lucide-react";

export function TrainerScreen() {
  const { save, learnOrRankUpSkill, equipSkill, unequipSkill, resetSkills } = useGame();
  const [respecOpen, setRespecOpen] = useState(false);
  if (!save) return null;
  const p = save.player;

  const classNodes = useMemo(
    () => SKILL_TREE.filter((n) => n.charClass === p.charClass),
    [p.charClass],
  );

  // Group by tier for a clean top-down layout (tier 1 = openers, tier 3 = capstone).
  const byTier = useMemo(() => {
    const out: Record<1 | 2 | 3, SkillNode[]> = { 1: [], 2: [], 3: [] };
    for (const n of classNodes) out[n.position.tier].push(n);
    for (const t of [1, 2, 3] as const) {
      out[t].sort((a, b) => a.position.col - b.position.col);
    }
    return out;
  }, [classNodes]);

  const refundableSP = totalSpentSP(p);
  const respecCost = refundableSP * SKILL_RESPEC_GOLD_PER_SP;
  const respecAffordable = p.gold >= respecCost && refundableSP > 0;
  const inRun = !!save.activeRun;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl text-amber-200 flex items-center gap-2">
            <BookOpen className="w-7 h-7" /> Skill Trainer
          </h1>
          <p className="text-muted-foreground italic">
            Master Reldath watches you with mild approval. "Spend wisely. The road remembers what you learn."
          </p>
        </div>
        <Card className="parchment px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-4 h-4" /> {p.skillPoints} SP
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="capitalize text-foreground/80">{p.charClass}</span>
            <span className="text-muted-foreground">·</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRespecOpen(true)}
              disabled={inRun || refundableSP <= 0}
              title={inRun ? "Cannot respec mid-delve." : `Refund ${refundableSP} SP for ${respecCost}g`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Skills
            </Button>
          </div>
        </Card>
      </div>

      {/* Equipped readout */}
      <Card className="p-4 bg-card/60 border-border">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-serif text-xl text-amber-300">Action Bar ({p.equippedSkills.length} / 5)</h2>
          <p className="text-xs text-muted-foreground italic">
            Up to 5 skills can be brought into a dungeon. Click a learned skill below to equip; click again to remove.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.equippedSkills.length === 0 && (
            <p className="text-sm italic text-muted-foreground">No skills equipped.</p>
          )}
          {p.equippedSkills.map((id) => {
            const node = classNodes.find((n) => n.id === id);
            if (!node) return null;
            const rank = p.skillRanks[id] ?? 0;
            return (
              <SkillTooltip key={id} skill={node} player={p} rank={rank}>
                <button
                  onClick={() => unequipSkill(id)}
                  disabled={inRun}
                  className="px-3 py-1.5 rounded border-2 border-sky-500/40 bg-sky-500/10 text-sky-200 text-xs hover:bg-sky-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {node.name} <span className="text-[10px] opacity-70">R{rank}</span>
                </button>
              </SkillTooltip>
            );
          })}
        </div>
        {inRun && (
          <p className="mt-2 text-[11px] italic text-amber-400/80">
            The Trainer's door is closed while you are mid-delve.
          </p>
        )}
      </Card>

      {/* Tree — three rows, top-to-bottom = tier 1 → tier 3 */}
      <div className="space-y-6">
        {([1, 2, 3] as const).map((tier) => (
          <div key={tier}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-serif text-amber-300 text-lg">Tier {tier}</h3>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {tier === 1 ? "Openers" : tier === 2 ? "Refinements" : "Capstones"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byTier[tier].map((node) => (
                <SkillNodeCard
                  key={node.id}
                  node={node}
                  rank={p.skillRanks[node.id] ?? 0}
                  inRun={inRun}
                  onLearn={() => learnOrRankUpSkill(node.id)}
                  onEquip={() => equipSkill(node.id)}
                  onUnequip={() => unequipSkill(node.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Respec confirmation */}
      <Dialog open={respecOpen} onOpenChange={setRespecOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Reset all skills?</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-foreground/90">
            <p className="italic text-muted-foreground">
              "Hold still." The Trainer presses a thumb to your brow and the lessons leak out like
              candle smoke. You will remember the words. The reflexes return to dust.
            </p>
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
              <div className="flex justify-between"><span>Spent SP refunded</span><span className="font-mono">{refundableSP}</span></div>
              <div className="flex justify-between"><span>Cost ({SKILL_RESPEC_GOLD_PER_SP}g per SP)</span><span className="font-mono">{respecCost}g</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Your gold</span><span className="font-mono">{p.gold}g</span></div>
            </div>
            <div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm">
              All current ranks and the action bar will be cleared.
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRespecOpen(false)}>Cancel</Button>
            <Button
              onClick={() => { setRespecOpen(false); resetSkills(); }}
              disabled={!respecAffordable}
            >
              Reset — {respecCost}g
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SkillNodeCard({
  node, rank, inRun, onLearn, onEquip, onUnequip,
}: {
  node: SkillNode;
  rank: number;
  inRun: boolean;
  onLearn: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}) {
  const { save } = useGame();
  if (!save) return null;
  const p = save.player;
  const isUnlocked = rank > 0;
  const isMaxed = rank >= node.maxRank;
  const blocker = skillRankUpBlocker(p, node);
  const nextCost = !isMaxed ? node.rankCosts[rank] : null;
  const equipped = p.equippedSkills.includes(node.id);
  const equippedFull = p.equippedSkills.length >= 5 && !equipped;
  const stats = skillStatsAtRank(node, Math.max(1, rank));

  // Visual state colors mirror the established palette — sky = active/equipped,
  // amber = available to spend SP on, neutral = locked, emerald = mastered.
  const borderColor = isMaxed
    ? "border-amber-500/60"
    : isUnlocked
      ? "border-sky-500/40"
      : "border-border";
  const bgTint = isMaxed
    ? "bg-amber-500/5"
    : isUnlocked
      ? "bg-sky-500/5"
      : "bg-card/40";

  return (
    <SkillTooltip skill={node} player={p} rank={rank}>
      <div className={`relative rounded-lg border-2 p-3 ${borderColor} ${bgTint} transition-colors`}>
        {/* Rank pips */}
        <div className="absolute top-2 right-2 flex gap-0.5">
          {Array.from({ length: node.maxRank }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i < rank ? "bg-amber-400" : "bg-border"}`}
            />
          ))}
        </div>

        <div className="font-serif text-amber-200 leading-tight pr-16">{node.name}</div>
        <p className="text-[11px] text-muted-foreground italic mt-0.5 leading-snug">{node.description}</p>

        <div className="mt-2 text-[11px] text-foreground/80 space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Mana</span>
            <span className="font-mono">{stats.manaCost}</span>
          </div>
          {node.cooldown > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cooldown</span>
              <span className="font-mono">{node.cooldown}t</span>
            </div>
          )}
          {node.effect.scaling && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scales</span>
              <span className="font-mono">
                {stats.scalingPct}% {node.effect.scaling.stat.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {node.requires.length > 0 && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Requires: {node.requires.map(r => SKILL_TREE.find(n => n.id === r)?.name ?? r).join(", ")}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {!isMaxed && (
            <Button
              size="sm"
              variant={isUnlocked ? "outline" : "default"}
              onClick={onLearn}
              disabled={!!blocker || inRun}
              title={blocker ?? undefined}
            >
              {isUnlocked
                ? `Rank Up → ${rank + 1} (${nextCost} SP)`
                : `Unlock (${nextCost} SP)`}
            </Button>
          )}
          {isMaxed && (
            <span className="text-xs px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
              Mastered
            </span>
          )}
          {isUnlocked && (
            equipped ? (
              <Button size="sm" variant="ghost" onClick={onUnequip} disabled={inRun}>
                Unequip
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEquip}
                disabled={inRun || equippedFull}
                title={equippedFull ? "Action bar is full (5/5). Unequip a skill first." : undefined}
              >
                Equip
              </Button>
            )
          )}
        </div>
      </div>
    </SkillTooltip>
  );
}
