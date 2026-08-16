import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { MOTORCYCLES, bikeName, getBike } from "../data/motorcycles";
import { TRANSMISSIONS } from "../data/transmissions";
import { beginnerLabel } from "../lib/filters";
import { BikePhoto } from "../components/Photo";
import { A2Badge, ShiftRail, TransmissionBadge } from "../components/Transmission";
import { Price } from "../components/BikeCard";
import { useCompare } from "../App";
import type { Motorcycle } from "../data/types";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

type Row = {
  label: string;
  get: (b: Motorcycle) => string;
  /** Direction that counts as "better" for highlighting, if any. */
  best?: "low" | "high";
  value?: (b: Motorcycle) => number;
  /** Rendered in the big display style rather than small text. */
  big?: boolean;
};

const ROWS: Row[] = [
  { label: "Type", get: (b) => `${b.vehicleType === "scooter" ? "🛵" : "🏍"} ${b.category}` },
  {
    label: "Engine",
    get: (b) => `${b.engine.displacement} cc`,
    value: (b) => b.engine.displacement,
    big: true,
  },
  {
    label: "Power",
    get: (b) => `${b.engine.horsepower} hp`,
    best: "high",
    value: (b) => b.engine.horsepower,
    big: true,
  },
  {
    label: "Torque",
    get: (b) => `${b.engine.torque} Nm`,
    best: "high",
    value: (b) => b.engine.torque,
    big: true,
  },
  {
    label: "Weight",
    get: (b) => `${b.dimensions.weight} kg`,
    best: "low",
    value: (b) => b.dimensions.weight,
    big: true,
  },
  {
    label: "Seat height",
    get: (b) => `${b.dimensions.seatHeight} mm`,
    best: "low",
    value: (b) => b.dimensions.seatHeight,
    big: true,
  },
  {
    label: "Fuel tank",
    get: (b) => (b.dimensions.fuelCapacity ? `${b.dimensions.fuelCapacity} l` : "—"),
  },
  {
    label: "Top speed",
    get: (b) => (b.performance?.topSpeed ? `${b.performance.topSpeed} km/h` : "—"),
  },
  {
    label: "Fuel use",
    get: (b) =>
      b.performance?.fuelConsumption ? `${b.performance.fuelConsumption} l/100km` : "—",
    best: "low",
    value: (b) => b.performance?.fuelConsumption ?? 99,
  },
  { label: "Final drive", get: (b) => b.chassis?.drive ?? "—" },
  { label: "Rider does", get: (b) => TRANSMISSIONS[b.transmission.type].riderDoes },
  { label: "A2 licence", get: (b) => (b.a2Compatible ? "Yes" : "Full A only") },
  {
    label: "Beginner",
    get: (b) => `${beginnerLabel(b.beginnerRating)} · ${b.beginnerRating}/10`,
    best: "high",
    value: (b) => b.beginnerRating,
  },
  {
    label: "Price",
    get: (b) => `${b.price.confidence === "approximate" ? "~" : ""}€${b.price.eur.toLocaleString()}`,
    best: "low",
    value: (b) => b.price.eur,
    big: true,
  },
];

