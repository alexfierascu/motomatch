import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { getBike, bikeName, MOTORCYCLES } from "../data/motorcycles";
import { TRANSMISSIONS } from "../data/transmissions";
import { similarityTo } from "../lib/scoring";
import { beginnerLabel } from "../lib/filters";
import { BikePhoto, PhotoCredit } from "../components/Photo";
import { A2Badge, ShiftRail, TransmissionBadge, VehicleTypeBadge, verdictColor } from "../components/Transmission";
import { Price } from "../components/BikeCard";
import { useCompare } from "../App";
import { useParallax, useReveal } from "../lib/motion";
import { usePageMeta } from "../lib/seo";
import NotFound from "./NotFound";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

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

/** Full-bleed cinematic opening. Image drifts slower than the scroll. */
function DetailHero({ bike }: { bike: NonNullable<ReturnType<typeof getBike>> }) {
  const imgRef = useParallax<HTMLDivElement>(0.12, 80);
  const tx = TRANSMISSIONS[bike.transmission.type];

  return (
    <section className="relative flex min-h-[78svh] items-end overflow-hidden border-b border-line">
      <div ref={imgRef} className="absolute inset-[-7%] will-change-transform">
        <img src={bike.images.hero} alt={bike.images.alt} className="h-full w-full object-cover" decoding="async" />
      </div>
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.55) 0%, transparent 30%, transparent 50%, rgba(9,9,11,0.97) 100%)",
        }}
      />

      <div className={`relative w-full pb-12 pt-40 ${GUTTER}`}>
        <Link to="/browse" className="data text-[11px] uppercase tracking-[0.18em] text-muted hover:text-accent">
          ← Browse
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="kicker">
              {bike.manufacturer} · {bike.year} · {bike.category}
            </div>
            <h1 className="mt-3 font-display text-[clamp(3rem,9vw,6.5rem)] uppercase leading-[0.9]">
              {bike.model}
              {bike.variant && (
                <>
                  <br />
                  <span className="text-accent">{bike.variant}</span>
                </>
              )}
            </h1>
          </div>

          <div className="flex gap-10 border-l-2 border-accent pl-6">
            {[
              [String(bike.engine.horsepower), "HP"],
              [String(bike.dimensions.weight), "KG"],
              [tx.short.toUpperCase(), "GEARBOX"],
            ].map(([v, u]) => (
              <div key={u}>
                <div className="bignum text-[clamp(1.8rem,4vw,3rem)]">{v}</div>
                <div className="eyebrow mt-1">{u}</div>
              </div>
            ))}
          </div>
        </div>
        <PhotoCredit bike={bike} className="mt-6 opacity-70" />
      </div>
    </section>
  );
}

