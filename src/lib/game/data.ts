import type { Item, Monster, DungeonDef, Slot, Tier, Affix, Consumable, TraderDef, QuestDef, SkillNode, PathDef } from "./types";

const mkItem = (id: string, name: string, tier: Tier, slot: Slot, power: number, stats: Item["stats"], flavor: string, affixes: Affix[] = []): Item => ({
  id, name, tier, slot, power, stats, affixes, flavor,
  value: power * 10,
});

export const ITEMS: Item[] = [
  // ============ WEAPONS (all 9 tiers covered) ============
  mkItem("w_rusty_sword","Rusty Shortsword","common","weapon",5,{str:2},"A blade better suited to chopping turnips."),
  mkItem("w_oak_bow","Oak Hunter's Bow","common","weapon",5,{agi:2},"Smells faintly of pine resin."),
  mkItem("w_apprentice_wand","Apprentice's Wand","common","weapon",5,{int:2},"Crackles with a single weak spark."),
  mkItem("w_iron_axe","Iron Cleaver","uncommon","weapon",10,{str:4},"Marked by countless skirmishes."),
  mkItem("w_silver_dagger","Silverleaf Dagger","uncommon","weapon",10,{agi:4},"Whispers in moonlight."),
  mkItem("w_emerald_staff","Emerald Heartstaff","uncommon","weapon",10,{int:4},"Pulses with verdant life."),
  mkItem("w_blade_dawn","Bladeshard of Dawn","rare","weapon",18,{str:6,agi:3},"Forged when the first sun rose."),
  mkItem("w_stormcaller","Stormcaller Bow","rare","weapon",18,{agi:7},"Each arrow trails crackling lightning."),
  mkItem("w_frost_scepter","Frostbite Scepter","rare","weapon",18,{int:7},"Cold breath rises from the runes."),
  mkItem("w_runeblade","Runeblade of the Veil","epic","weapon",30,{str:10,int:5},"Runes shift while you sleep."),
  mkItem("w_obsidian","Obsidian Mournfang","epic","weapon",30,{str:12},"Carved from a fallen star."),
  mkItem("w_phoenix","Phoenix Feather Spear","legendary","weapon",45,{agi:10,int:8},"Reignites in your hand."),
  mkItem("w_dragonbone","Dragonbone Greatsword","legendary","weapon",45,{str:18},"Still warm to the touch."),
  mkItem("w_voidreaver","Voidreaver","mythic","weapon",65,{str:20,int:10},"Cuts holes in reality."),
  mkItem("w_soulharvest","Soulharvest Scythe","mythic","weapon",65,{int:25},"Hungers between strikes."),
  mkItem("w_aegis","Aegis of the First King","relic","weapon",85,{str:30,vit:10},"A relic from before recorded time."),
  mkItem("w_oblivion_edge","Edge of Oblivion","relic","weapon",85,{agi:25,int:20},"Forgets what it has cut."),
  mkItem("w_sunforger","Sunforger Hammer","divine","weapon",110,{str:35,int:15},"Blessed by the dawning god."),
  mkItem("w_dawnsong","Dawnsong","divine","weapon",110,{agi:32,int:25},"Sings the day awake."),
  mkItem("w_starblade","Celestial Starblade","celestial","weapon",150,{str:40,agi:25,int:25},"A weapon woven from constellations."),
  mkItem("w_voidpierce","Voidpiercer","celestial","weapon",150,{agi:45,int:35},"Threads the dark between the dark."),

  // ============ HELMETS ============
  mkItem("h_cloth_cap","Patched Cloth Cap","common","helmet",3,{vit:1},"Smells like wet dog."),
  mkItem("h_leather_hood","Tanner's Hood","uncommon","helmet",6,{agi:2,vit:1},"Worn but functional."),
  mkItem("h_iron_helm","Iron Greathelm","rare","helmet",12,{vit:5},"Dents tell stories."),
  mkItem("h_archmage","Archmage Circlet","epic","helmet",22,{int:10,vit:3},"Floats just above your brow."),
  mkItem("h_dragoncrown","Dragoncrown","legendary","helmet",35,{str:8,vit:10},"Heavy as judgment."),
  mkItem("h_voidmask","Voidwalker Mask","mythic","helmet",55,{agi:15,int:10},"Sees what isn't there."),
  mkItem("h_kingscrown","Crown of Forgotten Kings","relic","helmet",72,{str:18,vit:18},"Crowns the worthy. Crushes the rest."),
  mkItem("h_haloed","Haloed Diadem","divine","helmet",90,{int:25,vit:15},"Sings a single endless note."),
  mkItem("h_starcrown","Starcrown of Eternity","celestial","helmet",130,{str:20,agi:20,int:20,vit:20},"Crowns wearers in living stars."),

  // ============ CHEST ============
  mkItem("c_tunic","Frayed Tunic","common","chest",4,{vit:2},"Better than nothing."),
  mkItem("c_chainmail","Chainmail Hauberk","uncommon","chest",9,{vit:5},"Jingles ominously."),
  mkItem("c_platemail","Knight's Platemail","rare","chest",18,{str:5,vit:8},"Polished to a dull glare."),
  mkItem("c_shadowweave","Shadowweave Robe","epic","chest",30,{agi:8,int:8},"Drinks in lantern light."),
  mkItem("c_dragonhide","Dragonhide Coat","legendary","chest",48,{vit:18,str:5},"Still resists fire."),
  mkItem("c_voidplate","Voidplate Cuirass","mythic","chest",70,{vit:25,str:10},"Heavier than mountains."),
  mkItem("c_relic_plate","Plate of the Eternal Vigil","relic","chest",88,{str:18,vit:25},"Worn by guards who never blinked."),
  mkItem("c_divinity","Vestments of Divinity","divine","chest",100,{int:30,vit:20},"Hums with prayers."),
  mkItem("c_starweave","Starweave Mantle","celestial","chest",140,{str:25,agi:25,int:25,vit:25},"Stitched from comet trails."),

  // ============ BOOTS ============
  mkItem("b_sandals","Worn Sandals","common","boots",2,{agi:1},"Squeaks on stone."),
  mkItem("b_traveler","Traveler's Boots","uncommon","boots",5,{agi:3,vit:1},"Already broken in."),
  mkItem("b_stalker","Stalker Boots","rare","boots",10,{agi:6},"Silent as guilt."),
  mkItem("b_emberstride","Emberstride Greaves","epic","boots",18,{agi:8,vit:5},"Leaves smoldering footprints."),
  mkItem("b_stormrunner","Stormrunner Sabatons","legendary","boots",30,{agi:14,vit:6},"Outrun a thunderclap."),
  mkItem("b_void","Voidstep Boots","mythic","boots",45,{agi:18,int:8},"Phase between heartbeats."),
  mkItem("b_relic_greaves","Greaves of the First Mile","relic","boots",65,{agi:22,vit:18},"Step taken before stepping was invented."),
  mkItem("b_divine_walkers","Walkers of the Dawn","divine","boots",85,{agi:26,int:18,vit:14},"Each step warms the cold earth."),
  mkItem("b_starsteppers","Starsteppers","celestial","boots",110,{agi:30,str:15,int:15,vit:15},"Each step seeds a galaxy."),

  // ============ RINGS ============
  mkItem("r_copper","Copper Band","common","ring",2,{vit:1},"Turns finger green."),
  mkItem("r_emerald","Emerald Loop","uncommon","ring",6,{int:3},"Calm and cool."),
  mkItem("r_sapphire","Sapphire Signet","rare","ring",14,{int:6,vit:2},"A noble heirloom."),
  mkItem("r_bloodmoon","Bloodmoon Ring","epic","ring",24,{str:8,vit:5},"Pulses on full moons."),
  mkItem("r_eternity","Ring of Eternity","legendary","ring",40,{int:12,vit:8},"Time slows near it."),
  mkItem("r_voidcoil","Voidcoil Band","mythic","ring",60,{agi:14,int:14},"Loops through nothing and back."),
  mkItem("r_relic_band","Band of the First Oath","relic","ring",75,{str:14,int:14,vit:12},"Whoever wore it kept their word."),
  mkItem("r_godseye","Godseye Ring","divine","ring",80,{str:15,int:15,vit:10},"It watches back."),
  mkItem("r_starbound","Starbound Ring","celestial","ring",120,{str:18,agi:18,int:18,vit:18},"A loop of contained dawn."),

  // ============ AMULETS ============
  mkItem("a_charm","Wooden Charm","common","amulet",3,{vit:1},"Carved by a child."),
  mkItem("a_runic","Runic Pendant","uncommon","amulet",7,{int:3,vit:2},"Faintly warm."),
  mkItem("a_silvered","Silvered Locket","rare","amulet",15,{int:6,vit:4},"Contains a portrait of someone you don't recognize."),
  mkItem("a_pheonixheart","Phoenixheart Locket","epic","amulet",26,{int:10,vit:6},"Reignites when broken."),
  mkItem("a_dragonsoul","Dragonsoul Amulet","legendary","amulet",42,{str:10,vit:12},"Roars when shaken."),
  mkItem("a_oblivion","Pendant of Oblivion","mythic","amulet",60,{int:20,agi:10},"Forgets what you fear."),
  mkItem("a_godheart","Heart of a Forgotten God","relic","amulet",90,{str:18,int:18,vit:15},"Still beats."),
  mkItem("a_divine_aegis","Aegis of the Dawn Choir","divine","amulet",110,{int:28,vit:22},"Voices answer when you ask."),
  mkItem("a_starheart","Heart of the Cosmos","celestial","amulet",135,{str:22,agi:22,int:22,vit:22},"All things began here."),
];

