import { useGame, SKILL_TREE, PATHS } from "@/lib/game/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatTooltip } from "../StatTooltip";
import { SkillTooltip } from "../SkillTooltip";
import { Sparkles, GraduationCap, Compass } from "lucide-react";
import type { View } from "../Layout";
import type { SkillNode } from "@/lib/game/types";

export function CharacterScreen({ setView }: { setView?: (v: View) => void }) {
  const { save, allocateStat } = useGame();
  if (!save) return null;
  const p = save.player;
  const chosenPath = p.classPaths?.[p.charClass];
  const pathDef = chosenPath ? PATHS.find((d) => d.id === chosenPath) : undefined;

  // All skills the player has unlocked at any rank, for the read-only
  // overview on this screen. Live editing happens at the Skill Trainer.
  // Split into Base vs Path so the player can see their build's spine.
  const unlockedAll = SKILL_TREE.filter(
    (s) => s.charClass === p.charClass && (p.skillRanks?.[s.id] ?? 0) >= 1,
  );
  const unlockedBase = unlockedAll.filter((s) => s.path === undefined);
  const unlockedPath = unlockedAll.filter((s) => s.path !== undefined);

  const StatRow = ({ k, label }: { k: "str"|"agi"|"int"|"vit"; label: string }) => (
    <div className="flex items-center gap-3">
      <StatTooltip stat={k} charClass={p.charClass}>
        <span className="w-28 font-serif underline decoration-dotted decoration-muted-foreground/40 underline-offset-4">{label}</span>
      </StatTooltip>
      <span className="flex-1 text-amber-300 text-xl tabular-nums">{p.stats[k]}</span>
      {p.unspentPoints > 0 && <Button size="sm" variant="outline" onClick={() => allocateStat(k)}>+</Button>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-amber-200">{p.name}</h1>
        <p className="text-muted-foreground capitalize flex items-center gap-2 flex-wrap">
          <span>Level {p.level} {p.charClass}</span>
          {pathDef && (
            <span
              className="px-2 py-0.5 rounded text-[11px] uppercase tracking-widest border inline-flex items-center gap-1"
              style={{ color: pathDef.color, borderColor: `${pathDef.color}66`, backgroundColor: `${pathDef.color}11` }}
            >
              <Compass className="w-3 h-3" />
              {pathDef.name.replace("Path of the ", "")}
            </span>
          )}
        </p>
        {pathDef && (
          <p className="text-xs italic text-muted-foreground mt-1">"{pathDef.tagline}"</p>
        )}
      </div>

      <Card className="parchment p-5 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1"><span>Experience</span><span>{p.xp} / {p.xpToNext}</span></div>
          <Progress value={(p.xp / p.xpToNext) * 100} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1"><span>Health</span><span>{p.hp} / {p.maxHp}</span></div>
          <Progress value={(p.hp / p.maxHp) * 100} className="[&>div]:bg-red-500" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1"><span>Mana</span><span>{p.mana} / {p.maxMana}</span></div>
          <Progress value={(p.mana / p.maxMana) * 100} className="[&>div]:bg-sky-500" />
        </div>
      </Card>

      <Card className="p-5 bg-card/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-amber-300">Attributes</h2>
          {p.unspentPoints > 0 && <span className="text-sm text-emerald-400">{p.unspentPoints} points available</span>}
        </div>
        <StatRow k="str" label="Strength" />
        <StatRow k="agi" label="Agility" />
        <StatRow k="int" label="Intelligence" />
        <StatRow k="vit" label="Vitality" />
      </Card>

      <Card className="p-5 bg-card/60">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="font-serif text-xl text-amber-300 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" /> Skills
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> {p.skillPoints} SP
            </span>
            <span className="text-muted-foreground">
              {unlockedAll.length} learned · {p.equippedSkills.length}/5 equipped
            </span>
            {setView && (
              <Button size="sm" variant="outline" onClick={() => setView("trainer")}>
                Open Trainer
              </Button>
            )}
          </div>
        </div>
        {unlockedAll.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            You have not yet learned any skills. Visit the Skill Trainer at Eldergate.
          </p>
        ) : (
          <div className="space-y-4">
            {unlockedBase.length > 0 && (
              <SkillGroup title="Base Skills" subtitle={`Every ${p.charClass} has these.`} skills={unlockedBase} player={p} />
            )}
            {unlockedPath.length > 0 && pathDef && (
              <SkillGroup
                title={pathDef.name}
                subtitle={pathDef.identity}
                color={pathDef.color}
                skills={unlockedPath}
                player={p}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function SkillGroup({
  title, subtitle, color, skills, player,
}: {
  title: string;
  subtitle?: string;
  color?: string;
  skills: SkillNode[];
  player: import("@/lib/game/types").Player;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-serif text-sm" style={{ color: color ?? "#fbbf24" }}>{title}</h3>
        {subtitle && <span className="text-[11px] text-muted-foreground italic">{subtitle}</span>}
        <div className="flex-1 h-px" style={{ backgroundColor: color ? `${color}33` : undefined }} />
      </div>
      <ul className="space-y-2">
        {skills.map((s) => {
          const rank = player.skillRanks[s.id];
          const equipped = player.equippedSkills.includes(s.id);
          return (
            <li key={s.id}>
              <SkillTooltip skill={s} player={player} rank={rank}>
                <div className="p-3 rounded bg-background/40 border border-border cursor-help">
                  <div className="flex justify-between font-serif items-center">
                    <span>
                      {s.name}
                      <span className="ml-2 text-[11px] text-amber-400 tracking-wider">
                        R{rank}/{s.maxRank}
                      </span>
                      {equipped && (
                        <span className="ml-2 text-[10px] uppercase text-sky-400">equipped</span>
                      )}
                    </span>
                    <span className="text-sky-400 text-sm">
                      {s.baseManaCost + s.manaCostPerRank * (rank - 1)} mana
                      {s.cooldown > 0 && <span className="ml-1 text-muted-foreground">· CD {s.cooldown}t</span>}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </SkillTooltip>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
