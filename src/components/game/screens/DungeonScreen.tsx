import { useEffect, useRef, useState } from "react";
import { useGame, generateLoot, CONSUMABLES } from "@/lib/game/store";
import { DUNGEONS, CLASS_SKILLS } from "@/lib/game/data";
import type { Consumable, Difficulty, Monster, RoomState } from "@/lib/game/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  availableDifficulties, consumeShield, DIFF_INDEX, generateItem, monsterAttack,
  playerAttack, rollTier, statCheck, statCheckChance, ROOM_DC, tickBuffs,
} from "@/lib/game/engine";
import { Confetti } from "../Confetti";
import { toast } from "sonner";
import { TIER_COLORS } from "@/lib/game/types";
import { DungeonLootPreview } from "../DungeonLootPreview";

const DIFFS: Difficulty[] = ["Novice","Adept","Expert","Master","Nightmare"];

// End-of-run completion bonuses, retuned downward so a Nightmare clear no
// longer hands the player 2+ free levels on top of mob/boss rewards.
const BONUS_GOLD_BY_DIFFICULTY: Record<Difficulty, number> = {
  Novice: 30, Adept: 60, Expert: 100, Master: 140, Nightmare: 180,
};
const BONUS_XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  Novice: 75, Adept: 130, Expert: 190, Master: 260, Nightmare: 340,
};

