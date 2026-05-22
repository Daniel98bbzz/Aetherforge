import type { Item, Monster, DungeonDef, Slot, Tier, Affix, Consumable, TraderDef, QuestDef } from "./types";

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

export const CLASS_SKILLS: Record<string, { name: string; cost: number; mult: number; desc: string }[]> = {
  warrior: [
    { name:"Cleave", cost: 8, mult: 1.8, desc:"A wide arcing strike." },
    { name:"Shield Bash", cost: 12, mult: 2.4, desc:"Brutal staggering blow." },
  ],
  ranger: [
    { name:"Piercing Shot", cost: 8, mult: 1.9, desc:"An arrow that finds gaps." },
    { name:"Hailstorm", cost: 14, mult: 2.6, desc:"A barrage of arrows." },
  ],
  sorcerer: [
    { name:"Arcane Bolt", cost: 8, mult: 2.0, desc:"A focused lance of mana." },
    { name:"Starfall", cost: 16, mult: 3.0, desc:"Calls down burning stars." },
  ],
};

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
