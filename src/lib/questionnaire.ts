import type { QuizAnswers } from "./match";
import type { RidingStyle } from "../data/types";
import { QUESTIONS, type Question } from "../data/questionnaire";

/* ────────────────────────────────────────────────────────────────────────────
 * Questionnaire state: the answer model, selection behavior, browser
 * persistence, and the adapter that feeds the existing recommendation engine.
 *
 * Answers are stored in normalized form keyed by stable option ids:
 * single-select questions hold one id, multi-select questions hold an array
 * of ids in the order they were picked (the first pick is the primary one
 * where the engine needs a single value). `toQuizAnswers` translates the
 * whole thing into the engine's richer `QuizAnswers` so `/results` runs the
 * same `matchAll()` the product has always used — one engine, no parallel
 * architecture. Persistence is a thin localStorage abstraction so a backend
 * can replace it later without touching the UI.
 * ──────────────────────────────────────────────────────────────────────────*/

export interface QuestionnaireAnswers {
  experience?: string;
  ridingStyle?: string[];
  personality?: string[];
  transmission?: string;
  performance?: string;
  sizeFit?: string;
  budget?: string;
  practicality?: string;
  passenger?: string;
  condition?: string;
}

/** Keys whose answers are arrays — derived from the answer model itself, so
 *  the question config and the state can never disagree about shape. */
export type MultiSelectKey = {
  [K in keyof QuestionnaireAnswers]-?: QuestionnaireAnswers[K] extends string[] | undefined
    ? K
    : never;
}[keyof QuestionnaireAnswers];

export type SingleSelectKey = Exclude<keyof QuestionnaireAnswers, MultiSelectKey>;

export interface QuestionnaireState {
  answers: QuestionnaireAnswers;
  /** Index of the question the user was last on. */
  step: number;
  /** True once the final question has been submitted. */
  completed: boolean;
}

/* ───────────────────────── selection behavior ──────────────────────────────
 * The question definition drives the interaction; the UI never hard-codes
 * per-question rules. Adding a future question type means extending these
 * three functions plus the renderer's branch on `question.type`. */

/** Current selection as a uniform list, whatever the question type. */
export function selectionsOf(answers: QuestionnaireAnswers, question: Question): string[] {
  if (question.type === "multi-select") return answers[question.key] ?? [];
  const value = answers[question.key];
  return value ? [value] : [];
}

/**
 * Applies a click on `optionId` and returns the next answers object.
 * Single-select replaces; multi-select toggles, refusing new picks past
 * `maxSelections` (returns the same reference so callers can ignore it)
 * while always allowing deselection.
 */
export function withSelection(
  answers: QuestionnaireAnswers,
  question: Question,
  optionId: string,
): QuestionnaireAnswers {
  if (question.type === "multi-select") {
    const current = answers[question.key] ?? [];
    const picked = current.includes(optionId);
    if (!picked && current.length >= question.maxSelections) return answers;
    const next = picked ? current.filter((id) => id !== optionId) : [...current, optionId];
    const out = { ...answers };
    out[question.key] = next.length > 0 ? next : undefined;
    return out;
  }
  const out = { ...answers };
  out[question.key] = optionId;
  return out;
}

/** True when the question's requirement is satisfied. */
export function isAnswerComplete(answers: QuestionnaireAnswers, question: Question): boolean {
  const count = selectionsOf(answers, question).length;
  if (question.type === "multi-select")
    return count >= question.minSelections && count <= question.maxSelections;
  return count === 1;
}

/* ───────────────────────────── persistence ─────────────────────────────────*/

const STORAGE_KEY = "motomatch.questionnaire.v1";

/** Coerces persisted answers (including pre-multi-select strings) into the
 *  current shape, dropping unknown ids so stale data can't corrupt state. */
function normalizeAnswers(raw: unknown): QuestionnaireAnswers {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const out: QuestionnaireAnswers = {};
  for (const question of QUESTIONS) {
    const value = source[question.key];
    const known = (id: unknown): id is string =>
      typeof id === "string" && question.options.some((o) => o.id === id);
    if (question.type === "multi-select") {
      const list = (Array.isArray(value) ? value : [value]).filter(known);
      if (list.length > 0) out[question.key] = list.slice(0, question.maxSelections);
    } else {
      const single = Array.isArray(value) ? value[0] : value;
      if (known(single)) out[question.key] = single;
    }
  }
  return out;
}

export function loadQuestionnaire(): QuestionnaireState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuestionnaireState>;
    if (typeof parsed !== "object" || parsed === null || typeof parsed.answers !== "object")
      return null;
    return {
      answers: normalizeAnswers(parsed.answers),
      step: typeof parsed.step === "number" ? parsed.step : 0,
      completed: Boolean(parsed.completed),
    };
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
  // Every selected riding style contributes; the engine scores the union.
  const ridingStyles = [...new Set((a.ridingStyle ?? []).flatMap((id) => RIDING_STYLE_MAP[id] ?? []))];
  // The engine models one temperament; the user's first pick is primary.
  const personality = a.personality?.[0] ?? "";
  return {
    experience: (a.experience as QuizAnswers["experience"]) ?? "little",
    ridingStyles,
    everything: ridingStyles.length === 0,
    personality: PERSONALITY_MAP[personality] ?? "minimal",
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
