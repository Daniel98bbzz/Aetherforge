import type {
  Affix, ActiveBuff, ActiveRun, Consumable, ConsumableStack,
  Difficulty, DungeonDef, GameEvent, Item, Monster, Player,
  QuestDef, QuestObjective, QuestState, RoomState, SkillCooldown,
  SkillNode, Tier, TraderDef,
} from "./types";
import { DIFFICULTY_ORDER, MANA_REGEN_PCT, PATH_CHOICE_LEVEL, TIER_ORDER, TIER_VALUE } from "./types";
import { AFFIX_POOL, CONSUMABLES, DUNGEONS, ITEMS, MONSTERS, SKILL_TREE } from "./data";

export const rand = (min: number, max: number) => Math.random() * (max - min) + min;
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const uid = () => Math.random().toString(36).slice(2, 10);

export const DIFF_INDEX: Record<Difficulty, number> = {
  Novice: 0, Adept: 1, Expert: 2, Master: 3, Nightmare: 4,
};

export const DIFF_MULT: Record<Difficulty, { stats: number; loot: number }> = {
  // Stats steepened so Master/Nightmare act as walls — undergeared players
  // get one-shot rather than chip-grinding through. Loot multiplier
  // *reduced* at higher difficulties so grinding Nightmare doesn't double
  // as a fast XP/gold fountain.
  Novice:    { stats: 1.0, loot: 1.0 },
  Adept:     { stats: 1.6, loot: 1.25 },
  Expert:    { stats: 2.7, loot: 1.55 },
  Master:    { stats: 4.6, loot: 2.0 },
  Nightmare: { stats: 7.5, loot: 2.6 },
};

export function scaleMonster(base: Monster, diff: Difficulty): Monster {
  const m = DIFF_MULT[diff].stats;
  return {
    ...base,
    hp: Math.round(base.hp * m),
    attack: Math.round(base.attack * m),
    defense: Math.round(base.defense * m),
    xp: Math.round(base.xp * DIFF_MULT[diff].loot),
    gold: Math.round(base.gold * DIFF_MULT[diff].loot),
  };
}

export function computeStats(player: Player) {
  const base = { ...player.stats };
  let weaponPower = 0;
  let critBonus = 0, lifesteal = 0, powerBonus = 0, fireBonus = 0;
  for (const slot of Object.keys(player.equipped) as (keyof typeof player.equipped)[]) {
    const it = player.equipped[slot];
    if (!it) continue;
    base.str += it.stats.str ?? 0;
    base.agi += it.stats.agi ?? 0;
    base.int += it.stats.int ?? 0;
    base.vit += it.stats.vit ?? 0;
    if (slot === "weapon") weaponPower += it.power;
    for (const a of it.affixes) {
      if (a.kind === "str") base.str += a.value;
      if (a.kind === "agi") base.agi += a.value;
      if (a.kind === "int") base.int += a.value;
      if (a.kind === "vit") base.vit += a.value;
      if (a.kind === "crit") critBonus += a.value;
      if (a.kind === "lifesteal") lifesteal += a.value;
      if (a.kind === "power") powerBonus += a.value;
      if (a.kind === "fire") fireBonus += a.value;
    }
  }
  // Apply temporary buffs from consumables
  for (const b of player.activeBuffs ?? []) {
    if (b.kind === "buff_str") base.str += b.magnitude;
    if (b.kind === "buff_agi") base.agi += b.magnitude;
    if (b.kind === "buff_int") base.int += b.magnitude;
    if (b.kind === "buff_vit") base.vit += b.magnitude;
  }
  weaponPower = Math.round(weaponPower * (1 + powerBonus / 100));
  const critChance = Math.min(60, 5 + base.agi * 0.3 + critBonus);
  const goldMult = (player.activeBuffs ?? []).some(b => b.kind === "gold_boost") ? 2 : 1;
  return { ...base, weaponPower, critChance, lifesteal, fireBonus, goldMult };
}

export function powerScore(player: Player): number {
  const equipped = Object.values(player.equipped).filter(Boolean) as Item[];
  if (equipped.length === 0) return 0;
  const sum = equipped.reduce((s, it) => s + TIER_VALUE[it.tier] * 10 + it.power, 0);
  return Math.round(sum / equipped.length);
}

/**
 * Re-evaluate which dungeons the player has earned access to based on their
 * current Power Score. Monotonic — never re-locks a dungeon that was already
 * unlocked. Returns the updated player plus the list of dungeons that crossed
 * the threshold this call (so the caller can fire toasts).
 *
 * This must be called on any event that can raise powerScore — equipping gear
 * in town, and end-of-run rewards. Centralizing it here ensures shop-only
 * progress unlocks dungeons the moment the threshold is met.
 */
export function recomputeUnlocks(player: Player): { player: Player; newlyUnlocked: DungeonDef[] } {
  const ps = powerScore(player);
  const have = new Set(player.unlockedDungeons);
  const newlyUnlocked: DungeonDef[] = [];
  for (const d of DUNGEONS) {
    if (!have.has(d.id) && ps >= d.minPower) {
      have.add(d.id);
      newlyUnlocked.push(d);
    }
  }
  if (newlyUnlocked.length === 0) return { player, newlyUnlocked };
  return {
    player: { ...player, unlockedDungeons: Array.from(have) },
    newlyUnlocked,
  };
}

/**
 * Returns the difficulties currently selectable for a given dungeon.
 * - No clear yet              → ["Novice"]
 * - Cleared "Novice"          → ["Novice", "Adept"]
 * - Cleared "Adept"           → ["Novice", "Adept", "Expert"]
 * - ...
 * - Cleared "Nightmare"       → all five (Nightmare itself is replayable).
 */
export function availableDifficulties(player: Player, dungeonId: string): Difficulty[] {
  const cleared = player.dungeonProgress?.[dungeonId];
  const maxIdx = cleared === undefined
    ? 0
    : Math.min(DIFFICULTY_ORDER.length - 1, DIFF_INDEX[cleared] + 1);
  return DIFFICULTY_ORDER.slice(0, maxIdx + 1);
}