export default function BikeDetail() {
  const { id } = useParams();
  const bike = id ? getBike(id) : undefined;
  const { isSelected, toggle, full } = useCompare();
  const revealRef = useReveal<HTMLDivElement>(".reveal");

  usePageMeta({
    title: bike ? `${bikeName(bike)} — MotoMatch` : "Motorcycle — MotoMatch",
    description: bike?.whoFor,
    image: bike?.images.card,
  });

  if (!bike) return <NotFound />;

  const tx = TRANSMISSIONS[bike.transmission.type];
  const color = verdictColor(tx.verdict);
  const alternatives = MOTORCYCLES.filter((b) => b.id !== bike.id)
    .map((b) => similarityTo(bike, b))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const selected = isSelected(bike.id);

  return (
    <div ref={revealRef}>
      <DetailHero bike={bike} />

      {/* SPEC BAND — the numbers as design elements */}
      <section className="border-b border-line bg-panel">
        <div className={`grid grid-cols-3 md:grid-cols-6 ${GUTTER} !px-0`}>
          {[
            [`${bike.engine.displacement}`, "CC"],
            [`${bike.engine.horsepower}`, "HP"],
            [`${bike.engine.torque}`, "NM"],
            [`${bike.dimensions.weight}`, "KG"],
            [`${bike.dimensions.seatHeight}`, "SEAT MM"],
            [`${bike.beginnerRating}/10`, "BEGINNER"],
          ].map(([v, u], i) => (
            <div key={u} className={`px-5 py-6 ${i > 0 ? "border-l border-line" : ""} ${i >= 3 ? "max-md:border-t max-md:[&:nth-child(4)]:border-l-0" : ""}`}>
              <div className="bignum text-[clamp(1.5rem,3vw,2.4rem)]">{v}</div>
              <div className="eyebrow mt-1.5">{u}</div>
            </div>
          ))}
        </div>
      </section>

      {/* OVERVIEW */}
      <section className={`grid gap-10 pt-16 lg:grid-cols-[1.15fr_1fr] ${GUTTER}`}>
        <div>
          <span className="kicker">About</span>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">{bike.about}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {bike.ridingStyles.map((s) => (
              <span key={s} className="data border border-line bg-raised px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted">
                {s}
              </span>
            ))}
          </div>
          <div className="reveal mt-6">
            <BikePhoto bike={bike} kind="studio" ratio="4/3" />
          </div>

          <div className="mt-6">
            <ShiftRail bike={bike} size="lg" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TransmissionBadge bike={bike} />
              <VehicleTypeBadge bike={bike} />
              <A2Badge bike={bike} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
            <div>
              <div className="eyebrow">Indicative price · {bike.price.country}</div>
              <div className="bignum mt-1 text-4xl text-accent">
                <Price p={bike.price} />
              </div>
              <p className="mt-2 max-w-md text-[11px] leading-relaxed text-dim">{bike.price.note}</p>
            </div>
            <button
              onClick={() => toggle(bike.id)}
              disabled={!selected && full}
              className={`btn ${selected ? "btn-ghost" : "btn-primary"} disabled:opacity-40`}
            >
              {selected ? "Remove from comparison" : "Add to comparison"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* TRANSMISSION — the section the site exists for */}
          <div className="reveal panel p-6" style={{ borderColor: `${color}40` }}>
            <span className="kicker">Transmission</span>
            <h2 className="mt-3 font-display text-3xl uppercase" style={{ color }}>
              {tx.label}
            </h2>
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
          </div>

          {/* RIDE / beginner suitability */}
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

          {/* WHO IS IT FOR */}
          <div className="reveal reveal-late panel p-6">
            <span className="kicker">Who is it for?</span>
            <p className="mt-3 text-sm leading-relaxed text-fg">{bike.whoFor}</p>
            <div className="mt-4 border-t border-line pt-4">
              <div className="eyebrow" style={{ color: "var(--color-semi)" }}>
                Maybe not for you if…
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{bike.notFor}</p>
            </div>
          </div>

        </div>
      </section>

      {/* PROS / CONS */}
      <section className={`mt-16 ${GUTTER}`}>
        <span className="kicker">The trade</span>
        <div className="mt-6 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
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

      {/* SPECS */}
      <section className={`mt-16 grid gap-8 md:grid-cols-2 ${GUTTER}`}>
        <div>
          <span className="kicker">Specifications</span>
          <div className="mt-5">
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
            {bike.engine.powerNote && (
              <p className="mt-3 text-[11px] leading-relaxed text-dim">{bike.engine.powerNote}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="kicker">Performance</span>
            <div className="mt-5">
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
          </div>

          <Expandable title="Chassis">
            <SpecRow label="Brakes" value={bike.chassis?.brakes} />
            <SpecRow label="Suspension" value={bike.chassis?.suspension} />
            <SpecRow label="Final drive" value={bike.chassis?.drive} />
          </Expandable>

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

      {/* ALTERNATIVES */}
      {alternatives.length > 0 && (
        <section className={`mt-20 ${GUTTER}`}>
          <span className="kicker">Similar machines</span>
          <h2 className="mt-4 font-display text-3xl uppercase md:text-4xl">
            Closest alternatives <span className="text-dim">to this bike</span>
          </h2>
          <div className="mt-8 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {alternatives.map((a) => (
              <Link key={a.bike.id} to={`/bikes/${a.bike.id}`} className="group block bg-panel transition-colors hover:bg-raised">
                <BikePhoto bike={a.bike} kind="card" ratio="16/10" />
                <div className="p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow">{a.bike.manufacturer}</span>
                    <span className="bignum text-lg text-accent">{a.score}%</span>
                  </div>
                  <h3 className="mt-1 font-display text-xl uppercase group-hover:text-accent">
                    {a.bike.model}
                    {a.bike.variant ? ` ${a.bike.variant}` : ""}
                  </h3>
                  <div className="data mt-2 text-[11px] text-muted">
                    {a.bike.engine.horsepower} hp · {a.bike.dimensions.weight} kg ·{" "}
                    <Price p={a.bike.price} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
