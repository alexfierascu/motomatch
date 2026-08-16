import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Motorcycle } from "../data/types";
import { getBike, bikeName, MOTORCYCLES } from "../data/motorcycles";
import { TRANSMISSIONS } from "../data/transmissions";
import { similarityTo } from "../lib/scoring";
import { beginnerLabel } from "../lib/filters";
import { matchAll, matchQuality, type MatchResult } from "../lib/match";
import { loadQuestionnaire, toQuizAnswers } from "../lib/questionnaire";
import { BikePhoto, PhotoCredit } from "../components/Photo";
import { A2Badge, ShiftRail, TransmissionBadge, VehicleTypeBadge, verdictColor } from "../components/Transmission";
import { Price } from "../components/BikeCard";
import { FavoriteButton, HeartIcon } from "../components/Favorite";
import { useCompare, useFavorites } from "../App";
import { useReveal } from "../lib/motion";
import { usePageMeta } from "../lib/seo";
import NotFound from "./NotFound";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

/* ────────────────────────────────────────────────────────────────────────────
 * Motorcycle detail — one reusable page for every bike in the database.
 * Everything renders from the Motorcycle model and, when the visitor has a
 * completed questionnaire, from the same MatchResult the results page uses.
 * No scoring happens here.
 * ──────────────────────────────────────────────────────────────────────────*/

const SECTIONS = [
  ["overview", "Overview"],
  ["specifications", "Specifications"],
  ["features", "Features"],
  ["reviews", "Reviews"],
  ["similar", "Similar bikes"],
] as const;

const CheckIcon = (
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

function SpecRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/50 py-2.5">
      <span className="text-xs text-dim">{label}</span>
      <span className="data text-right text-sm">{value}</span>
    </div>
  );
}

function Expandable({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="font-display text-lg uppercase tracking-wide">{title}</span>
        <span className="text-muted" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="border-t border-line p-4 pt-3">{children}</div>}
    </div>
  );
}

function CategoryChip({ label }: { label: string }) {
  return (
    <span className="data inline-flex rounded-md border border-line bg-raised px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
      {label}
    </span>
  );
}

/* ─────────────────────────────── hero gallery ──────────────────────────────*/