/**
 * Record a dungeon clear at a given difficulty, only raising the recorded
 * tier (never lowering). Pure function — caller decides when to commit.
 */
export function recordDungeonClear(player: Player, dungeonId: string, diff: Difficulty): Player {
  const prev = player.dungeonProgress?.[dungeonId];
  const prevIdx = prev !== undefined ? DIFF_INDEX[prev] : -1;
  const newIdx = DIFF_INDEX[diff];
  if (newIdx <= prevIdx) return player;
  return {
    ...player,
    dungeonProgress: { ...(player.dungeonProgress ?? {}), [dungeonId]: diff },
  };
}

// Per-difficulty weights over the dungeon's five tierBias slots.
// Slot 4 is the "jackpot" tier and is intentionally rare (1–3%) even on
// Nightmare so gold/rainbow drops feel genuinely earned. Each row sums to 100.
const DIFF_TIER_WEIGHTS: Record<Difficulty, number[]> = {
  Novice:    [82, 15, 3,  0,  0],
  Adept:     [50, 35, 13, 2,  0],
  Expert:    [25, 42, 25, 7,  1],
  Master:    [10, 30, 38, 20, 2],
  Nightmare: [ 5, 18, 32, 42, 3],
};

/** Returns the full weighted distribution over the 5 bias slots for a given difficulty. */
export function tierWeights(dungeon: DungeonDef, diff: Difficulty): { tier: Tier; weight: number; pct: number }[] {
  const weights = DIFF_TIER_WEIGHTS[diff];
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return dungeon.tierBias.map((tier, i) => ({
    tier,
    weight: weights[i],
    pct: Math.round((weights[i] / total) * 1000) / 10, // one decimal
  }));
}

export function rollTier(dungeon: DungeonDef, diff: Difficulty, pityActive: boolean): Tier {
  // Pity roll: bias toward the upper end of *this dungeon's* bias array
  // rather than handing out celestials from the starter dungeon. The
  // jackpot tier is still possible but clamped to whatever the dungeon
  // is actually capable of dropping.
  if (pityActive) {
    const bias = dungeon.tierBias;
    const r = Math.random();
    let idx: number;
    if (r < 0.55) idx = 2;       // mid-slot (was unconditional "epic")
    else if (r < 0.85) idx = 3;  // near-jackpot
    else idx = 4;                // dungeon's jackpot
    return bias[Math.min(bias.length - 1, idx)];
  }
  const weights = DIFF_TIER_WEIGHTS[diff];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < dungeon.tierBias.length; i++) {
    r -= weights[i];
    if (r <= 0) return dungeon.tierBias[i];
  }
  return dungeon.tierBias[0];
}

export function generateItem(tier: Tier, slotHint?: Item["slot"]): Item {
  let candidates = ITEMS.filter(i => i.tier === tier);
  if (slotHint) candidates = candidates.filter(i => i.slot === slotHint);
  if (candidates.length === 0 && slotHint) {
    // walk down tiers for the requested slot, then back up; never silent-fall to wrong tier
    const targetIdx = TIER_VALUE[tier];
    for (let step = 1; step < TIER_ORDER.length; step++) {
      for (const dir of [-1, +1]) {
        const idx = targetIdx - 1 + dir * step;
        if (idx < 0 || idx >= TIER_ORDER.length) continue;
        const t = TIER_ORDER[idx];
        const cands = ITEMS.filter(i => i.tier === t && i.slot === slotHint);
        if (cands.length > 0) { candidates = cands; break; }
      }
      if (candidates.length > 0) break;
    }
  }
  if (candidates.length === 0) candidates = ITEMS.filter(i => i.tier === tier);
  if (candidates.length === 0) candidates = ITEMS;
  const base = { ...pick(candidates) };
  // Always honor requested tier (override if pulled from a different tier)
  base.tier = tier;
  const numAffixes = Math.min(4, Math.max(0, TIER_VALUE[tier] - 2 + (Math.random() < 0.3 ? 1 : 0)));
  const affixes: Affix[] = [];
  const pool = [...AFFIX_POOL];
  for (let i = 0; i < numAffixes && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    affixes.push(pool.splice(idx, 1)[0]);
  }
  return {
    ...base,
    id: base.id + "_" + uid(),
    affixes,
    value: base.value + numAffixes * 25,
  };
}

export function templateIdOf(generatedId: string): string {
  // ids look like "w_starblade_abc123" → "w_starblade"
  const parts = generatedId.split("_");
  if (parts.length <= 2) return generatedId;
  return parts.slice(0, parts.length - 1).join("_");
}

export function xpToNext(level: number) {
  // Steepened from 50 × 1.35^(L-1) so a single Nightmare clear no longer
  // grants 2+ levels at mid-game. Now 75 × 1.42^(L-1).
  return Math.round(75 * Math.pow(1.42, level - 1));
}

export function tryLevelUp(player: Player, log?: (s: string) => void): Player {
  let p = { ...player };
  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    p.level += 1;
    p.unspentPoints += 3;
    p.skillPoints += 1;
    p.maxHp += 12;
    p.maxMana += 6;
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    p.xpToNext = xpToNext(p.level);
    log?.(`✦ Level Up! You are now level ${p.level}. +3 stat points, +1 Skill Point.`);
  }
  // Keep any "reach_level" quest objectives in sync with the player's
  // current level — every code path that grants XP funnels through here,
  // so this is the single point where the bug (0/15 at level 10) is fixed.
  return reconcileLevelQuests(p);
}

