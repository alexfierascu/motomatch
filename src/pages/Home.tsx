import { Link } from "react-router-dom";
import { MOTORCYCLES, getBike, bikeName } from "../data/motorcycles";
import { TRANSMISSIONS, VERDICT_ORDER } from "../data/transmissions";
import { closestAutomatics, headlineStats } from "../lib/scoring";
import { ShiftRail, TransmissionBadge, verdictColor } from "../components/Transmission";
import { BikePhoto } from "../components/Photo";
import { Price } from "../components/BikeCard";
import { useCountUp, useParallax, useReveal } from "../lib/motion";
import type { Motorcycle } from "../data/types";

/* Shared page gutter. */
const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

function SectionKicker({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-line pb-4">
      <span className="kicker">{label}</span>
      <span className="data text-[11px] tracking-[0.22em] text-dim">{index} / 08</span>
    </div>
  );
}

/* ───────────────────────────── 01 · HERO ──────────────────────────────────*/

function Hero() {
  const hero = getBike("yamaha-mt-07-y-amt")!;
  const imgRef = useParallax<HTMLDivElement>(0.14, 90);
  const metaRef = useParallax<HTMLDivElement>(-0.06, 60);

  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden border-b border-line">
      {/* Photograph — oversized and translated slower than the scroll. */}
      <div ref={imgRef} className="absolute inset-[-8%] will-change-transform">
        <img
          src={hero.images.hero}
          alt={hero.images.alt}
          className="h-full w-full object-cover"
          decoding="async"
        />
      </div>
      {/* Scrims so the type owns the left edge and the base. */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(9,9,11,0.88) 0%, rgba(9,9,11,0.45) 42%, rgba(9,9,11,0.15) 70%), linear-gradient(180deg, rgba(9,9,11,0.5) 0%, transparent 25%, transparent 55%, rgba(9,9,11,0.96) 100%)",
        }}
      />

      <div className={`relative w-full pb-16 pt-40 ${GUTTER}`}>
        <p className="kicker">Automatic &amp; no-clutch motorcycles · Romania · 2026</p>
        <h1 className="mt-5 font-display text-[clamp(3.2rem,10vw,7.5rem)] uppercase leading-[0.92] tracking-[0.01em]">
          Find your
          <br />
          <span className="text-accent">automatic</span>
          <br />
          motorcycle
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
          Real motorcycles. Real specifications. No clutch required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/recommendation" className="btn btn-primary">
            Find my bike
          </Link>
          <Link to="/browse" className="btn btn-ghost">
            Explore motorcycles
          </Link>
        </div>

        {/* Technical metadata strip — drifts slightly faster than the page. */}
        <div ref={metaRef} className="mt-14 hidden gap-10 border-t border-line/60 pt-5 will-change-transform md:flex">
          {[
            ["Machine", bikeName(hero)],
            ["Transmission", "Y-AMT · fully automatic"],
            ["Power", `${hero.engine.horsepower} hp (A2)`],
            ["Weight", `${hero.dimensions.weight} kg`],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="eyebrow">{k}</div>
              <div className="data mt-1 text-[13px] text-fg">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── quick stats (data strip) ─────────────────────────*/

function StatStrip() {
  const stats = headlineStats();
  const tiles: { label: string; value: string; sub: string; to: string }[] = [
    {
      label: "In the database",
      value: String(stats.total),
      sub: `${stats.automaticCount} fully automatic`,
      to: "/browse",
    },
    {
      label: "Cheapest automatic",
      value: stats.cheapest.model,
      sub: `~€${stats.cheapest.price.eur.toLocaleString()}`,
      to: `/bikes/${stats.cheapest.id}`,
    },
    {
      label: "Most powerful automatic",
      value: stats.mostPowerful.model,
      sub: `${stats.mostPowerful.engine.horsepower} hp`,
      to: `/bikes/${stats.mostPowerful.id}`,
    },
    {
      label: "Best for beginners",
      value: stats.bestBeginner.model,
      sub: `${stats.bestBeginner.beginnerRating}/10 · ${stats.bestBeginner.vehicleType}`,
      to: `/bikes/${stats.bestBeginner.id}`,
    },
    {
      label: "Best motorcycle",
      value: stats.bestMotorcycle.model,
      sub: "excluding scooters",
      to: `/bikes/${stats.bestMotorcycle.id}`,
    },
  ];

  return (
    <section className="border-b border-line bg-panel">
      <div className={`grid grid-cols-2 md:grid-cols-5 ${GUTTER} !px-0`}>
        {tiles.map((t, i) => (
          <Link
            key={t.label}
            to={t.to}
            className={`panel-hover block border-line px-5 py-6 ${i > 0 ? "md:border-l" : ""} ${
              i % 2 === 1 ? "border-l md:border-l" : ""
            } ${i >= 2 ? "border-t md:border-t-0" : ""}`}
          >
            <div className="eyebrow">{t.label}</div>
            <div className="mt-2 font-display text-[22px] uppercase leading-none">{t.value}</div>
            <div className="data mt-2 text-[11px] text-muted">{t.sub}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── 02 · THE PROBLEM ─────────────────────────────────*/

function TheProblem() {
  const ref = useReveal<HTMLElement>(".reveal");

  return (
    <section ref={ref} className={`pt-24 ${GUTTER}`}>
      <SectionKicker index="02" label="The problem" />
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="reveal font-display text-[clamp(2.4rem,6vw,4.5rem)] uppercase leading-[0.95]">
            You want a motorcycle.
            <br />
            <span className="text-dim">You don't want to shift gears.</span>
          </h2>
          <p className="reveal reveal-late mt-8 max-w-xl text-[15px] leading-relaxed text-muted">
            Clutch coordination is the single biggest thing a new rider has to learn — and the
            thing that makes hills, stalls and stop-start traffic miserable. Three systems remove
            it completely. One only pretends to. This site refuses to flatten them into a single
            word.
          </p>
        </div>

        <div className="space-y-8">
          {VERDICT_ORDER.map((verdict, i) => {
            const info = Object.values(TRANSMISSIONS).find((t) => t.verdict === verdict)!;
            const color = verdictColor(verdict);
            const example = MOTORCYCLES.find(
              (b) =>
                TRANSMISSIONS[b.transmission.type].verdict === verdict &&
                b.transmission.type === (verdict === "automatic" ? "y-amt" : info.type),
            );
            return (
              <div key={verdict} className={`reveal ${i === 1 ? "reveal-late" : i === 2 ? "reveal-later" : ""}`}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="font-display text-lg uppercase tracking-wide" style={{ color }}>
                    {info.verdictLabel}
                  </span>
                  <span className="eyebrow shrink-0">
                    {verdict === "automatic" ? "DCT · Y-AMT · CVT" : verdict === "semi" ? "E-Clutch" : "6-speed"}
                  </span>
                </div>
                {example && <ShiftRail bike={example} />}
                <p className="mt-2 text-xs leading-relaxed text-muted">{info.riderDoes}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 03 · FIND YOUR MATCH ─────────────────────────────*/

function FindYourMatch() {
  const closest = closestAutomatics("cfmoto-450sr", 3);
  const ref = useReveal<HTMLElement>(".reveal");

  return (
    <section ref={ref} className={`pt-24 ${GUTTER}`}>
      <SectionKicker index="03" label="Find your match" />
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-none">
          Closest automatics
          <br />
          <span className="text-dim">to the CFMOTO 450s</span>
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Ranked by how close each automatic gets to the 450SR on power, weight, price,
          displacement, seat height and riding position — not by which one is fastest.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
        {closest.map((r, i) => (
          <Link key={r.bike.id} to={`/bikes/${r.bike.id}`} className="reveal group block bg-panel transition-colors hover:bg-raised" style={{ transitionDelay: `${i * 0.12}s` }}>
            <BikePhoto bike={r.bike} kind="card" ratio="16/10" />
            <div className="p-5">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Match #{i + 1}</span>
                <span className="bignum text-2xl text-accent">{r.score}%</span>
              </div>
              <h3 className="mt-2 font-display text-xl uppercase group-hover:text-accent">
                {bikeName(r.bike)}
              </h3>
              <div className="mt-4 space-y-1.5">
                {r.breakdown.slice(0, 3).map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[11px] text-dim">{b.label}</span>
                    <div className="h-px flex-1 bg-raised">
                      <div className="h-[2px] -translate-y-px bg-accent" style={{ width: `${b.score}%` }} />
                    </div>
                    <span className="data w-28 shrink-0 text-right text-[10px] text-muted">{b.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── 04 · FEATURED (editorial) ────────────────────────*/

const FEATURED_IDS = [
  "yamaha-mt-07-y-amt",
  "honda-nc750x-dct",
  "cfmoto-450sr",
  "cfmoto-450cl-c",
  "honda-rebel-1100-dct",
];

function FeaturedBike({ bike, index }: { bike: Motorcycle; index: number }) {
  const flip = index % 2 === 1;
  const imgRef = useParallax<HTMLDivElement>(0.07, 46);
  const ref = useReveal<HTMLDivElement>(".reveal");

  return (
    <div ref={ref} className="relative border-t border-line py-16 first:border-t-0 md:py-20">
      <div className={`grid items-center gap-10 lg:grid-cols-[1fr_1.35fr] ${flip ? "lg:[direction:rtl]" : ""}`}>
        <div className="[direction:ltr]">
          <div className="reveal flex items-baseline gap-5">
            <span className="ghost-index text-[clamp(4rem,9vw,7rem)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="eyebrow">{bike.manufacturer}</div>
              <Link to={`/bikes/${bike.id}`}>
                <h3 className="mt-1 font-display text-[clamp(2rem,4.5vw,3.4rem)] uppercase leading-[0.95] hover:text-accent">
                  {bike.model}
                  {bike.variant && (
                    <>
                      <br />
                      <span className="text-accent">{bike.variant}</span>
                    </>
                  )}
                </h3>
              </Link>
            </div>
          </div>

          <div className="reveal reveal-late mt-8 grid grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              [String(bike.engine.horsepower), "HP"],
              [String(bike.dimensions.weight), "KG"],
              [String(bike.engine.displacement), "CC"],
            ].map(([v, u]) => (
              <div key={u}>
                <div className="bignum text-[clamp(2rem,4vw,3.2rem)]">{v}</div>
                <div className="eyebrow mt-1">{u}</div>
              </div>
            ))}
          </div>

          <div className="reveal reveal-late mt-6">
            <ShiftRail bike={bike} size="sm" />
            <div className="mt-3 flex items-center justify-between">
              <TransmissionBadge bike={bike} compact />
              <span className="data text-sm text-accent">
                <Price p={bike.price} />
              </span>
            </div>
          </div>
        </div>

        <Link to={`/bikes/${bike.id}`} className="[direction:ltr]">
          <div ref={imgRef} className="will-change-transform">
            <BikePhoto bike={bike} kind="hero" ratio="16/9" />
          </div>
        </Link>
      </div>
    </div>
  );
}

function Featured() {
  return (
    <section className={`pt-24 ${GUTTER}`}>
      <SectionKicker index="04" label="Featured machines" />
      <div>
        {FEATURED_IDS.map((id, i) => {
          const bike = getBike(id);
          return bike ? <FeaturedBike key={id} bike={bike} index={i} /> : null;
        })}
      </div>
    </section>
  );
}

/* ─────────────────────── 05 · PERFORMANCE ─────────────────────────────────*/

function PerfBar({
  bike,
  metric,
  max,
  value,
  unit,
}: {
  bike: Motorcycle;
  metric: string;
  max: number;
  value: number;
  unit: string;
}) {
  const [ref, shown] = useCountUp<HTMLDivElement>(value, 900, value % 1 !== 0 ? 1 : 0);
  return (
    <div ref={ref} className="flex items-center gap-4">
      <span className="data w-40 shrink-0 truncate text-[11px] uppercase tracking-wider text-muted">
        {bike.model}
        {bike.variant ? ` ${bike.variant}` : ""}
      </span>
      <div className="h-[3px] flex-1 bg-raised">
        <div
          className="h-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${(shown / max) * 100}%` }}
          aria-hidden
        />
      </div>
      <span className="bignum w-24 shrink-0 text-right text-xl" aria-label={`${value} ${unit} ${metric}`}>
        {shown}
        <span className="data ml-1 text-[10px] text-dim">{unit}</span>
      </span>
    </div>
  );
}

function Performance() {
  const bikes = FEATURED_IDS.map((id) => getBike(id)!).filter(Boolean);
  const metrics: { key: string; label: string; unit: string; get: (b: Motorcycle) => number }[] = [
    { key: "hp", label: "Horsepower", unit: "hp", get: (b) => b.engine.horsepower },
    { key: "nm", label: "Torque", unit: "Nm", get: (b) => b.engine.torque },
    { key: "kg", label: "Weight", unit: "kg", get: (b) => b.dimensions.weight },
    { key: "cc", label: "Displacement", unit: "cc", get: (b) => b.engine.displacement },
  ];

  return (
    <section className={`pt-24 ${GUTTER}`}>
      <SectionKicker index="05" label="Performance" />
      <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-none">
        The numbers, <span className="text-dim">side by side</span>
      </h2>

      <div className="mt-10 grid gap-x-16 gap-y-12 lg:grid-cols-2">
        {metrics.map((m) => {
          const max = Math.max(...bikes.map(m.get));
          return (
            <div key={m.key}>
              <div className="mb-4 flex items-baseline justify-between border-b border-line pb-2">
                <span className="font-display text-lg uppercase tracking-wide">{m.label}</span>
                <span className="eyebrow">{m.unit}</span>
              </div>
              <div className="space-y-3.5">
                {bikes.map((b) => (
                  <PerfBar key={b.id} bike={b} metric={m.label} max={max} value={m.get(b)} unit={m.unit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[11px] leading-relaxed text-dim">
        Longer is only better on the first two rows. Weight and displacement are context, not a score.
      </p>
    </section>
  );
}

/* ─────────────────────── 06 · THE 450 CLASS QUESTION ──────────────────────*/

function DuelRow({
  label,
  a,
  b,
  better,
}: {
  label: string;
  a: string;
  b: string;
  better?: 0 | 1;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-4 border-b border-line/60 py-4">
      <span className={`bignum text-right text-[clamp(1.3rem,3vw,2.2rem)] ${better === 0 ? "text-fg" : "text-dim"}`}>
        {a}
      </span>
      <span className="eyebrow w-28 text-center md:w-40">{label}</span>
      <span className={`bignum text-[clamp(1.3rem,3vw,2.2rem)] ${better === 1 ? "text-accent" : "text-dim"}`}>
        {b}
      </span>
    </div>
  );
}

function The450Question() {
  const sr = getBike("cfmoto-450sr")!;
  const mt = getBike("yamaha-mt-07-y-amt")!;
  const clc = getBike("cfmoto-450cl-c")!;
  const ref = useReveal<HTMLElement>(".reveal");

  return (
    <section ref={ref} className="mt-24 border-y border-line bg-panel py-20">
      <div className={GUTTER}>
        <SectionKicker index="06" label="The 450 class question" />
        <h2 className="reveal text-center font-display text-[clamp(2.4rem,7vw,5.5rem)] uppercase leading-[0.95]">
          Like the 450.
          <br />
          <span className="text-accent">Want the automatic.</span>
        </h2>

        <div className="mt-14 grid items-start gap-8 md:grid-cols-2">
          {[sr, mt].map((bike, i) => (
            <Link key={bike.id} to={`/bikes/${bike.id}`} className={`reveal ${i === 1 ? "reveal-late" : ""} group block`}>
              <BikePhoto bike={bike} kind="hero" ratio="16/9" scrim="b" />
              <div className="-mt-16 relative z-10 px-5">
                <div className="eyebrow">{bike.manufacturer}</div>
                <h3 className="mt-1 font-display text-2xl uppercase group-hover:text-accent md:text-3xl">
                  {bike.model}
                  {bike.variant && <span className="text-accent"> {bike.variant}</span>}
                </h3>
                <div className="mt-2">
                  <ShiftRail bike={bike} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <DuelRow label="Power" a={`${sr.engine.horsepower} hp`} b={`${mt.engine.horsepower} hp`} better={1} />
          <DuelRow label="Torque" a={`${sr.engine.torque} Nm`} b={`${mt.engine.torque} Nm`} better={1} />
          <DuelRow label="Weight" a={`${sr.dimensions.weight} kg`} b={`${mt.dimensions.weight} kg`} better={1} />
          <DuelRow label="Gears you shift" a="6" b="0" better={1} />
          <DuelRow label="Clutch lever" a="Yes" b="None" better={1} />
          <DuelRow
            label="Price"
            a={`~€${sr.price.eur.toLocaleString()}`}
            b={`~€${mt.price.eur.toLocaleString()}`}
            better={0}
          />

          <p className="mt-8 text-center text-[15px] leading-relaxed text-muted">
            <strong className="text-fg">
              Same 47-horsepower A2 ceiling. Six kilos lighter. Nothing to shift.
            </strong>{" "}
            The trade is roughly €{(mt.price.eur - sr.price.eur).toLocaleString()} and a taller
            seat. Against the {clc.model} bobber you also gain {mt.engine.torque - clc.engine.torque}{" "}
            Nm — but give up its {clc.dimensions.seatHeight} mm seat height.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/compare?a=${sr.id}&b=${mt.id}`} className="btn btn-primary">
              Run the full comparison
            </Link>
            <Link to={`/compare?a=${clc.id}&b=${mt.id}`} className="btn btn-ghost">
              450CL-C vs MT-07 Y-AMT
            </Link>
          </div>
        </div>

        {/* The licence trap nobody tells beginners about. */}
        <div className="reveal mx-auto mt-16 max-w-3xl border border-line bg-ink p-6 md:p-8">
          <div className="kicker">Before you book your test</div>
          <h3 className="mt-3 font-display text-xl uppercase leading-tight md:text-2xl">
            An automatic test gives you an automatic-only licence
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Under EU licensing rules, taking your A2 or A test on a vehicle with no clutch lever
            restricts your licence to automatics — recorded as code 78. That covers DCT, Y-AMT and
            every CVT scooter. Honda's E-Clutch bikes keep a conventional gearbox and a working
            clutch lever, so they don't trigger the restriction. Confirm the current rule with your
            school and with the Romanian licensing authority before booking.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 07 + 08 · FIND YOUR BIKE / FINAL CTA ─────────────*/

function FinalCta() {
  const ref = useReveal<HTMLElement>(".reveal");
  return (
    <section ref={ref} className={`pt-24 ${GUTTER}`}>
      <SectionKicker index="07" label="Find your bike" />
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="reveal font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.95]">
            Seven questions.
            <br />
            <span className="text-dim">One shortlist.</span>
          </h2>
          <p className="reveal reveal-late mt-6 max-w-md text-[15px] leading-relaxed text-muted">
            Experience, budget, body style, seat height, licence. The engine scores all{" "}
            {MOTORCYCLES.length} machines against your answers — power is scored as closeness to
            what you asked for, never as more-is-better. No email, nothing saved.
          </p>
        </div>
        <div className="reveal reveal-late grid grid-cols-2 gap-px border border-line bg-line">
          {["Experience", "Shifting", "Body style", "Budget", "Performance", "Seat height", "Use", "→ Result"].map(
            (s, i) => (
              <div key={s} className="bg-panel px-5 py-4">
                <span className="data text-[10px] text-dim">{String(i + 1).padStart(2, "0")}</span>
                <div className={`mt-1 text-sm font-medium ${i === 7 ? "text-accent" : ""}`}>{s}</div>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="reveal mt-24 border-t border-line pt-20 pb-8 text-center">
        <span className="data text-[11px] tracking-[0.22em] text-dim">08 / 08</span>
        <h2 className="mt-6 font-display text-[clamp(2.6rem,8vw,6.5rem)] uppercase leading-[0.95]">
          Your next motorcycle
          <br />
          <span className="text-accent">doesn't need a clutch.</span>
        </h2>
        <Link to="/recommendation" className="btn btn-primary mt-10 px-8 py-4 text-sm">
          Find my motorcycle
        </Link>
      </div>
    </section>
  );
}

/* ──────────────────────────────── page ────────────────────────────────────*/

export default function Home() {
  return (
    <>
      <Hero />
      <StatStrip />
      <TheProblem />
      <FindYourMatch />
      <Featured />
      <Performance />
      <The450Question />
      <FinalCta />
    </>
  );
}
