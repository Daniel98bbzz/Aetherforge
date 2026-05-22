import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type {
  ActiveRun, CharClass, Consumable, GameEvent, Item, Player, QuestDef,
  QuestState, SaveData, Slot, Tier, TraderState,
} from "./types";
import { SAVE_VERSION, TIER_VALUE } from "./types";
import {
  ACHIEVEMENTS, CONSUMABLES, DUNGEONS, ITEMS,
  QUESTS, STARTER_KITS, TRADERS,
} from "./data";
import {
  addConsumable, applyConsumable, buildRooms, computeStats,
  consumeShield, DIFF_INDEX, generateItem, generateTraderStock, makeQuestState,
  powerScore, randInt, reconcileLevelQuests, recomputeUnlocks, recordDungeonClear,
  rollTier, shardsForTier, templateIdOf,
  traderXpToNext, tryLevelUp, uid, updateQuestProgress,
  upgradeChance, upgradeCost, xpToNext,
} from "./engine";
import type { Difficulty, DungeonDef } from "./types";
import { DIFFICULTY_ORDER } from "./types";
import { toast } from "sonner";

const SAVE_KEY = "aetherforge_save_v1";

function starterQuestStates(): QuestState[] {
  return QUESTS
    .filter(q => !q.prerequisiteQuestIds || q.prerequisiteQuestIds.length === 0)
    .map(makeQuestState);
}

function freshTrader(level = 1): TraderState {
  return {
    level,
    xp: 0,
    xpToNext: traderXpToNext(level),
    stockItems: [],
    stockConsumables: [],
    lastRefresh: "",
  };
}

function freshTraders(): Record<string, TraderState> {
  const out: Record<string, TraderState> = {};
  for (const t of TRADERS) out[t.id] = freshTrader();
  return out;
}

function freshPlayer(name: string, charClass: CharClass, hardcore: boolean, prestige = 0): Player {
  const kit = STARTER_KITS[charClass].map((id) => {
    const base = ITEMS.find((i) => i.id === id)!;
    return { ...base, id: base.id + "_" + uid(), affixes: [] };
  });
  const equipped: Player["equipped"] = {};
  for (const it of kit) equipped[it.slot] = it;
  const prestigeBonus = prestige * 2;
  const player: Player = {
    name, charClass,
    level: 1, xp: 0, xpToNext: xpToNext(1),
    hp: 60 + prestigeBonus * 5, maxHp: 60 + prestigeBonus * 5,
    mana: 30 + prestigeBonus * 2, maxMana: 30 + prestigeBonus * 2,
    stats: charClass === "warrior" ? { str:8+prestigeBonus,agi:4,int:3,vit:6+prestigeBonus }
      : charClass === "ranger" ? { str:5,agi:8+prestigeBonus,int:4,vit:4+prestigeBonus }
      : { str:3,agi:4,int:9+prestigeBonus,vit:4+prestigeBonus },
    unspentPoints: 0,
    gold: 50 + prestige * 200,
    shards: 0, essence: 0,
    inventory: [],
    equipped,
    consumables: [],
    activeBuffs: [],
    unlockedDungeons: ["d_thicket"],
    codexMonsters: [],
    codexItems: kit.map(k => templateIdOf(k.id)),
    achievements: [],
    activeQuests: starterQuestStates(),
    completedQuests: [],
    unlockedFeatures: [],
    pity: 0,
    prestige,
    hardcore,
    // Fresh players have not cleared any dungeon yet — only Novice is
    // selectable for d_thicket until they clear it.
    dungeonProgress: {},
  };
  // Ensure starting "reach_level" quests already reflect the player's level.
  return reconcileLevelQuests(player);
}

function migrateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as any;
  if (!data.player) return null;
  const p = data.player;

  // Saves predating SAVE_VERSION 3 had no per-dungeon difficulty tracking.
  // To avoid stripping access from returning players who already conquered
  // higher difficulties, grant them full ("Nightmare") access for every
  // dungeon they had previously unlocked. New unlocks going forward start
  // at Novice as designed.
  const isLegacy = typeof data.version !== "number" || data.version < 3;
  const unlockedDungeons: string[] = Array.isArray(p.unlockedDungeons) && p.unlockedDungeons.length > 0
    ? p.unlockedDungeons
    : ["d_thicket"];
  let dungeonProgress: Record<string, Difficulty> = {};
  if (p.dungeonProgress && typeof p.dungeonProgress === "object") {
    dungeonProgress = { ...p.dungeonProgress };
  } else if (isLegacy) {
    for (const did of unlockedDungeons) dungeonProgress[did] = "Nightmare";
  }

  // Build a forward-compatible Player from any prior schema
  const player: Player = {
    name: p.name ?? "Aether Warden",
    charClass: p.charClass ?? "warrior",
    level: p.level ?? 1,
    xp: p.xp ?? 0,
    xpToNext: p.xpToNext ?? xpToNext(p.level ?? 1),
    hp: p.hp ?? 60,
    maxHp: p.maxHp ?? 60,
    mana: p.mana ?? 30,
    maxMana: p.maxMana ?? 30,
    stats: p.stats ?? { str:5, agi:5, int:5, vit:5 },
    unspentPoints: p.unspentPoints ?? 0,
    gold: p.gold ?? 0,
    shards: p.shards ?? 0,
    essence: p.essence ?? 0,
    inventory: Array.isArray(p.inventory) ? p.inventory : [],
    equipped: p.equipped ?? {},
    consumables: Array.isArray(p.consumables) ? p.consumables : [],
    activeBuffs: Array.isArray(p.activeBuffs) ? p.activeBuffs : [],
    unlockedDungeons,
    codexMonsters: Array.isArray(p.codexMonsters) ? p.codexMonsters : [],
    codexItems: Array.isArray(p.codexItems) ? p.codexItems : [],
    achievements: Array.isArray(p.achievements) ? p.achievements : [],
    activeQuests: Array.isArray(p.activeQuests) ? p.activeQuests : [],
    completedQuests: Array.isArray(p.completedQuests) ? p.completedQuests : (Array.isArray(p.questsCompleted) ? p.questsCompleted : []),
    unlockedFeatures: Array.isArray(p.unlockedFeatures) ? p.unlockedFeatures : [],
    pity: p.pity ?? 0,
    prestige: p.prestige ?? 0,
    hardcore: !!p.hardcore,
    lastDailyClaim: p.lastDailyClaim,
    dungeonProgress,
  };
  // Seed starter quests if migrating from a save that didn't have them
  if (player.activeQuests.length === 0) {
    const starters = QUESTS.filter(q =>
      !player.completedQuests.includes(q.id) &&
      (!q.prerequisiteQuestIds || q.prerequisiteQuestIds.length === 0)
    );
    player.activeQuests = starters.map(makeQuestState);
  }
  // Initialize traders
  const traders: Record<string, TraderState> = (data.traders && typeof data.traders === "object") ? { ...data.traders } : {};
  for (const t of TRADERS) {
    if (!traders[t.id]) traders[t.id] = freshTrader();
    else {
      // patch any missing fields
      const ts = traders[t.id];
      traders[t.id] = {
        level: ts.level ?? 1,
        xp: ts.xp ?? 0,
        xpToNext: ts.xpToNext ?? traderXpToNext(ts.level ?? 1),
        stockItems: Array.isArray(ts.stockItems) ? ts.stockItems : [],
        stockConsumables: Array.isArray(ts.stockConsumables) ? ts.stockConsumables : [],
        lastRefresh: ts.lastRefresh ?? "",
      };
    }
  }
  // Forward-compat for the carried-rewards split (SAVE_VERSION 4). Legacy
  // saves that crash-recovered a run had no carried pool — default both to
  // an empty pool so worst-case the player walks back with what they would
  // have anyway, no rewards retroactively granted.
  let activeRun: ActiveRun | null = null;
  if (data.activeRun && typeof data.activeRun === "object") {
    const ar = data.activeRun as Partial<ActiveRun>;
    activeRun = {
      dungeonId: ar.dungeonId ?? "",
      difficulty: ar.difficulty ?? "Novice",
      rooms: Array.isArray(ar.rooms) ? ar.rooms : [],
      currentRoom: ar.currentRoom ?? 0,
      gold: ar.gold ?? 0,
      xp: ar.xp ?? 0,
      loot: Array.isArray(ar.loot) ? ar.loot : [],
      carriedGold: ar.carriedGold ?? 0,
      carriedXp: ar.carriedXp ?? 0,
      carriedLoot: Array.isArray(ar.carriedLoot) ? ar.carriedLoot : [],
      log: Array.isArray(ar.log) ? ar.log : [],
    };
  }
  return {
    // Snap any "reach_level" quests to the loaded player's actual level so
    // legacy saves (and the prior bug) display correct progress on next load.
    player: reconcileLevelQuests(player),
    activeRun,
    traders,
    version: SAVE_VERSION,
  };
}

// Outcome of a finished run. Drives the reward payout and the
// resurrection-floor / hardcore-permadeath branches in endRun.
//   victory — boss slain, full run rewards apply.
//   defeat  — player KO'd in combat; 50% of carried pool, half loot.
//   retreat — voluntary safe exit; 100% of carried pool, no boss reward.
export type RunOutcome = "victory" | "defeat" | "retreat";

interface GameContextValue {
  save: SaveData | null;
  hasSave: boolean;
  newGame: (name: string, cls: CharClass, hardcore: boolean) => void;
  loadGame: () => void;
  resetGame: () => void;
  setPlayer: (updater: (p: Player) => Player) => void;
  setActiveRun: (r: ActiveRun | null) => void;
  // Functional update for activeRun — always reads the latest state, so
  // ordering between setTimeout-deferred callbacks and immediate state
  // writes can't accidentally clobber each other. Required for the
  // carried/pending reward split to land correctly.
  updateActiveRun: (updater: (r: ActiveRun) => ActiveRun) => void;
  // gear
  equip: (item: Item) => void;
  unequip: (slot: Slot) => void;
  dismantle: (itemId: string) => void;
  sellItem: (itemId: string, traderId?: string) => void;
  sellAll: (tiers: Tier[], traderId?: string) => void;
  upgradeItem: (itemId: string) => void;
  allocateStat: (key: "str"|"agi"|"int"|"vit") => void;
  // dungeon
  startDungeon: (dungeonId: string, diff: Difficulty) => void;
  pushLog: (s: string) => void;
  endRun: (outcome: RunOutcome) => void;
  // achievements + daily
  unlockAchievement: (id: string) => void;
  claimDaily: () => void;
  restAtInn: () => void;
  restAtInnFree: () => void;   // Mercy Cot — free, capped at 50% HP, broke-only.
  innCost: number;
  canUseMercyCot: boolean;     // True when broke + below 50% maxHp + not mid-run.
  // event bus
  dispatchEvent: (event: GameEvent) => void;
  // traders
  refreshTraderStock: (traderId: string, force?: boolean) => void;
  buyItem: (traderId: string, itemId: string) => void;
  buyConsumable: (traderId: string, consumableId: string, qty: number) => void;
  // consumables
  useConsumable: (consumableId: string) => void;
  useConsumableInCombat: (consumableId: string) => string | null;
  // quests
  turnInQuest: (questId: string) => void;
  // ngp
  startNewGamePlus: () => void;
  power: number;
}

