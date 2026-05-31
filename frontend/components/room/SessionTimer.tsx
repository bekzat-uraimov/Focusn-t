"use client";

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface Props {
  remaining: number;
  duration: number;
  progress: number;
}

export default function SessionTimer({ remaining, duration, progress }: Props) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);

  const hue = Math.round(120 * (1 - progress)); // green → red as time passes
  const color = `hsl(${hue}, 70%, 50%)`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(240 3.7% 15.9%)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 2s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-mono font-bold">{fmt(remaining)}</span>
          <span className="text-xs text-muted-foreground">remaining</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{fmt(duration)} session</p>
    </div>
  );
}
