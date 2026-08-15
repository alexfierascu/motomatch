import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MOTORCYCLES, bikeName, getBike } from "../data/motorcycles";
import type { Category } from "../data/types";
import { matchAll, type MatchResult, type QuizAnswers } from "../lib/match";
import { BikePhoto } from "../components/Photo";
import { Price } from "../components/BikeCard";
import { prefersReducedMotion, useParallax, useReveal } from "../lib/motion";
import { usePageMeta } from "../lib/seo";

const GUTTER = "mx-auto w-full max-w-[1400px] px-4 md:px-8";

/** Placeholder marketing figure from the approved design — NOT a real metric.
 *  MotoMatch has no accounts and does not count riders. Replace with a real
 *  number (or remove the claim) once the product can actually measure it. */
const RIDER_COUNT_LABEL = "20,000+";

/* ─────────────────────── primary section configuration ────────────────────
 * Single source of truth for the homepage's full-screen sections and the
 * right-side navigator. Section components reference these ids.            */

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "how-it-works", label: "How it works" },
  { id: "perfect-match", label: "Your perfect match" },
  { id: "browse-style", label: "Browse by style" },
  { id: "final-cta", label: "Get started" },
] as const;

/** Applies proximity scroll-snap to the document only while Home is mounted. */
function useHomeSnap() {
  useEffect(() => {
    document.documentElement.classList.add("snap-home");
    return () => document.documentElement.classList.remove("snap-home");
  }, []);
}

/* ─────────────────────────── section navigator ────────────────────────────*/

function SectionNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(SECTIONS.findIndex((s) => s.id === e.target.id));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center xl:flex"
    >
      {SECTIONS.map((s, i) => (
        <span key={s.id} className="flex flex-col items-center">
          {i > 0 && <span className="h-4 w-px bg-line-bright" aria-hidden />}
          <button
            onClick={() => goTo(s.id)}
            aria-label={`Go to ${s.label}`}
            aria-current={i === active ? "true" : undefined}
            className="group flex flex-col items-center gap-1.5 py-1"
          >
            <span
              className={`data text-[9px] tracking-[0.2em] transition-colors ${
                i === active ? "text-accent" : "text-dim group-hover:text-muted"
              }`}
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className="block rounded-full transition-all duration-300"
              style={
                i === active
                  ? { width: 8, height: 8, background: "var(--color-accent)" }
                  : { width: 5, height: 5, background: "var(--color-line-bright)" }
              }
              aria-hidden
            />
          </button>
        </span>
      ))}
    </nav>
  );
}

/* ─────────────────────────────── 01 · hero ────────────────────────────────*/

/* Heroes whose photography suits the reference composition: rider on the
 * road, warm bright environment, room on the left for type. */
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
          <circle cx="15" cy="12" r="6" fill="#c9c4ba" opacity="0.85" />
          <path d="M9.5 12a5.5 5.5 0 0 1 11 0v1.6h-11z" fill="#1c1c20" />
          <path d="M6 26c1.6-4.4 5-6.4 9-6.4s7.4 2 9 6.4z" fill="#c9c4ba" opacity="0.7" />
        </svg>
      ))}
    </span>
  );
}

function HeroSection() {
  const [bike] = useState(pickHero);
  const imgRef = useParallax<HTMLDivElement>(0.12, 80);
  const headRef = useParallax<HTMLDivElement>(-0.045, 44);
  const metaRef = useParallax<HTMLDivElement>(0.04, 30);

  return (
    <section
      id="hero"
      className="snap-section relative -mt-14 flex min-h-[100svh] items-center overflow-hidden"
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

      <div className={`relative pb-24 pt-36 ${GUTTER}`}>
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

/* ─────────────────────── 02 · feature strip + how it works ────────────────*/

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

const STEPS: [string, string][] = [
  ["Tell us about you", "Answer a few simple questions."],
  ["We find your match", "Our engine scores every motorcycle in the database."],
  ["Get your results", "See the best options for your profile."],
  ["Explore & choose", "Compare, save and find your perfect ride."],
];

function HowItWorksSection() {
  const ref = useReveal<HTMLElement>(".reveal, .line-reveal");
  const mediaBike = getBike("suzuki-v-strom-800de");

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="snap-section flex min-h-[100svh] flex-col justify-center scroll-mt-14 py-16"
    >
      <div className={GUTTER}>
        {/* Feature / value strip */}
        <div className="reveal grid grid-cols-2 gap-y-6 rounded-2xl border border-line bg-panel/90 px-6 py-6 backdrop-blur-sm sm:grid-cols-3 lg:grid-cols-5">
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

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1.45fr_1fr]">
          <div>
            <h2 className="display-light reveal font-medium text-[clamp(1.7rem,3.2vw,2.4rem)] uppercase">
              How it works
            </h2>

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

          {/* Media card: placeholder for a future "how we match" film. */}
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
      </div>
    </section>
  );
}

/* ─────────────────────── 03 · your perfect match awaits ───────────────────
 * Scores and reasons are REAL: the engine runs on a labeled sample profile.
 * The best match stays fixed; "other matches" is a looping carousel over the
 * rest of the ranked list — it can never be empty, whatever the count.      */

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