function Gallery({ bike }: { bike: Motorcycle }) {
  const shots = useMemo(() => {
    const list = [bike.images.hero, ...(bike.images.gallery ?? []), bike.images.card];
    return [...new Set(list.filter(Boolean))];
  }, [bike]);
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setActive(0);
    setBroken(new Set());
  }, [bike.id]);

  const usable = shots.filter((s) => !broken.has(s));
  const src = usable[Math.min(active, Math.max(usable.length - 1, 0))];

  if (!src) {
    // Every file failed — the framed silhouette keeps the layout intact.
    return <BikePhoto bike={bike} kind="hero" ratio="4/3" className="rounded-xl" />;
  }

  const markBroken = (url: string) =>
    setBroken((prev) => new Set(prev).add(url));

  return (
    <div className="flex flex-col gap-2.5 lg:flex-row">
      {/* Thumbnail rail — only when there is a real choice. */}
      {usable.length > 1 && (
        <div
          className="order-2 flex gap-2.5 overflow-x-auto lg:order-1 lg:w-[76px] lg:flex-col lg:overflow-visible"
          role="group"
          aria-label="Photo gallery"
        >
          {usable.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1} of ${usable.length}`}
              aria-current={i === active}
              className={`h-14 w-[76px] shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${
                i === active
                  ? "border-accent opacity-100"
                  : "border-line opacity-60 hover:border-line-bright hover:opacity-90"
              }`}
            >
              <img
                src={s}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                onError={() => markBroken(s)}
              />
            </button>
          ))}
        </div>
      )}

      <div className="photo-frame order-1 flex-1 rounded-xl lg:order-2" style={{ aspectRatio: "4/3" }}>
        <img
          key={src}
          src={src}
          alt={bike.images.alt}
          decoding="async"
          className="carousel-in h-full w-full object-cover"
          onError={() => markBroken(src)}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────── match panel ───────────────────────────────*/

function MatchPanel({ result, rank }: { result: MatchResult | null; rank: number }) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-line bg-ink/50 p-5">
        <span className="data text-[11px] uppercase tracking-[0.22em] text-accent">
          Find your match
        </span>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          Answer ten short questions and we'll score this bike — and every other one — against
          how you actually ride.
        </p>
        <Link to="/find-my-bike" className="btn btn-primary mt-4 w-full justify-center text-xs">
          Find your match <span aria-hidden>→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-ink/50 p-5" style={{ border: "1px solid rgba(217,194,154,0.4)" }}>
      <span className="data text-[11px] uppercase tracking-[0.22em] text-accent">Your match</span>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="bignum text-6xl text-accent">{result.score}%</span>
        {rank === 1 && (
          <span className="data rounded bg-accent px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-on-accent)]">
            Best match
          </span>
        )}
      </div>
      <div className="data mt-2 text-[11px] uppercase tracking-[0.2em] text-fg">
        {matchQuality(result.score)}
      </div>
      <div className="mt-3 h-[3px] bg-raised">
        <div className="h-full bg-accent transition-[width] duration-700" style={{ width: `${result.score}%` }} />
      </div>
      <a
        href="#why-it-fits"
        className="data mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
      >
        Why this match? <span aria-hidden>→</span>
      </a>
    </div>
  );
}

/* ─────────────────────────────── similar card ──────────────────────────────*/

function SimilarCard({ bike, matchScore }: { bike: Motorcycle; matchScore?: number }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line-bright">
      <FavoriteButton bike={bike} className="absolute right-3 top-3 z-10 bg-ink/60" />
      <Link to={`/bike/${bike.id}`} className="flex flex-1 flex-col">
        <BikePhoto bike={bike} kind="card" ratio="16/10" />
        <div className="flex flex-1 flex-col p-4">
          {matchScore !== undefined && (
            <div className="flex items-baseline gap-2">
              <span className="bignum text-2xl text-accent">{matchScore}%</span>
              <span className="data text-[10px] uppercase tracking-[0.18em] text-muted">Match</span>
            </div>
          )}
          <span className={`eyebrow ${matchScore !== undefined ? "mt-2.5" : ""}`}>
            {bike.manufacturer}
          </span>
          <h3 className="mt-0.5 font-display text-lg uppercase leading-tight group-hover:text-accent">
            {bike.model}
            {bike.variant ? ` ${bike.variant}` : ""}
          </h3>
          <div className="mt-2">
            <CategoryChip label={bike.category} />
          </div>
          <div className="data mt-auto flex items-baseline justify-between pt-4 text-[12px]">
            <span className="text-muted">
              {bike.engine.displacement}cc · {bike.engine.horsepower} hp
            </span>
            <span className="text-accent">
              <Price p={bike.price} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ─────────────────────────────────── page ──────────────────────────────────*/

export default function BikeDetail() {
  const { id } = useParams();
  const bike = id ? getBike(id) : undefined;
  const { isSelected, toggle, full } = useCompare();
  const { isFavorite, toggleFavorite } = useFavorites();
  const revealRef = useReveal<HTMLDivElement>(".reveal");

  /* The same engine run the results page uses; null without a completed quiz. */
  const matches = useMemo(() => {
    const state = loadQuestionnaire();
    if (!state?.completed) return null;
    return matchAll(toQuizAnswers(state.answers));
  }, []);
  const myMatch = bike ? (matches?.find((r) => r.bike.id === bike.id) ?? null) : null;
  const myRank = bike && matches ? matches.findIndex((r) => r.bike.id === bike.id) + 1 : 0;
  const scoreOf = (bikeId: string) => matches?.find((r) => r.bike.id === bikeId)?.score;

  usePageMeta({
    title: bike ? `${bikeName(bike)} — MotoMatch` : "Motorcycle — MotoMatch",
    description: bike?.whoFor,
    image: bike?.images.card,
  });

  if (!bike) return <NotFound />;

  const tx = TRANSMISSIONS[bike.transmission.type];
  const color = verdictColor(tx.verdict);
  const selected = isSelected(bike.id);
  const faved = isFavorite(bike.id);
  const name = bikeName(bike);

  const similar = MOTORCYCLES.filter((b) => b.id !== bike.id)
    .map((b) => similarityTo(bike, b))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const specStrip: Array<[React.ReactNode, string]> = [
    [<Price key="p" p={bike.price} />, "Est. price"],
    [`${bike.engine.displacement}cc`, "Engine"],
    [`${bike.engine.horsepower} hp`, "Power"],
    [`${bike.engine.torque} Nm`, "Torque"],
    [`${bike.dimensions.weight} kg`, "Weight"],
    [tx.short, "Transmission"],
    ...(bike.performance?.fuelConsumption
      ? ([[`${bike.performance.fuelConsumption} l/100km`, "Fuel cons."]] as Array<[React.ReactNode, string]>)
      : []),
    [bike.a2Compatible ? "A2" : "A", "License"],
  ];

  return (
    <div ref={revealRef} className="pt-5" key={bike.id}>
      {/* ── Hero ── */}
      <section className={GUTTER} aria-label={name}>
        <div className="rounded-3xl border border-line bg-panel p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {matches ? (
              <Link
                to="/find-my-bike/results"
                className="data inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent transition-colors hover:text-fg"
              >
                <span aria-hidden>←</span> Back to results
              </Link>
            ) : (
              <Link
                to="/explore"
                className="data inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent transition-colors hover:text-fg"
              >
                <span aria-hidden>←</span> Back to explore
              </Link>
            )}
            <PhotoCredit bike={bike} className="opacity-70" />
          </div>

          <div className="mt-5 grid gap-7 lg:grid-cols-[1.35fr_1fr]">
            <Gallery bike={bike} />

            <div className="flex flex-col">
              <span className="eyebrow">
                {bike.manufacturer} · {bike.year}
              </span>
              <h1 className="mt-1.5 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] uppercase leading-[0.95]">
                {bike.model}
                {bike.variant && <span className="text-accent"> {bike.variant}</span>}
              </h1>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                <CategoryChip label={bike.category} />
                <CategoryChip label={tx.short} />
                <CategoryChip label={`${bike.engine.displacement}cc`} />
                {bike.a2Compatible && <CategoryChip label="A2 licence" />}
              </div>
              <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">{bike.whoFor}</p>

              <div className="mt-5">
                <span className="bignum text-4xl text-accent">
                  <Price p={bike.price} />
                </span>
                <span className="eyebrow mt-1 block" title={bike.price.note}>
                  Est. price · {bike.price.country}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  onClick={() => toggle(bike.id)}
                  disabled={!selected && full}
                  className={`btn text-xs ${selected ? "btn-ghost" : "btn-primary"} disabled:opacity-40`}
                >
                  {selected ? "Remove from compare" : "Add to compare"}
                </button>
                <button
                  onClick={() => toggleFavorite(bike.id)}
                  aria-pressed={faved}
                  className={`btn btn-ghost gap-2 text-xs ${faved ? "border-accent text-accent" : ""}`}
                >
                  <HeartIcon filled={faved} size={15} />
                  {faved ? "Saved to favorites" : "Save to favorites"}
                </button>
              </div>

              <div className="mt-5">
                <MatchPanel result={myMatch} rank={myRank} />
              </div>
            </div>
          </div>

          {/* Spec strip */}
          <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-line sm:grid-cols-4 lg:grid-cols-8">
            {specStrip.map(([v, l], i) => (
              <div
                key={l}
                className={`px-3 py-3.5 text-center ${i > 0 ? "border-l border-line max-sm:[&:nth-child(odd)]:border-l-0 sm:max-lg:[&:nth-child(4n+1)]:border-l-0" : ""} ${
                  i >= 2 ? "max-sm:border-t max-sm:border-line" : ""
                } ${i >= 4 ? "sm:max-lg:border-t sm:max-lg:border-line" : ""}`}
              >
                <div className="data text-[14px] text-fg">{v}</div>
                <div className="eyebrow mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Content navigation ── */}
      <nav aria-label="Page sections" className={`${GUTTER} mt-8`}>
        <div className="flex gap-6 overflow-x-auto border-b border-line">
          {SECTIONS.map(([anchor, label]) => (
            <a
              key={anchor}
              href={`#${anchor}`}
              className="data whitespace-nowrap border-b-2 border-transparent pb-3 text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:border-accent hover:text-fg"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Overview ── */}
      <section id="overview" className={`${GUTTER} mt-8 scroll-mt-20`}>
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h2 className="font-display text-2xl uppercase">About the {name}</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{bike.about}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {bike.ridingStyles.map((s) => (
                <CategoryChip key={s} label={s} />
              ))}
            </div>

            {/* The gearbox truth panel — the axis the site is organised around. */}
            <div className="reveal panel mt-6 p-6" style={{ borderColor: `${color}40` }}>
              <span className="kicker">Transmission</span>
              <h3 className="mt-3 font-display text-2xl uppercase md:text-3xl" style={{ color }}>
                {tx.verdictLabel}
              </h3>
              <p className="mt-3 text-sm font-medium">{tx.riderDoes}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">{tx.explanation}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
                <div>
                  <div className="eyebrow">Clutch lever</div>
                  <div className="mt-1 text-xs font-semibold">
                    {bike.transmission.clutchLever ? "Fitted, you use it" : "None"}
                  </div>
                </div>
                <div>
                  <div className="eyebrow">Gear selection</div>
                  <div className="mt-1 text-xs font-semibold">
                    {bike.transmission.fullyAutomatic ? "Automatic" : "You choose"}
                  </div>
                </div>
                <div>
                  <div className="eyebrow">Manual override</div>
                  <div className="mt-1 text-xs font-semibold">
                    {bike.transmission.manualOverride ? "Yes" : "No"}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <ShiftRail bike={bike} size="sm" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <TransmissionBadge bike={bike} />
                <VehicleTypeBadge bike={bike} />
                <A2Badge bike={bike} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Key highlights — the bike's strongest real qualities. */}
            <div className="reveal panel p-6">
              <h3 className="data text-[11px] uppercase tracking-[0.22em] text-accent">
                Key highlights
              </h3>
              <ul className="mt-4 space-y-2.5">
                {bike.pros.slice(0, 5).map((p) => (
                  <li key={p} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                    {CheckIcon}
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Personalized when a questionnaire exists; editorial otherwise. */}
            <div id="why-it-fits" className="reveal reveal-late panel scroll-mt-20 p-6">
              {myMatch ? (
                <>
                  <h3 className="data text-[11px] uppercase tracking-[0.22em] text-accent">
                    Why it fits you
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {myMatch.reasons.map((r) => (
                      <li key={r.id} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                        {CheckIcon}
                        <span>{r.label}</span>
                      </li>
                    ))}
                  </ul>
                  {myMatch.warnings.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                      {myMatch.warnings.map((w) => (
                        <li key={w} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                          <span style={{ color: "var(--color-semi)" }} aria-hidden>
                            !
                          </span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <h3 className="data text-[11px] uppercase tracking-[0.22em] text-accent">
                    Who is this bike for?
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-fg">{bike.whoFor}</p>
                </>
              )}
              <div className="mt-4 border-t border-line pt-4">
                <div className="eyebrow" style={{ color: "var(--color-semi)" }}>
                  Maybe not for you if…
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{bike.notFor}</p>
              </div>
            </div>

            {/* Ride character */}
            <div className="reveal reveal-late panel p-6">
              <span className="kicker">Ride</span>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="bignum text-4xl">{bike.beginnerRating}/10</span>
                <span className="text-sm text-muted">{beginnerLabel(bike.beginnerRating)} for beginners</span>
              </div>
              <div className="mt-3 h-[3px] bg-raised">
                <div
                  className="h-full"
                  style={{
                    width: `${bike.beginnerRating * 10}%`,
                    background:
                      bike.beginnerRating >= 8
                        ? "var(--color-auto)"
                        : bike.beginnerRating >= 6
                          ? "var(--color-semi)"
                          : "var(--color-manual)",
                  }}
                />
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">{bike.beginnerNote}</p>
              {bike.a2Note && (
                <p className="mt-3 text-[12px] leading-relaxed text-muted">
                  <span className="text-fg">Licence: </span>
                  {bike.a2Note}
                </p>
              )}
              <div className="mt-5 space-y-3 border-t border-line pt-4">
                {(
                  [
                    ["Performance", bike.performanceLevel],
                    ["Practicality", bike.practicality],
                    ["Passenger comfort", bike.passengerSuitability],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-[11px] text-dim">{label}</span>
                    <div className="h-[3px] flex-1 bg-raised">
                      <div className="h-full bg-accent" style={{ width: `${v * 10}%` }} />
                    </div>
                    <span className="data w-9 shrink-0 text-right text-[11px] text-muted">{v}/10</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Specifications ── */}
      <section id="specifications" className={`${GUTTER} mt-14 scroll-mt-20`}>
        <h2 className="font-display text-2xl uppercase">Specifications</h2>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div>
            <SpecRow label="Engine" value={`${bike.engine.cylinders}-cylinder, 4-stroke`} />
            <SpecRow label="Displacement" value={`${bike.engine.displacement} cc`} />
            <SpecRow label="Power" value={`${bike.engine.horsepower} hp`} />
            <SpecRow label="Torque" value={`${bike.engine.torque} Nm`} />
            <SpecRow label="Transmission" value={tx.label} />
            <SpecRow label="Final drive" value={bike.chassis?.drive} />
            <SpecRow label="Kerb weight" value={`${bike.dimensions.weight} kg`} />
            <SpecRow label="Seat height" value={`${bike.dimensions.seatHeight} mm`} />
            <SpecRow
              label="Fuel capacity"
              value={bike.dimensions.fuelCapacity ? `${bike.dimensions.fuelCapacity} l` : undefined}
            />
            <SpecRow label="Licence" value={bike.a2Compatible ? "A2 compatible" : "Full A licence"} />
            {bike.engine.powerNote && (
              <p className="mt-3 text-[11px] leading-relaxed text-dim">{bike.engine.powerNote}</p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <SpecRow
                label="Top speed"
                value={bike.performance?.topSpeed ? `${bike.performance.topSpeed} km/h` : "Not published"}
              />
              <SpecRow
                label="0–100 km/h"
                value={bike.performance?.zeroTo100 ? `${bike.performance.zeroTo100} s` : "No reliable figure"}
              />
              <SpecRow
                label="Fuel consumption"
                value={
                  bike.performance?.fuelConsumption
                    ? `${bike.performance.fuelConsumption} l/100 km`
                    : undefined
                }
              />
            </div>
            <Expandable title="Chassis">
              <SpecRow label="Brakes" value={bike.chassis?.brakes} />
              <SpecRow label="Suspension" value={bike.chassis?.suspension} />
              <SpecRow label="Final drive" value={bike.chassis?.drive} />
            </Expandable>
          </div>
        </div>
      </section>

      {/* ── Features: what works, what to weigh up ── */}
      <section id="features" className={`${GUTTER} mt-14 scroll-mt-20`}>
        <h2 className="font-display text-2xl uppercase">Features & trade-offs</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          <div className="bg-panel p-6">
            <div className="eyebrow mb-3" style={{ color: "var(--color-auto)" }}>
              What works
            </div>
            <ul className="space-y-2">
              {bike.pros.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm leading-relaxed">
                  <span style={{ color: "var(--color-auto)" }} aria-hidden>
                    +
                  </span>
                  <span className="text-muted">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-panel p-6">
            <div className="eyebrow mb-3" style={{ color: "var(--color-manual)" }}>
              What to weigh up
            </div>
            <ul className="space-y-2">
              {bike.cons.map((c) => (
                <li key={c} className="flex gap-2.5 text-sm leading-relaxed">
                  <span style={{ color: "var(--color-manual)" }} aria-hidden>
                    −
                  </span>
                  <span className="text-muted">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Reviews: expert take + provenance ── */}
      <section id="reviews" className={`${GUTTER} mt-14 scroll-mt-20`}>
        <h2 className="font-display text-2xl uppercase">Expert take</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="panel relative overflow-hidden p-6">
            <span className="ghost-index pointer-events-none absolute right-5 top-3 text-[4rem]" aria-hidden>
              ”
            </span>
            <p className="max-w-xl pr-10 text-[15px] leading-relaxed text-fg">{bike.whoFor}</p>
            <p className="mt-3 max-w-xl pr-10 text-[13px] leading-relaxed text-muted">
              {bike.beginnerNote}
            </p>
            <p className="data mt-5 border-t border-line pt-4 text-[11px] uppercase tracking-[0.16em] text-dim">
              MotoMatch editorial — written from manufacturer data and press material, not paid
              placement. Individual owner reviews aren't available yet.
            </p>
          </div>
          <Expandable title="Sources">
            <ul className="space-y-1.5">
              {bike.sources.map((s) => (
                <li key={s} className="text-[12px] leading-relaxed text-muted">
                  • {s}
                </li>
              ))}
              {bike.images.sourceName && (
                <li className="text-[12px] leading-relaxed text-muted">
                  • Photography: {bike.images.sourceName}
                  {bike.images.source ? ` — ${bike.images.source}` : ""}
                </li>
              )}
            </ul>
            <p className="data mt-3 text-[11px] text-dim">
              Market: {bike.price.country} · Model year: {bike.year} · Last verified:{" "}
              {bike.lastVerified}
            </p>
          </Expandable>
        </div>
      </section>

      {/* ── Similar motorcycles ── */}
      {similar.length > 0 && (
        <section id="similar" className={`${GUTTER} mt-14 scroll-mt-20`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl uppercase">Similar motorcycles</h2>
            <Link
              to={`/explore?category=${bike.category}`}
              className="data text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
            >
              View all similar <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {similar.map((s) => (
              <SimilarCard key={s.bike.id} bike={s.bike} matchScore={scoreOf(s.bike.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
