export type Tier =
  | "common" | "uncommon" | "rare" | "epic" | "legendary"
  | "mythic" | "relic" | "divine" | "celestial";

export type Slot = "weapon" | "helmet" | "chest" | "boots" | "ring" | "amulet";
export type CharClass = "warrior" | "ranger" | "sorcerer";
export type Difficulty = "Novice" | "Adept" | "Expert" | "Master" | "Nightmare";

export interface Affix {
  name: string;
  value: number;
  kind: "str" | "agi" | "int" | "vit" | "crit" | "lifesteal" | "fire" | "power";
}

export interface Item {
  id: string;
  name: string;
  tier: Tier;
  slot: Slot;
  power: number;
  stats: { str?: number; agi?: number; int?: number; vit?: number };
  affixes: Affix[];
  flavor: string;
  value: number;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  xp: number;
  gold: number;
  flavor: string;
  special?: string;
}

export interface DungeonDef {
  id: string;
  name: string;
  theme: string;
  description: string;
  minPower: number;
  monsterPool: string[];
  boss: string;
  tierBias: Tier[];
}

export interface RoomState {
  index: number;
  total: number;
  kind: "combat" | "trap" | "merchant" | "puzzle" | "lore" | "boss" | "empty";
  text: string;
  monster?: Monster;
  resolved: boolean;
}

export interface ActiveRun {
  dungeonId: string;
  difficulty: Difficulty;
  rooms: RoomState[];
  currentRoom: number;
  // Pending pool: total gold/xp/loot accrued in the run so far. Each room's
  // contribution lives here until the room resolves; on resolve of a
  // non-boss room the pending values are promoted into the carried pool.
  gold: number;
  xp: number;
  loot: Item[];
  // Carried pool: rewards the player has secured and can walk home with.
  // Updated only when a non-boss room is fully resolved. Boss rewards are
  // intentionally NEVER promoted into carried — the boss is all-or-nothing.
  carriedGold: number;
  carriedXp: number;
  carriedLoot: Item[];
  log: string[];
  // Active skill cooldowns. Run-scoped (NOT player-scoped) so they reset
  // automatically on every endRun (victory / retreat / defeat) — matching
  // the design contract "every new dungeon run starts with 0 cooldowns".
  cooldowns: SkillCooldown[];
  // Skill IDs that have already been activated this run, when the skill is
  // flagged oncePerRun. Capstone skills like Indomitable belong here — they
  // intentionally do NOT use the normal cooldown system because we want the
  // restriction tied to the run's lifecycle, not a turn counter.
  oncePerRunUsed: string[];
}

// === Skills (Skill Tree, Ranks, Cooldowns, Paths) ===
export type SkillKind =
  | "active_attack"   // does damage; uses player's combat damage pipeline
  | "active_heal"     // restores HP
  | "active_buff";    // grants an ActiveBuff (shield / stat boost)

export type SkillScalingStat = "str" | "agi" | "int" | "vit" | "weaponPower";

export interface SkillScaling {
  stat: SkillScalingStat;
  // Base percent of the stat applied at rank 1 (e.g., 150 = 150% of STR),
  // plus an additive bonus per rank above 1.
  basePct: number;
  pctPerRank: number;
}

// Class specializations. Only Warrior has paths in this iteration; Ranger
// and Sorcerer keep base-class-only trees for now. The union type leaves
// room for future expansion without touching consumers.
export type WarriorPath = "dark_knight" | "guardian";
export type ClassPath = WarriorPath;

export interface PathDef {
  id: ClassPath;
  charClass: CharClass;
  name: string;
  tagline: string;
  description: string;
  identity: string;
  strengths: string[];
  weaknesses: string[];
  color: string;          // hex for headers / borders / dot
}

export interface SkillEffect {
  kind: "damage" | "heal" | "shield" | "buff_stat";
  // Base value at rank 1. For "damage": damage-multiplier seed (also see
  // scaling). For "heal": fraction of maxHp (0.25 = 25%). For "shield":
  // flat absorption. For "buff_stat": magnitude of the stat buff.
  baseMagnitude: number;
  magnitudePerRank: number;
  scaling?: SkillScaling;
  duration?: number;             // turns (for buff_stat / shield)
  buffKind?: ConsumableKind;     // reuses ActiveBuff plumbing (buff_str/agi/int/vit/shield/cheat_death)

