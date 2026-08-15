import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, RidingStyle } from "../data/types";
import { MOTORCYCLES, bikeName } from "../data/motorcycles";
import { matchGroups, type MatchResult, type QuizAnswers } from "../lib/match";
import { BikePhoto } from "../components/Photo";
import { A2Badge, ShiftRail, TransmissionBadge } from "../components/Transmission";
import { Price } from "../components/BikeCard";
import { usePageMeta } from "../lib/seo";
import { prefersReducedMotion } from "../lib/motion";
import { useCompare } from "../App";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";
const STORAGE_KEY = "motomatch.quiz.v1";

/* ─────────────────────────────── questions ────────────────────────────────*/

type Opt = { value: string; label: string; sub?: string };

interface Question {
  key: keyof QuizAnswers | "look";
  kicker: string;
  title: string;
  hint?: string;
  multi?: boolean;
  skippable?: boolean;
  options: Opt[];
}

const QUESTIONS: Question[] = [
  {
    key: "experience",
    kicker: "About you",
    title: "How much riding experience do you have?",
    options: [
      { value: "new", label: "I'm completely new", sub: "I've never ridden or I'm just starting." },
      { value: "little", label: "I've ridden a little", sub: "Some experience, but I'm still learning." },
      { value: "comfortable", label: "I'm comfortable on a bike", sub: "I've ridden regularly." },
      { value: "veteran", label: "I've been riding for years", sub: "I know exactly what I'm doing." },
    ],
  },
  {
    key: "ridingStyles",
    kicker: "How you ride",
    title: "What kind of riding sounds like you?",
    hint: "Pick everything that applies.",
    multi: true,
    options: [
      { value: "city", label: "City & commuting" },
      { value: "weekend", label: "Weekend rides" },
      { value: "touring", label: "Long-distance touring" },
      { value: "mountain", label: "Mountain roads" },
      { value: "sport", label: "Fast / sporty riding" },
      { value: "offroad", label: "Off-road adventures" },
      { value: "cruising", label: "Cruising" },
      { value: "everything", label: "A bit of everything" },
    ],
  },
  {
    key: "personality",
    kicker: "Your kind of machine",
    title: "Which one feels most like you?",
    options: [
      { value: "sporty", label: "Sporty", sub: "Sharp, aggressive, fast." },
      { value: "relaxed", label: "Relaxed", sub: "Low, comfortable, laid-back." },
      { value: "adventure", label: "Adventure", sub: "Ready to go anywhere." },
      { value: "minimal", label: "Minimal", sub: "Light, simple, agile." },
      { value: "classic", label: "Classic", sub: "Retro character and timeless styling." },
      { value: "touring", label: "Touring", sub: "Comfort, distance and practicality." },
    ],
  },
  {
    key: "shifting",
    kicker: "Transmission",
    title: "How do you feel about changing gears?",
    hint: "DCT, Y-AMT and CVT are fully automatic. Honda's E-Clutch removes the clutch lever but you still shift with your foot.",
    options: [
      { value: "manual", label: "I want to shift myself", sub: "Traditional motorcycle experience." },
      { value: "either", label: "I don't mind either way", sub: "Transmission isn't important." },
      { value: "prefer-auto", label: "I'd rather not", sub: "I'd prefer an automatic or automated transmission." },
      { value: "auto-only", label: "Absolutely no gear shifting", sub: "Only bikes where I never select a gear." },
    ],
  },
  {
    key: "performance",
    kicker: "Performance",
    title: "How much performance do you want?",
    options: [
      { value: "easy", label: "Easy-going", sub: "Predictable and forgiving." },
      { value: "balanced", label: "Balanced", sub: "Enough power for everything." },
      { value: "quick", label: "Quick", sub: "I want something that feels fast." },
      { value: "serious", label: "Serious performance", sub: "Performance is a major priority." },
    ],
  },
  {
    key: "manageability",
    kicker: "Physical fit",
    title: "How important is an easy-to-manage motorcycle?",
    options: [
      { value: "very", label: "Very important", sub: "I want something light and approachable." },
      { value: "somewhat", label: "Somewhat important" },
      { value: "not", label: "Not particularly important" },
      { value: "substantial", label: "I prefer something substantial" },
    ],
  },
  {
    key: "seat",
    kicker: "Physical fit",
    title: "How do you feel about seat height?",
    options: [
      { value: "low", label: "I want a low seat" },
      { value: "average", label: "Average is fine" },
      { value: "any", label: "I don't care" },
      { value: "tall", label: "I prefer a taller riding position" },
    ],
  },
  {
    key: "budget",
    kicker: "Budget",
    title: "What's your motorcycle budget?",
    hint: "Indicative European prices, on-the-road, before gear and insurance.",
    options: [
      { value: "5000", label: "Under €5,000" },
      { value: "7500", label: "€5,000–€7,500" },
      { value: "10000", label: "€7,500–€10,000" },
      { value: "15000", label: "€10,000–€15,000" },
      { value: "100000", label: "€15,000+" },
      { value: "explore", label: "I'm just exploring" },
    ],
  },
  {
    key: "newUsed",
    kicker: "Budget",
    title: "Are you looking for a new or used motorcycle?",
    hint: "MotoMatch currently lists new-bike prices; used listings are on the roadmap.",
    options: [
      { value: "new", label: "New only" },
      { value: "used", label: "Used is fine" },
      { value: "either", label: "Either" },
      { value: "unsure", label: "I don't know yet" },
    ],
  },
  {
    key: "practicality",
    kicker: "Daily life",
    title: "How important is practicality?",
    options: [
      { value: "none", label: "I just want to ride", sub: "Practicality doesn't matter." },
      { value: "somewhat", label: "Somewhat important" },
      { value: "very", label: "Very important" },
      { value: "everything", label: "I need it to do everything", sub: "Commuting, storage, passenger, touring." },
    ],
  },
  {
    key: "passenger",
    kicker: "Daily life",
    title: "Will you regularly ride with a passenger?",
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "frequently", label: "Frequently" },
    ],
  },
  {
    key: "look",
    kicker: "One last thing — optional",
    title: "Which look attracts you most?",
    hint: "Real bikes from the database. Skip if you'd rather not choose.",
    skippable: true,
    options: [
      { value: "sport", label: "Sport" },
      { value: "naked", label: "Naked" },
      { value: "cruiser", label: "Cruiser" },
      { value: "adventure", label: "Adventure" },
      { value: "retro", label: "Retro" },
      { value: "touring", label: "Touring" },
      { value: "scooter", label: "Scooter" },
    ],
  },
];

