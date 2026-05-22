import { useGame } from "@/lib/game/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CLASS_SKILLS } from "@/lib/game/data";
import { StatTooltip } from "../StatTooltip";

export function CharacterScreen() {
  const { save, allocateStat } = useGame();
  if (!save) return null;
  const p = save.player;
  const skills = CLASS_SKILLS[p.charClass];

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
        <p className="text-muted-foreground capitalize">Level {p.level} {p.charClass}</p>
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
        <h2 className="font-serif text-xl text-amber-300 mb-3">Class Skills</h2>
        <ul className="space-y-2">
          {skills.map((s) => (
            <li key={s.name} className="p-3 rounded bg-background/40 border border-border">
              <div className="flex justify-between font-serif">
                <span>{s.name}</span>
                <span className="text-sky-400 text-sm">{s.cost} mana</span>
              </div>
              <p className="text-sm text-muted-foreground">{s.desc} (×{s.mult} damage)</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}