import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MOTORCYCLES, bikeName, getBike } from "../data/motorcycles";
import type { Category } from "../data/types";
import { matchAll, type MatchResult, type QuizAnswers } from "../lib/match";
import { BikePhoto } from "../components/Photo";
import { Price } from "../components/BikeCard";
import { useParallax, useReveal } from "../lib/motion";
import { usePageMeta } from "../lib/seo";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

/** Placeholder marketing figure from the approved design — NOT a real metric.
 *  MotoMatch has no accounts and does not count riders. Replace with a real
 *  number (or remove the claim) once the product can actually measure it. */
const RIDER_COUNT_LABEL = "20,000+";

/* ─────────────────────────── section indicator ────────────────────────────
 * Editorial 01–05 scroll rail on the right edge of the viewport, per the
 * reference: small dots joined by hairlines, active dot emphasized.        */

const SECTION_IDS = ["mm-hero", "mm-how", "mm-match", "mm-styles", "mm-cta"];

function SectionDots() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(SECTION_IDS.indexOf(e.target.id));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center xl:flex"
    >
      <span className="data mb-3 text-[10px] tracking-[0.2em] text-dim">01</span>
      {SECTION_IDS.map((id, i) => (
        <span key={id} className="flex flex-col items-center">
          {i > 0 && <span className="h-4 w-px bg-line-bright" />}
          <span
            className="block rounded-full transition-all duration-300"
            style={
              i === active
                ? { width: 8, height: 8, background: "var(--color-accent)" }
                : { width: 5, height: 5, background: "var(--color-line-bright)" }
            }
          />
        </span>
      ))}
      <span className="data mt-3 text-[10px] tracking-[0.2em] text-dim">05</span>
    </div>
  );
}

/* ─────────────────────────────── 01 · hero ────────────────────────────────*/

/* Heroes whose photography suits the reference composition: rider on the
 * road, warm bright environment, room on the left for type. Dark night
 * shots are excluded — the reference hero image must stay dominant. */
const HERO_IDS = [
  "yamaha-tenere-700",
  "honda-cmx500-rebel-e-clutch",
  "kawasaki-eliminator-500",
];

function pickHero() {
  const available = HERO_IDS.map(getBike).filter(Boolean);
  return available[Math.floor(Math.random() * available.length)] ?? MOTORCYCLES[0];
}

/** Tasteful generic rider avatars (drawn, not fake user photos). */
function RiderAvatars() {
  const tones = ["#3a3a42", "#4a4237", "#2f3a38", "#443340"];
  return (
    <span className="flex -space-x-2.5" aria-hidden>
      {tones.map((bg, i) => (
        <svg
          key={i}
          width="30"
          height="30"
          viewBox="0 0 30 30"
          className="rounded-full border-2 border-ink"
          style={{ background: bg }}
        >
          {/* helmeted rider bust */}
          <circle cx="15" cy="12" r="6" fill="#c9c4ba" opacity="0.85" />
          <path d="M9.5 12a5.5 5.5 0 0 1 11 0v1.6h-11z" fill="#1c1c20" />
          <path d="M6 26c1.6-4.4 5-6.4 9-6.4s7.4 2 9 6.4z" fill="#c9c4ba" opacity="0.7" />
        </svg>
      ))}
    </span>
  );
}

