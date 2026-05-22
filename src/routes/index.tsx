import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameProvider, useGame } from "@/lib/game/store";
import { StartScreen } from "@/components/game/StartScreen";
import { GameLayout, type View } from "@/components/game/Layout";
import { HubScreen } from "@/components/game/screens/HubScreen";
import { DungeonScreen } from "@/components/game/screens/DungeonScreen";
import { InventoryScreen } from "@/components/game/screens/InventoryScreen";
import { CharacterScreen } from "@/components/game/screens/CharacterScreen";
import { ForgeScreen } from "@/components/game/screens/ForgeScreen";
import { CodexScreen } from "@/components/game/screens/CodexScreen";
import { AchievementsScreen } from "@/components/game/screens/AchievementsScreen";
import { Embers } from "@/components/game/Confetti";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Aetherforge: Nine Tiers — Dark Fantasy RPG" },
      { name: "description", content: "A single-player dark fantasy text RPG of loot, glory, and the nine tiers of legend." },
    ],
  }),
});

function Index() {
  return (
    <GameProvider>
      <Embers />
      <GameRoot />
      <Toaster theme="dark" position="top-right" />
    </GameProvider>
  );
}

function GameRoot() {
  const { save } = useGame();
  const [view, setView] = useState<View>("hub");
  if (!save) return <StartScreen />;
  // Lock sidebar navigation while a run is active (force route through Dungeons)
  const locked = !!save.activeRun && view !== "dungeons";
  if (save.activeRun && view !== "dungeons") {
    // auto-switch to dungeons when a run is active
    setTimeout(() => setView("dungeons"), 0);
  }
  return (
    <GameLayout view={view} setView={setView} locked={locked}>
      {view === "hub" && <HubScreen setView={setView} />}
      {view === "dungeons" && <DungeonScreen />}
      {view === "inventory" && <InventoryScreen />}
      {view === "character" && <CharacterScreen />}
      {view === "forge" && <ForgeScreen />}
      {view === "codex" && <CodexScreen />}
      {view === "achievements" && <AchievementsScreen />}
    </GameLayout>
  );
}
