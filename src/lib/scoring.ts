import type { Category, Motorcycle } from "../data/types";
import { MOTORCYCLES } from "../data/motorcycles";

/* ────────────────────────────── Closest match ──────────────────────────────
 * The question this site exists to answer is not "which bike is best" but
 * "which automatic bike feels closest to the 450-class bike I actually want".
 * So similarity is measured against a reference bike across the axes a rider
 * notices: power, weight, price, displacement, seat height and body style.
 * ───────────────────────────────────────────────────────────────────────────*/

const SIMILARITY_WEIGHTS = {
  horsepower: 0.3,
  weight: 0.22,
  price: 0.18,
  displacement: 0.1,
  seatHeight: 0.1,
  bodyStyle: 0.1,
} as const;

/** 1 when identical, decaying to 0 as the gap reaches `tolerance`. */
function closeness(a: number, b: number, tolerance: number): number {
  const gap = Math.abs(a - b);
  return Math.max(0, 1 - gap / tolerance);
}

/** How similar two riding positions feel. Scooters are their own world. */
function bodyStyleCloseness(a: Motorcycle, b: Motorcycle): number {
  if (a.vehicleType !== b.vehicleType) return 0.15;
  if (a.category === b.category) return 1;
  const upright: Category[] = ["naked", "adventure", "touring"];
  const bothUpright = upright.includes(a.category) && upright.includes(b.category);
  if (bothUpright) return 0.7;
  if (
    (a.category === "sport" && upright.includes(b.category)) ||
    (b.category === "sport" && upright.includes(a.category))
  )
    return 0.5;
  return 0.3;
}

export interface SimilarityResult {
  bike: Motorcycle;
  score: number; // 0–100
  breakdown: { label: string; score: number; detail: string }[];
}

export function similarityTo(reference: Motorcycle, candidate: Motorcycle): SimilarityResult {
  const hp = closeness(reference.engine.horsepower, candidate.engine.horsepower, 45);
  const wt = closeness(reference.dimensions.weight, candidate.dimensions.weight, 90);
  const pr = closeness(reference.price.eur, candidate.price.eur, 9000);
  const cc = closeness(reference.engine.displacement, candidate.engine.displacement, 900);
  const sh = closeness(reference.dimensions.seatHeight, candidate.dimensions.seatHeight, 200);
  const bs = bodyStyleCloseness(reference, candidate);

  const score =
    hp * SIMILARITY_WEIGHTS.horsepower +
    wt * SIMILARITY_WEIGHTS.weight +
    pr * SIMILARITY_WEIGHTS.price +
    cc * SIMILARITY_WEIGHTS.displacement +
    sh * SIMILARITY_WEIGHTS.seatHeight +
    bs * SIMILARITY_WEIGHTS.bodyStyle;

  return {
    bike: candidate,
    score: Math.round(score * 1000) / 10,
    breakdown: [
      {
        label: "Power",
        score: Math.round(hp * 100),
        detail: `${candidate.engine.horsepower} hp vs ${reference.engine.horsepower} hp`,
      },
      {
        label: "Weight",
        score: Math.round(wt * 100),
        detail: `${candidate.dimensions.weight} kg vs ${reference.dimensions.weight} kg`,
      },
      {
        label: "Price",
        score: Math.round(pr * 100),
        detail: `€${candidate.price.eur.toLocaleString()} vs €${reference.price.eur.toLocaleString()}`,
      },
      {
        label: "Engine size",
        score: Math.round(cc * 100),
        detail: `${candidate.engine.displacement} cc vs ${reference.engine.displacement} cc`,
      },
      {
        label: "Seat height",
        score: Math.round(sh * 100),
        detail: `${candidate.dimensions.seatHeight} mm vs ${reference.dimensions.seatHeight} mm`,
      },
      {
        label: "Riding position",
        score: Math.round(bs * 100),
        detail: `${candidate.category} vs ${reference.category}`,
      },
    ],
  };
}

/** Closest fully automatic alternatives to a reference bike, best first. */
export function closestAutomatics(referenceId: string, limit = 4): SimilarityResult[] {
  const reference = MOTORCYCLES.find((b) => b.id === referenceId);
  if (!reference) return [];
  return MOTORCYCLES.filter((b) => b.transmission.fullyAutomatic)
    .map((b) => similarityTo(reference, b))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