/** A representative, photographed bike for each category (for the look question). */
function representativeFor(category: Category) {
  return MOTORCYCLES.find((b) => b.category === category);
}

/* ────────────────────────────── persistence ───────────────────────────────*/

type Stored = { answers: Partial<QuizAnswers>; step: number };

function loadStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (typeof parsed.step !== "number" || typeof parsed.answers !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function store(answers: Partial<QuizAnswers>, step: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step }));
  } catch {
    /* storage unavailable — fine */
  }
}

/* ─────────────────────────────── the page ─────────────────────────────────*/

type Phase = "quiz" | "analyzing" | "results";

export default function FindMyBike() {
  usePageMeta({
    title: "Find my motorcycle — MotoMatch",
    description:
      "Answer a short quiz about how you ride, what you like and what you want to spend. MotoMatch scores every motorcycle in its database against your answers.",
  });

  const stored = useRef(loadStored());
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>(stored.current?.answers ?? {});
  const [step, setStep] = useState(stored.current?.step ?? 0);
  const [phase, setPhase] = useState<Phase>(
    stored.current && stored.current.step >= QUESTIONS.length ? "analyzing" : "quiz",
  );
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [customBudget, setCustomBudget] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];

  useEffect(() => {
    if (phase === "quiz") store(answers, step);
  }, [answers, step, phase]);

  // Move focus to the question heading on step change — keyboard/SR friendly.
  useEffect(() => {
    if (phase === "quiz") headingRef.current?.focus();
  }, [step, phase]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const delay = prefersReducedMotion() ? 150 : 1600;
    const t = setTimeout(() => setPhase("results"), delay);
    return () => clearTimeout(t);
  }, [phase]);

  const advance = (next: Partial<QuizAnswers>) => {
    const merged = { ...answers, ...next };
    setAnswers(merged);
    if (step >= QUESTIONS.length - 1) {
      store(merged, QUESTIONS.length);
      setPhase("analyzing");
    } else {
      setStep(step + 1);
    }
  };

  const answer = (value: string) => {
    switch (q.key) {
      case "budget":
        advance({ budget: value === "explore" ? null : Number(value) });
        break;
      case "look":
        advance({ look: value as Category });
        break;
      case "ridingStyles":
        // handled by multi-select continue
        break;
      default:
        advance({ [q.key]: value } as Partial<QuizAnswers>);
    }
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setStep(0);
    setMultiDraft([]);
    setCustomBudget("");
    setPhase("quiz");
  };

  /* ── results ── */
  if (phase === "analyzing") {
    return (
      <div className="flex min-h-[70svh] items-center justify-center px-4">
        <div className="text-center" role="status">
          <div className="kicker justify-center">MotoMatch</div>
          <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.4rem)] uppercase leading-tight">
            Analyzing your riding style…
          </h1>
          <div className="mx-auto mt-8 flex max-w-xs gap-1" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[3px] flex-1 animate-pulse bg-accent"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return <Results answers={answers as QuizAnswers} onRestart={restart} onEdit={() => { setPhase("quiz"); setStep(0); }} />;
  }

  /* ── quiz ── */
  const isMulti = q.multi === true;
  const isBudget = q.key === "budget";
  const isLook = q.key === "look";
  const progress = step / QUESTIONS.length;

  return (
    <div className={`pt-10 ${GUTTER}`}>
      <div className="flex items-baseline justify-between">
        <span className="kicker">MotoMatch</span>
        <span className="data text-[12px] tracking-[0.22em] text-dim">
          {String(step + 1).padStart(2, "0")} / {QUESTIONS.length}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-4 h-[3px] w-full bg-raised" aria-hidden>
        <div
          className="h-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>

      <div className="mt-12 max-w-4xl">
        <div className="eyebrow">{q.kicker}</div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 break-words font-display text-[clamp(1.6rem,7vw,3.4rem)] uppercase leading-tight outline-none"
        >
          {q.title}
        </h1>
        <p className="data mt-1 text-[11px] uppercase tracking-[0.18em] text-dim" aria-hidden>
          Question {step + 1} of {QUESTIONS.length}
        </p>
        {q.hint && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{q.hint}</p>}

        {/* Options */}
        {isLook ? (
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
            {q.options.map((o) => {
              const rep = representativeFor(o.value as Category);
              return (
                <button
                  key={o.value}
                  onClick={() => answer(o.value)}
                  className="group bg-panel text-left transition-colors hover:bg-raised"
                >
                  {rep && <BikePhoto bike={rep} kind="card" ratio="16/10" />}
                  <div className="p-4">
                    <div className="font-display text-lg uppercase group-hover:text-accent">{o.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={`mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 ${q.options.length > 4 ? "lg:grid-cols-3" : ""}`}>
            {q.options.map((o, i) => {
              const on = isMulti && (multiDraft.includes(o.value) || (o.value === "everything" && multiDraft.includes("everything")));
              return (
                <button
                  key={o.value}
                  onClick={() => {
                    if (!isMulti) return answer(o.value);
                    setMultiDraft((prev) => {
                      if (o.value === "everything") return prev.includes("everything") ? [] : ["everything"];
                      const without = prev.filter((x) => x !== "everything");
                      return without.includes(o.value)
                        ? without.filter((x) => x !== o.value)
                        : [...without, o.value];
                    });
                  }}
                  aria-pressed={isMulti ? on : undefined}
                  className="group relative bg-panel p-5 text-left transition-colors hover:bg-raised"
                  style={on ? { boxShadow: "inset 0 0 0 1px var(--color-accent)" } : undefined}
                >
                  <div className={`font-semibold ${on ? "text-accent" : "group-hover:text-accent"}`}>{o.label}</div>
                  {o.sub && <div className="mt-1 text-xs text-muted">{o.sub}</div>}
                  <span className="data mt-3 block text-[10px] text-dim" aria-hidden>
                    {isMulti ? (on ? "✓ selected" : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Budget: optional exact maximum */}
        {isBudget && (
          <form
            className="mt-5 flex flex-wrap items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(customBudget);
              if (n >= 1000) advance({ budget: n });
            }}
          >
            <label htmlFor="exact-budget" className="text-sm text-muted">
              Or set an exact maximum:
            </label>
            <div className="flex items-center gap-2">
              <span className="data text-sm text-dim">€</span>
              <input
                id="exact-budget"
                type="number"
                min={1000}
                step={500}
                value={customBudget}
                onChange={(e) => setCustomBudget(e.target.value)}
                className="data w-32 border border-line bg-raised px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                placeholder="9000"
              />
              <button type="submit" className="btn btn-ghost px-3 py-2 text-xs" disabled={Number(customBudget) < 1000}>
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Controls */}
        <div className="mt-8 flex items-center gap-5">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="data text-[11px] uppercase tracking-[0.18em] text-muted hover:text-accent"
            >
              ← Back
            </button>
          )}
          {isMulti && (
            <button
              onClick={() => {
                const everything = multiDraft.includes("everything");
                advance({
                  ridingStyles: everything ? [] : (multiDraft as RidingStyle[]),
                  everything,
                });
              }}
              disabled={multiDraft.length === 0}
              className="btn btn-primary px-5 py-2.5 text-xs disabled:opacity-40"
            >
              Continue
            </button>
          )}
          {q.skippable && (
            <button
              onClick={() => advance({ look: null })}
              className="data text-[11px] uppercase tracking-[0.18em] text-dim hover:text-muted"
            >
              Skip →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── results ──────────────────────────────────*/

function BreakdownBars({ result }: { result: MatchResult }) {
  return (
    <div className="space-y-2">
      {result.breakdown.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-[11px] text-dim">{d.label}</span>
          <div className="h-[3px] flex-1 bg-raised">
            <div className="h-full bg-accent transition-[width] duration-700" style={{ width: `${d.score}%` }} />
          </div>
          <span className="data w-10 shrink-0 text-right text-[11px] text-muted">{d.score}%</span>
        </div>
      ))}
    </div>
  );
}

type Refine = { transmission: "all" | "automatic" | "manual" | "e-clutch"; category: Category | "all" };

function Results({
  answers,
  onRestart,
  onEdit,
}: {
  answers: QuizAnswers;
  onRestart: () => void;
  onEdit: () => void;
}) {
  const { toggle, isSelected, full } = useCompare();
  const [showMore, setShowMore] = useState(false);
  const [refine, setRefine] = useState<Refine>({ transmission: "all", category: "all" });
  const groups = useMemo(() => matchGroups(answers), [answers]);
  const { best, alternatives, rest } = groups;

  const refined = useMemo(() => {
    const all = [best, ...alternatives, ...rest];
    return all.filter((r) => {
      if (refine.transmission === "automatic" && !r.bike.transmission.fullyAutomatic) return false;
      if (refine.transmission === "manual" && r.bike.transmission.type !== "manual") return false;
      if (refine.transmission === "e-clutch" && r.bike.transmission.type !== "e-clutch") return false;
      if (refine.category !== "all" && r.bike.category !== refine.category) return false;
      return true;
    });
  }, [best, alternatives, rest, refine]);

  const categories = useMemo(
    () => Array.from(new Set(MOTORCYCLES.map((b) => b.category))).sort(),
    [],
  );

  return (
    <div className={`pt-10 ${GUTTER}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="kicker">Based on your answers</span>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4rem)] uppercase leading-none">
            Your matches
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn btn-ghost px-3 py-2 text-xs">
            Edit answers
          </button>
          <button onClick={onRestart} className="btn btn-ghost px-3 py-2 text-xs">
            Start over
          </button>
        </div>
      </div>

      {/* Best match */}
      <div className="overflow-hidden border" style={{ borderColor: "rgba(255,77,18,0.4)" }}>
        <div className="grid lg:grid-cols-[1.25fr_1fr]">
          <div className="relative">
            <BikePhoto bike={best.bike} kind="hero" ratio="16/10" scrim="b" priority />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6">
              <div className="eyebrow">#1 best match · {best.bike.manufacturer}</div>
              <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.6rem)] uppercase leading-[0.95]">
                {best.bike.model}
                {best.bike.variant && <span className="text-accent"> {best.bike.variant}</span>}
              </h2>
            </div>
          </div>

          <div className="flex flex-col bg-panel p-6 md:p-8">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <span className="eyebrow">Compatibility</span>
              <span className="bignum text-5xl text-accent">
                {best.score}
                <span className="text-xl text-dim">%</span>
              </span>
            </div>

            <div className="mt-5">
              <div className="eyebrow mb-2">Why we think you'll like it</div>
              <ul className="space-y-2">
                {best.reasons.map((r) => (
                  <li key={r} className="flex gap-2.5 text-sm leading-relaxed">
                    <span className="text-accent" aria-hidden>—</span>
                    <span className="text-muted">{r}</span>
                  </li>
                ))}
              </ul>
              {best.warnings.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {best.warnings.map((w) => (
                    <li key={w} className="flex gap-2.5 text-sm leading-relaxed">
                      <span style={{ color: "var(--color-semi)" }} aria-hidden>!</span>
                      <span className="text-muted">{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <div className="eyebrow mb-3">Your match, dimension by dimension</div>
              <BreakdownBars result={best} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <Link to={`/bikes/${best.bike.id}`} className="btn btn-primary text-xs">
                See full details
              </Link>
              <button
                onClick={() => toggle(best.bike.id)}
                disabled={!isSelected(best.bike.id) && full}
                className="btn btn-ghost text-xs disabled:opacity-40"
              >
                {isSelected(best.bike.id) ? "Remove from compare" : "Add to compare"}
              </button>
              <span className="data ml-auto text-sm text-accent">
                <Price p={best.bike.price} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strong alternatives */}
      <h2 className="mb-5 mt-14 font-display text-2xl uppercase">Strong alternatives</h2>
      <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {alternatives.map((r) => (
          <Link key={r.bike.id} to={`/bikes/${r.bike.id}`} className="group block bg-panel transition-colors hover:bg-raised">
            <BikePhoto bike={r.bike} kind="card" ratio="16/10" />
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="eyebrow">{r.bike.manufacturer}</span>
                <span className="bignum text-xl text-accent">{r.score}%</span>
              </div>
              <h3 className="mt-1 font-display text-lg uppercase leading-tight group-hover:text-accent">
                {r.bike.model}
                {r.bike.variant ? ` ${r.bike.variant}` : ""}
              </h3>
              <div className="mt-2">
                <ShiftRail bike={r.bike} size="sm" />
              </div>
              <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-muted">{r.reasons[0]}</p>
              <div className="data mt-3 flex items-baseline justify-between text-[11px] text-muted">
                <span>
                  {r.bike.engine.horsepower} hp · {r.bike.dimensions.weight} kg
                </span>
                <Price p={r.bike.price} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Show more + refine */}
      {!showMore ? (
        <div className="mt-8 text-center">
          <button onClick={() => setShowMore(true)} className="btn btn-ghost">
            Show more motorcycles
          </button>
        </div>
      ) : (
        <section className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl uppercase">All matches</h2>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "All"],
                  ["automatic", "Fully automatic"],
                  ["e-clutch", "E-Clutch"],
                  ["manual", "Manual"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setRefine((r) => ({ ...r, transmission: v }))}
                  aria-pressed={refine.transmission === v}
                  className="border px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={
                    refine.transmission === v
                      ? { borderColor: "var(--color-accent)", color: "var(--color-accent)", background: "rgba(255,77,18,0.1)" }
                      : { borderColor: "var(--color-line)", color: "var(--color-muted)" }
                  }
                >
                  {label}
                </button>
              ))}
              <select
                value={refine.category}
                onChange={(e) => setRefine((r) => ({ ...r, category: e.target.value as Refine["category"] }))}
                aria-label="Filter by type"
                className="data border border-line bg-raised px-2 py-1.5 text-xs text-muted outline-none focus:border-accent"
              >
                <option value="all">All types</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden border border-line bg-line">
            {refined.map((r, i) => (
              <Link
                key={r.bike.id}
                to={`/bikes/${r.bike.id}`}
                className="flex items-center gap-5 bg-panel p-4 transition-colors hover:bg-raised"
              >
                <span className="bignum w-8 shrink-0 text-xl text-dim">{i + 1}</span>
                <div className="hidden w-28 shrink-0 sm:block">
                  <BikePhoto bike={r.bike} kind="card" ratio="16/10" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base uppercase leading-tight">{bikeName(r.bike)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <TransmissionBadge bike={r.bike} compact />
                    <A2Badge bike={r.bike} />
                    <span className="data text-[11px] text-muted">
                      {r.bike.engine.horsepower} hp · {r.bike.dimensions.weight} kg
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="bignum text-xl text-accent">{r.score}%</div>
                  <div className="data text-xs text-muted">
                    <Price p={r.bike.price} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {refined.length === 0 && (
            <p className="mt-4 text-sm text-muted">Nothing matches those refinements — loosen one.</p>
          )}
        </section>
      )}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-dim">
        Scores blend riding style, transmission, budget, experience, performance, size, practicality
        and passenger use — each dimension weighted, none absolute. A bigger engine never wins on
        its own.
      </p>
    </div>
  );
}