export default function Compare() {
  const { selected, toggle, clear, full } = useCompare();
  const [params, setParams] = useSearchParams();

  // Deep-link support: /compare?a=x&b=y
  useEffect(() => {
    const a = params.get("a");
    const b = params.get("b");
    if (a || b) {
      clear();
      [a, b].forEach((id) => id && getBike(id) && toggle(id));
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bikes = selected.map((id) => getBike(id)).filter((b): b is Motorcycle => Boolean(b));

  if (bikes.length === 0) {
    return (
      <div className={`pt-10 ${GUTTER}`}>
        <span className="kicker">Side by side</span>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4rem)] uppercase leading-none">
          Compare
        </h1>
        <div className="mt-8 max-w-2xl border-l-2 border-accent pl-6">
          <p className="text-sm leading-relaxed text-muted">
            Pick two to four bikes to line them up side by side. Add them from the browse page or
            from any bike's own page.
          </p>
          <Link to="/browse" className="btn btn-primary mt-5">
            Browse bikes
          </Link>
        </div>

        <h2 className="mb-5 mt-14 font-display text-2xl uppercase">Quick start</h2>
        <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {MOTORCYCLES.slice(0, 4).map((b) => (
            <button
              key={b.id}
              onClick={() => toggle(b.id)}
              className="group block bg-panel text-left transition-colors hover:bg-raised"
            >
              <BikePhoto bike={b} kind="card" ratio="16/10" />
              <div className="p-4">
                <div className="eyebrow">{b.manufacturer}</div>
                <div className="mt-0.5 font-display text-lg uppercase group-hover:text-accent">
                  {b.model}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`pt-10 ${GUTTER}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="kicker">Side by side</span>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4rem)] uppercase leading-none">
            Compare
          </h1>
          <p className="data mt-2 text-sm text-muted">
            {bikes.length} selected{full ? " · maximum reached" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={clear} className="btn btn-ghost px-3 py-2 text-xs">
            Clear
          </button>
          <Link to="/browse" className="btn btn-primary px-3 py-2 text-xs">
            Add more
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-line">
              <th className="sticky left-0 z-10 w-32 bg-ink px-3 py-3 text-left align-bottom">
                <span className="eyebrow">Spec</span>
              </th>
              {bikes.map((b) => (
                <th key={b.id} className="min-w-[180px] px-3 py-3 align-top">
                  <div className="relative">
                    <BikePhoto bike={b} kind="card" ratio="16/10" />
                    <button
                      onClick={() => toggle(b.id)}
                      aria-label={`Remove ${bikeName(b)}`}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-line-bright bg-ink/70 text-xs text-muted backdrop-blur-sm hover:text-manual"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 text-left">
                    <div className="eyebrow">{b.manufacturer}</div>
                    <Link to={`/bike/${b.id}`} className="block font-display text-xl uppercase leading-tight hover:text-accent">
                      {b.model}
                      {b.variant && <span className="text-accent"> {b.variant}</span>}
                    </Link>
                  </div>
                  <div className="mt-2.5">
                    <ShiftRail bike={b} size="sm" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <TransmissionBadge bike={b} compact />
                    <A2Badge bike={b} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              let bestIdx = -1;
              if (row.best && row.value && bikes.length > 1) {
                const vals = bikes.map(row.value);
                const target = row.best === "low" ? Math.min(...vals) : Math.max(...vals);
                if (new Set(vals).size > 1) bestIdx = vals.indexOf(target);
              }
              return (
                <tr key={row.label} className="border-b border-line/50">
                  <td className="sticky left-0 z-10 bg-ink px-3 py-3">
                    <span className="eyebrow">{row.label}</span>
                  </td>
                  {bikes.map((b, i) => (
                    <td
                      key={b.id}
                      className={`px-3 py-3 ${
                        row.label === "Rider does"
                          ? "text-xs leading-relaxed text-muted"
                          : row.big
                            ? "bignum text-[clamp(1.1rem,2vw,1.7rem)]"
                            : "data text-sm"
                      } ${i === bestIdx ? "text-accent" : row.big ? "text-fg" : ""}`}
                    >
                      {row.get(b)}
                      {i === bestIdx && (
                        <span className="eyebrow ml-2 align-middle text-accent" aria-label="best in row">
                          ◆
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-dim">
        ◆ marks the best figure in the row for that spec — lightest, cheapest, most powerful. It is
        not an overall verdict.
      </p>

      <div
        className="mt-10 grid gap-px overflow-hidden border border-line bg-line"
        style={{ gridTemplateColumns: `repeat(${Math.min(bikes.length, 2)}, minmax(0,1fr))` }}
      >
        {bikes.map((b) => (
          <div key={b.id} className="bg-panel p-6">
            <h3 className="font-display text-lg uppercase">{bikeName(b)}</h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{b.beginnerNote}</p>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3.5">
              <span className="eyebrow">Price</span>
              <span className="bignum text-xl text-accent">
                <Price p={b.price} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