export function buildRooms(dungeon: DungeonDef, diff: Difficulty): RoomState[] {
  const total = randInt(5, 8);
  const rooms: RoomState[] = [];
  for (let i = 0; i < total - 1; i++) {
    const r = Math.random();
    let kind: RoomState["kind"];
    if (r < 0.55) kind = "combat";
    else if (r < 0.7) kind = "trap";
    else if (r < 0.8) kind = "merchant";
    else if (r < 0.9) kind = "puzzle";
    else kind = "lore";
    const monsterId = kind === "combat" ? pick(dungeon.monsterPool) : undefined;
    const baseMonster = monsterId ? MONSTERS.find(m => m.id === monsterId) : undefined;
    rooms.push({
      index: i + 1,
      total,
      kind,
      text: roomFlavor(kind, dungeon.theme),
      monster: baseMonster ? scaleMonster(baseMonster, diff) : undefined,
      resolved: false,
    });
  }
  const bossBase = MONSTERS.find(m => m.id === dungeon.boss)!;
  rooms.push({
    index: total, total, kind: "boss",
    text: `A heavy presence fills the chamber. ${bossBase.name} awaits.`,
    monster: scaleMonster(bossBase, diff),
    resolved: false,
  });
  return rooms;
}

function roomFlavor(kind: RoomState["kind"], theme: string): string {
  const flavors: Record<string, Record<string, string[]>> = {
    forest: {
      combat: ["Leaves rustle. Something with teeth steps from the shadows."],
      trap: ["A vine tightens around your ankle."],
      merchant: ["A wandering druid sits beside a glowing mushroom cart."],
      puzzle: ["Three carved stones glow with shifting runes."],
      lore: ["An old stone tablet, half-swallowed by moss."],
    },
    undead: {
      combat: ["Bones rattle into a standing shape."],
      trap: ["The floor gives way to brine and grasping hands."],
      merchant: ["A hooded figure trades in coins still warm from a corpse."],
      puzzle: ["Skulls on pedestals turn to face you."],
      lore: ["A diary, the ink still wet."],
    },
    ice: {
      combat: ["The frost on the wall straightens, becomes a shape, then teeth."],
      trap: ["A patch of black ice grins where you meant to step."],
      merchant: ["A frostbitten peddler keeps her hands inside her sleeves."],
      puzzle: ["Three frozen statues, each holding a different number of fingers."],
      lore: ["Names scratched into the ice, all the same one."],
    },
    fire: {
      combat: ["The forge spits a creature of cinder."],
      trap: ["A blast of steam erupts beneath your boots."],
      merchant: ["A salamander-blooded smith hawks superheated wares."],
      puzzle: ["Four braziers, one unlit."],
      lore: ["Tablets of fire-script flicker on the wall."],
    },
    shadow: {
      combat: ["Darkness folds in on itself and develops a hunger."],
      trap: ["The corridor lengthens behind you, then snaps shut."],
      merchant: ["A faceless dealer offers wares with too many fingers."],
      puzzle: ["Mirrors that show only what you fear to see."],
      lore: ["A name written across the floor. It is yours."],
    },
    corruption: {
      combat: ["The mud peels back to reveal a mouth, then a hunger."],
      trap: ["A patch of rot exhales spores you'd rather not name."],
      merchant: ["A leper smiles too generously beneath their hood."],
      puzzle: ["Four totems weep something thicker than water."],
      lore: ["A bone has been chewed into the shape of words."],
    },
    celestial: {
      combat: ["A constellation steps down and unsheathes itself."],
      trap: ["Gravity tilts ninety degrees and forgets to right itself."],
      merchant: ["A being of light barters in moments."],
      puzzle: ["Stars must be put back in their proper order."],
      lore: ["A scripture older than time."],
    },
  };
  return (flavors[theme]?.[kind] ?? ["The path continues onward."])[0];
}

export interface AttackResult {
  damage: number;
  crit: boolean;
  lifesteal: number;
  log: string;
}

export function playerAttack(player: Player, target: Monster, mult = 1, name = "strike"): AttackResult {
  const s = computeStats(player);
  const statBonus = player.charClass === "warrior" ? s.str : player.charClass === "ranger" ? s.agi : s.int;
  const variance = 1 + rand(0.1, 0.3);
  const fireMult = 1 + (s.fireBonus ?? 0) / 100;
  let dmg = Math.max(1, Math.round((s.weaponPower + statBonus) * mult * variance * fireMult) - target.defense);
  const crit = Math.random() * 100 < s.critChance;
  if (crit) dmg = Math.round(dmg * 1.8);
  const lifesteal = Math.round(dmg * s.lifesteal / 100);
  const flavor = crit
    ? `Your ${name} bursts with brilliance, dealing ${dmg} damage!`
    : `Your ${name} lands for ${dmg} damage.`;
  return { damage: dmg, crit, lifesteal, log: flavor };
}

export function monsterAttack(monster: Monster, player: Player): { damage: number; log: string } {
  const s = computeStats(player);
  const defense = Math.round((s.vit ?? 0) * 0.6);
  let dmg = Math.max(1, Math.round(monster.attack * (1 + rand(-0.1, 0.2))) - defense);
  const log = monster.special && Math.random() < 0.2
    ? `${monster.name} uses ${monster.special}! ${dmg} damage.`
    : `${monster.name} strikes you for ${dmg} damage.`;
  return { damage: dmg, log };
}

export function shardsForTier(tier: Tier): { shards: number; essence: number } {
  const v = TIER_VALUE[tier];
  return { shards: v * 5, essence: v >= 4 ? v - 3 : 0 };
}

export function upgradeChance(tier: Tier): number {
  // Lower base, steeper drop. Upgrading rare→epic falls 51% → 34%;
  // legendary→mythic falls 35% → 20%; divine→celestial bottoms out at 3%.
  const v = TIER_VALUE[tier];
  return Math.max(3, 55 - v * 7);
}

export function upgradeCost(tier: Tier): { shards: number; essence: number } {
  // Quadratic shard cost + quadratic essence cost from epic onward. Going
  // legendary→mythic now costs 250 shards / 9 essence (was 100 / 2).
  const v = TIER_VALUE[tier];
  return {
    shards: v * v * 8 + v * 10,
    essence: Math.max(0, (v - 2) * (v - 2)),
  };
}

// ============ CONSUMABLES ============

