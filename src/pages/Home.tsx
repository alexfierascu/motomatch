import { useState } from "react";
import { Link } from "react-router-dom";
import { MOTORCYCLES, bikeName, getBike } from "../data/motorcycles";
import type { Category } from "../data/types";
import { BikePhoto } from "../components/Photo";
import { useParallax, useReveal } from "../lib/motion";
import { usePageMeta } from "../lib/seo";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

/* Bikes whose hero photography carries a full-viewport crop. The pick
 * rotates per visit so returning users see a different machine. */
const HERO_IDS = [
  "yamaha-mt-07-y-amt",
  "honda-rebel-1100-dct",
  "cfmoto-450sr",
  "honda-x-adv",
  "yamaha-tenere-700",
  "triumph-speed-twin-900",
];

function pickHero() {
  const available = HERO_IDS.map(getBike).filter(Boolean);
  return available[Math.floor(Math.random() * available.length)] ?? MOTORCYCLES[0];
}

/* ─────────────────────────────── 01 · hero ────────────────────────────────*/

function Hero() {
  const [bike] = useState(pickHero);
  const imgRef = useParallax<HTMLDivElement>(0.14, 90);
  const subRef = useParallax<HTMLDivElement>(-0.05, 50);

  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden border-b border-line">
      <div ref={imgRef} className="absolute inset-[-8%] will-change-transform">
        <img
          src={bike.images.hero}
          alt={bike.images.alt}
          className="h-full w-full object-cover"
          decoding="async"
        />
      </div>
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(9,9,11,0.88) 0%, rgba(9,9,11,0.45) 42%, rgba(9,9,11,0.12) 70%), linear-gradient(180deg, rgba(9,9,11,0.5) 0%, transparent 25%, transparent 55%, rgba(9,9,11,0.96) 100%)",
        }}
      />

      <div className={`relative w-full pb-16 pt-40 ${GUTTER}`}>
        <p className="kicker">MotoMatch</p>
        <h1 className="mt-5 font-display text-[clamp(3.4rem,11vw,8rem)] uppercase leading-[0.92]">
          Find your bike.
        </h1>
        <p className="mt-6 max-w-md font-display text-[clamp(1.2rem,2.6vw,1.7rem)] uppercase leading-snug text-muted">
          Not by engine size.
          <br />
          Not by horsepower.
          <br />
          <span className="text-fg">
            By <span className="text-accent">you</span>.
          </span>
        </p>
        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
          Tell us how you ride, what you like and what you want to spend. We'll find the
          motorcycles that fit.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/find-my-bike" className="btn btn-primary">
            Find my motorcycle
          </Link>
          <Link to="/explore" className="btn btn-ghost">
            Explore motorcycles
          </Link>
        </div>

        <div ref={subRef} className="mt-12 will-change-transform">
          <Link to={`/bikes/${bike.id}`} className="eyebrow hover:text-accent">
            Pictured: {bikeName(bike)} →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 02 · how it works ────────────────────────────*/

function HowItWorks() {
  const ref = useReveal<HTMLElement>(".reveal");
  const steps: [string, string, string][] = [
    [
      "Tell us about yourself",
      "Twelve short questions — how you ride, how much experience you have, what you want to spend. No account, nothing saved beyond your browser.",
      "01",
    ],
    [
      "We score every motorcycle",
      `Each of the ${MOTORCYCLES.length} machines in the database is scored against your answers across eight weighted dimensions — never a simple filter.`,
      "02",
    ],
    [
      "You get your matches",
      "A best match with the reasons spelled out, strong alternatives, and the full ranked list when you want to dig deeper.",
      "03",
    ],
  ];

  return (
    <section ref={ref} className={`pt-24 ${GUTTER}`}>
      <span className="kicker">How it works</span>
      <div className="mt-8 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
        {steps.map(([title, body, num], i) => (
          <div key={num} className={`reveal bg-panel p-7 ${i === 1 ? "reveal-late" : i === 2 ? "reveal-later" : ""}`}>
            <span className="ghost-index text-5xl">{num}</span>
            <h2 className="mt-4 font-display text-2xl uppercase leading-tight">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── 03 · every kind of ride ──────────────────────*/

const CATEGORY_LABEL: Partial<Record<Category, string>> = {
  sport: "Sport",
  naked: "Naked",
  cruiser: "Cruiser",
  adventure: "Adventure",
  touring: "Touring",
  retro: "Retro",
  "dual-sport": "Dual-sport",
  scooter: "Scooter",
};

function CategoryMosaic() {
  const ref = useReveal<HTMLElement>(".reveal");
  const cats = (Object.keys(CATEGORY_LABEL) as Category[])
    .map((c) => ({ cat: c, bike: MOTORCYCLES.find((b) => b.category === c) }))
    .filter((x) => x.bike);

  return (
    <section ref={ref} className={`pt-24 ${GUTTER}`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="kicker">Every kind of ride</span>
          <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-none">
            Whatever you're into
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Manual or automatic. Cruiser or supersport. Sixty horsepower or two hundred. MotoMatch
          doesn't have a favourite — the quiz finds yours.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line md:grid-cols-4">
        {cats.map(({ cat, bike }, i) => (
          <Link
            key={cat}
            to="/explore"
            className="reveal group relative block bg-panel"
            style={{ transitionDelay: `${(i % 4) * 0.08}s` }}
          >
            <BikePhoto bike={bike!} kind="card" ratio="4/3" scrim="b" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4">
              <span className="font-display text-xl uppercase tracking-wide group-hover:text-accent">
                {CATEGORY_LABEL[cat]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────── 04 · CTA ─────────────────────────────────*/

function FinalCta() {
  const ref = useReveal<HTMLElement>(".reveal");
  return (
    <section ref={ref} className={`pt-28 ${GUTTER}`}>
      <div className="reveal border-t border-line pt-20 pb-10 text-center">
        <span className="kicker justify-center">Two minutes, twelve questions</span>
        <h2 className="mt-6 font-display text-[clamp(2.6rem,8vw,6rem)] uppercase leading-[0.95]">
          Stop scrolling
          <br />
          <span className="text-accent">spec sheets.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-muted">
          The right motorcycle depends on the rider. Tell us who you are — we'll do the rest.
        </p>
        <Link to="/find-my-bike" className="btn btn-primary mt-10 px-8 py-4 text-sm">
          Find my motorcycle
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta({
    title: "MotoMatch — Find the motorcycle that fits you",
    description:
      "Not by engine size. Not by horsepower. By you. Answer a short quiz and get personalized motorcycle matches with the reasons spelled out.",
  });

  return (
    <>
      <Hero />
      <HowItWorks />
      <CategoryMosaic />
      <FinalCta />
    </>
  );
}
