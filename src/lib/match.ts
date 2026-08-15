import type { Category, Motorcycle, RidingStyle } from "../data/types";
import { MOTORCYCLES, bikeName } from "../data/motorcycles";
import { TRANSMISSIONS } from "../data/transmissions";

/* ────────────────────────────────────────────────────────────────────────────
 * The MotoMatch engine.
 *
 * Every bike gets a compatibility score built from eight normalized
 * dimensions (0–1), each weighted. Answers influence several dimensions at
 * once, and the per-dimension breakdown is surfaced in the UI so the user can
 * see WHY a bike matched. Nothing here filters — a poor fit scores low rather
 * than disappearing, except that "absolutely no shifting" makes manual bikes
 * effectively unrecommendable, which is the point.
 * ──────────────────────────────────────────────────────────────────────────*/

export interface QuizAnswers {
  experience: "new" | "little" | "comfortable" | "veteran";
  /** Empty array plus `everything: true` means "a bit of everything". */
  ridingStyles: RidingStyle[];
  everything?: boolean;
  personality: "sporty" | "relaxed" | "adventure" | "minimal" | "classic" | "touring";
  shifting: "manual" | "either" | "prefer-auto" | "auto-only";
  performance: "easy" | "balanced" | "quick" | "serious";
  manageability: "very" | "somewhat" | "not" | "substantial";
  seat: "low" | "average" | "any" | "tall";
  /** EUR ceiling; null = "just exploring". */
  budget: number | null;
  /** Stored for the future used-bike dataset; not scored today. */
  newUsed: "new" | "used" | "either" | "unsure";
  practicality: "none" | "somewhat" | "very" | "everything";
  passenger: "never" | "occasionally" | "frequently";
  /** Optional visual question; null/undefined when skipped. */
  look?: Category | null;
}

export interface Dimension {
  key: string;
  label: string;
  score: number; // 0–100
  weight: number;
}