export function applyConsumable(p: Player, c: Consumable): { player: Player; log: string } {
  if (c.kind === "heal") {
    const newHp = Math.min(p.maxHp, p.hp + c.magnitude);
    return { player: { ...p, hp: newHp }, log: `You quaff ${c.name}. +${newHp - p.hp} HP.` };
  }
  if (c.kind === "mana") {
    const newMp = Math.min(p.maxMana, p.mana + c.magnitude);
    return { player: { ...p, mana: newMp }, log: `You drink ${c.name}. +${newMp - p.mana} MP.` };
  }
  // buff / shield / gold_boost
  const buff: ActiveBuff = {
    source: c.name,
    kind: c.kind,
    magnitude: c.magnitude,
    turnsLeft: c.duration ?? 3,
  };
  // Replace existing buff of same kind from the same source rather than stacking
  const filtered = p.activeBuffs.filter(b => !(b.kind === c.kind && b.source === c.name));
  return { player: { ...p, activeBuffs: [...filtered, buff] }, log: `${c.name} surges through you.` };
}

export function tickBuffs(p: Player): Player {
  if (!p.activeBuffs || p.activeBuffs.length === 0) return p;
  const newBuffs = p.activeBuffs
    .map((b) => ({ ...b, turnsLeft: b.turnsLeft - 1 }))
    .filter((b) => b.turnsLeft > 0 && (b.kind !== "shield" || b.magnitude > 0));
  return { ...p, activeBuffs: newBuffs };
}

export function consumeShield(p: Player, incomingDmg: number): { player: Player; absorbed: number; remaining: number } {
  const shieldIdx = (p.activeBuffs ?? []).findIndex(b => b.kind === "shield" && b.magnitude > 0);
  if (shieldIdx < 0) return { player: p, absorbed: 0, remaining: incomingDmg };
  const shield = p.activeBuffs[shieldIdx];
  const absorbed = Math.min(shield.magnitude, incomingDmg);
  const newMag = shield.magnitude - absorbed;
  const newBuffs = p.activeBuffs
    .map((b, i) => i === shieldIdx ? { ...b, magnitude: newMag } : b)
    .filter(b => b.kind !== "shield" || b.magnitude > 0);
  return { player: { ...p, activeBuffs: newBuffs }, absorbed, remaining: incomingDmg - absorbed };
}

export function addConsumable(stacks: ConsumableStack[], id: string, qty: number, allConsumables: Consumable[]): ConsumableStack[] {
  const def = allConsumables.find(c => c.id === id);
  if (!def) return stacks;
  const existing = stacks.find(s => s.itemId === id);
  if (existing) {
    return stacks.map(s => s.itemId === id ? { ...s, qty: Math.min(def.stackLimit, s.qty + qty) } : s);
  }
  return [...stacks, { itemId: id, qty: Math.min(def.stackLimit, qty) }];
}

// ============ TRADERS ============

export function traderXpToNext(level: number): number {
  // Steepened from 100 × 1.45^(L-1) → 200 × 1.55^(L-1) and the cap raised
  // from 10 → 20 (see grantTraderXp). Cumulative gold-to-L20 ≈ 2.1M.
  return Math.round(200 * Math.pow(1.55, level - 1));
}

// Premium multiplier applied to stock prices so higher-tier purchases are
// real economic decisions, not casual buys. Lower tiers stay at face value.
const STOCK_PRICE_MULT: Record<Tier, number> = {
  common: 1.0, uncommon: 1.0, rare: 1.2, epic: 1.5,
  legendary: 2.5, mythic: 1.0, relic: 1.0, divine: 1.0, celestial: 1.0,
};

/**
 * Picks the rolled tier for one trader stock slot, given the trader's
 * current tier ceiling (`maxTierIdx` = 1..5 across the extended L20 ladder:
 * 1=common, 2=uncommon, 3=rare, 4=epic, 5=legendary).
 *
 * The max-tier slot is the rare "jackpot" — most stock sits one or two
 * tiers below the cap so even at L20 the player sees mostly epics with
 * legendary as a ~3% slot lottery.
 */
function rollStockTier(maxTierIdx: number): Tier {
  if (maxTierIdx <= 1) return TIER_ORDER[0]; // common-only (L1–3)
  const r = Math.random();
  // tierAt(0) = cap, tierAt(1) = one below cap, tierAt(2) = two below.
  const tierAt = (offset: number) => TIER_ORDER[Math.max(0, maxTierIdx - 1 - offset)];

  if (maxTierIdx === 2) {
    // Uncommon cap (L4–6).
    if (r < 0.70) return tierAt(1); // common
    return tierAt(0);               // uncommon (30%)
  }
  if (maxTierIdx === 3) {
    // Rare cap (L7–10).
    if (r < 0.50) return tierAt(2); // common
    if (r < 0.85) return tierAt(1); // uncommon
    return tierAt(0);               // rare (15%)
  }
  if (maxTierIdx === 4) {
    // Epic cap (L11–16). Mostly rare, occasional epic.
    if (r < 0.50) return tierAt(2); // uncommon
    if (r < 0.85) return tierAt(1); // rare
    return tierAt(0);               // epic (15%)
  }
  // maxTierIdx === 5: Legendary cap (L17–20). ~3% legendary jackpot.
  if (r < 0.35) return tierAt(2); // rare
  if (r < 0.97) return tierAt(1); // epic
  return tierAt(0);               // legendary (3%)
}