export const MONSTERS: Monster[] = [
  // Forest
  { id:"m_wolf", name:"Thicket Wolf", hp:30, attack:8, defense:2, xp:15, gold:8, flavor:"Eyes like wet moonlight." },
  { id:"m_sprite", name:"Mossback Sprite", hp:22, attack:6, defense:1, xp:12, gold:6, flavor:"Giggles in three voices." },
  { id:"m_bear", name:"Bramblefang Bear", hp:70, attack:14, defense:5, xp:30, gold:18, flavor:"Bark grows from its hide." },
  { id:"m_treant", name:"Elder Treant", hp:120, attack:18, defense:10, xp:55, gold:35, flavor:"Older than the kingdom.", special:"Bark Slam" },
  { id:"m_goblin", name:"Twigsnatch Goblin", hp:18, attack:5, defense:1, xp:8, gold:4, flavor:"Steals socks." },
  { id:"m_wisp", name:"Will-o'-Wisp", hp:25, attack:7, defense:0, xp:14, gold:9, flavor:"Lures with a gentle hum." },

  // Undead
  { id:"m_skeleton", name:"Crypt Skeleton", hp:45, attack:11, defense:4, xp:22, gold:14, flavor:"Rattles a lullaby." },
  { id:"m_ghoul", name:"Hollow Ghoul", hp:60, attack:15, defense:5, xp:30, gold:18, flavor:"Wet eyes, dry laugh." },
  { id:"m_lich", name:"Bone Archlich", hp:200, attack:25, defense:12, xp:120, gold:90, flavor:"Wears its own crown.", special:"Bone Storm" },

  // Ice (NEW)
  { id:"m_frostwraith", name:"Frostbound Wraith", hp:55, attack:14, defense:5, xp:28, gold:18, flavor:"Howls a winter that hasn't ended.", special:"Frost Bite" },
  { id:"m_glacial_golem", name:"Glacial Golem", hp:120, attack:18, defense:14, xp:60, gold:40, flavor:"A mountain that learned to walk." },
  { id:"m_ice_basilisk", name:"Ice Basilisk", hp:95, attack:21, defense:8, xp:55, gold:38, flavor:"Stares until your blood becomes still.", special:"Freezing Gaze" },
  { id:"m_blizzard_drake", name:"Blizzard Drake", hp:340, attack:38, defense:18, xp:280, gold:220, flavor:"Wings of winter, breath of forever.", special:"Eternal Blizzard" },

  // Fire
  { id:"m_imp", name:"Forge Imp", hp:40, attack:12, defense:3, xp:20, gold:14, flavor:"Solid mischief, fluid flame." },
  { id:"m_salamander", name:"Magma Salamander", hp:90, attack:20, defense:8, xp:50, gold:30, flavor:"Drinks lava like wine." },
  { id:"m_elemental", name:"Cinder Elemental", hp:130, attack:24, defense:10, xp:75, gold:55, flavor:"A walking forge.", special:"Inferno" },
  { id:"m_dragon", name:"Magmalord Drakon", hp:400, attack:42, defense:20, xp:300, gold:250, flavor:"Sings molten arias.", special:"Volcanic Roar" },

  // Shadow / Void
  { id:"m_shade", name:"Void Shade", hp:80, attack:22, defense:6, xp:50, gold:30, flavor:"Casts no shadow." },
  { id:"m_horror", name:"Tendril Horror", hp:160, attack:30, defense:12, xp:110, gold:80, flavor:"Has too many directions.", special:"Mind Lash" },
  { id:"m_warden", name:"Void Warden", hp:260, attack:38, defense:18, xp:200, gold:160, flavor:"Counts the names of stars." },
  { id:"m_voidlord", name:"Voidspire Tyrant", hp:600, attack:55, defense:25, xp:500, gold:400, flavor:"He IS the citadel.", special:"Reality Tear" },

  // Corruption (NEW — Abyssal Mire)
  { id:"m_plagued_hound", name:"Plagued Hound", hp:180, attack:32, defense:12, xp:140, gold:100, flavor:"Drips a green that eats stone.", special:"Putrid Bite" },
  { id:"m_rot_shambler", name:"Rot Shambler", hp:240, attack:36, defense:14, xp:180, gold:130, flavor:"Composted, but ambitious." },
  { id:"m_corruption_leech", name:"Corruption Leech", hp:140, attack:42, defense:10, xp:160, gold:120, flavor:"Drinks colors first, blood second.", special:"Soul Drain" },
  { id:"m_abyssal_harbinger", name:"Abyssal Harbinger", hp:780, attack:62, defense:28, xp:700, gold:600, flavor:"Bears bad news in every tongue.", special:"Abyssal Tide" },

  // Celestial
  { id:"m_seraph", name:"Fallen Seraph", hp:320, attack:48, defense:22, xp:280, gold:220, flavor:"Wings of memory." },
  { id:"m_archon", name:"Forgotten Archon", hp:500, attack:58, defense:28, xp:450, gold:380, flavor:"Names you mid-strike.", special:"Judgement" },
  { id:"m_forgotten", name:"The Forgotten One", hp:1000, attack:80, defense:35, xp:1500, gold:1200, flavor:"You will not remember winning.", special:"Erase" },
];