  // ====== Path-skill modifiers (all optional, all data-driven) ======
  // Self-damage paid on cast. Stacks with selfDamagePctMaxHp.
  // Used by Reckless Strike (flat) and Demonic Pact (percent).
  selfDamage?: number;
  selfDamagePctMaxHp?: number;
  // Extra lifesteal % applied on top of any gear lifesteal (Soul Drain).
  bonusLifestealPct?: number;
  // Secondary stat scaling added on top of primary (Shield Slam: STR + VIT;
  // Sun Hammer: STR + VIT).
  secondaryScaling?: SkillScaling;
  // If the hit kills the target, the skill's cooldown is wiped (Carnage).
  refundCdOnKill?: boolean;
  // Conditional damage multiplier. Sun Hammer: "+50% damage if at >= 80% HP".
  // The engine evaluates `when` against the player at cast time.
  conditionalDamageBonus?: {
    when: "self_hp_above";
    threshold: number;     // 0..1 fraction of maxHp
    bonusPct: number;      // e.g., 50 = +50% damage
  };
  // Heal-on-cast applied IN ADDITION to the main effect (Aegis of Light:
  // shield + heal). Expressed as a fraction of maxHp.
  bonusHealPctMaxHp?: number;
}

export interface SkillNode {
  id: string;
  charClass: CharClass;
  name: string;
  description: string;
  kind: SkillKind;
  maxRank: number;
  // SP cost per rank. Index 0 = cost to UNLOCK (rank 0 → 1). Length === maxRank.
  // Example: [1, 1, 2] means unlock=1, rank2=1, rank3=2 (total 4 SP for max).
  rankCosts: number[];
  baseManaCost: number;
  manaCostPerRank: number;       // added per rank above 1; balances bigger ranks
  cooldown: number;              // in combat turns; 0 = no cooldown
  effect: SkillEffect;
  // Prerequisite skill IDs — must each have rank >= 1 before this skill
  // can be unlocked (does NOT require the prereq be maxed).
  requires: string[];
  position: { tier: 1 | 2 | 3; col: number };
  flavor?: string;

  // ====== Specialization & level gating (all optional) ======
  // undefined = base-class skill (always visible); a ClassPath = visible
  // and equippable only to players who chose that path.
  path?: ClassPath;
  // Player level required to reach rank N+1. Length should equal maxRank.
  // Each rank's gate is independent. Already-purchased ranks are grandfathered.
  levelRequirementPerRank?: number[];
  // Flat minimum level just to UNLOCK (rank 1). Combined with the rank-1
  // entry of levelRequirementPerRank via max().
  minLevel?: number;
  // Skill can only be activated ONCE per dungeon run. Tracked on
  // ActiveRun.oncePerRunUsed so the restriction wipes between runs.
  // Used by Indomitable (Guardian capstone).
  oncePerRun?: boolean;
}

export interface SkillCooldown {
  skillId: string;
  turnsRemaining: number;
}

// === Consumables ===
// Note: `cheat_death` is a SKILL-GRANTED buff kind only (Indomitable). It
// shares the ActiveBuff plumbing for ticking/cleanup; no Consumable definition
// should use it. The damage pipeline checks for an active cheat_death buff
// before lethal damage and converts it into "saved at 1 HP" + buff consumed.
export type ConsumableKind =
  | "heal" | "mana" | "buff_str" | "buff_agi" | "buff_int" | "buff_vit" | "shield" | "gold_boost"
  | "cheat_death";

export interface Consumable {
  id: string;
  name: string;
  description: string;
  kind: ConsumableKind;
  magnitude: number;
  duration?: number;
  price: number;
  stackLimit: number;
  combatOnly?: boolean;
  flavor?: string;
  rarity?: Tier; // for color tinting
}

export interface ConsumableStack {
  itemId: string;
  qty: number;
}

// === Active buffs (transient, live on player during runs) ===
export interface ActiveBuff {
  source: string;
  kind: ConsumableKind;
  magnitude: number;
  turnsLeft: number;
}

// === Traders ===
export type TraderType = "blacksmith" | "alchemist";

export interface TraderDef {
  id: string;
  name: string;
  type: TraderType;
  flavor: string;
  // length 10: tier the trader will sell at each level
  tierUnlockByLevel: Tier[];
  xpPerGoldSpent: number;
  stockSize: number;
}

export interface TraderState {
  level: number;
  xp: number;
  xpToNext: number;
  stockItems: Item[];
  stockConsumables: ConsumableStack[];
  lastRefresh: string;
}

// === Quests ===
export type QuestObjectiveType =
  | "kill_monster"
  | "kill_any_in_dungeon"
  | "clear_dungeon"
  | "find_tier"
  | "reach_level"
  | "spend_at_trader"
  | "buy_from_trader";

export interface QuestObjective {
  id: string;
  description: string;
  type: QuestObjectiveType;
  targetId?: string;
  targetDifficulty?: Difficulty;
  targetTier?: Tier;
  count: number;
  current: number;
}