export function generateTraderStock(def: TraderDef, traderLevel: number): {
  items: Item[];
  consumables: ConsumableStack[];
} {
  const maxTier = def.tierUnlockByLevel[Math.min(def.tierUnlockByLevel.length - 1, traderLevel - 1)];
  const maxTierIdx = TIER_VALUE[maxTier];

  if (def.type === "blacksmith") {
    const items: Item[] = [];
    const slots: Item["slot"][] = ["weapon","helmet","chest","boots","ring","amulet"];
    for (let i = 0; i < def.stockSize; i++) {
      const tier = rollStockTier(maxTierIdx);
      const slot = slots[i % slots.length];
      const item = generateItem(tier, slot);
      const mult = STOCK_PRICE_MULT[item.tier] ?? 1.0;
      if (mult !== 1.0) {
        item.value = Math.round(item.value * mult);
      }
      items.push(item);
    }
    return { items, consumables: [] };
  } else {
    // Alchemist: scale which consumables are sold by the trader's level.
    // Endgame quality-of-life bonuses: +1 stock slot at L15, +1 more at L20.
    const available = CONSUMABLES.filter(c => {
      if (c.price > 100 && maxTierIdx < 3) return false;
      if (c.price > 200 && maxTierIdx < 5) return false;
      return true;
    });
    const bonusSlots = (traderLevel >= 20 ? 2 : (traderLevel >= 15 ? 1 : 0));
    const targetSize = def.stockSize + bonusSlots;
    const stacks: ConsumableStack[] = [];
    const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, targetSize);
    for (const c of shuffled) {
      stacks.push({ itemId: c.id, qty: 2 + Math.floor(Math.random() * 4) });
    }
    return { items: [], consumables: stacks };
  }
}

// ============ QUESTS ============

export function makeQuestState(def: QuestDef): QuestState {
  return {
    questId: def.id,
    status: "active",
    objectives: def.objectives.map(o => ({ ...o, current: 0 })),
  };
}

function objectiveProgress(obj: QuestObjective, event: GameEvent): number {
  switch (event.type) {
    case "monster_killed":
      if (obj.type === "kill_monster" && obj.targetId === event.monsterId) return 1;
      if (obj.type === "kill_any_in_dungeon" && obj.targetId === event.dungeonId) return 1;
      return 0;
    case "dungeon_cleared":
      if (obj.type === "clear_dungeon" && obj.targetId === event.dungeonId) {
        if (obj.targetDifficulty) {
          const reached = DIFFICULTY_ORDER.indexOf(event.difficulty);
          const required = DIFFICULTY_ORDER.indexOf(obj.targetDifficulty);
          return reached >= required ? 1 : 0;
        }
        return 1;
      }
      return 0;
    case "tier_found":
      if (obj.type === "find_tier" && obj.targetTier) {
        const a = TIER_ORDER.indexOf(event.tier);
        const b = TIER_ORDER.indexOf(obj.targetTier);
        return a >= b ? 1 : 0;
      }
      return 0;
    case "level_reached":
      if (obj.type === "reach_level") {
        // Mirror the player's actual level (clamped to the goal) so the UI
        // shows incremental progress (e.g., 10/15) instead of stalling at 0.
        const target = Math.min(event.level, obj.count);
        const delta = target - obj.current;
        return delta > 0 ? delta : 0;
      }
      return 0;
    case "gold_spent":
      if (obj.type === "spend_at_trader") {
        if (!obj.targetId || obj.targetId === event.traderId) return event.amount;
      }
      return 0;
    case "purchase_made":
      if (obj.type === "buy_from_trader") {
        if (!obj.targetId || obj.targetId === event.traderId) return 1;
      }
      return 0;
  }
  return 0;
}

export function updateQuestProgress(p: Player, event: GameEvent): Player {
  if (!p.activeQuests || p.activeQuests.length === 0) return p;
  let changed = false;
  const newActive = p.activeQuests.map((qs) => {
    if (qs.status !== "active") return qs;
    let questChanged = false;
    const newObjs = qs.objectives.map((obj) => {
      if (obj.current >= obj.count) return obj;
      const add = objectiveProgress(obj, event);
      if (add > 0) {
        questChanged = true;
        return { ...obj, current: Math.min(obj.count, obj.current + add) };
      }
      return obj;
    });
    if (!questChanged) return qs;
    changed = true;
    const allDone = newObjs.every(o => o.current >= o.count);
    return { ...qs, objectives: newObjs, status: allDone ? "ready_to_turn_in" as const : qs.status };
  });
  if (!changed) return p;
  return { ...p, activeQuests: newActive };
}

/**
 * Snap every active "reach_level" objective's progress to the player's actual
 * level (clamped to the target). Idempotent; safe to call from any code path
 * that may have changed `player.level`. Auto-flips the quest to
 * `ready_to_turn_in` if the level meets the goal.
 *
 * Why this exists: previously, "reach_level" only advanced when the player
 * passed the threshold, leaving the UI at 0/15 while the player was at 10.
 */
export function reconcileLevelQuests(player: Player): Player {
  if (!player.activeQuests || player.activeQuests.length === 0) return player;
  let changed = false;
  const newActive = player.activeQuests.map((qs) => {
    if (qs.status !== "active") return qs;
    let questChanged = false;
    const newObjs = qs.objectives.map((obj) => {
      if (obj.type !== "reach_level") return obj;
      const target = Math.min(player.level, obj.count);
      if (target > obj.current) {
        questChanged = true;
        return { ...obj, current: target };
      }
      return obj;
    });
    if (!questChanged) return qs;
    changed = true;
    const allDone = newObjs.every(o => o.current >= o.count);
    return { ...qs, objectives: newObjs, status: allDone ? "ready_to_turn_in" as const : qs.status };
  });
  if (!changed) return player;
  return { ...player, activeQuests: newActive };
}

export function describeObjective(obj: QuestObjective): string {
  return `${obj.description} (${obj.current}/${obj.count})`;
}

// ============ STAT CHECKS (used by non-combat rooms) ============

export const ROOM_DC: Record<Difficulty, number> = {
  Novice: 8,
  Adept: 12,
  Expert: 16,
  Master: 22,
  Nightmare: 30,
};

export interface StatCheckResult {
  roll: number;          // d20 result
  bonus: number;         // playerStat passed in
  total: number;         // roll + bonus
  threshold: number;     // DC
  success: boolean;
}

export function statCheck(playerStat: number, diff: Difficulty): StatCheckResult {
  const roll = randInt(1, 20);
  const threshold = ROOM_DC[diff];
  const total = roll + playerStat;
  return { roll, bonus: playerStat, total, threshold, success: total >= threshold };
}