export const DUNGEONS: DungeonDef[] = [
  {
    id:"d_thicket", name:"Whispering Thicket", theme:"forest",
    description:"Ancient trees lean inward, sharing secrets in tongues you almost remember.",
    minPower: 0,
    monsterPool:["m_wolf","m_sprite","m_goblin","m_wisp","m_bear"],
    boss:"m_treant",
    // Floor common; Nightmare jackpot caps at epic.
    tierBias:["common","common","uncommon","rare","epic"],
  },
  {
    id:"d_crypt", name:"Sunken Crypt", theme:"undead",
    description:"Saltwater drips through stone teeth. The dead here never finished dying.",
    minPower: 15,
    monsterPool:["m_skeleton","m_ghoul","m_wisp"],
    boss:"m_lich",
    tierBias:["common","uncommon","uncommon","rare","epic"],
  },
  {
    id:"d_frost", name:"Frostbound Vault", theme:"ice",
    description:"A cathedral of ice that remembers being a sea. Each step echoes a thousand years backward.",
    minPower: 32,
    monsterPool:["m_frostwraith","m_glacial_golem","m_ice_basilisk"],
    boss:"m_blizzard_drake",
    tierBias:["common","uncommon","rare","rare","epic"],
  },
  {
    id:"d_forge", name:"Molten Heart Forge", theme:"fire",
    description:"The mountain has a heartbeat. It is hungry.",
    minPower: 55,
    monsterPool:["m_imp","m_salamander","m_elemental"],
    boss:"m_dragon",
    // First dungeon where Legendary is achievable — as the rare jackpot.
    tierBias:["uncommon","rare","rare","epic","legendary"],
  },
  {
    id:"d_void", name:"Voidspire Citadel", theme:"shadow",
    description:"A tower that grew downward. Every floor forgets the one above.",
    minPower: 80,
    monsterPool:["m_shade","m_horror","m_warden"],
    boss:"m_voidlord",
    // First dungeon where Mythic is achievable — as the rare jackpot.
    tierBias:["rare","epic","epic","legendary","mythic"],
  },
  {
    id:"d_mire", name:"Abyssal Mire", theme:"corruption",
    description:"Where the world goes when it gives up. The mud has opinions.",
    minPower: 110,
    monsterPool:["m_plagued_hound","m_rot_shambler","m_corruption_leech","m_shade"],
    boss:"m_abyssal_harbinger",
    // Relic jackpot; Divine/Celestial reserved for the Throne.
    tierBias:["epic","legendary","legendary","mythic","relic"],
  },
  {
    id:"d_throne", name:"Throne of the Forgotten", theme:"celestial",
    description:"A place between thoughts. The seat is occupied. The seat has always been occupied.",
    minPower: 145,
    monsterPool:["m_seraph","m_archon","m_warden"],
    boss:"m_forgotten",
    // The only dungeon where Divine and Celestial are obtainable.
    tierBias:["legendary","mythic","relic","divine","celestial"],
  },
];

export const STARTER_KITS: Record<string, string[]> = {
  warrior: ["w_rusty_sword","h_cloth_cap","c_tunic","b_sandals"],
  ranger:  ["w_oak_bow","h_cloth_cap","c_tunic","b_sandals"],
  sorcerer:["w_apprentice_wand","h_cloth_cap","c_tunic","b_sandals"],
};