function Hero() {
  const [bike] = useState(pickHero);
  const imgRef = useParallax<HTMLDivElement>(0.12, 80);
  const headRef = useParallax<HTMLDivElement>(-0.045, 44);
  const metaRef = useParallax<HTMLDivElement>(0.04, 30);

  return (
    <section
      id="mm-hero"
      className="relative -mt-14 flex min-h-[100svh] items-center overflow-hidden"
    >
      <div ref={imgRef} className="absolute inset-[-6%] will-change-transform">
        <img
          src={bike.images.hero}
          alt={bike.images.alt}
          className="h-full w-full object-cover object-[72%_center]"
          decoding="async"
        />
      </div>
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(11,11,13,0.9) 0%, rgba(11,11,13,0.58) 34%, rgba(11,11,13,0.16) 58%, rgba(11,11,13,0.02) 72%), linear-gradient(180deg, rgba(11,11,13,0.55) 0%, transparent 22%, transparent 62%, rgba(11,11,13,0.9) 100%)",
        }}
      />

      <div className={`relative w-full pb-24 pt-36 ${GUTTER}`}>
        <div ref={headRef} className="max-w-2xl will-change-transform">
          <p className="data text-[11px] uppercase tracking-[0.24em] text-dim">
            01 / Discover · motorcycle matching · 2026
          </p>
          <h1 className="display-light mt-6 font-medium text-[clamp(2.9rem,7.5vw,6rem)] uppercase leading-[1.02] text-fg">
            Find your
            <br />
            perfect ride.
          </h1>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted">
            Tell us about your style, your needs and your budget. We'll match you with the
            motorcycles that are made for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/find-my-bike" className="btn btn-primary">
              Find my bike <span aria-hidden>→</span>
            </Link>
            <Link to="/explore" className="btn btn-ghost">
              Explore bikes
            </Link>
          </div>

          {/* Social proof per the approved design; figure is a marked placeholder. */}
          <div ref={metaRef} className="mt-10 flex items-center gap-3 will-change-transform">
            <RiderAvatars />
            <span>
              <span className="data block text-[11px] uppercase tracking-[0.2em] text-accent">
                Join {RIDER_COUNT_LABEL} riders
              </span>
              <span className="block text-[12px] text-muted">who found their perfect match</span>
            </span>
          </div>
        </div>

        {/* Featured-bike chip, bottom right per the reference. */}
        <Link
          to={`/bikes/${bike.id}`}
          className="group mt-12 inline-flex items-center gap-3 rounded-full border border-line-bright bg-ink/60 py-2 pl-4 pr-2 backdrop-blur-sm transition-colors hover:border-accent md:absolute md:bottom-10 md:right-8 md:mt-0"
        >
          <span className="text-left">
            <span className="data block text-[9px] uppercase tracking-[0.22em] text-dim">Featured bike</span>
            <span className="block text-sm font-medium text-fg">{bikeName(bike)}</span>
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line-bright text-muted transition-colors group-hover:border-accent group-hover:text-accent"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────── feature strip ────────────────────────────────*/

const STRIP_ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* The reference's five benefits, verbatim. */
const STRIP: { title: string; sub: string; icon: React.ReactNode }[] = [
  {
    title: "Personalized",
    sub: "Just for you",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <circle cx="9" cy="9" r="3.2" />
        <path d="M3.5 19c1.2-2.9 3.3-4.3 5.5-4.3s4.3 1.4 5.5 4.3" />
        <circle cx="17" cy="10" r="2.4" />
        <path d="M15.5 15.2c1.7 0 3.6 1 4.8 3.3" />
      </svg>
    ),
  },
  {
    title: "Expert matching",
    sub: "Data + experience",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="7" r="2.2" />
        <circle cx="12" cy="17" r="2.2" />
        <path d="M7.8 7.4l8.4 8.1M16.2 8.6l-2.9 6.6M8 7.5l2.9 7.4" />
      </svg>
    ),
  },
  {
    title: "All bikes",
    sub: "All styles & brands",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <circle cx="6" cy="16" r="3.6" />
        <circle cx="18" cy="16" r="3.6" />
        <path d="M6 16l4-6h5l3 6M10 10l-1.5-2.5H6" />
      </svg>
    ),
  },
  {
    title: "Save & compare",
    sub: "Your favorites",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <rect x="4" y="5" width="6.5" height="14" rx="1.5" />
        <rect x="13.5" y="5" width="6.5" height="14" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Up to date",
    sub: "Latest models & prices",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
];

