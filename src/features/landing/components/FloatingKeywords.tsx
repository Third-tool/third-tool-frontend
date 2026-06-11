interface Props {
  words: string[];
}

const positions = [
  { top: '8%',  left: '6%',  delay: 0,    rotate: -4 },
  { top: '22%', left: '60%', delay: 0.6,  rotate: 3 },
  { top: '46%', left: '15%', delay: 1.2,  rotate: -2 },
  { top: '38%', left: '70%', delay: 1.8,  rotate: 5 },
  { top: '66%', left: '40%', delay: 2.4,  rotate: -3 },
  { top: '76%', left: '8%',  delay: 3.0,  rotate: 2 },
  { top: '60%', left: '78%', delay: 3.6,  rotate: -5 },
];

export function FloatingKeywords({ words }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative h-[420px] w-full md:h-[520px]"
    >
      {words.slice(0, positions.length).map((w, i) => {
        const p = positions[i]!;
        return (
          <span
            key={w}
            className="absolute inline-flex items-center rounded-full border border-edge bg-glass px-4 py-1.5 text-sm text-cream-mute backdrop-blur-md"
            style={{
              top: p.top,
              left: p.left,
              transform: `rotate(${p.rotate}deg)`,
              animation: `float 6s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}
