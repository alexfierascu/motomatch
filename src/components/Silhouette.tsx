import type { Motorcycle } from "../data/types";

/**
 * Photography stand-in.
 *
 * Real press photos of these bikes are copyrighted by the manufacturers, so the
 * project ships with drawn silhouettes instead of hot-linking images that would
 * break or infringe. Each body style gets its own profile, so a cruiser reads as
 * a cruiser at thumbnail size. See README for how to drop in real photos.
 */

type Profile = "cruiser" | "sport" | "naked" | "adventure" | "touring" | "scooter";

function profileFor(bike: Motorcycle): Profile {
  if (bike.vehicleType === "scooter" && bike.category === "adventure") return "adventure";
  return bike.category as Profile;
}

const BODIES: Record<Profile, string> = {
  // Low, long, teardrop tank, high bars
  cruiser:
    "M46 78 L58 62 Q64 54 76 53 L104 53 Q112 42 124 44 L146 47 Q152 48 150 53 L142 60 L150 66 Q156 70 154 76 L120 76 L96 76 Q86 66 74 68 L58 74 Z M104 53 L112 40 L136 38",
  // Fairing, tucked stance, tail up
  sport:
    "M44 74 Q46 58 62 52 L88 46 Q96 34 112 34 L140 38 Q152 40 156 50 L150 58 L156 62 L150 72 L118 72 L96 72 Q88 60 74 62 L56 68 Z M56 52 L44 56 L40 68",
  // Exposed tank and frame, upright bars
  naked:
    "M46 76 Q48 60 66 56 L92 50 Q100 40 116 42 L144 46 Q154 48 152 56 L144 62 L152 70 L118 72 L94 72 Q86 60 72 62 L56 70 Z M92 50 L100 36 L128 34",
  // Tall, beak, long travel
  adventure:
    "M42 72 Q44 52 62 46 L90 40 Q98 28 114 30 L142 34 Q154 36 152 46 L142 54 L152 64 L116 68 L92 68 Q84 54 68 56 L52 64 Z M90 40 L96 24 L126 22 M42 72 L34 58",
  // Screen, fairing, luggage line
  touring:
    "M42 72 Q44 54 62 48 L90 42 Q98 30 114 32 L144 36 Q158 38 156 48 L146 56 L158 66 L118 70 L92 70 Q84 56 68 58 L52 66 Z M90 42 L92 24 L118 20 M146 56 L164 56 L164 66",
  // Step-through, floorboard, front apron
  scooter:
    "M48 78 Q50 62 66 58 L84 56 L92 44 Q98 34 114 36 L134 40 Q146 44 144 56 L138 66 L148 72 L112 74 L84 74 L70 66 Z M92 44 L84 30 L106 26 M84 56 L70 66",
};

export function Silhouette({
  bike,
  className = "",
  accent = false,
}: {
  bike: Motorcycle;
  className?: string;
  accent?: boolean;
}) {
  const profile = profileFor(bike);
  const stroke = accent ? "var(--color-accent)" : "var(--color-line-bright)";
  const fill = accent ? "rgba(255,92,22,0.10)" : "rgba(255,255,255,0.035)";
  const gid = `g-${bike.id}`;

  return (
    <svg
      viewBox="0 0 200 100"
      className={className}
      role="img"
      aria-label={`${bike.manufacturer} ${bike.model} — ${profile} profile illustration`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* ground line */}
      <line x1="14" y1="90" x2="186" y2="90" stroke="var(--color-line)" strokeWidth="1" />

      {/* wheels */}
      <circle cx="52" cy="76" r="14" fill="none" stroke={`url(#${gid})`} strokeWidth="2.5" />
      <circle cx="52" cy="76" r="5" fill="none" stroke={stroke} strokeWidth="1" opacity="0.5" />
      <circle cx="150" cy="76" r="14" fill="none" stroke={`url(#${gid})`} strokeWidth="2.5" />
      <circle cx="150" cy="76" r="5" fill="none" stroke={stroke} strokeWidth="1" opacity="0.5" />

      {/* body */}
      <path
        d={BODIES[profile]}
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
