import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { Category } from "../data/types";
import { MOTORCYCLES } from "../data/motorcycles";
import { QUESTIONS } from "../data/questionnaire";
import { matchAll, type MatchResult } from "../lib/match";
import {
  clearQuestionnaire,
  loadQuestionnaire,
  saveQuestionnaire,
  toQuizAnswers,
} from "../lib/questionnaire";
import { BikePhoto } from "../components/Photo";
import { Price } from "../components/BikeCard";
import { TRANSMISSIONS } from "../data/transmissions";
import { usePageMeta } from "../lib/seo";
import { prefersReducedMotion } from "../lib/motion";
import { useCompare } from "../App";
import { FavoriteButton } from "../components/Favorite";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

/* ────────────────────────────── result controls ────────────────────────────
 * Filters and sorting operate on the ranked list below the best match; the
 * best match is the page's anchor and always stays rank 01. All logic is
 * plain data transforms — no scoring happens in this file.
 * ──────────────────────────────────────────────────────────────────────────*/

type SortKey = "match" | "price-asc" | "price-desc" | "engine" | "power";

const SORT_LABEL: Record<SortKey, string> = {
  match: "Match",
  "price-asc": "Price low → high",
  "price-desc": "Price high → low",
  engine: "Engine size",
  power: "Power",
};

const SORTERS: Record<SortKey, (a: MatchResult, b: MatchResult) => number> = {
  match: (a, b) => b.score - a.score,
  "price-asc": (a, b) => a.bike.price.eur - b.bike.price.eur,
  "price-desc": (a, b) => b.bike.price.eur - a.bike.price.eur,
  engine: (a, b) => b.bike.engine.displacement - a.bike.engine.displacement,
  power: (a, b) => b.bike.engine.horsepower - a.bike.engine.horsepower,
};

interface ResultFilters {
  category: Category | "all";
  transmission: "all" | "automatic" | "e-clutch" | "manual";
  maxPrice: number | null;
  engine: "all" | "small" | "mid" | "large" | "liter";
  minScore: number;
}

const NO_FILTERS: ResultFilters = {
  category: "all",
  transmission: "all",
  maxPrice: null,
  engine: "all",
  minScore: 0,
};

const ENGINE_BANDS: Record<Exclude<ResultFilters["engine"], "all">, [number, number]> = {
  small: [0, 400],
  mid: [400, 700],
  large: [700, 1000],
  liter: [1000, Infinity],
};

function applyFilters(list: MatchResult[], f: ResultFilters): MatchResult[] {
  return list.filter((r) => {
    const b = r.bike;
    if (f.category !== "all" && b.category !== f.category) return false;
    if (f.transmission === "automatic" && !b.transmission.fullyAutomatic) return false;
    if (f.transmission === "e-clutch" && b.transmission.type !== "e-clutch") return false;
    if (f.transmission === "manual" && b.transmission.type !== "manual") return false;
    if (f.maxPrice != null && b.price.eur > f.maxPrice) return false;
    if (f.engine !== "all") {
      const [lo, hi] = ENGINE_BANDS[f.engine];
      if (b.engine.displacement < lo || b.engine.displacement >= hi) return false;
    }
    if (r.score < f.minScore) return false;
    return true;
  });
}

/* ──────────────────────────────── icons ───────────────────────────────────*/

const SlidersIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
    <path d="M4 8h9M17.5 8H20M4 16h2.5M11 16h9" />
    <circle cx="15" cy="8" r="2.1" />
    <circle cx="8.5" cy="16" r="2.1" />
  </svg>
);

const FunnelIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 5h16l-6.2 7.2V18l-3.6 2v-7.8z" />
  </svg>
);

const CheckCircleIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--color-accent)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mt-0.5 shrink-0"
    aria-hidden
  >
    <circle cx="12" cy="12" r="8.6" />
    <path d="M8.6 12.2l2.2 2.2 4.6-5" />
  </svg>
);

/* ─────────────────────────────── fragments ────────────────────────────────*/

function RankChip({ rank, size = "md" }: { rank: number; size?: "md" | "lg" }) {
  return (
    <span
      className={`data flex items-center justify-center rounded-lg border text-accent ${
        size === "lg" ? "h-9 w-9 text-[13px]" : "h-8 w-8 text-[12px]"
      }`}
      style={{ borderColor: "rgba(217,194,154,0.55)" }}
      aria-label={`Rank ${rank}`}
    >
      {String(rank).padStart(2, "0")}
    </span>
  );
}

function CategoryChip({ category }: { category: Category }) {
  return (
    <span className="data inline-flex w-fit rounded-md border border-line bg-raised px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
      {category}
    </span>
  );
}