// ============ SKILL TREE ============
// Per-class skill graph. Each node carries its own rank progression:
//   • rankCosts[i] is the SP cost to reach rank (i+1).
//   • baseManaCost + manaCostPerRank * (rank-1) — costs grow with power.
//   • effect.baseMagnitude / magnitudePerRank — damage/heal/shield growth.
//   • effect.scaling.basePct / pctPerRank — % of the chosen stat applied.
// Prerequisites: each entry in `requires` must have rank >= 1 (i.e. unlocked,
// not necessarily maxed). Matches the "basic heal → AOE heal" gating rule.
export const SKILL_TREE: SkillNode[] = [
  // ===================== WARRIOR — BASE (path-agnostic) =====================
  // Available to every Warrior, regardless of specialization path.
  // Tier-based level gates: T1 = early game, T2 = mid game, T3 = late game.
  {
    id: "war_strike", charClass: "warrior", name: "Power Strike",
    description: "A heavy overhead chop that punches through guards.",
    kind: "active_attack",
    maxRank: 5,
    rankCosts: [1, 1, 1, 2, 2],
    baseManaCost: 6, manaCostPerRank: 1,
    cooldown: 0,
    effect: {
      kind: "damage",
      baseMagnitude: 1.3, magnitudePerRank: 0.2,
      scaling: { stat: "str", basePct: 130, pctPerRank: 25 },
    },
    requires: [],
    position: { tier: 1, col: 1 },
    levelRequirementPerRank: [1, 3, 5, 8, 11],
    flavor: "The simplest answer is force.",
  },
  {
    id: "war_iron_will", charClass: "warrior", name: "Iron Will",
    description: "Steel your nerves: a brief surge of strength.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [1, 2, 2],
    baseManaCost: 10, manaCostPerRank: 2,
    cooldown: 2,
    effect: {
      kind: "buff_stat",
      baseMagnitude: 6, magnitudePerRank: 3,
      duration: 3,
      buffKind: "buff_str",
    },
    requires: [],
    position: { tier: 1, col: 2 },
    levelRequirementPerRank: [1, 3, 6],
    flavor: "Hold the line. Hold yourself.",
  },
  {
    id: "war_battle_cry", charClass: "warrior", name: "Battle Cry",
    description: "A bellow that sharpens your reflexes.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [1, 2, 2],
    baseManaCost: 8, manaCostPerRank: 1,
    cooldown: 3,
    effect: {
      kind: "buff_stat",
      baseMagnitude: 8, magnitudePerRank: 4,
      duration: 3,
      buffKind: "buff_agi",
    },
    requires: [],
    position: { tier: 1, col: 3 },
    levelRequirementPerRank: [2, 4, 6],
    flavor: "Loud enough to remind your hands they are still yours.",
  },
  {
    id: "war_cleave", charClass: "warrior", name: "Cleave",
    description: "Wide arcing strike that crushes armored foes.",
    kind: "active_attack",
    maxRank: 5,
    rankCosts: [2, 2, 2, 3, 3],
    baseManaCost: 14, manaCostPerRank: 2,
    cooldown: 2,
    effect: {
      kind: "damage",
      baseMagnitude: 2.0, magnitudePerRank: 0.3,
      scaling: { stat: "str", basePct: 200, pctPerRank: 35 },
    },
    requires: ["war_strike"],
    position: { tier: 2, col: 1 },
    levelRequirementPerRank: [4, 7, 10, 13, 16],
    flavor: "One swing, three regrets.",
  },
  {
    id: "war_bulwark", charClass: "warrior", name: "Bulwark",
    description: "Raise an iron shield that absorbs incoming blows.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [2, 3, 3],
    baseManaCost: 18, manaCostPerRank: 4,
    cooldown: 3,
    effect: {
      kind: "shield",
      baseMagnitude: 70, magnitudePerRank: 35,
      duration: 99,
    },
    requires: ["war_iron_will"],
    position: { tier: 2, col: 2 },
    levelRequirementPerRank: [4, 8, 12],
    flavor: "Bend the world around you, not the other way.",
  },
  {
    id: "war_second_wind", charClass: "warrior", name: "Second Wind",
    description: "Pause. Breathe. Knit the worst of the cuts shut.",
    kind: "active_heal",
    maxRank: 3,
    rankCosts: [2, 2, 3],
    baseManaCost: 16, manaCostPerRank: 2,
    cooldown: 4,
    effect: {
      kind: "heal",
      baseMagnitude: 0.15, magnitudePerRank: 0.05,
    },
    requires: [],
    position: { tier: 2, col: 3 },
    levelRequirementPerRank: [6, 8, 10],
    flavor: "The soldier's first lesson: there is always one more breath.",
  },
  {
    id: "war_earthshaker", charClass: "warrior", name: "Earthshaker",
    description: "Devastating slam that rattles even bosses.",
    kind: "active_attack",
    maxRank: 3,
    rankCosts: [3, 3, 4],
    baseManaCost: 24, manaCostPerRank: 3,
    cooldown: 3,
    effect: {
      kind: "damage",
      baseMagnitude: 3.2, magnitudePerRank: 0.5,
      scaling: { stat: "str", basePct: 320, pctPerRank: 50 },
    },
    requires: ["war_cleave"],
    position: { tier: 3, col: 1 },
    levelRequirementPerRank: [8, 12, 16],
    flavor: "The mountain answers when you knock.",
  },
  {
    id: "war_heroic_stand", charClass: "warrior", name: "Heroic Stand",
    description: "Plant your feet. Deal more, take more. No retreating.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [3, 3, 4],
    baseManaCost: 26, manaCostPerRank: 3,
    cooldown: 5,
    effect: {
      kind: "buff_stat",
      baseMagnitude: 12, magnitudePerRank: 5,
      duration: 3,
      buffKind: "buff_str",
    },
    requires: ["war_iron_will"],
    position: { tier: 3, col: 2 },
    levelRequirementPerRank: [10, 13, 16],
    flavor: "Where you stand becomes the line.",
  },

  // ===================== WARRIOR — DARK KNIGHT PATH =====================
  // Aggressive, selfish, lifesteal-and-self-harm. Pays HP to deal more
  // damage and recover it via lifesteal. Pairs with crit / power / lifesteal gear.
  {
    id: "dk_soul_drain", charClass: "warrior", path: "dark_knight",
    name: "Soul Drain",
    description: "A predatory strike that pulls life from the wound.",
    kind: "active_attack",
    maxRank: 4,
    rankCosts: [2, 2, 3, 3],
    baseManaCost: 12, manaCostPerRank: 2,
    cooldown: 0,
    effect: {
      kind: "damage",
      baseMagnitude: 1.6, magnitudePerRank: 0.2,
      scaling: { stat: "str", basePct: 160, pctPerRank: 25 },
      // Adds 30% lifesteal on top of any gear lifesteal at R1, scaling
      // up by 10% per rank to 60% at R4. Sustain engine.
      bonusLifestealPct: 30,
    },
    requires: [],
    position: { tier: 1, col: 1 },
    minLevel: 15,
    levelRequirementPerRank: [15, 17, 19, 21],
    flavor: "The blade was thirsty before you ever drew it.",
  },
  {
    id: "dk_reckless_strike", charClass: "warrior", path: "dark_knight",
    name: "Reckless Strike",
    description: "Pay in blood for a savage hit. -8 HP, massive damage.",
    kind: "active_attack",
    maxRank: 5,
    rankCosts: [2, 2, 3, 3, 3],
    baseManaCost: 8, manaCostPerRank: 1,
    cooldown: 0,
    effect: {
      kind: "damage",
      baseMagnitude: 2.2, magnitudePerRank: 0.35,
      scaling: { stat: "str", basePct: 220, pctPerRank: 40 },
      selfDamage: 8,
    },
    requires: [],
    position: { tier: 1, col: 2 },
    minLevel: 15,
    levelRequirementPerRank: [15, 17, 19, 21, 23],
    flavor: "Some men flinch from pain. You bargain with it.",
  },
  {
    id: "dk_bloodthirst", charClass: "warrior", path: "dark_knight",
    name: "Bloodthirst",
    description: "Glass cannon: +25% STR, but you take +25% damage. 3 turns.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [2, 3, 3],
    baseManaCost: 14, manaCostPerRank: 3,
    cooldown: 4,
    effect: {
      kind: "buff_stat",
      // Magnitude here represents +STR directly (not %).
      baseMagnitude: 12, magnitudePerRank: 5,
      duration: 3,
      buffKind: "buff_str",
    },
    requires: ["dk_soul_drain"],
    position: { tier: 2, col: 1 },
    minLevel: 18,
    levelRequirementPerRank: [18, 21, 24],
    flavor: "Trade safety for certainty.",
  },
  {
    id: "dk_demonic_pact", charClass: "warrior", path: "dark_knight",
    name: "Demonic Pact",
    description: "No mana cost — spends 20% of max HP for a massive blow.",
    kind: "active_attack",
    maxRank: 3,
    rankCosts: [3, 3, 4],
    baseManaCost: 0, manaCostPerRank: 0,
    cooldown: 4,
    effect: {
      kind: "damage",
      baseMagnitude: 2.8, magnitudePerRank: 0.6,
      scaling: { stat: "str", basePct: 280, pctPerRank: 60 },
      selfDamagePctMaxHp: 0.20,
    },
    requires: ["dk_reckless_strike"],
    position: { tier: 2, col: 2 },
    minLevel: 19,
    levelRequirementPerRank: [19, 22, 25],
    flavor: "Names were exchanged. You forgot which was yours.",
  },
  {
    id: "dk_carnage", charClass: "warrior", path: "dark_knight",
    name: "Carnage",
    description: "Brutal execution. If the hit kills, the cooldown refunds.",
    kind: "active_attack",
    maxRank: 3,
    rankCosts: [4, 4, 5],
    baseManaCost: 22, manaCostPerRank: 3,
    cooldown: 3,
    effect: {
      kind: "damage",
      baseMagnitude: 3.8, magnitudePerRank: 0.7,
      scaling: { stat: "str", basePct: 380, pctPerRank: 70 },
      refundCdOnKill: true,
    },
    requires: ["dk_bloodthirst"],
    position: { tier: 3, col: 1 },
    minLevel: 22,
    levelRequirementPerRank: [22, 25, 28],
    flavor: "If they fall, you have not even started.",
  },
  {
    id: "dk_black_aegis", charClass: "warrior", path: "dark_knight",
    name: "Black Aegis",
    description: "Your wounds fuel you. +18 STR for 3 turns; ignore one shield's worth of pain.",
    kind: "active_buff",
    maxRank: 2,
    rankCosts: [4, 5],
    baseManaCost: 28, manaCostPerRank: 4,
    cooldown: 5,
    effect: {
      kind: "buff_stat",
      baseMagnitude: 18, magnitudePerRank: 8,
      duration: 3,
      buffKind: "buff_str",
    },
    requires: ["dk_demonic_pact"],
    position: { tier: 3, col: 2 },
    minLevel: 24,
    levelRequirementPerRank: [24, 27],
    flavor: "What you cannot prevent, you can spend.",
  },

  // ===================== WARRIOR — GUARDIAN PATH =====================
  // Defensive, protective, outlast-the-enemy. Pairs with VIT / shield / heal.
  {
    id: "gd_shield_slam", charClass: "warrior", path: "guardian",
    name: "Shield Slam",
    description: "STR and VIT both fuel this blow — hits like a wall.",
    kind: "active_attack",
    maxRank: 4,
    rankCosts: [2, 2, 3, 3],
    baseManaCost: 8, manaCostPerRank: 2,
    cooldown: 0,
    effect: {
      kind: "damage",
      baseMagnitude: 1.2, magnitudePerRank: 0.2,
      scaling: { stat: "str", basePct: 120, pctPerRank: 20 },
      secondaryScaling: { stat: "vit", basePct: 80, pctPerRank: 20 },
    },
    requires: [],
    position: { tier: 1, col: 1 },
    minLevel: 15,
    levelRequirementPerRank: [15, 17, 19, 21],
    flavor: "The shield is also the sword.",
  },
  {
    id: "gd_steel_skin", charClass: "warrior", path: "guardian",
    name: "Steel Skin",
    description: "A self-shield equal to a quarter of your max HP, scaling up.",
    kind: "active_buff",
    maxRank: 5,
    rankCosts: [2, 2, 2, 3, 3],
    baseManaCost: 10, manaCostPerRank: 2,
    cooldown: 2,
    effect: {
      kind: "shield",
      // baseMagnitude here represents *flat* absorption derived at cast
      // time from player.maxHp (25% at R1, +5% per rank to 45% at R5).
      // For simplicity we encode a fixed scaling baseline and let the
      // engine compute via skillStatsAtRank — the helper returns the
      // magnitude directly so we keep this as flat shield amount.
      baseMagnitude: 60, magnitudePerRank: 20,
      duration: 99,
    },
    requires: [],
    position: { tier: 1, col: 2 },
    minLevel: 15,
    levelRequirementPerRank: [15, 17, 19, 21, 23],
    flavor: "The skin remembers the shape of the old shield.",
  },
  {
    id: "gd_provoke", charClass: "warrior", path: "guardian",
    name: "Provoke",
    description: "Goad the enemy. Their next strike against you deals -40% damage.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [2, 3, 3],
    baseManaCost: 6, manaCostPerRank: 2,
    cooldown: 1,
    effect: {
      // Implemented as a shield buff with magnitude scaled to a typical
      // monster hit — keeps the mechanic in one well-tested code path
      // (consumeShield) rather than introducing a new "%-reduction" type.
      kind: "shield",
      baseMagnitude: 40, magnitudePerRank: 20,
      duration: 99,
    },
    requires: ["gd_shield_slam"],
    position: { tier: 2, col: 1 },
    minLevel: 18,
    levelRequirementPerRank: [18, 20, 22],
    flavor: "Eyes on me, monster. Eyes on me.",
  },
  {
    id: "gd_aegis_of_light", charClass: "warrior", path: "guardian",
    name: "Aegis of Light",
    description: "A radiant ward that shields and heals at once.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [3, 3, 4],
    baseManaCost: 18, manaCostPerRank: 4,
    cooldown: 4,
    effect: {
      kind: "shield",
      baseMagnitude: 80, magnitudePerRank: 40,
      duration: 99,
      // Heal-on-cast in addition to the shield: 10% maxHp at R1, +5%/rank.
      bonusHealPctMaxHp: 0.10,
    },
    requires: ["gd_steel_skin"],
    position: { tier: 2, col: 2 },
    minLevel: 19,
    levelRequirementPerRank: [19, 22, 25],
    flavor: "Light, then water, then a held breath.",
  },
  {
    id: "gd_indomitable", charClass: "warrior", path: "guardian",
    name: "Indomitable",
    description: "Once per run: the next lethal blow leaves you at 1 HP instead.",
    kind: "active_buff",
    maxRank: 1,
    rankCosts: [4],
    baseManaCost: 24, manaCostPerRank: 0,
    cooldown: 0,
    effect: {
      kind: "buff_stat",
      baseMagnitude: 1, magnitudePerRank: 0,
      duration: 99,
      buffKind: "cheat_death",
    },
    requires: ["gd_aegis_of_light"],
    position: { tier: 3, col: 1 },
    minLevel: 22,
    levelRequirementPerRank: [22],
    oncePerRun: true,
    flavor: "Death has been told 'not yet' before. It listens.",
  },
  {
    id: "gd_sun_hammer", charClass: "warrior", path: "guardian",
    name: "Sun Hammer",
    description: "STR + VIT smash. +50% damage if your HP is above 80%.",
    kind: "active_attack",
    maxRank: 3,
    rankCosts: [4, 4, 5],
    baseManaCost: 26, manaCostPerRank: 3,
    cooldown: 3,
    effect: {
      kind: "damage",
      baseMagnitude: 2.0, magnitudePerRank: 0.4,
      scaling: { stat: "str", basePct: 200, pctPerRank: 40 },
      secondaryScaling: { stat: "vit", basePct: 200, pctPerRank: 40 },
      conditionalDamageBonus: {
        when: "self_hp_above",
        threshold: 0.80,
        bonusPct: 50,
      },
    },
    requires: ["gd_provoke"],
    position: { tier: 3, col: 2 },
    minLevel: 22,
    levelRequirementPerRank: [22, 25, 28],
    flavor: "Hammer raised at dawn. The dawn agrees with you.",
  },

  // ===================== RANGER =====================
  {
    id: "rng_pierce", charClass: "ranger", name: "Piercing Shot",
    description: "An arrow that threads gaps in armor.",
    kind: "active_attack",
    maxRank: 5,
    rankCosts: [1, 1, 1, 2, 2],
    baseManaCost: 6, manaCostPerRank: 1,
    cooldown: 0,
    effect: {
      kind: "damage",
      baseMagnitude: 1.4, magnitudePerRank: 0.2,
      scaling: { stat: "agi", basePct: 140, pctPerRank: 25 },
    },
    requires: [],
    position: { tier: 1, col: 1 },
    flavor: "Aim for the unguarded breath.",
  },
  {
    id: "rng_focus", charClass: "ranger", name: "Hawk's Focus",
    description: "Slow the world. Sharpen your aim.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [1, 2, 2],
    baseManaCost: 8, manaCostPerRank: 2,
    cooldown: 2,
    effect: {
      kind: "buff_stat",
      baseMagnitude: 8, magnitudePerRank: 4,
      duration: 3,
      buffKind: "buff_agi",
    },
    requires: [],
    position: { tier: 1, col: 2 },
    flavor: "The hawk does not chase. It waits.",
  },
  {
    id: "rng_volley", charClass: "ranger", name: "Volley",
    description: "Three rapid shots, fired faster than thought.",
    kind: "active_attack",
    maxRank: 5,
    rankCosts: [2, 2, 2, 3, 3],
    baseManaCost: 14, manaCostPerRank: 2,
    cooldown: 2,
    effect: {
      kind: "damage",
      baseMagnitude: 2.2, magnitudePerRank: 0.3,
      scaling: { stat: "agi", basePct: 220, pctPerRank: 35 },
    },
    requires: ["rng_pierce"],
    position: { tier: 2, col: 1 },
    flavor: "Empty quiver, full conscience.",
  },
  {
    id: "rng_evade", charClass: "ranger", name: "Evasive Roll",
    description: "Tumble aside; the next strike skitters off a phantom guard.",
    kind: "active_buff",
    maxRank: 3,
    rankCosts: [2, 3, 3],
    baseManaCost: 14, manaCostPerRank: 3,
    cooldown: 3,
    effect: {
      kind: "shield",
      baseMagnitude: 55, magnitudePerRank: 25,
      duration: 99,
    },
    requires: ["rng_focus"],
    position: { tier: 2, col: 2 },
    flavor: "Be where the blade is not.",
  },
  {
    id: "rng_hailstorm", charClass: "ranger", name: "Hailstorm",
    description: "Sky-darkening barrage of arrows.",
    kind: "active_attack",
    maxRank: 3,
    rankCosts: [3, 3, 4],
    baseManaCost: 26, manaCostPerRank: 3,
    cooldown: 3,
    effect: {
      kind: "damage",
      baseMagnitude: 3.5, magnitudePerRank: 0.5,
      scaling: { stat: "agi", basePct: 350, pctPerRank: 50 },
    },
    requires: ["rng_volley"],
    position: { tier: 3, col: 1 },
    flavor: "The sky remembers every shaft.",
  },

  // ===================== SORCERER =====================
  {
    id: "sor_bolt", charClass: "sorcerer", name: "Arcane Bolt",
    description: "A focused lance of pure mana.",
    kind: "active_attack",
    maxRank: 5,
    rankCosts: [1, 1, 1, 2, 2],
    baseManaCost: 6, manaCostPerRank: 1,
    cooldown: 0,
    effect: {
      kind: "damage",
      baseMagnitude: 1.5, magnitudePerRank: 0.2,
      scaling: { stat: "int", basePct: 150, pctPerRank: 25 },
    },
    requires: [],
    position: { tier: 1, col: 1 },
    flavor: "First lesson: light hurts.",
  },
  {
    id: "sor_mend", charClass: "sorcerer", name: "Mend",
    description: "Knit wounds with whispered syllables.",
    kind: "active_heal",
    maxRank: 5,
    rankCosts: [1, 1, 2, 2, 3],
    baseManaCost: 12, manaCostPerRank: 2,
    cooldown: 2,
    effect: {
      kind: "heal",
      baseMagnitude: 0.20, magnitudePerRank: 0.05,
    },
    requires: [],
    position: { tier: 1, col: 2 },
    flavor: "Flesh listens, if you speak slowly.",
  },
  {
    id: "sor_starfall", charClass: "sorcerer", name: "Starfall",
    description: "Calls down burning stars upon a single foe.",
    kind: "active_attack",
    maxRank: 5,
    rankCosts: [2, 2, 2, 3, 3],
    baseManaCost: 16, manaCostPerRank: 2,
    cooldown: 2,
    effect: {
      kind: "damage",
      baseMagnitude: 2.4, magnitudePerRank: 0.4,
      scaling: { stat: "int", basePct: 240, pctPerRank: 40 },
    },
    requires: ["sor_bolt"],
    position: { tier: 2, col: 1 },
    flavor: "Borrowed light, paid back in full.",
  },
  {
    id: "sor_renewal", charClass: "sorcerer", name: "Greater Renewal",
    description: "Pour vitality back into yourself in a flood.",
    kind: "active_heal",
    maxRank: 3,
    rankCosts: [2, 3, 3],
    baseManaCost: 22, manaCostPerRank: 4,
    cooldown: 3,
    effect: {
      kind: "heal",
      baseMagnitude: 0.45, magnitudePerRank: 0.10,
    },
    requires: ["sor_mend"],
    position: { tier: 2, col: 2 },
    flavor: "The body remembers the shape of itself.",
  },
  {
    id: "sor_cataclysm", charClass: "sorcerer", name: "Cataclysm",
    description: "World-ender. The air itself becomes a weapon.",
    kind: "active_attack",
    maxRank: 3,
    rankCosts: [3, 3, 4],
    baseManaCost: 30, manaCostPerRank: 3,
    cooldown: 3,
    effect: {
      kind: "damage",
      baseMagnitude: 4.0, magnitudePerRank: 0.6,
      scaling: { stat: "int", basePct: 400, pctPerRank: 60 },
    },
    requires: ["sor_starfall"],
    position: { tier: 3, col: 1 },
    flavor: "The first sentence of an ending.",
  },
];

