import { useGame } from "@/lib/game/store";
import { Card } from "@/components/ui/card";
import { ACHIEVEMENTS } from "@/lib/game/data";
import { Trophy } from "lucide-react";

export function AchievementsScreen() {
  const { save } = useGame();
  if (!save) return null;
  const p = save.player;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-amber-200">Achievements</h1>
        <p className="text-muted-foreground">{p.achievements.length} / {ACHIEVEMENTS.length} unlocked</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const got = p.achievements.includes(a.id);
          return (
            <Card key={a.id} className={`p-4 flex items-center gap-3 ${got ? "border-yellow-500/40 bg-yellow-500/5" : "bg-card/40"}`}>
              <Trophy className={`w-8 h-8 ${got ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" : "text-muted-foreground opacity-40"}`} />
              <div>
                <div className={`font-serif ${got ? "text-yellow-300" : "text-muted-foreground"}`}>{a.name}</div>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}