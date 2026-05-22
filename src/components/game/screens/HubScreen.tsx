import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGame, QUESTS, TRADERS } from "@/lib/game/store";
import type { View } from "../Layout";
import { Swords, Backpack, Hammer, Trophy, Sparkles, ScrollText, Bed, GraduationCap } from "lucide-react";
import { TraderModal, TraderCard } from "../TraderModal";
import { useState } from "react";
import { describeObjective } from "@/lib/game/engine";

export function HubScreen({ setView }: { setView: (v: View) => void }) {
  const { save, claimDaily, turnInQuest, startNewGamePlus, restAtInn, restAtInnFree, innCost, canUseMercyCot } = useGame();
  const [openTrader, setOpenTrader] = useState<string | null>(null);
  if (!save) return null;
  const p = save.player;
  const today = new Date().toDateString();
  const dailyClaimed = p.lastDailyClaim === today;
  const ngpUnlocked = p.unlockedFeatures.includes("new_game_plus");
  const fullyRested = p.hp >= p.maxHp && p.mana >= p.maxMana;
  const inRun = !!save.activeRun;
  // Mercy Cot is visible only when broke + below half HP. No cooldown by
  // design (a cooldown would re-create the soft lock we're solving).
  const mercyCap = Math.floor(p.maxHp * 0.5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-amber-200 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">Eldergate</h1>
        <p className="text-muted-foreground italic">The last bastion at the edge of the Aetherwild. Lanterns sway. The forge never sleeps.</p>
        {p.prestige > 0 && (
          <p className="text-xs text-amber-400 mt-1">Prestige {p.prestige} — your saga continues anew.</p>
        )}
      </div>

      {save.activeRun && (
        <Card className="parchment p-4 flex items-center justify-between">
          <div>
            <div className="font-serif text-amber-300">A door stands ajar.</div>
            <p className="text-sm text-muted-foreground">You have an unfinished run in progress.</p>
          </div>
          <Button onClick={() => setView("dungeons")}>Continue Last Run</Button>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <button onClick={() => setView("dungeons")} className="glow-card text-left rounded-lg border-2 border-primary/30 p-4 bg-card/60 text-primary"><Swords className="w-6 h-6 mb-2"/><div className="font-serif">Dungeons</div><p className="text-xs text-muted-foreground">Venture into darkness.</p></button>
        <button onClick={() => setView("inventory")} className="glow-card text-left rounded-lg border-2 border-amber-500/30 p-4 bg-card/60 text-amber-400"><Backpack className="w-6 h-6 mb-2"/><div className="font-serif">Inventory</div><p className="text-xs text-muted-foreground">{p.inventory.length} unequipped · {p.consumables.reduce((a,c)=>a+c.qty,0)} potions</p></button>
        <button onClick={() => setView("trainer")} className="glow-card text-left rounded-lg border-2 border-sky-500/30 p-4 bg-card/60 text-sky-300"><GraduationCap className="w-6 h-6 mb-2"/><div className="font-serif">Skill Trainer</div><p className="text-xs text-muted-foreground">{p.skillPoints} SP · {p.equippedSkills.length}/5 equipped</p></button>
        <button onClick={() => setView("forge")} className="glow-card text-left rounded-lg border-2 border-orange-500/30 p-4 bg-card/60 text-orange-400"><Hammer className="w-6 h-6 mb-2"/><div className="font-serif">The Forge</div><p className="text-xs text-muted-foreground">{p.shards} shards · {p.essence} essence</p></button>
        <button onClick={() => setView("achievements")} className="glow-card text-left rounded-lg border-2 border-yellow-400/30 p-4 bg-card/60 text-yellow-400"><Trophy className="w-6 h-6 mb-2"/><div className="font-serif">Glory</div><p className="text-xs text-muted-foreground">{p.achievements.length} unlocked</p></button>
      </div>

      <div>
        <h2 className="font-serif text-xl text-amber-200 mb-2">The Market</h2>
        <p className="text-xs text-muted-foreground italic mb-3">"Spend coin. Build trust. Better wares follow."</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {TRADERS.map((t) => (
            <TraderCard key={t.id} trader={t} onOpen={() => setOpenTrader(t.id)} />
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card className="parchment p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl text-amber-200 flex items-center gap-2">
                <Bed className="w-5 h-5" /> The Sleeping Lantern
              </h3>
              <p className="text-xs text-muted-foreground italic">A bed of straw, soup that's mostly broth. The innkeeper asks no questions.</p>
              <p className="text-xs mt-2">
                <span className="text-emerald-400">HP {p.hp}/{p.maxHp}</span>
                <span className="text-muted-foreground"> · </span>
                <span className="text-sky-400">MP {p.mana}/{p.maxMana}</span>
              </p>
              {canUseMercyCot && (
                <p className="text-[11px] mt-1 italic text-amber-400/80">
                  The innkeeper notices your empty purse and nods toward the hayloft.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Button
                onClick={restAtInn}
                disabled={inRun || fullyRested || p.gold < innCost}
                variant={fullyRested ? "outline" : "default"}
              >
                {inRun ? "Mid-Delve" : fullyRested ? "Rested" : `Rest — ${innCost}g`}
              </Button>
              {canUseMercyCot && (
                <Button
                  onClick={restAtInnFree}
                  variant="outline"
                  size="sm"
                  title={`Free shelter. Restores HP to ${mercyCap}/${p.maxHp}. Does not restore mana.`}
                >
                  Sleep in the stables (free)
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="parchment p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl text-amber-200">Daily Blessing</h3>
              <p className="text-xs text-muted-foreground italic">A small offering from the temple. Once per day.</p>
            </div>
            <Button onClick={claimDaily} disabled={dailyClaimed}>
              {dailyClaimed ? "Claimed Today" : "Claim +100g"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-card/60 border-border">
        <h3 className="font-serif text-xl text-amber-200 mb-2 flex items-center gap-2"><ScrollText className="w-5 h-5" />Quest Board</h3>
        {p.activeQuests.length === 0 && (
          <p className="text-sm italic text-muted-foreground">No active quests. The roads are quiet.</p>
        )}
        <ul className="space-y-3">
          {p.activeQuests.map((aq) => {
            const def = QUESTS.find(q => q.id === aq.questId);
            if (!def) return null;
            const ready = aq.status === "ready_to_turn_in";
            const totalProg = aq.objectives.reduce((s, o) => s + o.current, 0);
            const totalNeed = aq.objectives.reduce((s, o) => s + o.count, 0);
            const pct = (totalProg / Math.max(1, totalNeed)) * 100;
            return (
              <li
                key={aq.questId}
                className={`rounded p-3 ${ready ? "bg-emerald-500/10 border border-emerald-500/40" : "bg-background/40 border border-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-serif text-amber-300">{def.title}</div>
                    <p className="text-xs text-muted-foreground italic">{def.description}</p>
                    <ul className="mt-2 space-y-1">
                      {aq.objectives.map((o) => (
                        <li key={o.id} className="text-xs flex items-center gap-2">
                          <span className={o.current >= o.count ? "text-emerald-400" : "text-muted-foreground"}>
                            {o.current >= o.count ? "✓" : "○"}
                          </span>
                          <span>{describeObjective(o)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-400 mt-2">Reward: {def.rewardSummary}</p>
                  </div>
                  <div className="text-right space-y-2 min-w-[120px]">
                    {ready ? (
                      <Button size="sm" onClick={() => turnInQuest(aq.questId)}>Turn In</Button>
                    ) : (
                      <>
                        <div className="text-[10px] text-muted-foreground">{Math.round(pct)}%</div>
                        <Progress value={pct} className="h-1.5 w-24" />
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {p.completedQuests.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">Completed ({p.completedQuests.length})</summary>
            <ul className="mt-2 space-y-1">
              {p.completedQuests.map((qid) => {
                const def = QUESTS.find(q => q.id === qid);
                if (!def) return null;
                return (
                  <li key={qid} className="text-xs text-emerald-400">✓ {def.title}</li>
                );
              })}
            </ul>
          </details>
        )}
      </Card>

      {ngpUnlocked && (
        <Card className="parchment p-4 border-2" style={{ borderColor: "#ec4899", boxShadow: "0 0 24px rgba(236,72,153,0.25)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl flex items-center gap-2 text-pink-300">
                <Sparkles className="w-5 h-5" /> New Game+
              </h3>
              <p className="text-sm text-muted-foreground">Begin again. Keep your codex, achievements, and the memory of stars. Start +1 prestige (better stats, more starting gold).</p>
            </div>
            <Button
              onClick={() => {
                if (confirm("Begin New Game+? Your gear and quests reset; codex and achievements are kept.")) {
                  startNewGamePlus();
                }
              }}
            >
              Ascend
            </Button>
          </div>
        </Card>
      )}

      <TraderModal traderId={openTrader} onClose={() => setOpenTrader(null)} />
    </div>
  );
}
