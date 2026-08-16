import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { Category } from "../data/types";
import { MOTORCYCLES, bikeName } from "../data/motorcycles";
import { matchGroups, type MatchResult } from "../lib/match";
import { clearQuestionnaire, loadQuestionnaire, toQuizAnswers } from "../lib/questionnaire";
import { BikePhoto } from "../components/Photo";
import { A2Badge, ShiftRail, TransmissionBadge } from "../components/Transmission";
import { Price } from "../components/BikeCard";
import { usePageMeta } from "../lib/seo";
import { prefersReducedMotion } from "../lib/motion";
import { useCompare } from "../App";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

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

export default function Results() {
  usePageMeta({
    title: "Your matches — MotoMatch",
    description:
      "Your personalized motorcycle matches, scored across eight dimensions with the reasons explained.",
  });

  const navigate = useNavigate();
  const { toggle, isSelected, full } = useCompare();
  const [analyzing, setAnalyzing] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [refine, setRefine] = useState<Refine>({ transmission: "all", category: "all" });

  const state = useMemo(loadQuestionnaire, []);
  const answers = useMemo(() => (state ? toQuizAnswers(state.answers) : null), [state]);
  const groups = useMemo(() => (answers ? matchGroups(answers) : null), [answers]);

  useEffect(() => {
    const delay = prefersReducedMotion() ? 150 : 1600;
    const t = setTimeout(() => setAnalyzing(false), delay);
    return () => clearTimeout(t);
  }, []);

  // No completed questionnaire → back to the quiz.
  if (!state || !state.completed || !groups) return <Navigate to="/find-my-bike" replace />;

  const { best, alternatives, rest } = groups;

  if (analyzing) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center px-4">
        <div className="text-center" role="status">
          <div className="kicker justify-center">MotoMatch</div>
          <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.4rem)] uppercase leading-tight">
            Analyzing your riding style…
          </h1>
          <div className="mx-auto mt-8 flex max-w-xs gap-1" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[3px] flex-1 animate-pulse bg-accent" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const refined = [best, ...alternatives, ...rest].filter((r) => {
    if (refine.transmission === "automatic" && !r.bike.transmission.fullyAutomatic) return false;
    if (refine.transmission === "manual" && r.bike.transmission.type !== "manual") return false;
    if (refine.transmission === "e-clutch" && r.bike.transmission.type !== "e-clutch") return false;
    if (refine.category !== "all" && r.bike.category !== refine.category) return false;
    return true;
  });

  const categories = Array.from(new Set(MOTORCYCLES.map((b) => b.category))).sort();

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
          <button onClick={() => navigate("/find-my-bike")} className="btn btn-ghost px-3 py-2 text-xs">
            Edit answers
          </button>
          <button
            onClick={() => {
              clearQuestionnaire();
              navigate("/find-my-bike");
            }}
            className="btn btn-ghost px-3 py-2 text-xs"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Best match */}
      <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "rgba(217,194,154,0.4)" }}>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {alternatives.map((r) => (
          <Link
            key={r.bike.id}
            to={`/bikes/${r.bike.id}`}
            className="group overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line-bright"
          >
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
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={
                    refine.transmission === v
                      ? { borderColor: "var(--color-accent)", color: "var(--color-accent)", background: "rgba(217,194,154,0.1)" }
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
                className="data rounded-lg border border-line bg-raised px-2 py-1.5 text-xs text-muted outline-none focus:border-accent"
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

          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {refined.map((r, i) => (
              <Link
                key={r.bike.id}
                to={`/bikes/${r.bike.id}`}
                className="flex items-center gap-5 bg-panel p-4 transition-colors hover:bg-raised"
              >
                <span className="bignum w-8 shrink-0 text-xl text-dim">{i + 1}</span>
                <div className="hidden w-28 shrink-0 overflow-hidden rounded-lg sm:block">
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
