import { palette } from "../theme";

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function HelixMark({
  size = 20,
  color = palette.forest,
  strokeWidth = 1.8,
}: Props) {
  const length = 28;
  const amp = 7;
  const turns = 2.5;
  const samples = 80;
  const start = (32 - length) / 2;
  const ptsA: [number, number][] = [];
  const ptsB: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const y = start + t * length;
    const a = t * turns * Math.PI * 2;
    ptsA.push([16 + Math.sin(a) * amp, y]);
    ptsB.push([16 + Math.sin(a + Math.PI) * amp, y]);
  }
  const toPath = (pts: [number, number][]) =>
    "M " + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <path
        d={toPath(ptsA)}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={toPath(ptsB)}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
