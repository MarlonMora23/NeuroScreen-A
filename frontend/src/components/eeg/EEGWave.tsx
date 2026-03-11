const EEGWave = ({ className = "", delay = 0 }: { className?: string; delay?: number }) => {
  const points = Array.from({ length: 200 }, (_, i) => {
    const x = i * 6;
    const y = 50 + 
      Math.sin(i * 0.3) * 15 + 
      Math.sin(i * 0.7) * 10 + 
      Math.sin(i * 1.5) * 5 +
      (Math.random() - 0.5) * 8;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg
      className={`absolute w-[200%] h-24 opacity-20 ${className}`}
      viewBox="0 0 1200 100"
      preserveAspectRatio="none"
      style={{ animationDelay: `${delay}s` }}
    >
      <polyline
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        points={points}
        className="animate-wave"
      />
    </svg>
  );
};

export default EEGWave;