export interface MatchResult {
  bike: Motorcycle;
  /** 0–100 overall compatibility. */
  score: number;
  breakdown: Dimension[];
  reasons: string[];
  warnings: string[];
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ─────────────────────────── dimension scoring ────────────────────────────*/

function transmissionFit(a: QuizAnswers, b: Motorcycle): number {
  const auto = b.transmission.fullyAutomatic;
  const t = b.transmission.type;
  switch (a.shifting) {
    case "manual":
      return t === "manual" ? 1 : t === "e-clutch" ? 0.8 : 0.45;
    case "either":
      return 1;
    case "prefer-auto":
      return auto ? 1 : t === "e-clutch" ? 0.55 : 0.25;
    case "auto-only":
      // E-Clutch still shifts with the foot — it does not qualify.
      return auto ? 1 : t === "e-clutch" ? 0.12 : 0.03;
  }
}

/** How strongly each personality answer maps to each bike category. */
const PERSONALITY_AFFINITY: Record<QuizAnswers["personality"], Partial<Record<Category, number>>> = {
  sporty: { sport: 1, naked: 0.85, retro: 0.4, adventure: 0.35, touring: 0.3, "dual-sport": 0.3, cruiser: 0.2, scooter: 0.15 },
  relaxed: { cruiser: 1, scooter: 0.85, touring: 0.7, retro: 0.6, naked: 0.4, adventure: 0.4, "dual-sport": 0.25, sport: 0.1 },
  adventure: { adventure: 1, "dual-sport": 0.95, touring: 0.55, naked: 0.35, scooter: 0.3, retro: 0.3, sport: 0.2, cruiser: 0.2 },
  minimal: { naked: 1, "dual-sport": 0.75, retro: 0.7, scooter: 0.55, sport: 0.5, cruiser: 0.3, adventure: 0.3, touring: 0.1 },
  classic: { retro: 1, cruiser: 0.75, naked: 0.45, scooter: 0.25, adventure: 0.2, touring: 0.2, "dual-sport": 0.2, sport: 0.15 },
  touring: { touring: 1, adventure: 0.85, cruiser: 0.5, naked: 0.3, scooter: 0.35, sport: 0.15, retro: 0.25, "dual-sport": 0.3 },
};

/** Categories that read as visual siblings for the optional "look" question. */
const LOOK_SIBLINGS: Partial<Record<Category, Category[]>> = {
  sport: ["naked"],
  naked: ["sport", "retro"],
  cruiser: ["retro"],
  adventure: ["dual-sport", "touring"],
  "dual-sport": ["adventure"],
  touring: ["adventure"],
  retro: ["naked", "cruiser"],
  scooter: [],
};

function styleFit(a: QuizAnswers, b: Motorcycle): number {
  // 1. Riding-use overlap.
  let overlap: number;
  if (a.everything || a.ridingStyles.length === 0) {
    // "A bit of everything" rewards versatile bikes.
    overlap = 0.55 + Math.min(0.45, b.ridingStyles.length * 0.11);
  } else {
    const hits = a.ridingStyles.filter((s) => b.ridingStyles.includes(s)).length;
    overlap = hits / a.ridingStyles.length;
  }

  // 2. Personality → category affinity.
  const personality = PERSONALITY_AFFINITY[a.personality][b.category] ?? 0.2;

  // 3. Optional visual preference.
  if (a.look) {
    const look =
      b.category === a.look ? 1 : (LOOK_SIBLINGS[a.look] ?? []).includes(b.category) ? 0.55 : 0.15;
    return clamp01(0.4 * overlap + 0.35 * personality + 0.25 * look);
  }
  return clamp01(0.5 * overlap + 0.5 * personality);
}

function experienceFit(a: QuizAnswers, b: Motorcycle): number {
  const br = b.beginnerRating;
  const perf = b.performanceLevel;
  switch (a.experience) {
    case "new": {
      let f = clamp01((br - 3) / 5.5); // 9→1, 6→0.55, 4→0.18
      if (perf >= 7) f *= 0.35; // no 200 hp bikes for day one
      return f;
    }
    case "little": {
      let f = clamp01((br - 2) / 5); // 7→1, 5→0.6
      if (perf >= 8) f *= 0.5;
      return f;
    }
    case "comfortable":
      return perf >= 9 ? 0.85 : 1;
    case "veteran":
      return 1;
  }
}

const PERFORMANCE_TARGET: Record<QuizAnswers["performance"], number> = {
  easy: 2.5,
  balanced: 5,
  quick: 7,
  serious: 9.5,
};

function performanceFit(a: QuizAnswers, b: Motorcycle): number {
  // performanceLevel already blends power, weight and character; the
  // power-to-weight nudge separates bikes sharing a level.
  const ptw = b.engine.horsepower / b.dimensions.weight; // ~0.15 relaxed … 0.9 superbike
  const thrill = Math.min(10, b.performanceLevel + (ptw > 0.45 ? 0.5 : 0));
  return clamp01(1 - Math.abs(thrill - PERFORMANCE_TARGET[a.performance]) / 4.5);
}

function budgetFit(a: QuizAnswers, b: Motorcycle): number {
  if (a.budget == null) return 1; // just exploring
  const price = b.price.eur;
  if (price <= a.budget) return 1;
  return clamp01(1 - (price - a.budget) / (a.budget * 0.5));
}

function sizeFit(a: QuizAnswers, b: Motorcycle): number {
  const w = b.dimensions.weight;
  const s = b.dimensions.seatHeight;

  let weightScore: number;
  switch (a.manageability) {
    case "very":
      weightScore = clamp01(1 - (w - 165) / 110);
      break;
    case "somewhat":
      weightScore = clamp01(1 - (w - 185) / 160);
      break;
    case "not":
      weightScore = 1;
      break;
    case "substantial":
      weightScore = Math.max(0.4, clamp01((w - 160) / 80));
      break;
  }

  let seatScore: number;
  switch (a.seat) {
    case "low":
      seatScore = clamp01(1 - (s - 700) / 160);
      break;
    case "average":
      seatScore = s <= 800 ? 1 : clamp01(1 - (s - 800) / 120);
      break;
    case "any":
      seatScore = 1;
      break;
    case "tall":
      seatScore = clamp01(0.4 + (s - 700) / 130 * 0.6);
      break;
  }

  return clamp01(0.6 * weightScore + 0.4 * seatScore);
}

function practicalityFit(a: QuizAnswers, b: Motorcycle): number {
  const p = b.practicality;
  switch (a.practicality) {
    case "none":
      return 1;
    case "somewhat":
      return p >= 5 ? 1 : clamp01(0.5 + p * 0.1);
    case "very":
      return clamp01(p / 9);
    case "everything":
      return clamp01((p - 2) / 7);
  }
}

function passengerFit(a: QuizAnswers, b: Motorcycle): number {
  const ps = b.passengerSuitability;
  switch (a.passenger) {
    case "never":
      return 1;
    case "occasionally":
      return ps >= 5 ? 1 : clamp01(0.45 + ps * 0.11);
    case "frequently":
      return clamp01(ps / 9);
  }
}

/* ───────────────────────────── the match call ─────────────────────────────*/

const DIMENSIONS: { key: string; label: string; weight: number; fn: (a: QuizAnswers, b: Motorcycle) => number }[] = [
  { key: "style", label: "Riding style", weight: 1.6, fn: styleFit },
  { key: "transmission", label: "Transmission", weight: 1.6, fn: transmissionFit },
  { key: "budget", label: "Budget", weight: 1.3, fn: budgetFit },
  { key: "experience", label: "Experience", weight: 1.2, fn: experienceFit },
  { key: "performance", label: "Performance", weight: 1.2, fn: performanceFit },
  { key: "size", label: "Size & fit", weight: 1.0, fn: sizeFit },
  { key: "practicality", label: "Practicality", weight: 0.8, fn: practicalityFit },
  { key: "passenger", label: "Passenger", weight: 0.6, fn: passengerFit },
];

export function matchAll(answers: QuizAnswers): MatchResult[] {
  return MOTORCYCLES.map((bike) => {
    const dims: Dimension[] = DIMENSIONS.map((d) => ({
      key: d.key,
      label: d.label,
      weight: d.weight,
      score: Math.round(d.fn(answers, bike) * 100),
    }));
    const totalWeight = DIMENSIONS.reduce((s, d) => s + d.weight, 0);
    let raw = dims.reduce((s, d) => s + (d.score / 100) * d.weight, 0) / totalWeight;

    // "Absolutely no gear shifting" is a requirement, not a preference: bikes
    // the rider would have to shift can never rank near the top, no matter how
    // well everything else fits. E-Clutch keeps a sliver more than manual —
    // no clutch work, but the foot shifter disqualifies it all the same.
    if (answers.shifting === "auto-only" && !bike.transmission.fullyAutomatic) {
      raw *= bike.transmission.type === "e-clutch" ? 0.35 : 0.25;
    }

    return {
      bike,
      score: Math.round(raw * 100),
      breakdown: dims,
      ...reasonsFor(answers, bike, dims),
    };
  }).sort((a, b) => b.score - a.score);
}

/* ─────────────────────────── reason generation ────────────────────────────
 * Reasons are built from the user's actual answers and the bike's actual
 * numbers — never generic praise. Ordered by how much each dimension
 * contributed, capped at five.
 * ──────────────────────────────────────────────────────────────────────────*/

const STYLE_LABEL: Record<RidingStyle, string> = {
  city: "city riding",
  commuting: "commuting",
  weekend: "weekend rides",
  touring: "long-distance touring",
  mountain: "mountain roads",
  sport: "sporty riding",
  offroad: "off-road adventures",
  cruising: "cruising",
};

function reasonsFor(
  a: QuizAnswers,
  b: Motorcycle,
  dims: Dimension[],
): { reasons: string[]; warnings: string[] } {
  const candidates: { key: string; text: string }[] = [];
  const warnings: string[] = [];
  const tx = TRANSMISSIONS[b.transmission.type];
  const name = b.model + (b.variant ? ` ${b.variant}` : "");

  // Transmission
  if ((a.shifting === "auto-only" || a.shifting === "prefer-auto") && b.transmission.fullyAutomatic) {
    candidates.push({
      key: "transmission",
      text: `You said you'd rather not shift — the ${name}'s ${tx.short} is fully automatic: no clutch lever, no gear lever.`,
    });
  } else if (a.shifting === "manual" && b.transmission.type === "manual") {
    candidates.push({ key: "transmission", text: `Keeps the traditional manual gearbox you asked for.` });
  } else if (a.shifting !== "auto-only" && b.transmission.type === "e-clutch") {
    candidates.push({
      key: "transmission",
      text: `E-Clutch removes stalling and clutch work, while keeping a real gearbox — you still shift with your foot.`,
    });
  }
  if (a.shifting === "auto-only" && !b.transmission.fullyAutomatic) {
    warnings.push(
      b.transmission.type === "e-clutch"
        ? "Not actually automatic — E-Clutch still needs foot shifts."
        : "Conventional manual gearbox — you asked for no shifting.",
    );
  }

  // Style
  if (!a.everything && a.ridingStyles.length > 0) {
    const hits = a.ridingStyles.filter((s) => b.ridingStyles.includes(s));
    if (hits.length > 0) {
      candidates.push({
        key: "style",
        text: `You ride mostly ${hits.map((s) => STYLE_LABEL[s]).join(" and ")} — exactly what this bike is set up for.`,
      });
    }
  } else if (a.everything && b.ridingStyles.length >= 4) {
    candidates.push({
      key: "style",
      text: `You wanted a bit of everything — this is one of the most versatile machines in the database.`,
    });
  }

  // Experience
  if ((a.experience === "new" || a.experience === "little") && b.beginnerRating >= 8) {
    candidates.push({
      key: "experience",
      text: `Rated ${b.beginnerRating}/10 for newer riders — forgiving power and easy manners.`,
    });
  }
  if (a.experience === "new" && b.beginnerRating <= 5) {
    warnings.push("Demanding as a first bike.");
  }

  // Budget
  if (a.budget != null) {
    if (b.price.eur <= a.budget) {
      const headroom = a.budget - b.price.eur;
      candidates.push({
        key: "budget",
        text:
          headroom >= 1500
            ? `At ~€${b.price.eur.toLocaleString()} it leaves real room in your €${a.budget.toLocaleString()} budget for gear and insurance.`
            : `Fits your €${a.budget.toLocaleString()} budget.`,
      });
    } else {
      warnings.push(`About €${(b.price.eur - a.budget).toLocaleString()} over your budget.`);
    }
  }

  // Size
  if (a.manageability === "very" && b.dimensions.weight <= 195) {
    candidates.push({
      key: "size",
      text: `${b.dimensions.weight} kg — among the lighter, more manageable bikes here.`,
    });
  }
  if (a.seat === "low" && b.dimensions.seatHeight <= 760) {
    candidates.push({
      key: "size",
      text: `${b.dimensions.seatHeight} mm seat — low enough for most riders to flat-foot.`,
    });
  }
  if (a.seat === "low" && b.dimensions.seatHeight > 820) {
    warnings.push(`${b.dimensions.seatHeight} mm seat is tall, and you asked for low.`);
  }

  // Performance
  if (a.performance === "serious" && b.performanceLevel >= 8) {
    candidates.push({
      key: "performance",
      text: `${b.engine.horsepower} hp and ${b.engine.torque} Nm — performance is what this bike is for.`,
    });
  } else if (a.performance === "easy" && b.performanceLevel <= 3) {
    candidates.push({ key: "performance", text: `Soft, predictable power delivery — nothing here will catch you out.` });
  }

  // Practicality & passenger
  if ((a.practicality === "very" || a.practicality === "everything") && b.practicality >= 8) {
    candidates.push({ key: "practicality", text: `One of the most practical machines in the database — storage, range and everyday usability.` });
  }
  if (a.passenger === "frequently" && b.passengerSuitability >= 7) {
    candidates.push({ key: "passenger", text: `Genuinely comfortable two-up, which you said matters.` });
  } else if (a.passenger === "frequently" && b.passengerSuitability <= 4) {
    warnings.push("Not a great passenger bike, and you ride two-up often.");
  }

  // Order by dimension contribution, dedupe by key order stability, cap at 5.
  const rank = new Map(dims.map((d) => [d.key, d.score * d.weight]));
  const reasons = candidates
    .sort((x, y) => (rank.get(y.key) ?? 0) - (rank.get(x.key) ?? 0))
    .map((c) => c.text)
    .slice(0, 5);

  // Guarantee at least two reasons using the bike's own editorial line.
  if (reasons.length < 2) reasons.push(b.whoFor);

  return { reasons, warnings: warnings.slice(0, 3) };
}

/** Convenience for the results page: best + strong alternatives + the rest. */
export function matchGroups(answers: QuizAnswers) {
  const all = matchAll(answers);
  return { best: all[0], alternatives: all.slice(1, 5), rest: all.slice(5) };
}

export { bikeName };
