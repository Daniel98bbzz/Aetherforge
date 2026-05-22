import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CharClass } from "@/lib/game/types";

export type StatKey =
  | "str" | "agi" | "int" | "vit"
  | "weaponPower" | "crit" | "lifesteal" | "fire" | "power" | "defense";

interface Props {
  stat: StatKey;
  charClass?: CharClass;
  children: ReactNode;
}

const PRIMARY_BY_CLASS: Record<CharClass, "str" | "agi" | "int"> = {
  warrior: "str",
  ranger: "agi",
  sorcerer: "int",
};

function describe(stat: StatKey, charClass?: CharClass): { title: string; body: string[] } {
  switch (stat) {
    case "str": {
      const primary = charClass && PRIMARY_BY_CLASS[charClass] === "str";
      return {
        title: "Strength (STR)",
        body: primary
          ? ["Primary damage stat for Warriors.", "Every point adds directly to your weapon damage before defense reduction."]
          : ["Adds raw might. As a non-Warrior, STR does NOT increase your damage — your class scales from a different stat.", "Still useful when stacked from gear affixes for cross-build flavor."],
      };
    }
    case "agi": {
      const primary = charClass && PRIMARY_BY_CLASS[charClass] === "agi";
      return {
        title: "Agility (AGI)",
        body: [
          primary
            ? "Primary damage stat for Rangers — every point increases your weapon damage."
            : "Does NOT add to your damage outside Ranger.",
          "Universal benefit: +0.3% Crit Chance per point (capped at 60% total).",
          "Also used in trap dodge rolls (AGI + d20 vs the room's DC).",
        ],
      };
    }
    case "int": {
      const primary = charClass && PRIMARY_BY_CLASS[charClass] === "int";
      return {
        title: "Intelligence (INT)",
        body: [
          primary
            ? "Primary damage stat for Sorcerers — every point increases your weapon damage."
            : "Does NOT add to your damage outside Sorcerer.",
          "Also used in puzzle resolution rolls (INT + d20 vs the room's DC).",
        ],
      };
    }
    case "vit":
      return {
        title: "Vitality (VIT)",
        body: [
          "Defensive stat for every class.",
          "Each point reduces incoming monster damage by 0.6 (rounded). 10 VIT ≈ 6 damage mitigated per hit.",
          "Boosts your max HP indirectly through gear with VIT stats.",
        ],
      };
    case "weaponPower":
      return {
        title: "Weapon Power",
        body: [
          "Base of the damage formula: (Weapon Power + class stat) × variance × fire mult − enemy defense.",
          "Comes from your equipped weapon's power value.",
          "Multiplied by total +% Power affixes from all gear.",
        ],
      };
    case "crit":
      return {
        title: "Crit Chance",
        body: [
          "min(60%, 5 + AGI × 0.3 + crit affixes).",
          "Critical hits multiply damage by ×1.8 and produce a brilliant log message.",
        ],
      };
    case "lifesteal":
      return {
        title: "Lifesteal",
        body: [
          "Heals you for that percent of damage dealt on every hit.",
          "Stacks additively from all 'Lifesteal' affixes on your gear.",
        ],
      };
    case "fire":
      return {
        title: "Fire Damage",
        body: [
          "Multiplies your damage by (1 + fire% / 100) before defense subtraction.",
          "Stacks additively from '+% Fire Damage' affixes across all gear.",
        ],
      };
    case "power":
      return {
        title: "Power Bonus",
        body: [
          "Multiplies your weapon's power by (1 + power% / 100).",
          "One of the strongest scaling affixes — best when stacked.",
        ],
      };
    case "defense":
      return {
        title: "Defense",
        body: ["Derived from VIT × 0.6 (rounded). Subtracted from incoming monster damage each hit."],
      };
  }
}

export function StatTooltip({ stat, charClass, children }: Props) {
  const d = describe(stat, charClass);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{children}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-card border border-amber-500/40 text-foreground p-3 space-y-1.5"
      >
        <div className="font-serif text-amber-300">{d.title}</div>
        {d.body.map((line, i) => (
          <p key={i} className="text-xs leading-snug">{line}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