// Probability of succeeding, used to show players a hint
export function statCheckChance(playerStat: number, diff: Difficulty): number {
  const threshold = ROOM_DC[diff];
  const needed = threshold - playerStat;
  // d20 distribution: rolls 1..20 each 5%
  if (needed <= 1) return 100;
  if (needed > 20) return 0;
  const successRolls = 20 - needed + 1;
  return Math.round((successRolls / 20) * 100);
}

// ============ SKILLS: RANKS, COOLDOWNS, REGEN, PREVIEW ============

/**
 * Per-turn mana regeneration applied at the end of the player's combat
 * action (matches where `tickBuffs` already fires). Floors at +1 so even
 * the L1 caster with maxMana = 30 actually gets a tick.
 * Combat-only by design: out-of-combat the Inn / Mercy Cot handle it.
 */
export function regenMana(p: Player): Player {
  if (p.mana >= p.maxMana) return p;
  const tick = Math.max(1, Math.round(p.maxMana * MANA_REGEN_PCT));
  return { ...p, mana: Math.min(p.maxMana, p.mana + tick) };
}

export function tickCooldowns(run: ActiveRun): ActiveRun {
  if (!run.cooldowns || run.cooldowns.length === 0) return run;
  const next = run.cooldowns
    .map((cd) => ({ ...cd, turnsRemaining: cd.turnsRemaining - 1 }))
    .filter((cd) => cd.turnsRemaining > 0);
  return { ...run, cooldowns: next };
}

export function cooldownOf(run: ActiveRun, skillId: string): number {
  return run.cooldowns?.find((cd) => cd.skillId === skillId)?.turnsRemaining ?? 0;
}

export function startCooldown(run: ActiveRun, skillId: string, turns: number): ActiveRun {
  const filtered = (run.cooldowns ?? []).filter((cd) => cd.skillId !== skillId);
  if (turns <= 0) return { ...run, cooldowns: filtered };
  return { ...run, cooldowns: [...filtered, { skillId, turnsRemaining: turns }] };
}

/** Look up a SkillNode by id. Returns undefined if not in the tree. */
export function findSkill(skillId: string): SkillNode | undefined {
  return SKILL_TREE.find((s) => s.id === skillId);
}

/**
 * Derived per-rank statistics for a skill at a specific rank (1..maxRank).
 * Rank 0 (locked) is allowed for tooltip "Next Rank" previews but clamps
 * to rank-1 magnitudes internally so the consumer can show "would be".
 */
export interface RankedSkillStats {
  rank: number;             // the rank these stats describe
  manaCost: number;
  magnitude: number;        // damage multiplier OR fraction of maxHp OR shield value, depending on effect.kind
  scalingPct: number;       // % of the scaling stat used (0 if no scaling)
}

export function skillStatsAtRank(node: SkillNode, rank: number): RankedSkillStats {
  const r = Math.max(1, rank);
  const stepsAbove = r - 1;
  const manaCost = node.baseManaCost + node.manaCostPerRank * stepsAbove;
  const magnitude = node.effect.baseMagnitude + node.effect.magnitudePerRank * stepsAbove;
  const scalingPct = node.effect.scaling
    ? node.effect.scaling.basePct + node.effect.scaling.pctPerRank * stepsAbove
    : 0;
  return { rank: r, manaCost, magnitude, scalingPct };
}

/**
 * Preview the concrete numbers a skill would produce for THIS player at
 * THIS rank — used by tooltips, the trainer's "Next Rank" callout, and
 * the action bar labels. Damage previews assume average variance (1.2)
 * and ignore the target's defense so the displayed number is a clean
 * "your hit floor against an undefended target".
 */
export interface SkillPreview {
  rank: number;
  manaCost: number;
  cooldown: number;
  // damage: average expected, plus min/max from the same variance band as combat
  damage: number;
  damageMin: number;
  damageMax: number;
  heal: number;
  shield: number;
  buffText?: string;
  scalingText?: string;     // "Deals 150% of STR as damage"
  // Special-effect annotations shown in the tooltip
  lifestealPct?: number;        // gear lifesteal + skill bonus lifesteal
  selfDamageCost?: number;      // flat HP deducted on cast
  selfDamagePctMaxHp?: number;  // fraction of max HP deducted on cast (e.g. 0.20)
  bonusHealOnCast?: number;     // flat HP healed alongside another effect (Aegis of Light)
  refundCdOnKill?: boolean;     // cooldown refunds when target dies (Carnage)
}