// ============ CLASS PATHS ============
// Metadata for class specializations. Only Warrior has paths in this round;
// add Ranger/Sorcerer entries here when those classes' trees are expanded.
// The `identity` line is what shows in the Trainer's pitch cards; strengths
// and weaknesses are bullet lists in the same card so the player can compare
// them side-by-side before committing.
export const PATHS: PathDef[] = [
  {
    id: "dark_knight",
    charClass: "warrior",
    name: "Path of the Dark Knight",
    tagline: "Bleed first. Live second. Win finally.",
    description:
      "A pact written in your own blood. Each strike trades safety for ruin — and the wound becomes the well you drink from.",
    identity: "Aggressive · Selfish · High-damage",
    strengths: [
      "Lifesteal-based sustain — Soul Drain keeps you topped up mid-fight.",
      "Highest single-target damage in the Warrior tree.",
      "Carnage refunds its cooldown on execution kills.",
    ],
    weaknesses: [
      "Many skills cost HP — chip damage compounds fast.",
      "No reliable defensive options outside Black Aegis.",
      "Bloodthirst leaves you brittle if the kill doesn't land.",
    ],
    color: "#a21caf",
  },
  {
    id: "guardian",
    charClass: "warrior",
    name: "Path of the Guardian",
    tagline: "Stand between them and the dawn.",
    description:
      "The shield is the answer. So is the second shield. And the third. Outlast everything that swings at you, and one day you will outlast death itself.",
    identity: "Defensive · Protective · Sustain",
    strengths: [
      "Massive damage reduction — Steel Skin + Aegis stack absurd survival.",
      "Indomitable: once-per-run cheat-death insurance for boss runs.",
      "Sun Hammer rewards staying healthy with +50% damage.",
    ],
    weaknesses: [
      "Slow kill speed — long boss fights are the norm.",
      "Mana-hungry (lots of buffs cost full mana bars).",
      "Self-damage Warrior gear is mostly wasted on Guardians.",
    ],
    color: "#0ea5e9",
  },
];

