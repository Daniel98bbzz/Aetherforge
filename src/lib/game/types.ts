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
}

// === Consumables ===
export type ConsumableKind =
  | "heal" | "mana" | "buff_str" | "buff_agi" | "buff_int" | "buff_vit" | "shield" | "gold_boost";

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
}

export interface SaveData {
  player: Player;
  activeRun: ActiveRun | null;
  traders: Record<string, TraderState>;
  version: number;
}

export const SAVE_VERSION = 4;

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