/** One cell of a specification strip; renders nothing when the value is absent. */
function SpecCell({ value, label }: { value: React.ReactNode; label: string }) {
  if (value == null || value === "") return null;
  return (
    <div className="px-3 py-3.5 text-center">
      <div className="data text-[14px] text-fg">{value}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}

/* ────────────────────────────── page sections ──────────────────────────────*/

function BestMatch({ result }: { result: MatchResult }) {
  const { toggle, isSelected, full } = useCompare();
  const b = result.bike;
  const tx = TRANSMISSIONS[b.transmission.type];
  return (
    <section className={`${GUTTER} mt-5`} aria-label="Best match">
      <div
        className="overflow-hidden rounded-3xl bg-panel"
        style={{ border: "1px solid rgba(217,194,154,0.4)" }}
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5 md:px-7">
          <RankChip rank={1} size="lg" />
          <span className="data text-[11px] uppercase tracking-[0.24em] text-accent">Best match</span>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.9fr_1fr]">
          {/* Photography */}
          <div className="flex items-center p-4 md:p-6">
            <BikePhoto bike={b} kind="studio" ratio="4/3" priority className="w-full rounded-xl" />
          </div>

          {/* Identity + score */}
          <div className="flex flex-col justify-center px-5 pb-5 md:px-6 lg:py-6">
            <span className="eyebrow">{b.manufacturer}</span>
            <h2 className="mt-1 font-display text-[clamp(1.9rem,3.2vw,3rem)] uppercase leading-[0.98]">
              {b.model}
              {b.variant && <span className="text-accent"> {b.variant}</span>}
            </h2>
            <div className="mt-3">
              <CategoryChip category={b.category} />
            </div>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="bignum text-[clamp(3.4rem,5vw,4.6rem)] leading-none text-accent">
                {result.score}%
              </span>
              <span className="data text-[11px] uppercase tracking-[0.24em] text-muted">Match</span>
            </div>
            <div className="data mt-5 text-lg text-fg">
              <Price p={b.price} />
              <span className="eyebrow mt-1 block">Est. price</span>
            </div>
          </div>

          {/* Why it matches + actions */}
          <div className="flex flex-col border-t border-line p-5 md:p-6 lg:border-l lg:border-t-0">
            <h3 className="data text-[11px] uppercase tracking-[0.22em] text-accent">
              Why it's a great match
            </h3>
            <ul className="mt-4 space-y-2.5">
              {result.reasons.map((r) => (
                <li key={r.id} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                  {CheckCircleIcon}
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
            {result.warnings.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {result.warnings.map((w) => (
                  <li key={w} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                    <span style={{ color: "var(--color-semi)" }} aria-hidden>
                      !
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex flex-col gap-2.5 pt-6">
              <Link to={`/bike/${b.id}`} className="btn btn-primary justify-center text-xs">
                View details <span aria-hidden>→</span>
              </Link>
              <button
                onClick={() => toggle(b.id)}
                disabled={!isSelected(b.id) && full}
                className="btn btn-ghost justify-center text-xs disabled:opacity-40"
              >
                {isSelected(b.id) ? "Remove from compare" : "Add to compare"}
              </button>
            </div>
          </div>
        </div>

        {/* Specification strip */}
        <div className="grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-4">
          <SpecCell value={b.engine.displacement ? `${b.engine.displacement}cc` : null} label="Engine" />
          <SpecCell value={b.engine.horsepower ? `${b.engine.horsepower} hp` : null} label="Power" />
          <SpecCell value={b.dimensions.weight ? `${b.dimensions.weight} kg` : null} label="Weight" />
          <SpecCell value={tx.short} label="Transmission" />
        </div>
      </div>
    </section>
  );
}

function MatchCard({ result, rank }: { result: MatchResult; rank: number }) {
  const b = result.bike;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line-bright">
      <div className="flex items-center justify-between px-4 pt-4">
        <RankChip rank={rank} />
        <FavoriteButton bike={b} />
      </div>
      <div className="px-4 pt-3">
        <BikePhoto bike={b} kind="card" ratio="16/10" className="rounded-lg" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline gap-2">
          <span className="bignum text-3xl text-accent">{result.score}%</span>
          <span className="data text-[10px] uppercase tracking-[0.18em] text-muted">Match</span>
        </div>
        <span className="eyebrow mt-3">{b.manufacturer}</span>
        <h3 className="mt-0.5 font-display text-lg uppercase leading-tight group-hover:text-accent">
          {b.model}
          {b.variant ? ` ${b.variant}` : ""}
        </h3>
        <div className="mt-2">
          <CategoryChip category={b.category} />
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-1">
          <SpecCell value={b.engine.displacement ? `${b.engine.displacement}cc` : null} label="Engine" />
          <SpecCell value={b.engine.horsepower ? `${b.engine.horsepower} hp` : null} label="Power" />
          <SpecCell value={<Price p={b.price} />} label="Est. price" />
        </div>
        <Link
          to={`/bike/${b.id}`}
          className="btn btn-ghost mt-auto w-full justify-center text-xs"
        >
          View details <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

function FilterPanel({
  filters,
  onChange,
}: {
  filters: ResultFilters;
  onChange: (f: ResultFilters) => void;
}) {
  const categories = Array.from(new Set(MOTORCYCLES.map((b) => b.category))).sort();
  const select =
    "data mt-1.5 w-full rounded-lg border border-line bg-raised px-2 py-2 text-xs text-fg outline-none focus:border-accent";
  const set = <K extends keyof ResultFilters>(key: K, value: ResultFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-panel p-4 md:grid-cols-5 md:gap-4 md:p-5">
      <label className="block">
        <span className="eyebrow">Type</span>
        <select className={select} value={filters.category} onChange={(e) => set("category", e.target.value as ResultFilters["category"])}>
          <option value="all">All types</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">Transmission</span>
        <select className={select} value={filters.transmission} onChange={(e) => set("transmission", e.target.value as ResultFilters["transmission"])}>
          <option value="all">All</option>
          <option value="automatic">Fully automatic</option>
          <option value="e-clutch">E-Clutch</option>
          <option value="manual">Manual</option>
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">Max price</span>
        <select
          className={select}
          value={filters.maxPrice ?? "any"}
          onChange={(e) => set("maxPrice", e.target.value === "any" ? null : Number(e.target.value))}
        >
          <option value="any">Any</option>
          <option value="6000">€6,000</option>
          <option value="9000">€9,000</option>
          <option value="12000">€12,000</option>
          <option value="18000">€18,000</option>
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">Engine size</span>
        <select className={select} value={filters.engine} onChange={(e) => set("engine", e.target.value as ResultFilters["engine"])}>
          <option value="all">Any</option>
          <option value="small">Under 400 cc</option>
          <option value="mid">400 – 700 cc</option>
          <option value="large">700 – 1000 cc</option>
          <option value="liter">1000 cc and up</option>
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">Min match</span>
        <select className={select} value={filters.minScore} onChange={(e) => set("minScore", Number(e.target.value))}>
          <option value="0">Any</option>
          <option value="70">70%+</option>
          <option value="80">80%+</option>
          <option value="90">90%+</option>
        </select>
      </label>
    </div>
  );
}

/* ─────────────────────────────────── page ──────────────────────────────────*/

export default function Results() {
  usePageMeta({
    title: "Your matches — MotoMatch",
    description:
      "Your personalized motorcycle matches, scored across eight dimensions with the reasons explained.",
  });

  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ResultFilters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>("match");
  const [showAll, setShowAll] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const state = useMemo(loadQuestionnaire, []);
  const answers = useMemo(() => (state ? toQuizAnswers(state.answers) : null), [state]);
  /* All scoring happens in the engine; this page only ranks, filters, sorts. */
  const ranked = useMemo(() => (answers ? matchAll(answers) : null), [answers]);

  useEffect(() => {
    const delay = prefersReducedMotion() ? 150 : 1600;
    const t = setTimeout(() => setAnalyzing(false), delay);
    return () => clearTimeout(t);
  }, []);

  // No completed questionnaire → back to the quiz.
  if (!state || !state.completed || !ranked || ranked.length === 0)
    return <Navigate to="/find-my-bike" replace />;

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

  const best = ranked[0];
  const others = ranked.slice(1);
  /** Match rank is the bike's identity on this page, whatever the sort order. */
  const rankOf = new Map(ranked.map((r, i) => [r.bike.id, i + 1]));

  const refined = [...applyFilters(others, filters)].sort(SORTERS[sort]);
  const visible = showAll ? refined : refined.slice(0, 4);
  const filtersActive =
    filters.category !== "all" ||
    filters.transmission !== "all" ||
    filters.maxPrice != null ||
    filters.engine !== "all" ||
    filters.minScore > 0;

  const viewAll = () => {
    setShowAll(true);
    gridRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const editQuestion = (index: number) => {
    if (state) saveQuestionnaire({ answers: state.answers, step: index, completed: true });
    navigate("/find-my-bike");
  };

  return (
    <div className="pt-5">
      {/* ── Hero ── */}
      <section className={GUTTER} aria-label="Your matches">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-panel">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] md:block" aria-hidden>
            <img
              src={best.bike.images.hero}
              alt=""
              className="h-full w-full object-cover object-[65%_35%]"
              decoding="async"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--color-panel) 0%, rgba(17,17,20,0.6) 30%, rgba(17,17,20,0.05) 70%), linear-gradient(180deg, rgba(17,17,20,0.3) 0%, rgba(17,17,20,0) 40%, rgba(17,17,20,0.45) 100%)",
              }}
            />
          </div>
          <div className="relative max-w-xl px-5 py-8 md:px-10 md:py-12">
            <Link
              to="/find-my-bike"
              className="data inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent transition-colors hover:text-fg"
            >
              <span aria-hidden>←</span> Back to questions
            </Link>
            <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.6rem)] uppercase leading-[0.95]">
              Your matches
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Based on your riding style, experience, preferences and budget.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link to="/find-my-bike" className="btn btn-ghost gap-2.5 text-xs">
                {SlidersIcon} Adjust preferences
              </Link>
              <button
                onClick={() => {
                  clearQuestionnaire();
                  navigate("/find-my-bike");
                }}
                className="data text-[11px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-fg"
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Best match ── */}
      <BestMatch result={best} />

      {/* ── Other strong matches ── */}
      <section className={`${GUTTER} mt-10`} aria-label="Other strong matches">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl uppercase">Other strong matches</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              className={`btn btn-ghost gap-2 text-xs ${filtersActive ? "border-accent text-accent" : ""}`}
            >
              {FunnelIcon} Filter results
              {filtersActive && (
                <span className="data rounded bg-accent px-1.5 py-0.5 text-[10px] text-[var(--color-on-accent)]">
                  on
                </span>
              )}
            </button>
            <label className="btn btn-ghost gap-2 text-xs">
              <span className="data text-[11px] uppercase tracking-[0.16em] text-muted">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort results"
                className="data cursor-pointer border-none bg-transparent text-[11px] uppercase tracking-[0.16em] text-fg outline-none"
              >
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filterOpen && <FilterPanel filters={filters} onChange={setFilters} />}

        <div ref={gridRef} className="mt-5 scroll-mt-20 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((r) => (
            <MatchCard key={r.bike.id} result={r} rank={rankOf.get(r.bike.id) ?? 0} />
          ))}
        </div>
        {visible.length === 0 && (
          <div className="mt-5 rounded-2xl border border-line bg-panel p-8 text-center">
            <p className="text-sm text-muted">Nothing matches those filters — loosen one.</p>
            <button onClick={() => setFilters(NO_FILTERS)} className="btn btn-ghost mt-4 text-xs">
              Reset filters
            </button>
          </div>
        )}
        {!showAll && refined.length > 4 && (
          <p className="data mt-3 text-right text-[11px] uppercase tracking-[0.16em] text-dim">
            Showing 4 of {refined.length} matches
          </p>
        )}
      </section>

      {/* ── Personalization panel ── */}
      <section className={`${GUTTER} mt-10`}>
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-ink/50 px-5 py-5 md:flex-row md:items-center md:px-7">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 text-accent"
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4.5" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-fg">These matches are personalized for you</h3>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
              Your answers help us find motorcycles that truly fit your needs, not just the most
              popular ones.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/compare" className="btn btn-ghost text-xs">
              Compare bikes
            </Link>
            <button onClick={viewAll} className="btn btn-primary text-xs">
              View all results <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Questionnaire progress ── */}
      <nav aria-label="Questionnaire steps" className={`${GUTTER} mt-10`}>
        <ol className="flex items-start gap-0 overflow-x-auto border-t border-line pb-1 pt-5">
          {QUESTIONS.map((question, i) => (
            <li key={question.key} className="flex min-w-[88px] flex-1 items-start">
              {i > 0 && (
                <span className="mt-[13px] h-px w-full min-w-2 flex-1 bg-accent/35" aria-hidden />
              )}
              <button
                onClick={() => editQuestion(i)}
                aria-label={`Edit question ${i + 1}: ${question.category}`}
                className="group flex shrink-0 flex-col items-center gap-1.5 px-2"
              >
                <span
                  className="data flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] transition-colors"
                  style={{
                    background: "var(--color-accent)",
                    color: "var(--color-on-accent)",
                  }}
                >
                  {i + 1}
                </span>
                <span className="data whitespace-nowrap text-[8.5px] uppercase tracking-[0.1em] text-muted transition-colors group-hover:text-accent">
                  {question.category}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <p className={`${GUTTER} mt-8 text-xs leading-relaxed text-dim`}>
        <span className="block max-w-2xl">
          Scores blend riding style, transmission, budget, experience, performance, size,
          practicality and passenger use — each dimension weighted, none absolute. A bigger engine
          never wins on its own.
        </span>
      </p>
    </div>
  );
}