export const AFFIX_POOL: Affix[] = [
  { name:"+10% Crit", value: 10, kind:"crit" },
  { name:"+8% Lifesteal", value: 8, kind:"lifesteal" },
  { name:"+15% Fire Damage", value: 15, kind:"fire" },
  { name:"+5 Strength", value: 5, kind:"str" },
  { name:"+5 Agility", value: 5, kind:"agi" },
  { name:"+5 Intelligence", value: 5, kind:"int" },
  { name:"+8 Vitality", value: 8, kind:"vit" },
  { name:"+10% Power", value: 10, kind:"power" },
];

// ============ CONSUMABLES ============
export const CONSUMABLES: Consumable[] = [
  { id:"c_hp_minor",   name:"Minor Health Potion",   description:"Restores 40 HP.",  kind:"heal", magnitude:40,  price:25,  stackLimit:9, flavor:"Tastes like copper.", rarity:"common" },
  { id:"c_hp_major",   name:"Major Health Potion",   description:"Restores 120 HP.", kind:"heal", magnitude:120, price:80,  stackLimit:5, flavor:"Glows like a wound at sunset.", rarity:"uncommon" },
  { id:"c_hp_supreme", name:"Supreme Health Elixir", description:"Restores 300 HP.", kind:"heal", magnitude:300, price:220, stackLimit:3, flavor:"Drink at the edge of death.", rarity:"rare" },
  { id:"c_mp_minor",   name:"Minor Mana Draught",    description:"Restores 20 mana.", kind:"mana", magnitude:20, price:20,  stackLimit:9, flavor:"Bitter blue. The good kind.", rarity:"common" },
  { id:"c_mp_major",   name:"Major Mana Draught",    description:"Restores 60 mana.", kind:"mana", magnitude:60, price:70,  stackLimit:5, flavor:"Crackles on the tongue.", rarity:"uncommon" },
  { id:"c_buff_str",   name:"Strength Elixir",       description:"+10 STR for 3 turns.", kind:"buff_str", magnitude:10, duration:3, price:90, stackLimit:5, combatOnly:true, flavor:"Knuckles whiten on their own.", rarity:"rare" },
  { id:"c_buff_agi",   name:"Agility Tincture",      description:"+10 AGI for 3 turns.", kind:"buff_agi", magnitude:10, duration:3, price:90, stackLimit:5, combatOnly:true, flavor:"Time slows. Or you speed up.", rarity:"rare" },
  { id:"c_buff_int",   name:"Intelligence Essence",  description:"+10 INT for 3 turns.", kind:"buff_int", magnitude:10, duration:3, price:90, stackLimit:5, combatOnly:true, flavor:"The world resolves into footnotes.", rarity:"rare" },
  { id:"c_shield",     name:"Iron Skin Salve",       description:"Absorbs the next 50 damage.", kind:"shield", magnitude:50, duration:99, price:120, stackLimit:3, combatOnly:true, flavor:"Smells like a smithy and a chapel.", rarity:"epic" },
  { id:"c_fortune",    name:"Scroll of Fortune",     description:"Doubles gold from kills for 4 turns.", kind:"gold_boost", magnitude:2, duration:4, price:60, stackLimit:5, combatOnly:true, flavor:"The dice were always loaded.", rarity:"uncommon" },
];