export function previewSkill(player: Player, node: SkillNode, rank: number): SkillPreview {
  const s = computeStats(player);
  const r = skillStatsAtRank(node, rank);
  const out: SkillPreview = {
    rank: r.rank,
    manaCost: r.manaCost,
    cooldown: node.cooldown,
    damage: 0, damageMin: 0, damageMax: 0,
    heal: 0, shield: 0,
  };

  if (node.effect.kind === "damage" && node.effect.scaling) {
    const stat = node.effect.scaling.stat;
    const statVal = stat === "weaponPower" ? s.weaponPower : (s as any)[stat] ?? 0;
    const fireMult = 1 + (s.fireBonus ?? 0) / 100;
    let base = (s.weaponPower + statVal) * (r.scalingPct / 100);
    let secText = "";
    if (node.effect.secondaryScaling) {
      const sec = node.effect.secondaryScaling;
      const secStat = sec.stat === "weaponPower" ? s.weaponPower : (s as any)[sec.stat] ?? 0;
      const secPct = sec.basePct + sec.pctPerRank * (r.rank - 1);
      base += (s.weaponPower + secStat) * (secPct / 100);
      secText = ` + ${secPct}% ${sec.stat.toUpperCase()}`;
    }
    const cond = node.effect.conditionalDamageBonus;
    let condText = "";
    if (cond && cond.when === "self_hp_above") {
      const hpFrac = player.maxHp > 0 ? player.hp / player.maxHp : 0;
      const active = hpFrac >= cond.threshold;
      if (active) base *= 1 + cond.bonusPct / 100;
      condText = ` · +${cond.bonusPct}% if HP ≥ ${Math.round(cond.threshold * 100)}% (${active ? "active" : "inactive"})`;
    }
    out.damage = Math.round(base * 1.20 * fireMult);
    out.damageMin = Math.round(base * 1.10 * fireMult);
    out.damageMax = Math.round(base * 1.30 * fireMult);
    out.scalingText = `Deals ${r.scalingPct}% ${stat.toUpperCase()}${secText}${condText}`;
  } else if (node.effect.kind === "heal") {
    out.heal = Math.round(player.maxHp * r.magnitude);
    out.scalingText = `Restores ${Math.round(r.magnitude * 100)}% of Max HP`;
  } else if (node.effect.kind === "shield") {
    out.shield = Math.round(r.magnitude);
    out.scalingText = `Absorbs ${out.shield} damage`;
  } else if (node.effect.kind === "buff_stat") {
    const dur = node.effect.duration ?? 3;
    if (node.effect.buffKind === "cheat_death") {
      // Give a human-readable description instead of "+1 CHEAT_DEATH for 99 turns"
      out.buffText    = "Survive the next lethal blow at 1 HP";
      out.scalingText = "Survive the next lethal blow at 1 HP";
    } else {
      out.buffText = `+${Math.round(r.magnitude)} ${(node.effect.buffKind ?? "stat").replace("buff_","").toUpperCase()} for ${dur} turns`;
      out.scalingText = out.buffText;
    }
  }

  // === Special-effect annotations for the tooltip ===
  // Self-damage costs (Reckless Strike, Demonic Pact, etc.)
  if (node.effect.selfDamage && node.effect.selfDamage > 0)
    out.selfDamageCost = node.effect.selfDamage;
  if (node.effect.selfDamagePctMaxHp && node.effect.selfDamagePctMaxHp > 0)
    out.selfDamagePctMaxHp = node.effect.selfDamagePctMaxHp;

  // Lifesteal: gear baseline + any skill bonus
  if (node.effect.bonusLifestealPct && node.effect.bonusLifestealPct > 0)
    out.lifestealPct = s.lifesteal + node.effect.bonusLifestealPct;

  // Combo heal alongside shield (Aegis of Light, Runic Ward, etc.)
  if (node.effect.bonusHealPctMaxHp && node.effect.bonusHealPctMaxHp > 0)
    out.bonusHealOnCast = Math.round(player.maxHp * node.effect.bonusHealPctMaxHp);

  // CD-refund-on-kill badge (Carnage, Rapid Reload, etc.)
  if (node.effect.refundCdOnKill) out.refundCdOnKill = true;

  return out;
}

export interface SkillUseResult {
  damage: number;
  crit: boolean;
  lifesteal: number;
  heal: number;
  buff?: ActiveBuff;
  // Self-damage cost (Reckless Strike / Demonic Pact). Caller subtracts from
  // player HP; clamped to leave at least 1 HP so a skill can't outright suicide.
  selfDamageCost: number;
  // True if this skill is configured to refund its cooldown on kill (Carnage).
  // The caller checks this against the kill outcome of the same turn.
  refundCdOnKill: boolean;
  log: string;
}

/**
 * Resolve a skill use against a target. Pure: returns the numbers and the
 * log line; mutating the player/run is the caller's job. Mirrors
 * playerAttack's pipeline (variance, crit, lifesteal, fire mult, defense)
 * and folds in the path-skill modifiers (secondary scaling, conditional
 * damage bonus, bonus lifesteal, self-damage).
 */
export function applySkill(player: Player, target: Monster | null, node: SkillNode, rank: number): SkillUseResult {
  const s = computeStats(player);
  const r = skillStatsAtRank(node, rank);
  const out: SkillUseResult = {
    damage: 0, crit: false, lifesteal: 0, heal: 0,
    selfDamageCost: 0,
    refundCdOnKill: !!node.effect.refundCdOnKill,
    log: `You use ${node.name} (Rank ${r.rank}).`,
  };

  // Self-damage component (computed first so we can include it in the log).
  const selfFlat = node.effect.selfDamage ?? 0;
  const selfPct = node.effect.selfDamagePctMaxHp ?? 0;
  out.selfDamageCost = Math.round(selfFlat + selfPct * player.maxHp);

  if (node.effect.kind === "damage" && node.effect.scaling && target) {
    const stat = node.effect.scaling.stat;
    const statVal = stat === "weaponPower" ? s.weaponPower : (s as any)[stat] ?? 0;
    const variance = 1 + rand(0.1, 0.3);
    const fireMult = 1 + (s.fireBonus ?? 0) / 100;
    // Base damage: (weaponPower + primary stat) × (rank's scaling %)
    let base = (s.weaponPower + statVal) * (r.scalingPct / 100);

    // Secondary scaling (Shield Slam, Sun Hammer). Additive to base, not
    // multiplicative — keeps the math intuitive in the tooltip preview.
    if (node.effect.secondaryScaling) {
      const sec = node.effect.secondaryScaling;
      const secStat = sec.stat === "weaponPower" ? s.weaponPower : (s as any)[sec.stat] ?? 0;
      const secPct = sec.basePct + sec.pctPerRank * (r.rank - 1);
      base += (s.weaponPower + secStat) * (secPct / 100);
    }

    // Conditional damage multiplier (Sun Hammer: +50% if hp >= 80% maxHp).
    const cond = node.effect.conditionalDamageBonus;
    if (cond && cond.when === "self_hp_above") {
      const hpFrac = player.maxHp > 0 ? player.hp / player.maxHp : 0;
      if (hpFrac >= cond.threshold) {
        base *= 1 + cond.bonusPct / 100;
      }
    }

    let dmg = Math.max(1, Math.round(base * variance * fireMult) - target.defense);
    const crit = Math.random() * 100 < s.critChance;
    if (crit) dmg = Math.round(dmg * 1.8);
    const baseLifesteal = (s.lifesteal + (node.effect.bonusLifestealPct ?? 0)) / 100;
    const lifesteal = Math.round(dmg * baseLifesteal);
    out.damage = dmg;
    out.crit = crit;
    out.lifesteal = lifesteal;
    out.log = crit
      ? `Your ${node.name} bursts with brilliance for ${dmg} damage!`
      : `Your ${node.name} lands for ${dmg} damage.`;
  } else if (node.effect.kind === "heal") {
    out.heal = Math.round(player.maxHp * r.magnitude);
    out.log = `You channel ${node.name} — restored ${out.heal} HP.`;
  } else if (node.effect.kind === "shield") {
    out.buff = {
      source: node.name,
      kind: "shield",
      magnitude: Math.round(r.magnitude),
      turnsLeft: node.effect.duration ?? 99,
    };
    out.log = `${node.name} envelops you — ${out.buff.magnitude} damage shielded.`;
    // Combo skills (Aegis of Light): heal-on-cast in addition to the shield.
    if (node.effect.bonusHealPctMaxHp && node.effect.bonusHealPctMaxHp > 0) {
      out.heal = Math.round(player.maxHp * node.effect.bonusHealPctMaxHp);
      out.log += ` (+${out.heal} HP restored)`;
    }
  } else if (node.effect.kind === "buff_stat" && node.effect.buffKind) {
    out.buff = {
      source: node.name,
      kind: node.effect.buffKind,
      magnitude: Math.round(r.magnitude),
      turnsLeft: node.effect.duration ?? 3,
    };
    out.log = `${node.name} surges through you.`;
  }
  return out;
}