const SHOWCASE_SIZE = 6;
const VISIBLE_OTHERS = 2;

function PerfectMatchSection() {
  const ref = useReveal<HTMLElement>(".reveal");
  /* Derived from the same engine the quiz uses — the homepage preview and the
   * real results share one data model (MatchResult[]). */
  const matches = useMemo(() => matchAll(SAMPLE_PROFILE).slice(0, SHOWCASE_SIZE), []);
  const best = matches[0];
  const others = matches.slice(1);

  // Looping window over `others`: [i, i+1] with wraparound — never empty.
  const [start, setStart] = useState(0);
  const visible = Array.from(
    { length: Math.min(VISIBLE_OTHERS, others.length) },
    (_, k) => others[(start + k) % others.length],
  );
  const page = (d: number) => setStart((s) => (s + d + others.length) % others.length);

  if (!best) return null;

  return (
    <section
      id="perfect-match"
      ref={ref}
      className="snap-section flex min-h-[100svh] flex-col justify-center scroll-mt-14 py-16"
    >
      <div className={GUTTER}>
        <div
          className="rounded-3xl border border-line p-6 md:p-10"
          style={{
            background:
              "radial-gradient(900px 420px at 85% -10%, rgba(217,194,154,0.05), transparent 60%), var(--color-panel)",
          }}
        >
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

            {/* Best match — fixed, always rank #1 */}
            <div className="reveal overflow-hidden rounded-2xl border border-line bg-raised">
              <div className="relative">
                <BikePhoto bike={best.bike} kind="studio" ratio="16/9" />
                <span className="data absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-on-accent)]">
                  Best match
                </span>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="data text-[10px] uppercase tracking-[0.2em] text-dim">
                      {best.bike.manufacturer}
                    </div>
                    <h3 className="display-light mt-1 text-3xl uppercase">
                      {best.bike.model}
                      {best.bike.variant ? ` ${best.bike.variant}` : ""}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="data text-4xl font-light text-accent">{best.score}%</div>
                    <div className="data text-[9px] uppercase tracking-[0.2em] text-dim">Match score</div>
                  </div>
                </div>
                <ul className="mt-5 space-y-1.5 border-t border-line pt-4">
                  {shortReasons(best).map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                      <span className="text-auto" aria-hidden>✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <Link
                    to={`/bikes/${best.bike.id}`}
                    className="data text-[11px] uppercase tracking-[0.18em] text-fg underline-offset-4 hover:text-accent hover:underline"
                  >
                    View details
                  </Link>
                  <Link
                    to={`/bikes/${best.bike.id}`}
                    aria-label={`Open ${bikeName(best.bike)}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line-bright text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Other matches — looping carousel */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="data text-[10px] uppercase tracking-[0.2em] text-muted">Other matches</span>
                {others.length > VISIBLE_OTHERS && (
                  <span className="flex gap-1.5">
                    <button
                      onClick={() => page(-1)}
                      aria-label="Previous recommendation"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line-bright text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      <span aria-hidden>‹</span>
                    </button>
                    <button
                      onClick={() => page(1)}
                      aria-label="Next recommendation"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line-bright text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      <span aria-hidden>›</span>
                    </button>
                  </span>
                )}
              </div>

              <div key={start} className="carousel-in space-y-4">
                {visible.map((r) => {
                  const rank = matches.indexOf(r) + 1;
                  return (
                    <Link
                      key={r.bike.id}
                      to={`/bikes/${r.bike.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-raised p-3 transition-colors hover:border-line-bright"
                    >
                      <span className="data flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-[11px] text-muted">
                        {rank}
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
                  );
                })}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-dim">
                Sample profile: newer rider · city &amp; weekends · prefers automatic · ~€9,000.
                Your answers will produce a different list.
              </p>
            </div>
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

function BrowseByStyleSection() {
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
    <section
      id="browse-style"
      ref={ref}
      className="snap-section flex min-h-[100svh] flex-col justify-center scroll-mt-14 py-16"
    >
      <div className={GUTTER}>
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
      </div>
    </section>
  );
}

/* ──────────────── interlude: featured + why (not snapped) ─────────────────*/

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

/* ─────────────────────────── 05 · final CTA ───────────────────────────────*/

function FinalCtaSection() {
  const imgRef = useParallax<HTMLDivElement>(0.08, 50);
  const ref = useReveal<HTMLElement>(".reveal");
  const bike = getBike("kawasaki-eliminator-500") ?? MOTORCYCLES[0];

  return (
    <section
      id="final-cta"
      ref={ref}
      className="snap-section flex min-h-[100svh] flex-col justify-center scroll-mt-14 py-16"
    >
      <div className={GUTTER}>
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
  useHomeSnap();

  return (
    <>
      <SectionNav />
      <HeroSection />
      <HowItWorksSection />
      <PerfectMatchSection />
      <BrowseByStyleSection />
      <Featured />
      <WhyMotoMatch />
      <FinalCtaSection />
    </>
  );
}