function FeatureStrip() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className={`reveal relative z-10 -mt-8 ${GUTTER}`}>
      <div className="grid grid-cols-2 gap-y-6 rounded-2xl border border-line bg-panel/90 px-6 py-6 backdrop-blur-sm sm:grid-cols-3 lg:grid-cols-5">
        {STRIP.map((f) => (
          <div key={f.title} className="flex items-start gap-3 pr-4">
            <span className="mt-0.5 text-accent" aria-hidden>
              {f.icon}
            </span>
            <span>
              <span className="data block text-[10px] uppercase tracking-[0.18em] text-fg">{f.title}</span>
              <span className="mt-1 block text-[12px] text-muted">{f.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── 02 · how it works ────────────────────────────*/

const STEPS: [string, string][] = [
  ["Tell us about you", "Answer a few simple questions."],
  ["We find your match", "Our engine scores every motorcycle in the database."],
  ["Get your results", "See the best options for your profile."],
  ["Explore & choose", "Compare, save and find your perfect ride."],
];

function HowItWorks() {
  const ref = useReveal<HTMLElement>(".reveal, .line-reveal");
  const mediaBike = getBike("suzuki-v-strom-800de");

  return (
    <section id="mm-how" ref={ref} className={`pt-28 ${GUTTER}`}>
      <div className="grid items-center gap-12 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <h2 className="display-light reveal font-medium text-[clamp(1.7rem,3.2vw,2.4rem)] uppercase">
            How it works
          </h2>

          {/* Connected timeline: circles joined by a line that draws itself in. */}
          <ol className="mt-12 grid gap-x-0 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="relative pr-6">
                <div className="flex items-center">
                  <span
                    className="data reveal z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-bright bg-panel text-[12px] text-fg"
                    style={{ transitionDelay: `${i * 0.12}s` }}
                  >
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className="line-reveal hidden h-px flex-1 bg-line-bright lg:block"
                      style={{ transitionDelay: `${0.25 + i * 0.15}s` }}
                      aria-hidden
                    />
                  )}
                </div>
                <h3
                  className="data reveal mt-5 text-[11px] uppercase tracking-[0.18em] text-fg"
                  style={{ transitionDelay: `${i * 0.12}s` }}
                >
                  {title}
                </h3>
                <p
                  className="reveal mt-2 max-w-[180px] text-[13px] leading-relaxed text-muted"
                  style={{ transitionDelay: `${0.08 + i * 0.12}s` }}
                >
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Media card: placeholder for a future "how we match" film — links to
            the written method until real video exists. */}
        {mediaBike && (
          <Link
            to="/about"
            className="reveal reveal-late group relative block overflow-hidden rounded-2xl border border-line"
          >
            <BikePhoto bike={mediaBike} kind="hero" ratio="16/11" scrim="b" />
            <span
              className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line-bright bg-ink/55 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-fg)">
                <path d="M5 3.5v9l8-4.5z" />
              </svg>
            </span>
            <span className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-5">
              <span>
                <span className="data block text-[11px] uppercase tracking-[0.2em] text-fg">How we match</span>
                <span className="data mt-1 block text-[10px] uppercase tracking-[0.16em] text-muted">
                  2 min video
                </span>
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line-bright bg-ink/60 text-muted transition-colors group-hover:border-accent group-hover:text-accent"
                aria-hidden
              >
                →
              </span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── 03 · match showcase ──────────────────────────
 * "Your perfect match awaits" — the reference's recommendation showcase.
 * All scores and reasons are REAL: the engine runs on a labeled sample
 * profile, and the carousel pages through the actual ranked list.          */

const SAMPLE_PROFILE: QuizAnswers = {
  experience: "little",
  ridingStyles: ["city", "weekend"],
  everything: false,
  personality: "minimal",
  shifting: "prefer-auto",
  performance: "balanced",
  manageability: "very",
  seat: "average",
  budget: 9000,
  newUsed: "either",
  practicality: "somewhat",
  passenger: "occasionally",
  look: null,
};

/** Compact reference-style checklist lines derived from the strongest scoring dimensions. */
const DIM_REASON: Record<string, string> = {
  experience: "Perfect for your experience level",
  style: "Matches your riding style",
  transmission: "The transmission you asked for",
  budget: "Fits your budget",
  performance: "Great balance of power and control",
  size: "An easy size to live with",
  practicality: "Practical enough for every day",
  passenger: "Comfortable with a passenger",
};

function shortReasons(r: MatchResult): string[] {
  return [...r.breakdown]
    .filter((d) => d.score >= 80)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 4)
    .map((d) => DIM_REASON[d.key])
    .filter(Boolean);
}

const SHOWCASE_SIZE = 8;

function MatchPreview() {
  const ref = useReveal<HTMLElement>(".reveal");
  const ranked = useMemo(() => matchAll(SAMPLE_PROFILE).slice(0, SHOWCASE_SIZE), []);
  const [offset, setOffset] = useState(0);

  const main = ranked[offset];
  const runners = [ranked[(offset + 1) % ranked.length], ranked[(offset + 2) % ranked.length]];
  const step = (d: number) => setOffset((o) => (o + d + ranked.length) % ranked.length);

  if (!main) return null;

  return (
    <section id="mm-match" ref={ref} className={`pt-28 ${GUTTER}`}>
      <div
        className="relative rounded-3xl border border-line p-6 md:p-10"
        style={{
          background:
            "radial-gradient(900px 420px at 85% -10%, rgba(217,194,154,0.05), transparent 60%), var(--color-panel)",
        }}
      >
        {/* Carousel controls — circular, flanking the showcase per the reference. */}
        <button
          onClick={() => step(-1)}
          aria-label="Previous match"
          className="absolute -left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-bright bg-raised text-fg transition-colors hover:border-accent hover:text-accent lg:flex"
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          onClick={() => step(1)}
          aria-label="Next match"
          className="absolute -right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-bright bg-raised text-fg transition-colors hover:border-accent hover:text-accent lg:flex"
        >
          <span aria-hidden>›</span>
        </button>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.55fr_0.9fr]">
          {/* Pitch */}
          <div>
            <h2 className="display-light reveal font-medium text-[clamp(1.8rem,3.4vw,2.6rem)] uppercase">
              Your perfect
              <br />
              match awaits
            </h2>
            <p className="reveal reveal-late mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
              Take our short quiz and discover the motorcycles that fit your style, your needs and
              your life.
            </p>
            <dl className="reveal reveal-late mt-7 space-y-4">
              {(
                [
                  ["12", "questions"],
                  ["≈ 2 min", "to complete"],
                  ["100%", "personalized"],
                ] as const
              ).map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-3">
                  <dt className="data w-20 shrink-0 whitespace-nowrap text-lg text-accent">{v}</dt>
                  <dd className="data text-[10px] uppercase tracking-[0.18em] text-muted">{l}</dd>
                </div>
              ))}
            </dl>
            <Link to="/find-my-bike" className="btn btn-primary reveal reveal-late mt-8">
              Start the quiz <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Main match card */}
          <div className="reveal overflow-hidden rounded-2xl border border-line bg-raised">
            <div className="relative">
              <BikePhoto bike={main.bike} kind="studio" ratio="16/9" />
              <span className="data absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-on-accent)]">
                {offset === 0 ? "Best match" : `#${offset + 1} match`}
              </span>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="data text-[10px] uppercase tracking-[0.2em] text-dim">
                    {main.bike.manufacturer}
                  </div>
                  <h3 className="display-light mt-1 text-3xl uppercase">
                    {main.bike.model}
                    {main.bike.variant ? ` ${main.bike.variant}` : ""}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="data text-4xl font-light text-accent">{main.score}%</div>
                  <div className="data text-[9px] uppercase tracking-[0.2em] text-dim">Match score</div>
                </div>
              </div>
              <ul className="mt-5 space-y-1.5 border-t border-line pt-4">
                {shortReasons(main).map((r) => (
                  <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                    <span className="text-auto" aria-hidden>✓</span>
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <Link
                  to={`/bikes/${main.bike.id}`}
                  className="data text-[11px] uppercase tracking-[0.18em] text-fg underline-offset-4 hover:text-accent hover:underline"
                >
                  View details
                </Link>
                <Link
                  to={`/bikes/${main.bike.id}`}
                  aria-label={`Open ${bikeName(main.bike)}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line-bright text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Runners-up */}
          <div className="space-y-4">
            <p className="data reveal text-[10px] uppercase tracking-[0.18em] text-dim">
              Sample profile · newer rider · city & weekends · prefers automatic · ~€9,000
            </p>
            {runners.map((r, i) => (
              <Link
                key={r.bike.id}
                to={`/bikes/${r.bike.id}`}
                className="reveal reveal-late group flex items-center gap-4 rounded-2xl border border-line bg-raised p-3 transition-colors hover:border-line-bright"
              >
                <span className="data flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-[11px] text-muted">
                  {((offset + i + 1) % ranked.length) + 1}
                </span>
                <span className="w-24 shrink-0 overflow-hidden rounded-lg">
                  <BikePhoto bike={r.bike} kind="card" ratio="16/10" />
                </span>
                <span className="min-w-0">
                  <span className="data block text-[9px] uppercase tracking-[0.18em] text-dim">
                    {r.bike.manufacturer}
                  </span>
                  <span className="block truncate text-sm font-medium text-fg group-hover:text-accent">
                    {r.bike.model}
                    {r.bike.variant ? ` ${r.bike.variant}` : ""}
                  </span>
                  <span className="data mt-0.5 block text-[11px] text-accent">{r.score}% match</span>
                </span>
              </Link>
            ))}
            {/* Mobile carousel controls */}
            <div className="flex gap-2 lg:hidden">
              <button
                onClick={() => step(-1)}
                aria-label="Previous match"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line-bright text-fg"
              >
                <span aria-hidden>‹</span>
              </button>
              <button
                onClick={() => step(1)}
                aria-label="Next match"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line-bright text-fg"
              >
                <span aria-hidden>›</span>
              </button>
            </div>
            <p className="reveal reveal-later text-[12px] leading-relaxed text-dim">
              Your answers will produce a different list. That's the point.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 04 · browse by style ─────────────────────────*/

const CAT_ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* The reference's seven categories, in its order, with thin technical icons. */
const STYLE_CATS: { cat: Category; label: string; icon: React.ReactNode }[] = [
  {
    cat: "sport",
    label: "Sport",
    icon: (
      <svg {...CAT_ICON_PROPS} aria-hidden>
        <path d="M3 15l7-7 4 4 7-7M14 5h7v7" />
      </svg>
    ),
  },
  {
    cat: "naked",
    label: "Naked",
    icon: (
      <svg {...CAT_ICON_PROPS} aria-hidden>
        <circle cx="6" cy="17" r="3" />
        <circle cx="18" cy="17" r="3" />
        <path d="M6 17l5-8h4l3 8M11 9L9 6h5" />
      </svg>
    ),
  },
  {
    cat: "adventure",
    label: "Adventure",
    icon: (
      <svg {...CAT_ICON_PROPS} aria-hidden>
        <path d="M3 18L9 7l4 7 3-4 5 8z" />
      </svg>
    ),
  },
  {
    cat: "cruiser",
    label: "Cruiser",
    icon: (
      <svg {...CAT_ICON_PROPS} aria-hidden>
        <path d="M4 9c2.5 2 5 3 8 3s5.5-1 8-3M12 12v5M8 20h8" />
      </svg>
    ),
  },
  {
    cat: "touring",
    label: "Touring",
    icon: (
      <svg {...CAT_ICON_PROPS} aria-hidden>
        <path d="M5 20c3-6 3-10 2-16M19 20c-3-6-3-10-2-16M12 5v3M12 12v3M12 19v1" />
      </svg>
    ),
  },
  {
    cat: "retro",
    label: "Retro",
    icon: (
      <svg {...CAT_ICON_PROPS} aria-hidden>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M12 5V3M12 21v-2" />
      </svg>
    ),
  },
  {
    cat: "scooter",
    label: "Scooter",
    icon: (
      <svg {...CAT_ICON_PROPS} aria-hidden>
        <circle cx="5.5" cy="17.5" r="2.8" />
        <circle cx="18.5" cy="17.5" r="2.8" />
        <path d="M5.5 17.5L10 10h3l2.5 7.5M13 10l-1-4h3" />
      </svg>
    ),
  },
];

function BrowseByStyle() {
  const ref = useReveal<HTMLElement>(".reveal");
  const cats = useMemo(
    () =>
      STYLE_CATS.map(({ cat, label, icon }) => ({
        cat,
        label,
        icon,
        bike: MOTORCYCLES.find((b) => b.category === cat),
        count: MOTORCYCLES.filter((b) => b.category === cat).length,
      })).filter((c) => c.bike),
    [],
  );

  return (
    <section id="mm-styles" ref={ref} className={`pt-28 ${GUTTER}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="display-light font-medium text-[clamp(1.7rem,3.2vw,2.4rem)] uppercase">
          Browse by style
        </h2>
        <Link
          to="/explore"
          className="data text-[11px] uppercase tracking-[0.18em] text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          View all styles →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {cats.map(({ cat, label, icon, bike, count }, i) => (
          <Link
            key={cat}
            to={`/explore?category=${cat}`}
            className="reveal group overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-line-bright"
            style={{ transitionDelay: `${(i % 7) * 0.05}s` }}
          >
            <BikePhoto bike={bike!} kind="card" ratio="4/5" scrim="b" />
            <div className="p-3.5">
              <span className="text-dim transition-colors group-hover:text-accent" aria-hidden>
                {icon}
              </span>
              <div className="mt-2 flex items-center justify-between">
                <span>
                  <span className="data block text-[10px] uppercase tracking-[0.16em] text-fg">{label}</span>
                  <span className="data mt-0.5 block text-[10px] text-dim">
                    {count} {count === 1 ? "model" : "models"}
                  </span>
                </span>
                <span
                  className="text-dim opacity-0 transition-opacity group-hover:text-accent group-hover:opacity-100"
                  aria-hidden
                >
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── 05 · featured + why + CTA ────────────────────*/

const FEATURED_IDS = ["yamaha-mt-07", "honda-nc750x-dct", "cfmoto-450cl-c", "triumph-street-triple-765-rs"];

function Featured() {
  const ref = useReveal<HTMLElement>(".reveal");
  const bikes = FEATURED_IDS.map(getBike).filter(Boolean);

  return (
    <section ref={ref} className={`pt-28 ${GUTTER}`}>
      <span className="data text-[11px] uppercase tracking-[0.24em] text-dim">Featured motorcycles</span>
      <h2 className="display-light mt-4 font-medium text-[clamp(1.7rem,3.2vw,2.4rem)] uppercase">
        Four very different answers
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {bikes.map((b, i) => (
          <Link
            key={b!.id}
            to={`/bikes/${b!.id}`}
            className="reveal group overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line-bright"
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <BikePhoto bike={b!} kind="card" ratio="4/3" />
            <div className="p-5">
              <div className="data text-[10px] uppercase tracking-[0.2em] text-dim">
                {b!.manufacturer} · {b!.category}
              </div>
              <h3 className="display-light mt-1.5 text-2xl uppercase group-hover:text-accent">
                {b!.model}
                {b!.variant ? ` ${b!.variant}` : ""}
              </h3>
              <div className="data mt-3 flex items-baseline justify-between border-t border-line pt-3 text-[12px] text-muted">
                <span>
                  {b!.engine.horsepower} hp · {b!.engine.torque} Nm
                </span>
                <span className="text-accent">
                  <Price p={b!.price} />
                </span>
              </div>
              <div className="data mt-3 text-[10px] uppercase tracking-[0.18em] text-dim transition-colors group-hover:text-accent">
                Explore →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const WHY: [string, string][] = [
  ["Personalized", "Recommendations based on you, not popularity."],
  ["Practical", "Budget, experience, weight, seat height and real-world use matter."],
  ["Explained", "We tell you why a motorcycle matches you."],
  ["Independent", "MotoMatch isn't trying to sell you a particular motorcycle."],
];

function WhyMotoMatch() {
  const ref = useReveal<HTMLElement>(".reveal");
  return (
    <section ref={ref} className={`pt-28 ${GUTTER}`}>
      <div className="grid gap-x-8 gap-y-8 border-t border-line pt-10 sm:grid-cols-2 xl:grid-cols-4">
        {WHY.map(([title, body], i) => (
          <div key={title} className="reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
            <h3 className="data text-[11px] uppercase tracking-[0.2em] text-accent">{title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  const imgRef = useParallax<HTMLDivElement>(0.08, 50);
  const ref = useReveal<HTMLElement>(".reveal");
  const bike = getBike("kawasaki-eliminator-500") ?? MOTORCYCLES[0];

  return (
    <section id="mm-cta" ref={ref} className={`pt-28 ${GUTTER}`}>
      <div className="relative overflow-hidden rounded-3xl border border-line">
        <div ref={imgRef} className="absolute inset-[-8%] will-change-transform">
          <img src={bike.images.hero} alt={bike.images.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>
        <div
          className="absolute inset-0"
          aria-hidden
          style={{ background: "linear-gradient(180deg, rgba(11,11,13,0.72) 0%, rgba(11,11,13,0.55) 50%, rgba(11,11,13,0.85) 100%)" }}
        />
        <div className="relative px-6 py-24 text-center md:py-32">
          <h2 className="display-light reveal text-[clamp(2.4rem,6.5vw,5rem)] uppercase">
            Ready to find your bike?
          </h2>
          <p className="reveal reveal-late mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Your bike is out there. Let's figure out what belongs in your garage.
          </p>
          <Link to="/find-my-bike" className="btn btn-primary reveal reveal-late mt-9 px-8 py-4">
            Find my bike <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── page ────────────────────────────────────*/

export default function Home() {
  usePageMeta({
    title: "MotoMatch — Find the Motorcycle That's Right for You",
    description:
      "Tell MotoMatch how you ride, what you want and what you want to spend. Discover motorcycles that actually fit you.",
  });

  return (
    <>
      <SectionDots />
      <Hero />
      <FeatureStrip />
      <HowItWorks />
      <MatchPreview />
      <BrowseByStyle />
      <Featured />
      <WhyMotoMatch />
      <FinalCta />
    </>
  );
}