export interface QuestReward {
  gold?: number;
  xp?: number;
  shards?: number;
  essence?: number;
  items?: { templateId: string; tier?: Tier }[];
  consumables?: { id: string; qty: number }[];
  unlocks?: string[];
  traderXpBonus?: { traderId: string; amount: number };
}

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  objectives: Omit<QuestObjective, "current">[];
  reward: QuestReward;
  rewardSummary: string;
  prerequisiteQuestIds?: string[];
  repeatable?: boolean;
}

export type QuestStatus = "active" | "ready_to_turn_in";

export interface QuestState {
  questId: string;
  status: QuestStatus;
  objectives: QuestObjective[];
}

// === GameEvent bus ===
export type GameEvent =
  | { type: "monster_killed"; monsterId: string; dungeonId: string }
  | { type: "dungeon_cleared"; dungeonId: string; difficulty: Difficulty }
  | { type: "tier_found"; tier: Tier }
  | { type: "level_reached"; level: number }
  | { type: "gold_spent"; amount: number; traderId: string }
  | { type: "purchase_made"; traderId: string };

export interface Player {
  name: string;
  charClass: CharClass;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  stats: { str: number; agi: number; int: number; vit: number };
  unspentPoints: number;
  gold: number;
  shards: number;
  essence: number;
  inventory: Item[];
  equipped: Partial<Record<Slot, Item>>;
  consumables: ConsumableStack[];
  activeBuffs: ActiveBuff[];
  unlockedDungeons: string[];
  codexMonsters: string[];
  codexItems: string[];
  achievements: string[];
  activeQuests: QuestState[];
  completedQuests: string[];
  unlockedFeatures: string[];
  pity: number;
  prestige: number;
  hardcore: boolean;
  lastDailyClaim?: string;
  // Per-dungeon highest difficulty cleared. Missing key = nothing cleared
  // for that dungeon yet (so only Novice is selectable). Used to gate
  // sequential difficulty unlocks.
  dungeonProgress: Record<string, Difficulty>;
  // === Skills ===
  // Unspent SP. Earned at 1 SP per level-up via tryLevelUp (see engine).
  skillPoints: number;
  // Map of skillId → current rank (1..maxRank). Absent key = not unlocked.
  // Using a record (not string[]) so ranks survive structurally — no second
  // schema for "rank info" that could drift out of sync with unlocks.
  skillRanks: Record<string, number>;
  // Ordered action bar (max 5). Each entry is a skillId the player has
  // unlocked. Editing this is blocked while activeRun is non-null (enforced
  // both server- and client-side; see store.equipSkill / unequipSkill).
  equippedSkills: string[];
  // The player's chosen path per class. Missing key = not yet chosen.
  // Keyed by class so the system is forward-compatible with future
  // multi-class flows (e.g., NG+ class swap that wants to remember which
  // path the player had on each class). Cleared on Abandon Path.
  classPaths: Partial<Record<CharClass, ClassPath>>;
}

export interface SaveData {
  player: Player;
  activeRun: ActiveRun | null;
  traders: Record<string, TraderState>;
  version: number;
}

export const SAVE_VERSION = 6;

// Action-bar cap: enforced by store.equipSkill and rendered in UI.
export const MAX_EQUIPPED_SKILLS = 5;

// Combat-only baseline mana regen: 5% of maxMana per player turn-end,
// with a floor of 1. See engine.regenMana / DungeonScreen combat hooks.
export const MANA_REGEN_PCT = 0.05;

// Respec cost per refunded SP, paid to the Skill Trainer.
export const SKILL_RESPEC_GOLD_PER_SP = 50;

// Player level at which each class must choose a specialization path.
// Surfaced in the Trainer UI to telegraph the choice well before it triggers.
// Only Warrior is implemented this round; Ranger/Sorcerer values exist for
// type-completeness but are gated to "never" (level > xpToNext realistic max).
export const PATH_CHOICE_LEVEL: Record<CharClass, number> = {
  warrior: 15,
  ranger: 999,
  sorcerer: 999,
};

// Flat surcharge on top of the standard SP refund when ABANDONING a path
// (switching specializations). The base SKILL_RESPEC_GOLD_PER_SP cost is
// still paid for the refunded SP. Together they make path-swap a real
// economic decision without being a permanent trap.
export const PATH_RESPEC_GOLD = 2000;

export const TIER_COLORS: Record<Tier, string> = {
  common: "#e5e5e5",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythic: "#dc2626",
  relic: "#14b8a6",
  divine: "#eab308",
  celestial: "#ec4899",
};

export const TIER_ORDER: Tier[] = [
  "common","uncommon","rare","epic","legendary","mythic","relic","divine","celestial"
];

export const TIER_VALUE: Record<Tier, number> = {
  common:1,uncommon:2,rare:3,epic:4,legendary:5,mythic:6,relic:7,divine:8,celestial:9
};

export const DIFFICULTY_ORDER: Difficulty[] = ["Novice","Adept","Expert","Master","Nightmare"];
