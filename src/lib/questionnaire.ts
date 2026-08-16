import type { QuizAnswers } from "./match";
import type { RidingStyle } from "../data/types";

/* ────────────────────────────────────────────────────────────────────────────
 * Questionnaire state: the answer model, browser persistence, and the adapter
 * that feeds the existing recommendation engine.
 *
 * The questionnaire stores its own compact answer shape (one string per
 * question). `toQuizAnswers` translates it into the engine's richer
 * `QuizAnswers` so `/results` runs the same `matchAll()` the product has
 * always used — one engine, no parallel architecture. Persistence is a thin
 * localStorage abstraction so a backend can replace it later without touching
 * the UI.
 * ──────────────────────────────────────────────────────────────────────────*/

export interface QuestionnaireAnswers {
  experience?: string;
  ridingStyle?: string;
  personality?: string;
  transmission?: string;
  performance?: string;
  sizeFit?: string;
  budget?: string;
  practicality?: string;
  passenger?: string;
  condition?: string;
}

export interface QuestionnaireState {
  answers: QuestionnaireAnswers;
  /** Index of the question the user was last on. */
  step: number;
  /** True once question 10 has been submitted. */
  completed: boolean;
}

const STORAGE_KEY = "motomatch.questionnaire.v1";

export function loadQuestionnaire(): QuestionnaireState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuestionnaireState;
    if (typeof parsed !== "object" || typeof parsed.answers !== "object") return null;
    return { answers: parsed.answers ?? {}, step: parsed.step ?? 0, completed: Boolean(parsed.completed) };
  } catch {
    return null;
  }
}

export function saveQuestionnaire(state: QuestionnaireState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the flow still works for the session */
  }
}

export function clearQuestionnaire(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ─────────────────────── adapter → recommendation engine ──────────────────*/

const RIDING_STYLE_MAP: Record<string, RidingStyle[]> = {
  city: ["city", "commuting"],
  weekend: ["weekend"],
  touring: ["touring"],
  adventure: ["offroad", "weekend"],
  sport: ["sport", "mountain"],
};

const PERSONALITY_MAP: Record<string, QuizAnswers["personality"]> = {
  easy: "minimal",
  fun: "sporty",
  fast: "sporty",
  comfortable: "relaxed",
  capable: "adventure",
};

const TRANSMISSION_MAP: Record<string, QuizAnswers["shifting"]> = {
  manual: "manual",
  automatic: "prefer-auto",
  either: "either",
  unknown: "either",
};

const PERFORMANCE_MAP: Record<string, QuizAnswers["performance"]> = {
  easy: "easy",
  balanced: "balanced",
  strong: "quick",
  maximum: "serious",
};

const SIZE_FIT_MAP: Record<string, { manageability: QuizAnswers["manageability"]; seat: QuizAnswers["seat"] }> = {
  "low-seat": { manageability: "somewhat", seat: "low" },
  standard: { manageability: "somewhat", seat: "average" },
  tall: { manageability: "not", seat: "tall" },
  lightweight: { manageability: "very", seat: "any" },
  "no-preference": { manageability: "not", seat: "any" },
};

const BUDGET_MAP: Record<string, number | null> = {
  "under-5000": 5000,
  "5000-8000": 8000,
  "8000-12000": 12000,
  "12000-18000": 18000,
  "18000-plus": null, // effectively uncapped
};

const PRACTICALITY_MAP: Record<string, QuizAnswers["practicality"]> = {
  extremely: "everything",
  quite: "very",
  somewhat: "somewhat",
  not: "none",
};

const PASSENGER_MAP: Record<string, QuizAnswers["passenger"]> = {
  frequently: "frequently",
  sometimes: "occasionally",
  rarely: "never",
  never: "never",
};

const CONDITION_MAP: Record<string, QuizAnswers["newUsed"]> = {
  "new-only": "new",
  "mostly-new": "either",
  "new-or-used": "either",
  "used-preferred": "used",
};

/** Translates questionnaire answers into the engine's input shape. */
export function toQuizAnswers(a: QuestionnaireAnswers): QuizAnswers {
  return {
    experience: (a.experience as QuizAnswers["experience"]) ?? "little",
    ridingStyles: RIDING_STYLE_MAP[a.ridingStyle ?? ""] ?? [],
    everything: !(a.ridingStyle && RIDING_STYLE_MAP[a.ridingStyle]),
    personality: PERSONALITY_MAP[a.personality ?? ""] ?? "minimal",
    shifting: TRANSMISSION_MAP[a.transmission ?? ""] ?? "either",
    performance: PERFORMANCE_MAP[a.performance ?? ""] ?? "balanced",
    manageability: SIZE_FIT_MAP[a.sizeFit ?? ""]?.manageability ?? "somewhat",
    seat: SIZE_FIT_MAP[a.sizeFit ?? ""]?.seat ?? "any",
    budget: BUDGET_MAP[a.budget ?? ""] ?? null,
    newUsed: CONDITION_MAP[a.condition ?? ""] ?? "unsure",
    practicality: PRACTICALITY_MAP[a.practicality ?? ""] ?? "somewhat",
    passenger: PASSENGER_MAP[a.passenger ?? ""] ?? "never",
    look: null,
  };
}