const Ctx = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [save, setSave] = useState<SaveData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const migrated = migrateSave(parsed);
        if (migrated) setSave(migrated);
      }
    } catch (e) { console.warn(e); }
  }, []);

  useEffect(() => {
    if (save) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {}
    }
  }, [save]);

  const hasSave = !!save;

  const newGame = useCallback((name: string, cls: CharClass, hardcore: boolean) => {
    const player = freshPlayer(name || "Aether Warden", cls, hardcore);
    setSave({ player, activeRun: null, traders: freshTraders(), version: SAVE_VERSION });
  }, []);

  const loadGame = useCallback(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const migrated = migrateSave(JSON.parse(raw));
      if (migrated) setSave(migrated);
    }
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setSave(null);
  }, []);

  const setPlayer = useCallback((updater: (p: Player) => Player) => {
    setSave((s) => s ? { ...s, player: updater(s.player) } : s);
  }, []);

  const setActiveRun = useCallback((r: ActiveRun | null) => {
    setSave((s) => s ? { ...s, activeRun: r } : s);
  }, []);

  const updateActiveRun = useCallback((updater: (r: ActiveRun) => ActiveRun) => {
    setSave((s) => (s && s.activeRun) ? { ...s, activeRun: updater(s.activeRun) } : s);
  }, []);

  const equip = useCallback((item: Item) => {
    setPlayer((p) => {
      const inv = p.inventory.filter((i) => i.id !== item.id);
      const prev = p.equipped[item.slot];
      const equipped = { ...p.equipped, [item.slot]: item };
      if (prev) inv.push(prev);
      // Re-evaluate dungeon unlocks the instant gear changes — the fix for
      // the "Power 59 in town but Voidspire still locked" bug.
      const { player: unlocked, newlyUnlocked } = recomputeUnlocks({ ...p, inventory: inv, equipped });
      for (const d of newlyUnlocked) {
        queueMicrotask(() => toast.success(`✦ New dungeon unlocked: ${d.name}`));
      }
      return unlocked;
    });
  }, [setPlayer]);

  const unequip = useCallback((slot: Slot) => {
    setPlayer((p) => {
      const it = p.equipped[slot];
      if (!it) return p;
      const equipped = { ...p.equipped };
      delete equipped[slot];
      // Defensive: unlocks are monotonic, so this normally won't add any —
      // but keeping the call symmetric keeps the invariant clean.
      const { player: unlocked, newlyUnlocked } = recomputeUnlocks({ ...p, equipped, inventory: [...p.inventory, it] });
      for (const d of newlyUnlocked) {
        queueMicrotask(() => toast.success(`✦ New dungeon unlocked: ${d.name}`));
      }
      return unlocked;
    });
  }, [setPlayer]);

  const dismantle = useCallback((itemId: string) => {
    setPlayer((p) => {
      const it = p.inventory.find((i) => i.id === itemId);
      if (!it) return p;
      const r = shardsForTier(it.tier);
      toast.success(`Dismantled ${it.name}: +${r.shards} shards${r.essence?`, +${r.essence} essence`:""}`);
      return { ...p, inventory: p.inventory.filter(i=>i.id!==itemId), shards: p.shards + r.shards, essence: p.essence + r.essence };
    });
  }, [setPlayer]);

  // Trader XP rate when selling: 25% of the buy-rate. The economy overhaul
  // intentionally throttles vendor-trash → trader-level farming so reaching
  // max trader takes real, varied spend rather than dismantle-flood loops.
  const SELL_XP_RATIO = 0.25;
  // Sell-back ratio: the fraction of item.value the player receives when
  // selling. Dropped from 0.40 → 0.25 to slow passive gold accumulation.
  const SELL_VALUE_RATIO = 0.25;

  const sellItem = useCallback((itemId: string, traderId?: string) => {
    setSave((s) => {
      if (!s) return s;
      const it = s.player.inventory.find(i => i.id === itemId);
      if (!it) return s;
      const price = Math.max(1, Math.round(it.value * SELL_VALUE_RATIO));
      let traders = s.traders;
      if (traderId) {
        const tdef = TRADERS.find(td => td.id === traderId);
        if (tdef) {
          const xpGain = Math.max(1, Math.round(price * tdef.xpPerGoldSpent * SELL_XP_RATIO));
          traders = grantTraderXp(traderId, xpGain, traders);
        }
      }
      queueMicrotask(() => toast.success(`Sold ${it.name} for ${price}g.`));
      return {
        ...s,
        player: {
          ...s.player,
          inventory: s.player.inventory.filter(i => i.id !== itemId),
          gold: s.player.gold + price,
        },
        traders,
      };
    });
  }, []);

  const sellAll = useCallback((tiers: Tier[], traderId?: string) => {
    if (tiers.length === 0) return;
    setSave((s) => {
      if (!s) return s;
      const tset = new Set(tiers);
      const toSell = s.player.inventory.filter(i => tset.has(i.tier));
      if (toSell.length === 0) {
        queueMicrotask(() => toast.error("No items matching that filter."));
        return s;
      }
      const total = toSell.reduce((acc, it) => acc + Math.max(1, Math.round(it.value * SELL_VALUE_RATIO)), 0);
      let traders = s.traders;
      if (traderId) {
        const tdef = TRADERS.find(td => td.id === traderId);
        if (tdef) {
          const xpGain = Math.max(1, Math.round(total * tdef.xpPerGoldSpent * SELL_XP_RATIO));
          traders = grantTraderXp(traderId, xpGain, traders);
        }
      }
      queueMicrotask(() => toast.success(`Sold ${toSell.length} item${toSell.length === 1 ? "" : "s"} for ${total}g.`));
      return {
        ...s,
        player: {
          ...s.player,
          inventory: s.player.inventory.filter(i => !tset.has(i.tier)),
          gold: s.player.gold + total,
        },
        traders,
      };
    });
  }, []);

  const upgradeItem = useCallback((itemId: string) => {
    setPlayer((p) => {
      const it = p.inventory.find((i) => i.id === itemId);
      if (!it) return p;
      const cost = upgradeCost(it.tier);
      if (p.shards < cost.shards || p.essence < cost.essence) {
        toast.error("Not enough materials");
        return p;
      }
      const chance = upgradeChance(it.tier);
      const success = Math.random() * 100 < chance;
      const inv = p.inventory.filter((i) => i.id !== itemId);
      if (success) {
        const tierIdx = TIER_VALUE[it.tier];
        const order: Tier[] = ["common","uncommon","rare","epic","legendary","mythic","relic","divine","celestial"];
        const newTier = order[Math.min(8, tierIdx)];
        const upgraded = generateItem(newTier, it.slot);
        toast.success(`✦ Upgrade success! ${upgraded.name} (${newTier})`);
        return {
          ...p,
          shards: p.shards - cost.shards,
          essence: p.essence - cost.essence,
          inventory: [...inv, upgraded],
        };
      } else {
        // Soft-fail safety net: item still shatters, but 40% of materials
        // are recovered. Keeps the sting of failure without making long
        // upgrade chains feel ruinously total-loss at top tiers.
        const refundShards = Math.floor(cost.shards * 0.4);
        const refundEssence = Math.floor(cost.essence * 0.4);
        const shardSpent = cost.shards - refundShards;
        const essenceSpent = cost.essence - refundEssence;
        const refundMsg = refundShards > 0 || refundEssence > 0
          ? ` Scrap recovered: ${refundShards} shards${refundEssence ? `, ${refundEssence} essence` : ""}.`
          : "";
        toast.error(`The ${it.name} shatters in the forge.${refundMsg}`);
        return {
          ...p,
          shards: p.shards - shardSpent,
          essence: p.essence - essenceSpent,
          inventory: inv,
        };
      }
    });
  }, [setPlayer]);

  const allocateStat = useCallback((key: "str"|"agi"|"int"|"vit") => {
    setPlayer((p) => {
      if (p.unspentPoints <= 0) return p;
      return { ...p, unspentPoints: p.unspentPoints - 1, stats: { ...p.stats, [key]: p.stats[key] + 1 } };
    });
  }, [setPlayer]);

  const startDungeon = useCallback((dungeonId: string, diff: Difficulty) => {
    const d = DUNGEONS.find((x) => x.id === dungeonId)!;
    const rooms = buildRooms(d, diff);
    setActiveRun({
      dungeonId,
      difficulty: diff,
      rooms,
      currentRoom: 0,
      gold: 0, xp: 0, loot: [],
      // Carried pool starts empty — fills as the player clears non-boss
      // rooms (see DungeonScreen.onResolve).
      carriedGold: 0, carriedXp: 0, carriedLoot: [],
      log: [`You enter ${d.name} (${diff}).`],
    });
  }, [setActiveRun]);

  const pushLog = useCallback((s: string) => {
    setSave((sv) => {
      if (!sv?.activeRun) return sv;
      return { ...sv, activeRun: { ...sv.activeRun, log: [...sv.activeRun.log.slice(-50), s] } };
    });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setPlayer((p) => {
      if (p.achievements.includes(id)) return p;
      const def = ACHIEVEMENTS.find(a => a.id === id);
      if (def) queueMicrotask(() => toast.success(`🏆 Achievement: ${def.name}`));
      return { ...p, achievements: [...p.achievements, id] };
    });
  }, [setPlayer]);

  // ============ EVENT BUS ============
  const dispatchEvent = useCallback((event: GameEvent) => {
    setPlayer((p) => {
      const newP = updateQuestProgress(p, event);
      // toast on transition active → ready
      for (const aq of newP.activeQuests) {
        const old = p.activeQuests.find(q => q.questId === aq.questId);
        if (aq.status === "ready_to_turn_in" && old?.status === "active") {
          const def = QUESTS.find(q => q.id === aq.questId);
          if (def) queueMicrotask(() => toast.success(`✦ Quest ready: ${def.title} — Return to Eldergate!`));
        }
      }
      return newP;
    });
  }, [setPlayer]);

  // ============ END RUN ============
  // Outcome semantics (see RunOutcome doc-comment above):
  //   victory — full run.gold/xp/loot (boss loot already merged by finish()).
  //   retreat — 100% carriedGold/Xp/Loot (everything secured from cleared
  //             non-boss rooms). Boss bonus + boss loot forfeited. The
  //             current room's pending contribution is also forfeited (it
  //             never made it into carried).
  //   defeat  — 50% carriedGold/Xp + half of carriedLoot (deterministic).
  //             Triggers the Resurrection Floor (25% maxHp / 10% maxMana)
  //             for non-hardcore players. Hardcore = permadeath as before.
  const endRun = useCallback((outcome: RunOutcome) => {
    setSave((sv) => {
      if (!sv?.activeRun) return sv;
      const run = sv.activeRun;
      let p: Player = { ...sv.player };

      let goldGain = 0;
      let xpGain = 0;
      let lootGain: Item[] = [];
      if (outcome === "victory") {
        goldGain = run.gold;
        xpGain = run.xp;
        lootGain = [...run.loot];
      } else if (outcome === "retreat") {
        goldGain = run.carriedGold;
        xpGain = run.carriedXp;
        lootGain = [...run.carriedLoot];
      } else {
        // defeat — half of what you secured. Deterministic item halving:
        // keep every other item (indices 0, 2, 4, …) so the player can see
        // exactly which drops they'll lose vs. keep before the run ends.
        goldGain = Math.floor(run.carriedGold * 0.5);
        xpGain = Math.floor(run.carriedXp * 0.5);
        lootGain = run.carriedLoot.filter((_, i) => i % 2 === 0);
      }

      p.gold += goldGain;
      p.xp += xpGain;
      if (lootGain.length > 0) {
        p.inventory = [...p.inventory, ...lootGain];
        p.codexItems = Array.from(new Set([...p.codexItems, ...lootGain.map(l => templateIdOf(l.id))]));
      }
      p = tryLevelUp(p);

      // Achievements + clear-progression — only on a true boss kill.
      if (outcome === "victory") {
        if (!p.achievements.includes("a_first_dungeon")) p.achievements = [...p.achievements, "a_first_dungeon"];
        const dungeon = DUNGEONS.find(d => d.id === run.dungeonId)!;
        for (const loot of lootGain) {
          if (loot.tier === "epic" && !p.achievements.includes("a_epic")) p.achievements = [...p.achievements, "a_epic"];
          if (loot.tier === "legendary" && !p.achievements.includes("a_legendary")) p.achievements = [...p.achievements, "a_legendary"];
          if (loot.tier === "celestial" && !p.achievements.includes("a_celestial")) p.achievements = [...p.achievements, "a_celestial"];
        }
        if (run.difficulty === "Nightmare" && !p.achievements.includes("a_nightmare")) p.achievements = [...p.achievements, "a_nightmare"];
        if (dungeon.id === "d_throne" && !p.achievements.includes("a_throne")) p.achievements = [...p.achievements, "a_throne"];
        if (p.level >= 10 && !p.achievements.includes("a_level10")) p.achievements = [...p.achievements, "a_level10"];
        {
          const { player: unlocked, newlyUnlocked } = recomputeUnlocks(p);
          p = unlocked;
          for (const d of newlyUnlocked) {
            queueMicrotask(() => toast.success(`✦ New dungeon unlocked: ${d.name}`));
          }
        }
        {
          const prev = p.dungeonProgress?.[run.dungeonId];
          const prevIdx = prev !== undefined ? DIFF_INDEX[prev] : -1;
          p = recordDungeonClear(p, run.dungeonId, run.difficulty);
          const after = p.dungeonProgress?.[run.dungeonId];
          if (after !== undefined && DIFF_INDEX[after] > prevIdx) {
            const nextIdx = DIFF_INDEX[after] + 1;
            if (nextIdx < DIFFICULTY_ORDER.length) {
              const nextDiff = DIFFICULTY_ORDER[nextIdx];
              queueMicrotask(() => toast.success(`✦ ${nextDiff} difficulty unlocked for ${dungeon.name}!`));
            }
          }
        }
        p = updateQuestProgress(p, { type: "dungeon_cleared", dungeonId: run.dungeonId, difficulty: run.difficulty });
        for (const loot of lootGain) {
          p = updateQuestProgress(p, { type: "tier_found", tier: loot.tier });
        }
        p = updateQuestProgress(p, { type: "level_reached", level: p.level });
      }

      // Clear transient combat buffs at end of run
      p.activeBuffs = [];

      // Hardcore permadeath — only triggers on an actual defeat. Retreat
      // is a voluntary, safe exit and must NOT end the saga.
      if (outcome === "defeat" && p.hardcore) {
        queueMicrotask(() => toast.error("Hardcore: your saga ends here."));
        try { localStorage.removeItem(SAVE_KEY); } catch {}
        return null;
      }

      // Resurrection Floor — non-hardcore defeats only. Prevents the
      // 0-HP-soft-lock by guaranteeing the player wakes up with enough
      // headroom to survive the first few rooms of a Novice retry. Acts
      // as a floor (Math.max), so a player who somehow died at higher
      // HP keeps it. Retreat does NOT trigger this — the player walked
      // out under their own power and the Mercy Cot covers them.
      if (outcome === "defeat" && !p.hardcore) {
        const floorHp = Math.max(1, Math.floor(p.maxHp * 0.25));
        const floorMp = Math.max(0, Math.floor(p.maxMana * 0.10));
        p.hp = Math.max(p.hp, floorHp);
        p.mana = Math.max(p.mana, floorMp);
      }

      // Quest-ready toasts (post-process)
      for (const aq of p.activeQuests) {
        const old = sv.player.activeQuests.find(q => q.questId === aq.questId);
        if (aq.status === "ready_to_turn_in" && old?.status === "active") {
          const def = QUESTS.find(q => q.id === aq.questId);
          if (def) queueMicrotask(() => toast.success(`✦ Quest ready: ${def.title}`));
        }
      }
      return { ...sv, player: p, activeRun: null };
    });
  }, []);

  const claimDaily = useCallback(() => {
    setPlayer((p) => {
      const today = new Date().toDateString();
      if (p.lastDailyClaim === today) {
        toast.error("Already claimed today.");
        return p;
      }
      // Daily blessing halved (200g → 100g) as part of the economy
      // tightening pass — passive income shouldn't outpace dungeon grind.
      toast.success("+100 gold daily blessing!");
      return { ...p, gold: p.gold + 100, lastDailyClaim: today };
    });
  }, [setPlayer]);

  // Inn cost steepened (10 + L*5 → 20 + L*8) so resting between hard runs
  // is a meaningful expense at mid-late game.
  const innCost = save ? 20 + save.player.level * 8 : 0;

  // Mercy Cot — the free safety-net rest. Visible only when the player
  // genuinely cannot afford the paid Inn AND is below half HP, so wealthy
  // players never see the broke-only option. No cooldown by design: a
  // cooldown would re-create the soft lock this whole system fixes.
  // Friction is enforced structurally instead:
  //   * Only restores HP (no mana) → casters still want the paid Inn.
  //   * Caps at 50% maxHp → undertruncated mid/late runs still demand
  //     a real rest before going deeper.
  const MERCY_HP_CAP_RATIO = 0.5;
  const canUseMercyCot = !!(save && !save.activeRun
    && save.player.gold < innCost
    && save.player.hp < Math.floor(save.player.maxHp * MERCY_HP_CAP_RATIO));

  const restAtInn = useCallback(() => {
    setPlayer((p) => {
      if (save?.activeRun) {
        queueMicrotask(() => toast.error("You cannot rest mid-delve."));
        return p;
      }
      if (p.hp >= p.maxHp && p.mana >= p.maxMana) {
        queueMicrotask(() => toast.error("You are already fully rested."));
        return p;
      }
      const cost = 20 + p.level * 8;
      if (p.gold < cost) {
        queueMicrotask(() => toast.error(`The innkeeper holds out an empty palm. ${cost}g needed.`));
        return p;
      }
      queueMicrotask(() => toast.success(`You rest by the hearth. Fully restored for ${cost}g.`));
      return { ...p, gold: p.gold - cost, hp: p.maxHp, mana: p.maxMana };
    });
  }, [setPlayer, save?.activeRun]);

  const restAtInnFree = useCallback(() => {
    setPlayer((p) => {
      if (save?.activeRun) {
        queueMicrotask(() => toast.error("You cannot rest mid-delve."));
        return p;
      }
      const cost = 20 + p.level * 8;
      if (p.gold >= cost) {
        // Defensive: the UI hides the button when affordable, but if the
        // player somehow triggers it via stale state, route them to the
        // real Inn instead of subsidising a paying customer.
        queueMicrotask(() => toast.error("You can afford a proper bed. The innkeeper waves you to the hearth."));
        return p;
      }
      const cap = Math.floor(p.maxHp * MERCY_HP_CAP_RATIO);
      if (p.hp >= cap) {
        queueMicrotask(() => toast.error("The hayloft will not heal you further."));
        return p;
      }
      queueMicrotask(() => toast.success(`The innkeeper points you to the hayloft. You wake at ${cap}/${p.maxHp} HP.`));
      return { ...p, hp: cap };
    });
  }, [setPlayer, save?.activeRun]);

  // ============ TRADER ACTIONS ============
  const refreshTraderStock = useCallback((traderId: string, force = false) => {
    setSave((s) => {
      if (!s) return s;
      const t = s.traders[traderId];
      const tdef = TRADERS.find(td => td.id === traderId);
      if (!t || !tdef) return s;
      const today = new Date().toDateString();
      const hasStock = t.stockItems.length > 0 || t.stockConsumables.length > 0;
      if (!force && t.lastRefresh === today && hasStock) return s;
      const stock = generateTraderStock(tdef, t.level);
      return {
        ...s,
        traders: {
          ...s.traders,
          [traderId]: { ...t, stockItems: stock.items, stockConsumables: stock.consumables, lastRefresh: today },
        },
      };
    });
  }, []);

  // Trader level cap raised from 10 → 20 alongside the steeper
  // traderXpToNext curve. Old saves carry their existing level through;
  // the new cap only affects future XP gains.
  const TRADER_MAX_LEVEL = 20;

  const grantTraderXp = (traderId: string, amount: number, traders: Record<string, TraderState>): Record<string, TraderState> => {
    const t = traders[traderId];
    const tdef = TRADERS.find(td => td.id === traderId);
    if (!t || !tdef) return traders;
    let xp = t.xp + amount;
    let level = t.level;
    let xpToNextVal = t.xpToNext;
    while (xp >= xpToNextVal && level < TRADER_MAX_LEVEL) {
      xp -= xpToNextVal;
      level += 1;
      xpToNextVal = traderXpToNext(level);
      queueMicrotask(() => toast.success(`✦ ${tdef.name} levels up to ${level}!`));
    }
    return { ...traders, [traderId]: { ...t, xp, level, xpToNext: xpToNextVal } };
  };

  const buyItem = useCallback((traderId: string, itemId: string) => {
    setSave((s) => {
      if (!s) return s;
      const t = s.traders[traderId];
      const tdef = TRADERS.find(td => td.id === traderId);
      if (!t || !tdef) return s;
      const stockIdx = t.stockItems.findIndex(i => i.id === itemId);
      if (stockIdx < 0) return s;
      const item = t.stockItems[stockIdx];
      const price = item.value;
      if (s.player.gold < price) {
        queueMicrotask(() => toast.error("Not enough gold."));
        return s;
      }
      let newPlayer: Player = { ...s.player, gold: s.player.gold - price, inventory: [...s.player.inventory, item] };
      newPlayer = updateQuestProgress(newPlayer, { type: "gold_spent", amount: price, traderId });
      newPlayer = updateQuestProgress(newPlayer, { type: "purchase_made", traderId });
      if (!newPlayer.achievements.includes("a_first_purchase")) {
        newPlayer.achievements = [...newPlayer.achievements, "a_first_purchase"];
        queueMicrotask(() => toast.success(`🏆 Achievement: First Transaction`));
      }
      // Quest ready toasts
      for (const aq of newPlayer.activeQuests) {
        const old = s.player.activeQuests.find(q => q.questId === aq.questId);
        if (aq.status === "ready_to_turn_in" && old?.status === "active") {
          const def = QUESTS.find(q => q.id === aq.questId);
          if (def) queueMicrotask(() => toast.success(`✦ Quest ready: ${def.title}`));
        }
      }
      let traders = { ...s.traders, [traderId]: { ...t, stockItems: t.stockItems.filter((_, i) => i !== stockIdx) } };
      traders = grantTraderXp(traderId, Math.round(price * tdef.xpPerGoldSpent), traders);
      const lvl = traders[traderId].level;
      if (lvl >= 10 && !newPlayer.achievements.includes("a_trader_max")) {
        newPlayer.achievements = [...newPlayer.achievements, "a_trader_max"];
        queueMicrotask(() => toast.success(`🏆 Achievement: Patron Saint`));
      }
      if (lvl >= 20 && !newPlayer.achievements.includes("a_trader_grandmaster")) {
        newPlayer.achievements = [...newPlayer.achievements, "a_trader_grandmaster"];
        queueMicrotask(() => toast.success(`🏆 Achievement: Archpatron`));
      }
      queueMicrotask(() => toast.success(`You purchased ${item.name}.`));
      return { ...s, player: newPlayer, traders };
    });
  }, []);

  const buyConsumable = useCallback((traderId: string, consumableId: string, qty: number) => {
    setSave((s) => {
      if (!s) return s;
      const t = s.traders[traderId];
      const tdef = TRADERS.find(td => td.id === traderId);
      const cd = CONSUMABLES.find(c => c.id === consumableId);
      if (!t || !tdef || !cd) return s;
      const stockIdx = t.stockConsumables.findIndex(st => st.itemId === consumableId);
      if (stockIdx < 0) return s;
      const available = t.stockConsumables[stockIdx].qty;
      const wantQty = Math.min(qty, available);
      if (wantQty <= 0) return s;
      const totalCost = cd.price * wantQty;
      if (s.player.gold < totalCost) {
        queueMicrotask(() => toast.error("Not enough gold."));
        return s;
      }
      let newPlayer: Player = {
        ...s.player,
        gold: s.player.gold - totalCost,
        consumables: addConsumable(s.player.consumables, consumableId, wantQty, CONSUMABLES),
      };
      newPlayer = updateQuestProgress(newPlayer, { type: "gold_spent", amount: totalCost, traderId });
      newPlayer = updateQuestProgress(newPlayer, { type: "purchase_made", traderId });
      if (!newPlayer.achievements.includes("a_first_purchase")) {
        newPlayer.achievements = [...newPlayer.achievements, "a_first_purchase"];
        queueMicrotask(() => toast.success(`🏆 Achievement: First Transaction`));
      }
      for (const aq of newPlayer.activeQuests) {
        const old = s.player.activeQuests.find(q => q.questId === aq.questId);
        if (aq.status === "ready_to_turn_in" && old?.status === "active") {
          const def = QUESTS.find(q => q.id === aq.questId);
          if (def) queueMicrotask(() => toast.success(`✦ Quest ready: ${def.title}`));
        }
      }
      const newStockCons = t.stockConsumables
        .map((st, i) => i === stockIdx ? { ...st, qty: st.qty - wantQty } : st)
        .filter(st => st.qty > 0);
      let traders = { ...s.traders, [traderId]: { ...t, stockConsumables: newStockCons } };
      traders = grantTraderXp(traderId, Math.round(totalCost * tdef.xpPerGoldSpent), traders);
      const lvl = traders[traderId].level;
      if (lvl >= 10 && !newPlayer.achievements.includes("a_trader_max")) {
        newPlayer.achievements = [...newPlayer.achievements, "a_trader_max"];
        queueMicrotask(() => toast.success(`🏆 Achievement: Patron Saint`));
      }
      if (lvl >= 20 && !newPlayer.achievements.includes("a_trader_grandmaster")) {
        newPlayer.achievements = [...newPlayer.achievements, "a_trader_grandmaster"];
        queueMicrotask(() => toast.success(`🏆 Achievement: Archpatron`));
      }
      queueMicrotask(() => toast.success(`Bought ${wantQty}× ${cd.name}.`));
      return { ...s, player: newPlayer, traders };
    });
  }, []);

  const useConsumable = useCallback((consumableId: string) => {
    setPlayer((p) => {
      const cd = CONSUMABLES.find(c => c.id === consumableId);
      if (!cd) return p;
      const stack = p.consumables.find(s => s.itemId === consumableId);
      if (!stack || stack.qty <= 0) return p;
      const { player: newP, log } = applyConsumable(p, cd);
      queueMicrotask(() => toast.success(log));
      const newCons = p.consumables
        .map(s => s.itemId === consumableId ? { ...s, qty: s.qty - 1 } : s)
        .filter(s => s.qty > 0);
      return { ...newP, consumables: newCons };
    });
  }, [setPlayer]);

  // For combat: applies effect + logs to run log, returns the log line (or null)
  const useConsumableInCombat = useCallback((consumableId: string): string | null => {
    let outLog: string | null = null;
    setSave((s) => {
      if (!s) return s;
      const p = s.player;
      const cd = CONSUMABLES.find(c => c.id === consumableId);
      if (!cd) return s;
      const stack = p.consumables.find(st => st.itemId === consumableId);
      if (!stack || stack.qty <= 0) return s;
      const { player: newP, log } = applyConsumable(p, cd);
      outLog = log;
      const newCons = p.consumables
        .map(st => st.itemId === consumableId ? { ...st, qty: st.qty - 1 } : st)
        .filter(st => st.qty > 0);
      const newRun = s.activeRun ? { ...s.activeRun, log: [...s.activeRun.log.slice(-50), log] } : s.activeRun;
      return { ...s, player: { ...newP, consumables: newCons }, activeRun: newRun };
    });
    return outLog;
  }, []);

  // ============ QUESTS ============
  const turnInQuest = useCallback((questId: string) => {
    setSave((s) => {
      if (!s) return s;
      const p = s.player;
      const qs = p.activeQuests.find(q => q.questId === questId);
      const def = QUESTS.find(q => q.id === questId);
      if (!qs || !def || qs.status !== "ready_to_turn_in") return s;
      const r = def.reward;
      let newP: Player = {
        ...p,
        gold: p.gold + (r.gold ?? 0),
        xp: p.xp + (r.xp ?? 0),
        shards: p.shards + (r.shards ?? 0),
        essence: p.essence + (r.essence ?? 0),
      };
      let traders = { ...s.traders };
      if (r.items) {
        const items: Item[] = [];
        for (const ri of r.items) {
          const template = ITEMS.find(i => i.id === ri.templateId);
          if (template) {
            const baseTier = ri.tier ?? template.tier;
            const generated = generateItem(baseTier, template.slot);
            items.push({
              ...template,
              id: template.id + "_" + uid(),
              tier: baseTier,
              affixes: generated.affixes,
              value: template.value + generated.affixes.length * 25,
            });
          }
        }
        newP.inventory = [...newP.inventory, ...items];
      }
      if (r.consumables) {
        let cs = [...newP.consumables];
        for (const rc of r.consumables) cs = addConsumable(cs, rc.id, rc.qty, CONSUMABLES);
        newP.consumables = cs;
      }
      if (r.unlocks) {
        newP.unlockedFeatures = Array.from(new Set([...newP.unlockedFeatures, ...r.unlocks]));
      }
      if (r.traderXpBonus) {
        traders = grantTraderXp(r.traderXpBonus.traderId, r.traderXpBonus.amount, traders);
      }
      newP.activeQuests = newP.activeQuests.filter(q => q.questId !== questId);
      newP.completedQuests = [...newP.completedQuests, questId];
      newP = tryLevelUp(newP);
      // Unlock follow-up quests
      for (const q of QUESTS as QuestDef[]) {
        if (newP.completedQuests.includes(q.id)) continue;
        if (newP.activeQuests.find(aq => aq.questId === q.id)) continue;
        if (q.prerequisiteQuestIds && q.prerequisiteQuestIds.length > 0 &&
            q.prerequisiteQuestIds.every(pid => newP.completedQuests.includes(pid))) {
          newP.activeQuests = [...newP.activeQuests, makeQuestState(q)];
          queueMicrotask(() => toast.success(`✦ New quest available: ${q.title}`));
        }
      }
      queueMicrotask(() => toast.success(`✦ Quest complete: ${def.title}`));
      return { ...s, player: newP, traders };
    });
  }, []);

  // ============ NEW GAME+ ============
  const startNewGamePlus = useCallback(() => {
    setSave((s) => {
      if (!s) return s;
      if (!s.player.unlockedFeatures.includes("new_game_plus")) {
        queueMicrotask(() => toast.error("New Game+ is not yet unlocked."));
        return s;
      }
      const newPrestige = s.player.prestige + 1;
      const player = freshPlayer(s.player.name, s.player.charClass, s.player.hardcore, newPrestige);
      // Preserve meta progression
      player.codexMonsters = s.player.codexMonsters;
      player.codexItems = s.player.codexItems;
      player.achievements = s.player.achievements;
      player.unlockedFeatures = s.player.unlockedFeatures;
      queueMicrotask(() => toast.success(`✦ New Game+ begun. Prestige ${newPrestige}.`));
      return { player, activeRun: null, traders: freshTraders(), version: SAVE_VERSION };
    });
  }, []);

  const power = save ? powerScore(save.player) : 0;

  const value = useMemo<GameContextValue>(() => ({
    save, hasSave, newGame, loadGame, resetGame,
    setPlayer, setActiveRun, updateActiveRun,
    equip, unequip, dismantle, sellItem, sellAll, upgradeItem, allocateStat,
    startDungeon, pushLog, endRun, unlockAchievement, claimDaily,
    restAtInn, restAtInnFree, innCost, canUseMercyCot,
    dispatchEvent,
    refreshTraderStock, buyItem, buyConsumable,
    useConsumable, useConsumableInCombat,
    turnInQuest, startNewGamePlus,
    power,
  }), [save, hasSave, newGame, loadGame, resetGame, setPlayer, setActiveRun, updateActiveRun, equip, unequip, dismantle, sellItem, sellAll, upgradeItem, allocateStat, startDungeon, pushLog, endRun, unlockAchievement, claimDaily, restAtInn, restAtInnFree, innCost, canUseMercyCot, dispatchEvent, refreshTraderStock, buyItem, buyConsumable, useConsumable, useConsumableInCombat, turnInQuest, startNewGamePlus, power]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
}

// Boss loot count ranges (min..max inclusive). Tightened so even Nightmare
// bosses don't gush 4–5 items per kill — each drop should be a small event.
const BOSS_LOOT_RANGE: Record<Difficulty, [number, number]> = {
  Novice:    [1, 2],
  Adept:     [1, 2],
  Expert:    [2, 3],
  Master:    [2, 3],
  Nightmare: [2, 4],
};

// Helper to generate loot from a dungeon/difficulty/boss
export function generateLoot(dungeon: DungeonDef, diff: Difficulty, boss: boolean, pityActive: boolean): Item[] {
  const count = boss
    ? randInt(BOSS_LOOT_RANGE[diff][0], BOSS_LOOT_RANGE[diff][1])
    : (Math.random() < 0.5 ? 1 : 0);
  const out: Item[] = [];
  for (let i = 0; i < count; i++) {
    const tier = rollTier(dungeon, diff, pityActive && i === 0);
    out.push(generateItem(tier));
  }
  return out;
}

// Re-export for use across components
export { CONSUMABLES, TRADERS, QUESTS } from "./data";
