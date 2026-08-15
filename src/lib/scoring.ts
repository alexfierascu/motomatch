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

/* ───────────────────────────── Recommendation ──────────────────────────────*/

export interface Answers {
  experience: "beginner" | "some" | "experienced";
  wantsToShift: "no" | "dontcare" | "yes";
  bodyStyle: Category | "unsure";
  budget: number; // EUR ceiling
  performance: "relaxed" | "balanced" | "sporty";
  seatHeight: "very" | "somewhat" | "not";
  use: "city" | "commute" | "weekend" | "touring" | "mixed";
}

export interface Recommendation {
  bike: Motorcycle;
  score: number; // 0–10
  reasons: string[];
  warnings: string[];
}

const TARGET_HP: Record<Answers["performance"], number> = {
  relaxed: 30,
  balanced: 47,
  sporty: 70,
};

/**
 * Scores every bike out of 10. Deliberately NOT a horsepower ranking: a Gold
 * Wing-style outlier loses on weight, price and beginner suitability, and a
 * 300 cc scooter loses on the performance and body-style axes.
 */
export function recommend(answers: Answers, limit = 5): Recommendation[] {
  const results: Recommendation[] = MOTORCYCLES.map((bike) => {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Transmission — the dominant factor when the rider says no shifting.
    if (answers.wantsToShift === "no") {
      if (bike.transmission.fullyAutomatic) {
        score += 3.2;
        reasons.push("No clutch and no gear changes — exactly what you asked for");
      } else if (bike.transmission.type === "e-clutch") {
        score += 1.1;
        warnings.push("Clutchless, but you still change gears with your foot");
      } else {
        score += 0;
        warnings.push("Conventional manual gearbox — clutch and six gears");
      }
    } else if (answers.wantsToShift === "dontcare") {
      score += bike.transmission.fullyAutomatic ? 2.2 : 1.8;
      if (bike.transmission.fullyAutomatic)
        reasons.push("Automatic, which keeps your first months simpler");
    } else {
      score += bike.transmission.type === "manual" ? 2.4 : 1.6;
      if (bike.transmission.type === "manual") reasons.push("Traditional manual gearbox");
    }

    // 2. Budget.
    if (bike.price.eur <= answers.budget) {
      score += 1.8;
      const headroom = answers.budget - bike.price.eur;
      if (headroom > 2000) reasons.push(`Comfortably inside your €${answers.budget.toLocaleString()} budget`);
      else reasons.push(`Fits your €${answers.budget.toLocaleString()} budget`);
    } else {
      const over = bike.price.eur - answers.budget;
      score += Math.max(0, 1.8 - (over / answers.budget) * 6);
      warnings.push(`About €${over.toLocaleString()} over your budget`);
    }

    // 3. Beginner suitability, weighted by stated experience.
    const beginnerWeight = answers.experience === "beginner" ? 0.22 : answers.experience === "some" ? 0.12 : 0.05;
    score += bike.beginnerRating * beginnerWeight;
    if (answers.experience === "beginner" && bike.beginnerRating >= 8)
      reasons.push("Rated highly for first-time riders");
    if (answers.experience === "beginner" && bike.beginnerRating <= 6)
      warnings.push("Demanding as a first bike");

    // 4. Performance fit — closeness to target, not raw power.
    const target = TARGET_HP[answers.performance];
    const hpFit = Math.max(0, 1 - Math.abs(bike.engine.horsepower - target) / 45);
    score += hpFit * 1.6;
    if (hpFit > 0.8) reasons.push(`Power level matches the ${answers.performance} riding you described`);
    if (bike.engine.horsepower < target - 15)
      warnings.push("Noticeably less power than you said you wanted");

    // 5. Body style.
    if (answers.bodyStyle !== "unsure") {
      if (bike.category === answers.bodyStyle) {
        score += 1.4;
        reasons.push(`${bike.category.charAt(0).toUpperCase() + bike.category.slice(1)}, the style you chose`);
      } else if (answers.bodyStyle !== "scooter" && bike.vehicleType === "scooter") {
        score += 0.1;
        warnings.push("This is a scooter, not a motorcycle");
      } else {
        score += 0.5;
      }
    } else {
      score += 0.7;
    }

    // 6. Seat height.
    const lowSeat = bike.dimensions.seatHeight <= 760;
    const midSeat = bike.dimensions.seatHeight <= 800;
    if (answers.seatHeight === "very") {
      score += lowSeat ? 1.2 : midSeat ? 0.5 : 0;
      if (lowSeat) reasons.push(`Low ${bike.dimensions.seatHeight} mm seat — easy to flat-foot`);
      if (!midSeat) warnings.push(`${bike.dimensions.seatHeight} mm seat is tall`);
    } else if (answers.seatHeight === "somewhat") {
      score += lowSeat ? 0.8 : midSeat ? 0.6 : 0.2;
    } else {
      score += 0.5;
    }

    // 7. Intended use.
    const useFit: Record<Answers["use"], (b: typeof bike) => number> = {
      city: (b) => (b.vehicleType === "scooter" ? 1 : b.dimensions.weight < 200 ? 0.7 : 0.3),
      commute: (b) => (b.vehicleType === "scooter" ? 0.9 : b.dimensions.weight < 210 ? 0.8 : 0.5),
      weekend: (b) => (b.vehicleType === "motorcycle" ? 0.9 : 0.35),
      touring: (b) =>
        b.category === "touring" || b.category === "adventure"
          ? 1
          : b.vehicleType === "motorcycle"
            ? 0.55
            : 0.4,
      mixed: () => 0.7,
    };
    const uf = useFit[answers.use](bike);
    score += uf;
    if (uf >= 0.9) reasons.push(`Well suited to ${answers.use === "touring" ? "long trips" : answers.use} riding`);

    // 8. Licence reality check for a stated beginner.
    if (!bike.a2Compatible) {
      if (answers.experience === "beginner") {
        score -= 1.2;
        warnings.push("Not A2-legal — needs a full category A licence");
      } else {
        warnings.push("Not A2-legal");
      }
    } else {
      score += 0.4;
      reasons.push("A2-compatible");
    }

    return {
      bike,
      score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
      reasons: reasons.slice(0, 6),
      warnings: warnings.slice(0, 3),
    };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ────────────────────────────── Headline stats ─────────────────────────────*/

export function headlineStats() {
  const automatics = MOTORCYCLES.filter((b) => b.transmission.fullyAutomatic);
  const autoMotorcycles = automatics.filter((b) => b.vehicleType === "motorcycle");

  const cheapest = automatics.reduce((a, b) => (b.price.eur < a.price.eur ? b : a));
  const mostPowerful = automatics.reduce((a, b) =>
    b.engine.horsepower > a.engine.horsepower ? b : a,
  );
  const bestBeginner = automatics.reduce((a, b) => {
    if (b.beginnerRating !== a.beginnerRating) return b.beginnerRating > a.beginnerRating ? b : a;
    return b.price.eur < a.price.eur ? b : a;
  });
  // "Best motorcycle" = closest automatic motorcycle to the 450SR, which is the
  // question the site is built around.
  const bestMotorcycle = autoMotorcycles
    .map((b) => similarityTo(MOTORCYCLES.find((r) => r.id === "cfmoto-450sr")!, b))
    .sort((a, b) => b.score - a.score)[0].bike;

  return {
    total: MOTORCYCLES.length,
    automaticCount: automatics.length,
    cheapest,
    mostPowerful,
    bestBeginner,
    bestMotorcycle,
  };
}