/**
 * Consume an active cheat-death buff if lethal damage would land. Returns
 * the post-intervention HP and a log line. If no cheat-death buff is
 * active, returns the proposed nextHp unchanged.
 *
 * The Guardian capstone "Indomitable" grants this buff via the normal
 * applySkill → buff_stat → ActiveBuff pipeline (buffKind: cheat_death).
 */
export function applyCheatDeath(p: Player, proposedNextHp: number): { player: Player; nextHp: number; saved: boolean } {
  if (proposedNextHp > 0) return { player: p, nextHp: proposedNextHp, saved: false };
  const idx = (p.activeBuffs ?? []).findIndex((b) => b.kind === "cheat_death" && b.magnitude > 0);
  if (idx < 0) return { player: p, nextHp: proposedNextHp, saved: false };
  const newBuffs = p.activeBuffs.filter((_, i) => i !== idx);
  return { player: { ...p, activeBuffs: newBuffs }, nextHp: 1, saved: true };
}

/**
 * Total SP currently sunk into the player's skill ranks — used to compute
 * the respec refund. Sums rankCosts[0..rank-1] for every owned skill.
 */
export function totalSpentSP(player: Player): number {
  let total = 0;
  for (const [skillId, rank] of Object.entries(player.skillRanks ?? {})) {
    const node = findSkill(skillId);
    if (!node) continue;
    for (let i = 0; i < Math.min(rank, node.rankCosts.length); i++) {
      total += node.rankCosts[i];
    }
  }
  return total;
}

/**
 * Player level required to reach a given target rank (1..maxRank).
 * Combines node.minLevel (flat unlock floor) with the per-rank schedule.
 * Defaults to 1 if no gating is defined — preserves Ranger/Sorcerer skills
 * that pre-date the level-gating system.
 */
export function requiredLevelForRank(node: SkillNode, targetRank: number): number {
  if (targetRank < 1) return 1;
  const perRank = node.levelRequirementPerRank?.[targetRank - 1] ?? 0;
  const flat = targetRank === 1 ? (node.minLevel ?? 0) : 0;
  return Math.max(1, perRank, flat);
}

/**
 * Whether a skill is currently visible in the Trainer UI for this player.
 * Base skills (no `path`) are always visible. Path-locked skills are
 * visible only after the player has chosen the matching path. Pre-choice,
 * path skills are hidden entirely to keep the tree readable.
 */
export function isSkillVisible(player: Player, node: SkillNode): boolean {
  if (node.path === undefined) return true;
  const chosen = player.classPaths?.[player.charClass];
  if (chosen === undefined) return false;
  return chosen === node.path;
}

/**
 * Whether a skill is path-equippable for the player. Used by equipSkill to
 * refuse "wrong path" skills even if rank survived a partial respec.
 */
export function isSkillEquippableByPath(player: Player, node: SkillNode): boolean {
  if (node.path === undefined) return true;
  const chosen = player.classPaths?.[player.charClass];
  return chosen === node.path;
}

/**
 * Can the player learn / rank up this skill right now?
 * Returns the reason it's blocked (or null if allowed) so the UI can
 * surface the same gating rules without duplicating the logic.
 *
 * Check order matters — the message shown to the player is the first
 * blocker found, so the order goes "most informative" first (path lock
 * and level gate are loud, prereqs are softer).
 */
export function skillRankUpBlocker(player: Player, node: SkillNode): string | null {
  const currentRank = player.skillRanks?.[node.id] ?? 0;
  if (currentRank >= node.maxRank) return "Already at max rank.";

  // Path lock — path skills only available to players who chose that path.
  if (node.path !== undefined) {
    const chosen = player.classPaths?.[player.charClass];
    if (chosen === undefined) {
      const threshold = PATH_CHOICE_LEVEL[player.charClass];
      return `Choose your path first (level ${player.level >= threshold ? "now available" : threshold}).`;
    }
    if (chosen !== node.path) {
      return `Locked to a different path.`;
    }
  }

  // Level gate for the rank being purchased
  const targetRank = currentRank + 1;
  const reqLevel = requiredLevelForRank(node, targetRank);
  if (player.level < reqLevel) {
    return `Requires level ${reqLevel} (you are ${player.level}).`;
  }

  const cost = node.rankCosts[currentRank];
  if (player.skillPoints < cost) return `Need ${cost} SP (have ${player.skillPoints}).`;
  if (currentRank === 0) {
    for (const req of node.requires) {
      const reqRank = player.skillRanks?.[req] ?? 0;
      if (reqRank < 1) {
        const reqNode = findSkill(req);
        return `Requires ${reqNode?.name ?? req} (unlock first).`;
      }
    }
  }
  return null;
}
