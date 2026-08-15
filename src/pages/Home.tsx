import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MOTORCYCLES, bikeName, getBike } from "../data/motorcycles";
import type { Category } from "../data/types";
import { matchAll, type QuizAnswers } from "../lib/match";
import { BikePhoto } from "../components/Photo";
import { Price } from "../components/BikeCard";
import { useParallax, useReveal } from "../lib/motion";
import { usePageMeta } from "../lib/seo";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

/* ─────────────────────────── section indicator ────────────────────────────
 * The reference design carries a subtle 01–05 progress rail on the right
 * edge. Purely decorative; hidden below xl and from assistive tech.        */

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
      className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2.5 xl:flex"
    >
      <span className="data text-[10px] tracking-[0.2em] text-dim">01</span>
      {SECTION_IDS.map((id, i) => (
        <span
          key={id}
          className="block h-1.5 w-1.5 rounded-full transition-colors duration-300"
          style={{ background: i === active ? "var(--color-accent)" : "var(--color-line-bright)" }}
        />
      ))}
      <span className="data text-[10px] tracking-[0.2em] text-dim">05</span>
    </div>
  );
}

/* ─────────────────────────────── 01 · hero ────────────────────────────────*/

const HERO_IDS = [
  "yamaha-mt-07-y-amt",
  "honda-rebel-1100-dct",
  "cfmoto-450sr",
  "yamaha-tenere-700",
  "honda-cb750-hornet",
];

function pickHero() {
  const available = HERO_IDS.map(getBike).filter(Boolean);
  return available[Math.floor(Math.random() * available.length)] ?? MOTORCYCLES[0];
}

function Hero() {
  const [bike] = useState(pickHero);
  const imgRef = useParallax<HTMLDivElement>(0.12, 80);
  const headRef = useParallax<HTMLDivElement>(-0.045, 44);

  const stats = useMemo(() => {
    const manufacturers = new Set(MOTORCYCLES.map((b) => b.manufacturer)).size;
    const categories = new Set(MOTORCYCLES.map((b) => b.category)).size;
    return { bikes: MOTORCYCLES.length, manufacturers, categories };
  }, []);

  return (
    <section id="mm-hero" className="relative flex min-h-[92svh] items-center overflow-hidden">
      {/* Photograph — biased right per the reference, drifting slower than the page. */}
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
            "linear-gradient(90deg, rgba(11,11,13,0.94) 0%, rgba(11,11,13,0.72) 34%, rgba(11,11,13,0.25) 60%, rgba(11,11,13,0.05) 78%), linear-gradient(180deg, rgba(11,11,13,0.55) 0%, transparent 22%, transparent 60%, rgba(11,11,13,0.9) 100%)",
        }}
      />

      <div className={`relative w-full pb-24 pt-32 ${GUTTER}`}>
        <div ref={headRef} className="max-w-2xl will-change-transform">
          <p className="data text-[11px] uppercase tracking-[0.24em] text-dim">
            01 / Discover · motorcycle matching · 2026
          </p>
          <h1 className="display-light mt-6 text-[clamp(3rem,8.5vw,6.8rem)] uppercase text-fg">
            Find your{" "}
            <br className="hidden sm:block" />
            bike.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
            Tell us how you ride, what you like and what you want to spend. We'll find the
            motorcycles that fit.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/find-my-bike" className="btn btn-primary">
              Find my bike <span aria-hidden>→</span>
            </Link>
            <Link to="/explore" className="btn btn-ghost">
              Explore motorcycles
            </Link>
          </div>

          {/* Honest numbers where the reference put invented social proof. */}
          <div className="mt-10 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="data text-[11px] uppercase tracking-[0.2em] text-muted">
              {stats.bikes} motorcycles · {stats.manufacturers} manufacturers · {stats.categories} styles
            </span>
            <span className="text-[12px] text-dim">— scored against you, with the reasons explained.</span>
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