export function DungeonScreen() {
  const { save, startDungeon } = useGame();
  if (!save) return null;

  if (save.activeRun) return <ActiveRunView />;

  // Soft warning when the player is critically wounded. We intentionally
  // do NOT disable the buttons — the Resurrection Floor + Mercy Cot already
  // guarantee they can recover, and forcing a rest could re-create a soft
  // lock for hardcore players or in edge migrations.
  const p = save.player;
  const lowHpThreshold = Math.floor(p.maxHp * 0.25);
  const showLowHpWarning = p.hp <= lowHpThreshold;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-amber-200">Dungeons</h1>
        <p className="text-muted-foreground italic">Choose your trial. The loot remembers.</p>
      </div>
      {showLowHpWarning && (
        <Card className="p-3 border-destructive/40 bg-destructive/10 text-sm text-destructive flex items-center gap-2">
          <span className="text-base">⚠</span>
          <span>
            You are critically wounded ({p.hp}/{p.maxHp} HP). Rest at the Inn — or use the hayloft if your purse is light — before delving.
          </span>
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {DUNGEONS.map((d) => {
          const unlocked = save.player.unlockedDungeons.includes(d.id);
          const allowed = unlocked
            ? new Set(availableDifficulties(save.player, d.id))
            : new Set<Difficulty>();
          return (
            <Card key={d.id} className={`p-4 ${unlocked ? "bg-card/60" : "bg-card/20 opacity-60"} border-border`}>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl text-amber-300">{d.name}</h3>
                <DungeonLootPreview dungeon={d} />
              </div>
              <p className="text-sm text-muted-foreground italic mt-1">"{d.description}"</p>
              <p className="text-xs text-muted-foreground mt-2">Required Power: {d.minPower}</p>
              {unlocked ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DIFFS.map((diff, idx) => {
                      const isAvailable = allowed.has(diff);
                      if (isAvailable) {
                        return (
                          <Button key={diff} size="sm" variant="outline" onClick={() => startDungeon(d.id, diff)}>
                            {diff}
                          </Button>
                        );
                      }
                      const prevDiff = idx > 0 ? DIFFS[idx - 1] : "Novice";
                      return (
                        <Button
                          key={diff}
                          size="sm"
                          variant="outline"
                          disabled
                          title={`Clear ${prevDiff} first.`}
                          className="opacity-50"
                        >
                          {diff}
                        </Button>
                      );
                    })}
                  </div>
                  {allowed.size < DIFFS.length && (
                    <p className="mt-2 text-[11px] text-muted-foreground italic">
                      Beat each difficulty to unlock the next.
                    </p>
                  )}
                </>
              ) : <p className="mt-3 text-xs text-destructive">Locked. Increase your Power Score.</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ActiveRunView() {
  const { save, updateActiveRun, setPlayer, endRun, useConsumable } = useGame();
  const run = save!.activeRun!;
  const dungeon = DUNGEONS.find((d) => d.id === run.dungeonId)!;
  const room = run.rooms[run.currentRoom];
  const isBossRoom = room?.kind === "boss";
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [restOpen, setRestOpen] = useState(false);
  const [retreatOpen, setRetreatOpen] = useState(false);
  const logEnd = useRef<HTMLDivElement>(null);
  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [run.log.length]);

  if (!room) return null;

  const finish = (victory: boolean) => {
    if (victory) {
      const pityActive = save!.player.pity >= 8;
      const loot = generateLoot(dungeon, run.difficulty, true, pityActive);
      const hasEpicPlus = loot.some((l) => ["epic","legendary","mythic","relic","divine","celestial"].includes(l.tier));
      const bonusGold = BONUS_GOLD_BY_DIFFICULTY[run.difficulty];
      const bonusXp = BONUS_XP_BY_DIFFICULTY[run.difficulty];
      setPlayer((p) => ({ ...p, pity: hasEpicPlus ? 0 : p.pity + 1 }));
      if (loot.some((l) => ["divine","celestial","relic"].includes(l.tier))) {
        setConfettiTrigger((t) => t + 1);
      }
      // Use the functional updater so a delayed-by-setTimeout finish() can
      // never clobber doTurn's death-write of monster gold/xp/loot. Boss
      // rewards intentionally go into the PENDING pool (run.gold/xp/loot)
      // only — they're never promoted to carried, so a defeat-or-retreat
      // arriving after a hypothetical race would still forfeit them.
      updateActiveRun(r => ({
        ...r,
        loot: [...r.loot, ...loot],
        gold: r.gold + bonusGold,
        xp: r.xp + bonusXp,
      }));
      toast.success(`Victory! Boss slain, ${loot.length} new item${loot.length === 1 ? "" : "s"}.`);
      setTimeout(() => endRun("victory"), 150);
    } else {
      toast.error("You have fallen. You stagger back to Eldergate.");
      endRun("defeat");
    }
  };

  // Resolve handler invoked by RoomView / CombatView when a room finishes.
  // Three branches:
  //   1. Boss room → finish() with the combat outcome (no carry promotion).
  //   2. Non-boss combat lost → finish(false) (defeat path, no carry promotion).
  //   3. Non-boss success → promote everything in the pending pool into
  //      carried, mark the room resolved, and advance. All three writes go
  //      through a single functional update so we can't accidentally read a
  //      stale `run` from the closure (e.g. when this fires via setTimeout
  //      after a 400ms combat-death animation).
  const onResolve = (combatResult?: { victory: boolean }) => {
    if (isBossRoom) {
      if (combatResult?.victory) finish(true);
      else finish(false);
      return;
    }
    if (combatResult && !combatResult.victory) {
      finish(false);
      return;
    }
    updateActiveRun(r => {
      const rooms = r.rooms.map((rm, i) => i === r.currentRoom ? { ...rm, resolved: true } : rm);
      const nextIdx = r.currentRoom + 1;
      const nextKind = r.rooms[nextIdx]?.kind;
      const stepLog = nextKind === "boss"
        ? `→ The path ends. A heavy presence waits ahead.`
        : `→ You move deeper. Room ${nextIdx + 1}.`;
      return {
        ...r,
        rooms,
        // Promote the entire pending pool into carried. Because this is a
        // functional update, the pool always reflects the current room's
        // contribution (combat gold/xp/loot, trap reward, puzzle reward,
        // merchant purchase, etc.) regardless of how those writes were
        // scheduled.
        carriedGold: r.gold,
        carriedXp: r.xp,
        carriedLoot: [...r.loot],
        currentRoom: nextIdx,
        log: [...r.log.slice(-50), stepLog],
      };
    });
  };

  const confirmRetreat = () => {
    setRetreatOpen(false);
    endRun("retreat");
  };

  const restConsumables = save!.player.consumables.filter((s) => {
    const cd = CONSUMABLES.find(c => c.id === s.itemId);
    return cd && !cd.combatOnly && s.qty > 0;
  });

  return (
    <div className="space-y-4 relative">
      <Confetti trigger={confettiTrigger} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-amber-200">{dungeon.name}</h1>
          <p className="text-sm text-muted-foreground">{run.difficulty} · Room {run.currentRoom + 1} of {run.rooms.length}</p>
        </div>
        <div className="flex gap-2">
          {room.kind !== "combat" && room.kind !== "boss" && restConsumables.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setRestOpen(true)}>Rest</Button>
          )}
          {/* Retreat is the player's smart out: walk back with everything
              already secured in the carried pool. Disabled on the boss
              room (boss commitment is the headline tension). */}
          {isBossRoom ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="The boss chamber has no exits."
              className="opacity-50"
            >
              Retreat
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setRetreatOpen(true)}>
              Retreat
            </Button>
          )}
        </div>
      </div>

      {/* Room map */}
      <div className="flex flex-wrap items-center gap-1.5">
        {run.rooms.map((r, i) => (
          <div key={i} className={`w-8 h-8 rounded flex items-center justify-center text-xs border-2 ${
            i === run.currentRoom ? "border-primary bg-primary/20" :
            r.resolved ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" :
            "border-border bg-card/40 text-muted-foreground"
          }`}>
            {r.kind === "boss" ? "★" : i + 1}
          </div>
        ))}
        {/* Live carried-pool readout. Gives the player the information they
            need to make the Retreat decision before engaging the next room. */}
        <div className="ml-auto text-xs text-muted-foreground italic flex items-center gap-2 px-2 py-1 rounded bg-card/40 border border-border">
          <span className="text-emerald-400">Secured</span>
          <span>{run.carriedGold}g</span>
          <span>·</span>
          <span>{run.carriedXp} xp</span>
          <span>·</span>
          <span>{run.carriedLoot.length} item{run.carriedLoot.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* Active buffs banner */}
      {save!.player.activeBuffs.length > 0 && (
        <Card className="p-2 bg-card/40 border-amber-500/30">
          <div className="flex flex-wrap gap-2 text-xs">
            {save!.player.activeBuffs.map((b, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                {b.source} · {b.kind === "shield" ? `${b.magnitude} shield` : `${b.turnsLeft} turns`}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Room content */}
      <RoomView key={run.currentRoom} room={room} onResolve={onResolve} />

      {/* Combat log */}
      <Card className="parchment p-4 max-h-64 overflow-y-auto">
        <h3 className="font-serif text-amber-300 mb-2">Chronicle</h3>
        <div className="space-y-1 text-sm">
          {run.log.map((line, i) => <p key={i} className="text-foreground/90">{line}</p>)}
          <div ref={logEnd} />
        </div>
      </Card>

      {/* Retreat confirm dialog: shows the carried pool the player will
          walk home with, plus the boss reward they're forfeiting. */}
      <Dialog open={retreatOpen} onOpenChange={setRetreatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Retreat to Eldergate?</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-foreground/90">
            <p className="italic text-muted-foreground">
              You turn back through the rooms you've cleared. Whatever you have already secured comes with you.
            </p>
            <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
              <div className="text-xs uppercase tracking-widest text-emerald-400">You take</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>{run.carriedGold} gold</span>
                <span>{run.carriedXp} XP</span>
                <span>
                  {run.carriedLoot.length} item{run.carriedLoot.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div className="rounded border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              <div className="text-xs uppercase tracking-widest text-destructive">You forfeit</div>
              <div className="text-sm text-muted-foreground">
                The boss reward · completion bonus · anything still pending in this room.
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRetreatOpen(false)}>Press On</Button>
            <Button onClick={confirmRetreat}>Retreat</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rest dialog: out-of-combat consumable use */}
      <Dialog open={restOpen} onOpenChange={setRestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Rest a Moment</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground italic mb-2">Use out-of-combat consumables. Battle is paused.</p>
          {restConsumables.length === 0 && (
            <p className="text-sm italic text-muted-foreground">No restorative items to use.</p>
          )}
          <div className="space-y-2">
            {restConsumables.map((s) => {
              const cd = CONSUMABLES.find(c => c.id === s.itemId)!;
              const color = cd.rarity ? TIER_COLORS[cd.rarity] : "#a8a29e";
              return (
                <div key={s.itemId} className="flex items-center justify-between gap-2 rounded border-2 p-2 bg-card/60" style={{ borderColor: color }}>
                  <div>
                    <div className="font-serif" style={{ color }}>{cd.name} <span className="text-[11px] opacity-70">× {s.qty}</span></div>
                    <p className="text-xs text-foreground/80">{cd.description}</p>
                  </div>
                  <Button size="sm" onClick={() => useConsumable(cd.id)}>Use</Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomView({ room, onResolve }: { room: RoomState; onResolve: (r?: { victory: boolean }) => void }) {
  const { save, setPlayer, updateActiveRun, pushLog } = useGame();
  const run = save!.activeRun!;
  const dungeon = DUNGEONS.find((d) => d.id === run.dungeonId)!;

  if (room.kind === "combat" || room.kind === "boss") {
    return <CombatView room={room} onResolve={onResolve} />;
  }

  const handleChoice = (text: string, effect: () => void) => {
    pushLog(`• ${text}`);
    effect();
    onResolve();
  };

  // === stat-check helpers for trap/puzzle ===
  const diffIdx = DIFF_INDEX[run.difficulty];
  const trapDamage = 5 + diffIdx * 4;       // Novice 5 → Nightmare 21
  const trapReward = 8 + diffIdx * 4;
  const puzzleReward = 25 + diffIdx * 25;   // Novice 25 → Nightmare 125
  const puzzleBacklash = 4 + diffIdx * 3;   // Novice 4 → Nightmare 16
  const puzzleXp = 15 + diffIdx * 15;

  // Use base stat + class & affix contributions for the check
  const fullStats = (() => {
    // pull the same composite as combat sees
    const s = save!.player.stats;
    let agi = s.agi, intel = s.int;
    const player = save!.player;
    for (const slot of Object.keys(player.equipped) as (keyof typeof player.equipped)[]) {
      const it = player.equipped[slot]; if (!it) continue;
      agi += it.stats.agi ?? 0; intel += it.stats.int ?? 0;
      for (const a of it.affixes) {
        if (a.kind === "agi") agi += a.value;
        if (a.kind === "int") intel += a.value;
      }
    }
    for (const b of save!.player.activeBuffs) {
      if (b.kind === "buff_agi") agi += b.magnitude;
      if (b.kind === "buff_int") intel += b.magnitude;
    }
    return { agi, int: intel };
  })();

  const trapChance = statCheckChance(fullStats.agi, run.difficulty);
  const puzzleChance = statCheckChance(fullStats.int, run.difficulty);

  const attemptTrap = () => {
    const r = statCheck(fullStats.agi, run.difficulty);
    if (r.success) {
      handleChoice(
        `AGI ${r.bonus} + d20(${r.roll}) = ${r.total} vs DC ${r.threshold}. You weave through.`,
        () => {}
      );
    } else {
      handleChoice(
        `AGI ${r.bonus} + d20(${r.roll}) = ${r.total} vs DC ${r.threshold}. The trap finds you — ${trapDamage} damage.`,
        () => setPlayer((p) => ({ ...p, hp: Math.max(1, p.hp - trapDamage) }))
      );
    }
  };

  const pushTrap = () => {
    handleChoice(
      `You shoulder through. ${trapDamage} damage, but +${trapReward}g.`,
      () => {
        setPlayer((p) => ({ ...p, hp: Math.max(1, p.hp - trapDamage) }));
        updateActiveRun(r => ({ ...r, gold: r.gold + trapReward }));
      }
    );
  };

  const attemptPuzzle = () => {
    const r = statCheck(fullStats.int, run.difficulty);
    if (r.success) {
      handleChoice(
        `INT ${r.bonus} + d20(${r.roll}) = ${r.total} vs DC ${r.threshold}. The puzzle yields — +${puzzleReward}g, +${puzzleXp} xp.`,
        () => updateActiveRun(rr => ({ ...rr, gold: rr.gold + puzzleReward, xp: rr.xp + puzzleXp }))
      );
    } else {
      handleChoice(
        `INT ${r.bonus} + d20(${r.roll}) = ${r.total} vs DC ${r.threshold}. The runes backlash — ${puzzleBacklash} damage.`,
        () => setPlayer((p) => ({ ...p, hp: Math.max(1, p.hp - puzzleBacklash) }))
      );
    }
  };

  return (
    <Card className="parchment p-5 space-y-4">
      <p className="text-foreground/90 italic">{room.text}</p>
      <div className="flex flex-wrap gap-2">
        {room.kind === "trap" && (
          <>
            <Button variant="outline" onClick={attemptTrap}>
              Dodge — AGI {fullStats.agi} vs DC {ROOM_DC[run.difficulty]} ({trapChance}%)
            </Button>
            <Button variant="outline" onClick={pushTrap}>
              Push through — −{trapDamage} HP, +{trapReward}g
            </Button>
          </>
        )}
        {room.kind === "merchant" && (
          <>
            <Button variant="outline" disabled={save!.player.gold < 50} onClick={() => handleChoice("You purchase a mystery trinket.", () => {
              setPlayer((p) => ({ ...p, gold: p.gold - 50 }));
              const item = generateItem(rollTier(dungeon, run.difficulty, false));
              updateActiveRun(r => ({ ...r, loot: [...r.loot, item] }));
              pushLog(`✦ The merchant grins and hands you ${item.name}.`);
            })}>Buy mystery item (50g)</Button>
            <Button variant="outline" onClick={() => handleChoice("You move on.", () => {})}>Walk past</Button>
          </>
        )}
        {room.kind === "puzzle" && (
          <>
            <Button variant="outline" onClick={attemptPuzzle}>
              Attempt — INT {fullStats.int} vs DC {ROOM_DC[run.difficulty]} ({puzzleChance}%)
            </Button>
            <Button variant="outline" onClick={() => handleChoice("You skip it.", () => {})}>Skip</Button>
          </>
        )}
        {room.kind === "lore" && (
          <Button variant="outline" onClick={() => handleChoice("You learn a fragment of the world's grief.", () => {
            setPlayer((p) => ({ ...p, xp: p.xp + 25 }));
          })}>Read the tablet (+25 xp)</Button>
        )}
        {room.kind === "empty" && (
          <Button variant="outline" onClick={() => onResolve()}>Continue</Button>
        )}
      </div>
    </Card>
  );
}

function CombatView({ room, onResolve }: { room: RoomState; onResolve: (r: { victory: boolean }) => void }) {
  const { save, setPlayer, updateActiveRun, pushLog, unlockAchievement, dispatchEvent, useConsumableInCombat } = useGame();
  const run = save!.activeRun!;
  const dungeon = DUNGEONS.find((d) => d.id === run.dungeonId)!;
  const p = save!.player;
  const [monsterHp, setMonsterHp] = useState(room.monster!.hp);
  const [busy, setBusy] = useState(false);
  const [itemMenuOpen, setItemMenuOpen] = useState(false);

  useEffect(() => {
    if (room.monster && !p.codexMonsters.includes(room.monster.id)) {
      setPlayer((pp) => ({ ...pp, codexMonsters: [...pp.codexMonsters, room.monster!.id] }));
    }
    pushLog(`⚔ A ${room.monster!.name} appears! "${room.monster!.flavor}"`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monster: Monster = { ...room.monster!, hp: monsterHp };

  const doTurn = async (playerAction: () => { dmg: number; logLine: string; lifesteal?: number; manaCost?: number } | null) => {
    if (busy) return;
    setBusy(true);
    const res = playerAction();
    if (!res) { setBusy(false); return; }
    if (res.manaCost) setPlayer((pp) => ({ ...pp, mana: pp.mana - (res.manaCost ?? 0) }));
    pushLog(res.logLine);
    const newHp = monsterHp - res.dmg;
    setMonsterHp(newHp);
    if (res.lifesteal) {
      setPlayer((pp) => ({ ...pp, hp: Math.min(pp.maxHp, pp.hp + (res.lifesteal ?? 0)) }));
      pushLog(`  ↳ You drink ${res.lifesteal} life.`);
    }
    if (newHp <= 0) {
      const goldMult = (save!.player.activeBuffs ?? []).some((b) => b.kind === "gold_boost") ? 2 : 1;
      const goldGain = monster.gold * goldMult;
      pushLog(`✦ ${monster.name} crumples. +${monster.xp} xp, +${goldGain} gold.`);
      if (!p.achievements.includes("a_first_kill")) unlockAchievement("a_first_kill");
      dispatchEvent({ type: "monster_killed", monsterId: monster.id, dungeonId: dungeon.id });
      let extraLoot: ReturnType<typeof generateLoot> = [];
      // Trash-mob drop chance lowered from 35% → 20%. Boss loot piñatas
      // remain unchanged so the reward arc still points at the boss.
      if (Math.random() < 0.20 || room.kind === "boss") {
        extraLoot = generateLoot(dungeon, run.difficulty, false, false);
        extraLoot.forEach((l) => pushLog(`  ↳ Loot: ${l.name} [${l.tier}]`));
        extraLoot.forEach((l) => dispatchEvent({ type: "tier_found", tier: l.tier }));
      }
      // Functional update so the gold/xp/loot from this kill is folded
      // on top of whatever the latest run state is — important when
      // multiple turn-end writes interleave with carried-promotion reads.
      updateActiveRun(r => ({
        ...r,
        gold: r.gold + goldGain,
        xp: r.xp + monster.xp,
        loot: [...r.loot, ...extraLoot],
      }));
      setPlayer((pp) => tickBuffs(pp));
      setTimeout(() => onResolve({ victory: true }), 400);
      return;
    }
    // Monster turn after a short delay
    setTimeout(() => {
      const a = monsterAttack(monster, save!.player);
      pushLog(a.log);
      let died = false;
      setPlayer((pp) => {
        const { player: shielded, absorbed, remaining } = consumeShield(pp, a.damage);
        if (absorbed > 0) queueMicrotask(() => pushLog(`  ↳ Iron Skin absorbs ${absorbed} damage.`));
        const nextHp = shielded.hp - remaining;
        died = nextHp <= 0;
        return tickBuffs({ ...shielded, hp: Math.max(0, nextHp) });
      });
      // The setter mutates `died` synchronously; check after dispatch
      setTimeout(() => {
        if (died) {
          pushLog(`✘ Darkness takes you.`);
          onResolve({ victory: false });
        } else {
          setBusy(false);
        }
      }, 60);
    }, 500);
  };

  const basicAttack = () => {
    const r = playerAttack(save!.player, monster, 1, "strike");
    return { dmg: r.damage, logLine: r.log, lifesteal: r.lifesteal };
  };
  const useSkill = (s: { name: string; cost: number; mult: number }) => {
    if (save!.player.mana < s.cost) { toast.error("Not enough mana"); return null; }
    const r = playerAttack(save!.player, monster, s.mult, s.name);
    return { dmg: r.damage, logLine: r.log, lifesteal: r.lifesteal, manaCost: s.cost };
  };
  const useItemAction = (consumableId: string) => {
    const cd = CONSUMABLES.find(c => c.id === consumableId);
    const stack = save!.player.consumables.find((s) => s.itemId === consumableId);
    if (!cd || !stack || stack.qty <= 0) return null;
    const log = useConsumableInCombat(consumableId);
    if (!log) return null;
    return { dmg: 0, logLine: `You use ${cd.name}.` };
  };
  // In-combat Flee is the "I give up this fight" option. Boss combat is the
  // only place it can appear — the boss chamber disables the header's
  // Retreat button, so Flee is the player's safety valve there (counts as
  // a defeat: 50% of carried). In non-boss rooms we deliberately omit Flee
  // so players use the strictly-better header Retreat (100% of carried)
  // instead of trapping themselves into the wrong button.
  const concedeBoss = () => {
    pushLog("You concede the boss chamber.");
    onResolve({ victory: false });
  };

  const skills = CLASS_SKILLS[p.charClass];
  const isBoss = room.kind === "boss";
  const monsterColor = isBoss ? "#dc2626" : "#a855f7";
  const usableConsumables = save!.player.consumables.filter((s) => s.qty > 0);

  return (
    <>
      <Card className={`p-5 space-y-4 border-2 bg-card/70`} style={{ borderColor: monsterColor, boxShadow: `0 0 30px ${monsterColor}33` }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-2xl" style={{ color: monsterColor }}>{monster.name} {isBoss && "★"}</h3>
            <p className="text-xs text-muted-foreground italic">{monster.flavor}</p>
          </div>
          <div className="text-right text-sm">
            <div>ATK {monster.attack} · DEF {monster.defense}</div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1"><span>HP</span><span>{Math.max(0,monsterHp)} / {room.monster!.hp}</span></div>
          <Progress value={(Math.max(0,monsterHp) / room.monster!.hp) * 100} className="[&>div]:bg-red-500" />
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex justify-between text-xs mb-1"><span>You — {p.hp}/{p.maxHp} HP</span><span>{p.mana}/{p.maxMana} MP</span></div>
          <Progress value={(p.hp / p.maxHp) * 100} className="[&>div]:bg-emerald-500" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Button onClick={() => doTurn(basicAttack)} disabled={busy}>Attack</Button>
          {skills.map((s) => (
            <Button key={s.name} variant="outline" onClick={() => doTurn(() => useSkill(s))} disabled={busy || p.mana < s.cost}>
              {s.name} ({s.cost})
            </Button>
          ))}
          <Button variant="outline" disabled={busy || usableConsumables.length === 0} onClick={() => setItemMenuOpen(true)}>
            Use Item
          </Button>
          {isBoss ? (
            <Button variant="ghost" onClick={concedeBoss} disabled={busy} title="Concede the boss — half of secured rewards. The boss reward is forfeit.">
              Flee
            </Button>
          ) : (
            // Non-boss combat: no Flee. Use the header Retreat for a safe
            // exit (full carried payout), or play the fight through.
            <span className="hidden sm:block" aria-hidden />
          )}
        </div>
      </Card>

      <Dialog open={itemMenuOpen} onOpenChange={setItemMenuOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Use Consumable</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground italic mb-2">Counts as your turn.</p>
          {usableConsumables.length === 0 && <p className="text-sm italic text-muted-foreground">No consumables.</p>}
          <div className="space-y-2">
            {usableConsumables.map((s) => {
              const cd: Consumable | undefined = CONSUMABLES.find(c => c.id === s.itemId);
              if (!cd) return null;
              const color = cd.rarity ? TIER_COLORS[cd.rarity] : "#a8a29e";
              return (
                <div key={s.itemId} className="flex items-center justify-between gap-2 rounded border-2 p-2 bg-card/60" style={{ borderColor: color }}>
                  <div className="flex-1">
                    <div className="font-serif" style={{ color }}>{cd.name} <span className="text-[11px] opacity-70">× {s.qty}</span></div>
                    <p className="text-xs text-foreground/80">{cd.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setItemMenuOpen(false);
                      doTurn(() => useItemAction(cd.id));
                    }}
                  >
                    Use
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