// ============ TRADERS ============
// Tier cap per trader level (index 0 = level 1). The ladder extends to level
// 20: epic remains the *normal* trader ceiling, and Legendary only appears
// at L17+ as a rare jackpot slot. Mythic and above remain strictly drop-only.
export const TRADERS: TraderDef[] = [
  {
    id: "t_aldric",
    name: "Aldric the Smith",
    type: "blacksmith",
    flavor: "His arms could bend a horseshoe back into a horse.",
    tierUnlockByLevel: [
      "common","common","common","uncommon",        // 1–4
      "uncommon","uncommon","rare","rare",          // 5–8
      "rare","rare","epic","epic",                  // 9–12
      "epic","epic","epic","epic",                  // 13–16
      "legendary","legendary","legendary","legendary", // 17–20 (jackpot only)
    ],
    xpPerGoldSpent: 1,
    stockSize: 6,
  },
  {
    id: "t_sera",
    name: "Sera the Alchemist",
    type: "alchemist",
    flavor: "Her shop has more bottles than walls.",
    // Sera's tier ladder caps at epic — her endgame value comes from
    // expanded stock size (+1 slot at L15 and +1 at L20), not higher tiers.
    tierUnlockByLevel: [
      "common","common","common","uncommon",
      "uncommon","uncommon","rare","rare",
      "rare","rare","epic","epic",
      "epic","epic","epic","epic",
      "epic","epic","epic","epic",
    ],
    xpPerGoldSpent: 1,
    stockSize: 7,
  },
];

