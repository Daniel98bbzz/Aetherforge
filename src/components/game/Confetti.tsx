import { useEffect, useState } from "react";

export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ["#ec4899","#a78bfa","#22d3ee","#eab308","#f59e0b"];
    const arr = Array.from({ length: 60 }, (_, i) => ({
      id: trigger * 1000 + i,
      left: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 0.6,
    }));
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 3500);
    return () => clearTimeout(t);
  }, [trigger]);
  return (
    <>
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }} />
      ))}
    </>
  );
}

export function Embers() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="ember"
          style={{
            left: `${(i * 6.3) % 100}%`,
            animationDuration: `${8 + (i % 6) * 2}s`,
            animationDelay: `${-(i * 1.3)}s`,
            opacity: 0.5 + (i % 3) * 0.15,
          }} />
      ))}
    </div>
  );
}