const STRIP: { title: string; sub: string; icon: React.ReactNode }[] = [
  {
    title: "Personalized",
    sub: "Just for you",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5" />
      </svg>
    ),
  },
  {
    title: "Weighted matching",
    sub: "8 scored dimensions",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <path d="M4 17v-6M9 17V7M14 17v-4M19 17V9" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    title: "All styles",
    sub: "8 categories, manual & auto",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Save & compare",
    sub: "Up to 4 side by side",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <rect x="4" y="5" width="6.5" height="14" rx="1.5" />
        <rect x="13.5" y="5" width="6.5" height="14" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Verified data",
    sub: "Manufacturer specifications",
    icon: (
      <svg {...STRIP_ICON_PROPS} aria-hidden>
        <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4.5" />
      </svg>
    ),
  },
];

function FeatureStrip() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className={`reveal -mt-8 relative z-10 ${GUTTER}`}>
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
  ["Tell us about you", "Answer a few simple questions about how you ride."],
  ["We find your match", `The engine scores all ${MOTORCYCLES.length} motorcycles against your profile.`],
  ["Get your results", "See your strongest options — and why they fit."],
  ["Explore & choose", "Compare, dig into the details, decide."],
];

function HowItWorks() {
  const ref = useReveal<HTMLElement>(".reveal");
  const photoBike = getBike("honda-cmx500-rebel-e-clutch");

  return (
    <section id="mm-how" ref={ref} className={`pt-24 ${GUTTER}`}>
      <div className="grid items-start gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <span className="data text-[11px] uppercase tracking-[0.24em] text-dim">How it works</span>
          <h2 className="display-light reveal mt-4 text-[clamp(2.2rem,5vw,3.8rem)] uppercase">
            Not sure what to ride?
          </h2>
          <p className="reveal reveal-late mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
            You don't need to know everything about motorcycles. Tell us what you want from your
            ride. MotoMatch does the rest.
          </p>

          <ol className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="reveal relative" style={{ transitionDelay: `${i * 0.1}s` }}>
                {/* connector line, desktop only */}
                {i < STEPS.length - 1 && (
                  <span
                    className="absolute left-9 top-4 hidden h-px w-[calc(100%-2rem)] bg-line lg:block"
                    aria-hidden
                  />
                )}
                <span className="data flex h-8 w-8 items-center justify-center rounded-full border border-line-bright bg-panel text-[12px] text-fg">
                  {i + 1}
                </span>
                <h3 className="data mt-4 text-[11px] uppercase tracking-[0.18em] text-fg">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>

        {photoBike && (
          <Link
            to="/about"
            className="reveal reveal-late group relative block overflow-hidden rounded-2xl border border-line"
          >
            <BikePhoto bike={photoBike} kind="hero" ratio="4/3" scrim="b" />
            <span className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-5">
              <span>
                <span className="data block text-[10px] uppercase tracking-[0.2em] text-muted">
                  The method
                </span>
                <span className="mt-1 block font-medium text-fg">How we match</span>
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

/* ─────────────────────────── 03 · match preview ───────────────────────────
 * The reference shows a "your perfect match awaits" panel with a scored best
 * match. The numbers here are REAL: the actual engine runs on a labeled
 * sample profile. No invented percentages.                                  */

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

function MatchPreview() {
  const ref = useReveal<HTMLElement>(".reveal");
  const top3 = useMemo(() => matchAll(SAMPLE_PROFILE).slice(0, 3), []);
  const [best, second, third] = top3;

  return (
    <section id="mm-match" ref={ref} className={`pt-24 ${GUTTER}`}>
      <div className="rounded-3xl border border-line bg-panel p-6 md:p-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.55fr_0.9fr]">
          {/* Pitch */}
          <div>
            <h2 className="display-light reveal text-[clamp(2rem,4vw,3rem)] uppercase">
              Your perfect
              <br />
              match awaits
            </h2>
            <p className="reveal reveal-late mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
              Take the short quiz and discover the motorcycles that fit your style, your needs and
              your life.
            </p>
            <dl className="reveal reveal-late mt-7 space-y-4">
              {(
                [
                  ["12", "questions"],
                  ["≈ 2 min", "to complete"],
                  ["0", "accounts — runs in your browser"],
                ] as const
              ).map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-3">
                  <dt className="data w-16 shrink-0 text-lg text-accent">{v}</dt>
                  <dd className="data text-[10px] uppercase tracking-[0.18em] text-muted">{l}</dd>
                </div>
              ))}
            </dl>
            <Link to="/find-my-bike" className="btn btn-primary reveal reveal-late mt-8">
              Start the quiz <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Best match — real engine output on the sample profile */}
          {best && (
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
                  {best.reasons.slice(0, 3).map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                      <span className="text-auto" aria-hidden>✓</span>
                      <span className="line-clamp-2">{r}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <Link
                    to={`/bikes/${best.bike.id}`}
                    className="data text-[11px] uppercase tracking-[0.18em] text-fg underline-offset-4 hover:text-accent hover:underline"
                  >
                    View details →
                  </Link>
                  <span className="data text-sm text-accent">
                    <Price p={best.bike.price} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Runners-up */}
          <div className="space-y-4">
            <p className="data reveal text-[10px] uppercase tracking-[0.18em] text-dim">
              Sample profile · newer rider · city & weekends · prefers automatic · ~€9,000
            </p>
            {[second, third].filter(Boolean).map((r, i) => (
              <Link
                key={r.bike.id}
                to={`/bikes/${r.bike.id}`}
                className="reveal reveal-late group flex items-center gap-4 rounded-2xl border border-line bg-raised p-3 transition-colors hover:border-line-bright"
              >
                <span className="data flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-[11px] text-muted">
                  {i + 2}
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

const CATEGORY_LABEL: Record<Category, string> = {
  sport: "Sport",
  naked: "Naked",
  cruiser: "Cruiser",
  adventure: "Adventure",
  touring: "Touring",
  retro: "Retro",
  "dual-sport": "Dual-sport",
  scooter: "Scooter",
};

function BrowseByStyle() {
  const ref = useReveal<HTMLElement>(".reveal");
  const cats = useMemo(
    () =>
      (Object.keys(CATEGORY_LABEL) as Category[])
        .map((cat) => ({
          cat,
          bike: MOTORCYCLES.find((b) => b.category === cat),
          count: MOTORCYCLES.filter((b) => b.category === cat).length,
        }))
        .filter((c) => c.bike),
    [],
  );

  return (
    <section id="mm-styles" ref={ref} className={`pt-24 ${GUTTER}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="data text-[11px] uppercase tracking-[0.24em] text-dim">Browse by style</span>
          <h2 className="display-light mt-4 text-[clamp(2.2rem,5vw,3.8rem)] uppercase">
            What's your kind of ride?
          </h2>
        </div>
        <Link
          to="/explore"
          className="data text-[11px] uppercase tracking-[0.18em] text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          View all styles →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {cats.map(({ cat, bike, count }, i) => (
          <Link
            key={cat}
            to={`/explore?category=${cat}`}
            className="reveal group overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-line-bright"
            style={{ transitionDelay: `${(i % 8) * 0.05}s` }}
          >
            <BikePhoto bike={bike!} kind="card" ratio="4/5" scrim="b" />
            <div className="flex items-center justify-between p-3">
              <span>
                <span className="data block text-[10px] uppercase tracking-[0.16em] text-fg">
                  {CATEGORY_LABEL[cat]}
                </span>
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
    <section ref={ref} className={`pt-24 ${GUTTER}`}>
      <span className="data text-[11px] uppercase tracking-[0.24em] text-dim">Featured motorcycles</span>
      <h2 className="display-light mt-4 text-[clamp(2rem,4.5vw,3.4rem)] uppercase">
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
    <section ref={ref} className={`pt-24 ${GUTTER}`}>
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
    <section id="mm-cta" ref={ref} className={`pt-24 ${GUTTER}`}>
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