// ============ QUESTS ============
export const QUESTS: QuestDef[] = [
  {
    id: "q_first_whisper",
    title: "The First Whisper",
    description: "Clear the Whispering Thicket once.",
    objectives: [
      { id:"o1", description:"Clear Whispering Thicket", type:"clear_dungeon", targetId:"d_thicket", count:1 }
    ],
    reward: { gold:75, xp:100, consumables:[{ id:"c_hp_minor", qty:2 }] },
    rewardSummary: "75 gold · 100 xp · 2× Minor Health Potion",
  },
  {
    id: "q_merchant_apprentice",
    title: "Merchant's Apprentice",
    description: "Spend 500 gold at any trader.",
    objectives: [
      { id:"o1", description:"Spend 500 gold at traders", type:"spend_at_trader", count:500 }
    ],
    reward: { gold:150, traderXpBonus:{ traderId:"t_aldric", amount:200 } },
    rewardSummary: "150 gold · 200 trader XP for Aldric",
  },
  {
    id: "q_brewers_bounty",
    title: "Brewer's Bounty",
    description: "Buy 5 consumables from Sera the Alchemist.",
    objectives: [
      { id:"o1", description:"Purchase consumables from Sera", type:"buy_from_trader", targetId:"t_sera", count:5 }
    ],
    reward: { gold:120, consumables:[{ id:"c_hp_major", qty:2 }, { id:"c_mp_major", qty:1 }] },
    rewardSummary: "120 gold · 2× Major HP · 1× Major MP",
  },
  {
    id: "q_tempered",
    title: "Tempered",
    description: "Reach level 15.",
    objectives: [
      { id:"o1", description:"Reach level 15", type:"reach_level", count:15 }
    ],
    reward: { gold:300, xp:500 },
    rewardSummary: "300 gold · 500 xp",
  },
  {
    id: "q_first_epic",
    title: "The Glittering Threshold",
    description: "Find an Epic-tier item.",
    objectives: [
      { id:"o1", description:"Find an Epic+ item", type:"find_tier", targetTier:"epic", count:1 }
    ],
    reward: { gold:200, shards:30 },
    rewardSummary: "200 gold · 30 shards",
  },
  {
    id: "q_death_becomes_stone",
    title: "Death Becomes Stone",
    description: "Defeat the Bone Archlich in the Sunken Crypt.",
    objectives: [
      { id:"o1", description:"Slay the Bone Archlich", type:"kill_monster", targetId:"m_lich", count:1 }
    ],
    reward: { gold:200, xp:300, items:[{ templateId:"r_bloodmoon" }] },
    rewardSummary: "200 gold · 300 xp · Bloodmoon Ring",
    prerequisiteQuestIds:["q_first_whisper"],
  },
  {
    id: "q_eternal_cold",
    title: "The Eternal Cold",
    description: "Clear the Frostbound Vault three times.",
    objectives: [
      { id:"o1", description:"Clear Frostbound Vault", type:"clear_dungeon", targetId:"d_frost", count:3 }
    ],
    reward: { gold:400, items:[{ templateId:"w_frost_scepter", tier:"epic" }] },
    rewardSummary: "400 gold · Epic Frost Scepter",
    prerequisiteQuestIds:["q_first_whisper"],
  },
  {
    id: "q_heart_of_mountain",
    title: "Heart of the Mountain",
    description: "Clear Molten Heart Forge on Expert or higher.",
    objectives: [
      { id:"o1", description:"Clear Molten Heart on Expert+", type:"clear_dungeon", targetId:"d_forge", targetDifficulty:"Expert", count:1 }
    ],
    reward: { gold:600, items:[{ templateId:"w_dragonbone" }] },
    rewardSummary: "600 gold · Dragonbone Greatsword (Legendary)",
    prerequisiteQuestIds:["q_death_becomes_stone"],
  },
  {
    id: "q_shadow_purge",
    title: "Pact with Oblivion",
    description: "Slay 25 monsters within Voidspire Citadel.",
    objectives: [
      { id:"o1", description:"Voidspire kills", type:"kill_any_in_dungeon", targetId:"d_void", count:25 }
    ],
    reward: { gold:800, items:[{ templateId:"a_oblivion" }] },
    rewardSummary: "800 gold · Mythic Amulet",
    prerequisiteQuestIds:["q_heart_of_mountain"],
  },
  {
    id: "q_into_the_mire",
    title: "Into the Mire",
    description: "Find any Mythic-tier item.",
    objectives: [
      { id:"o1", description:"Find a Mythic+ item", type:"find_tier", targetTier:"mythic", count:1 }
    ],
    reward: { gold:500, shards:100, essence:8 },
    rewardSummary: "500 gold · 100 shards · 8 essence",
    prerequisiteQuestIds:["q_heart_of_mountain"],
  },
  {
    id: "q_forgotten_throne",
    title: "The Forgotten Throne",
    description: "Defeat The Forgotten One on Nightmare difficulty.",
    objectives: [
      { id:"o1", description:"Clear Throne of the Forgotten on Nightmare", type:"clear_dungeon", targetId:"d_throne", targetDifficulty:"Nightmare", count:1 }
    ],
    reward: { gold:5000, unlocks:["new_game_plus"], items:[{ templateId:"w_starblade" }] },
    rewardSummary: "5000 gold · Celestial Starblade · NEW GAME+",
    prerequisiteQuestIds:["q_shadow_purge"],
  },
];

export const ACHIEVEMENTS = [
  { id:"a_first_kill", name:"First Blood", desc:"Defeat any enemy." },
  { id:"a_first_dungeon", name:"Threshold Crosser", desc:"Clear a dungeon." },
  { id:"a_epic", name:"Epic Hoarder", desc:"Find an Epic item." },
  { id:"a_legendary", name:"Legend in the Making", desc:"Find a Legendary item." },
  { id:"a_celestial", name:"Touched by Stars", desc:"Find a Celestial item." },
  { id:"a_level10", name:"Tempered", desc:"Reach level 10." },
  { id:"a_nightmare", name:"Walker of Nightmares", desc:"Clear any dungeon on Nightmare." },
  { id:"a_throne", name:"Unforgotten", desc:"Defeat The Forgotten One." },
  { id:"a_first_purchase", name:"First Transaction", desc:"Buy something from a trader." },
  { id:"a_trader_max", name:"Patron Saint", desc:"Level a trader to 10." },
  { id:"a_trader_grandmaster", name:"Archpatron", desc:"Level a trader to 20." },
];
