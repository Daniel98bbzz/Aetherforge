import { useMemo, useState } from "react";
import { useGame, SKILL_TREE, PATHS } from "@/lib/game/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PATH_CHOICE_LEVEL, PATH_RESPEC_GOLD, SKILL_RESPEC_GOLD_PER_SP,
} from "@/lib/game/types";
import type { ClassPath, PathDef, SkillNode } from "@/lib/game/types";
import {
  isSkillVisible, requiredLevelForRank, skillRankUpBlocker, skillStatsAtRank, totalSpentSP,
} from "@/lib/game/engine";
import { SkillTooltip } from "../SkillTooltip";
import { Sparkles, RotateCcw, BookOpen, Lock, Compass } from "lucide-react";

export function TrainerScreen() {
  const {
    save, learnOrRankUpSkill, equipSkill, unequipSkill, resetSkills,
    choosePath, abandonPath,
  } = useGame();
  const [respecOpen, setRespecOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [chooseOpen, setChooseOpen] = useState(false);
  if (!save) return null;
  const p = save.player;

  const classNodes = useMemo(
    () => SKILL_TREE.filter((n) => n.charClass === p.charClass),
    [p.charClass],
  );

  // Visible-to-the-player skills, separated into three logical regions.
  const baseNodes = useMemo(
    () => classNodes.filter((n) => n.path === undefined && isSkillVisible(p, n)),
    [classNodes, p],
  );
  const pathNodes = useMemo(
    () => classNodes.filter((n) => n.path !== undefined && isSkillVisible(p, n)),
    [classNodes, p],
  );

  const groupByTier = (nodes: SkillNode[]) => {
    const out: Record<1 | 2 | 3, SkillNode[]> = { 1: [], 2: [], 3: [] };
    for (const n of nodes) out[n.position.tier].push(n);
    for (const t of [1, 2, 3] as const) out[t].sort((a, b) => a.position.col - b.position.col);
    return out;
  };

  const baseByTier = useMemo(() => groupByTier(baseNodes), [baseNodes]);
  const pathByTier = useMemo(() => groupByTier(pathNodes), [pathNodes]);

  const refundableSP = totalSpentSP(p);
  const respecCost = refundableSP * SKILL_RESPEC_GOLD_PER_SP;
  const respecAffordable = p.gold >= respecCost && refundableSP > 0;
  const inRun = !!save.activeRun;

  const choiceLevel = PATH_CHOICE_LEVEL[p.charClass];
  const chosenPath = p.classPaths?.[p.charClass];
  const eligibleToChoose = p.level >= choiceLevel && chosenPath === undefined;
  const lockedToChoose = p.level < choiceLevel && chosenPath === undefined;
  const classPaths: PathDef[] = PATHS.filter((d) => d.charClass === p.charClass);
  const chosenPathDef = chosenPath ? classPaths.find((d) => d.id === chosenPath) : undefined;

  const abandonCost = refundableSP * SKILL_RESPEC_GOLD_PER_SP + PATH_RESPEC_GOLD;
  const abandonAffordable = p.gold >= abandonCost && chosenPath !== undefined;

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
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-4 h-4" /> {p.skillPoints} SP
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="capitalize text-foreground/80">{p.charClass}</span>
            {chosenPathDef && (
              <>
                <span className="text-muted-foreground">·</span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] uppercase tracking-widest border"
                  style={{ color: chosenPathDef.color, borderColor: `${chosenPathDef.color}66`, backgroundColor: `${chosenPathDef.color}11` }}
                >
                  {chosenPathDef.name.replace("Path of the ", "")}
                </span>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRespecOpen(true)}
              disabled={inRun || refundableSP <= 0}
              title={inRun ? "Cannot respec mid-delve." : `Refund ${refundableSP} SP for ${respecCost}g`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Skills
            </Button>
            {chosenPath !== undefined && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAbandonOpen(true)}
                disabled={inRun}
                title={inRun ? "Cannot abandon path mid-delve." : `Costs ${abandonCost}g`}
              >
                <Compass className="w-3.5 h-3.5 mr-1" /> Abandon Path
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* PATH CHOICE STATE — three possible banners depending on eligibility */}
      {lockedToChoose && (
        <Card className="p-4 bg-card/40 border-border">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h3 className="font-serif text-amber-200">Path Choice — locked until level {choiceLevel}</h3>
              <p className="text-xs text-muted-foreground italic mt-1">
                At level {choiceLevel} you will choose between two specializations. Live the base class first; the choice rewards understanding.
              </p>
              <p className="text-xs mt-2 text-muted-foreground">
                You are level {p.level}. <span className="text-foreground">{choiceLevel - p.level}</span> levels remain.
              </p>
            </div>
          </div>
        </Card>
      )}

      {eligibleToChoose && (
        <Card className="p-4 border-2" style={{ borderColor: "#f59e0b", backgroundColor: "#f59e0b11" }}>
          <div className="flex items-start gap-3 flex-wrap">
            <Compass className="w-6 h-6 text-amber-300 mt-0.5" />
            <div className="flex-1 min-w-[220px]">
              <h3 className="font-serif text-amber-200 text-lg">Choose your Path</h3>
              <p className="text-sm text-muted-foreground italic mt-1">
                "Two doors. You will only walk through one. Choose carefully — the other path remains closed unless you pay to forget."
              </p>
              <p className="text-xs mt-2 text-foreground/80">
                Base Warrior skills remain available regardless of choice. Switching paths later costs {PATH_RESPEC_GOLD}g plus an SP refund.
              </p>
            </div>
            <Button onClick={() => setChooseOpen(true)} disabled={inRun}>
              Open Choice
            </Button>
          </div>
        </Card>
      )}

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

      {/* BASE SKILLS section */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-serif text-amber-300 text-xl">Base Skills</h2>
          <span className="text-xs text-muted-foreground">Available to every {p.charClass}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <SkillTierRows
          tiers={baseByTier}
          inRun={inRun}
          onLearn={learnOrRankUpSkill}
          onEquip={equipSkill}
          onUnequip={unequipSkill}
        />
      </section>

      {/* PATH SKILLS section — only renders if path is chosen */}
      {chosenPath !== undefined && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2
              className="font-serif text-xl"
              style={{ color: chosenPathDef?.color ?? "#f59e0b" }}
            >
              {chosenPathDef?.name}
            </h2>
            <span className="text-xs text-muted-foreground italic">
              "{chosenPathDef?.tagline}"
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: `${chosenPathDef?.color}44` }} />
          </div>
          <SkillTierRows
            tiers={pathByTier}
            inRun={inRun}
            onLearn={learnOrRankUpSkill}
            onEquip={equipSkill}
            onUnequip={unequipSkill}
          />
        </section>
      )}

      {/* Respec confirmation (keeps path, refunds SP only) */}
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
              All current ranks and the action bar will be cleared. Your path is kept.
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

      {/* Abandon Path confirmation (refunds SP, clears path, surcharge) */}
      <Dialog open={abandonOpen} onOpenChange={setAbandonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Abandon your path?</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-foreground/90">
            <p className="italic text-muted-foreground">
              The Trainer's gaze does not move. "Be certain. The road you walked away from will not be the same one waiting if you return."
            </p>
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
              <div className="flex justify-between"><span>Spent SP refunded</span><span className="font-mono">{refundableSP}</span></div>
              <div className="flex justify-between"><span>SP refund cost</span><span className="font-mono">{refundableSP * SKILL_RESPEC_GOLD_PER_SP}g</span></div>
              <div className="flex justify-between"><span>Path surcharge</span><span className="font-mono">{PATH_RESPEC_GOLD}g</span></div>
              <div className="flex justify-between font-serif"><span>Total</span><span className="font-mono">{abandonCost}g</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Your gold</span><span className="font-mono">{p.gold}g</span></div>
            </div>
            <div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm">
              All ranks (base + path), your action bar, AND your chosen path will be cleared.
              You may pick a path again immediately.
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAbandonOpen(false)}>Cancel</Button>
            <Button
              onClick={() => { setAbandonOpen(false); abandonPath(); }}
              disabled={!abandonAffordable}
            >
              Abandon — {abandonCost}g
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CHOOSE PATH modal — pitch cards side by side */}
      <Dialog open={chooseOpen} onOpenChange={setChooseOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Choose Your Path — {p.charClass.replace(/^./, c => c.toUpperCase())}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground italic mb-3">
            This choice defines what skills you can learn going forward. Base skills remain available either way.
            You may switch paths later for {PATH_RESPEC_GOLD}g (plus your SP refund cost).
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {classPaths.map((def) => (
              <PathPitchCard
                key={def.id}
                def={def}
                onChoose={() => { setChooseOpen(false); choosePath(def.id); }}
                disabled={inRun}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PathPitchCard({ def, onChoose, disabled }: { def: PathDef; onChoose: () => void; disabled: boolean }) {
  return (
    <div
      className="rounded-lg border-2 p-4 space-y-3"
      style={{ borderColor: `${def.color}66`, backgroundColor: `${def.color}08` }}
    >
      <div>
        <h3 className="font-serif text-lg" style={{ color: def.color }}>{def.name}</h3>
        <p className="text-xs italic text-muted-foreground mt-0.5">"{def.tagline}"</p>
      </div>
      <p className="text-sm text-foreground/90">{def.description}</p>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Identity</div>
        <div className="text-sm text-foreground/80">{def.identity}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-emerald-400">Strengths</div>
        <ul className="text-xs space-y-0.5 mt-1">
          {def.strengths.map((s, i) => <li key={i} className="text-foreground/85">• {s}</li>)}
        </ul>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-rose-400">Weaknesses</div>
        <ul className="text-xs space-y-0.5 mt-1">
          {def.weaknesses.map((s, i) => <li key={i} className="text-foreground/85">• {s}</li>)}
        </ul>
      </div>
      <Button
        onClick={onChoose}
        disabled={disabled}
        className="w-full"
        style={{ backgroundColor: def.color }}
      >
        Choose {def.name.replace("Path of the ", "")}
      </Button>
    </div>
  );
}

function SkillTierRows({
  tiers, inRun, onLearn, onEquip, onUnequip,
}: {
  tiers: Record<1 | 2 | 3, SkillNode[]>;
  inRun: boolean;
  onLearn: (id: string) => void;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {([1, 2, 3] as const).map((tier) => {
        const nodes = tiers[tier];
        if (nodes.length === 0) return null;
        return (
          <div key={tier}>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-serif text-amber-300/90 text-sm">Tier {tier}</h3>
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {tier === 1 ? "Openers" : tier === 2 ? "Refinements" : "Capstones"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {nodes.map((node) => (
                <SkillNodeCard
                  key={node.id}
                  node={node}
                  inRun={inRun}
                  onLearn={() => onLearn(node.id)}
                  onEquip={() => onEquip(node.id)}
                  onUnequip={() => onUnequip(node.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkillNodeCard({
  node, inRun, onLearn, onEquip, onUnequip,
}: {
  node: SkillNode;
  inRun: boolean;
  onLearn: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}) {
  const { save } = useGame();
  if (!save) return null;
  const p = save.player;
  const rank = p.skillRanks[node.id] ?? 0;
  const isUnlocked = rank > 0;
  const isMaxed = rank >= node.maxRank;
  const blocker = skillRankUpBlocker(p, node);
  const nextCost = !isMaxed ? node.rankCosts[rank] : null;
  const nextLevelReq = !isMaxed ? requiredLevelForRank(node, rank + 1) : null;
  const equipped = p.equippedSkills.includes(node.id);
  const equippedFull = p.equippedSkills.length >= 5 && !equipped;
  const stats = skillStatsAtRank(node, Math.max(1, rank));

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
          {node.oncePerRun && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Limit</span>
              <span className="font-mono text-amber-400">Once / run</span>
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
          {nextLevelReq !== null && nextLevelReq > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Next rank req.</span>
              <span className={`font-mono ${p.level >= nextLevelReq ? "" : "text-rose-400"}`}>
                Lv {nextLevelReq}
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
