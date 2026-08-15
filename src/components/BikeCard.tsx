import { Link } from "react-router-dom";
import type { Motorcycle } from "../data/types";
import { bikeName } from "../data/motorcycles";
import { beginnerLabel } from "../lib/filters";
import { BikePhoto } from "./Photo";
import { A2Badge, ShiftRail, TransmissionBadge } from "./Transmission";

export function Price({ p }: { p: Motorcycle["price"] }) {
  return (
    <span className="data" title={p.note}>
      {p.confidence === "approximate" ? "~" : ""}€{p.eur.toLocaleString("en-US")}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="data mt-0.5 text-sm text-fg">{value}</div>
    </div>
  );
}

export function BikeCard({
  bike,
  selected,
  onToggle,
}: {
  bike: Motorcycle;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <article
      className="panel panel-hover group flex flex-col overflow-hidden"
      style={selected ? { borderColor: "var(--color-accent)" } : undefined}
    >
      <div className="relative">
        <Link to={`/bikes/${bike.id}`} className="block">
          <BikePhoto bike={bike} kind="card" ratio="16/10" scrim="b" />
          {/* The name sits on the photograph, magazine-style. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4">
            <div className="eyebrow">{bike.manufacturer}</div>
            <h3 className="mt-0.5 font-display text-[22px] uppercase leading-none tracking-wide group-hover:text-accent">
              {bike.model}
              {bike.variant && <span className="text-accent"> {bike.variant}</span>}
            </h3>
          </div>
        </Link>
        <button
          onClick={() => onToggle(bike.id)}
          aria-pressed={selected}
          aria-label={`${selected ? "Remove" : "Add"} ${bikeName(bike)} ${selected ? "from" : "to"} comparison`}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center border text-sm font-bold transition-colors"
          style={
            selected
              ? { background: "var(--color-accent)", borderColor: "var(--color-accent)", color: "#fff" }
              : {
                  background: "rgba(9,9,11,0.65)",
                  borderColor: "var(--color-line-bright)",
                  color: "var(--color-muted)",
                  backdropFilter: "blur(4px)",
                }
          }
        >
          {selected ? "✓" : "+"}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4">
        <div>
          <ShiftRail bike={bike} size="sm" />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <TransmissionBadge bike={bike} compact />
            <A2Badge bike={bike} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 border-t border-line pt-3">
          <Stat label="Power" value={`${bike.engine.horsepower} hp`} />
          <Stat label="Weight" value={`${bike.dimensions.weight} kg`} />
          <Stat label="Seat" value={`${bike.dimensions.seatHeight}`} />
          <Stat label="Engine" value={`${bike.engine.displacement}cc`} />
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-line pt-3">
          <div>
            <div className="eyebrow">Beginner</div>
            <div className="mt-0.5 text-sm font-semibold">
              {beginnerLabel(bike.beginnerRating)}{" "}
              <span className="data text-xs text-dim">{bike.beginnerRating}/10</span>
            </div>
          </div>
          <div className="text-right">
            <div className="eyebrow">Price</div>
            <div className="bignum mt-0.5 text-xl text-accent">
              <Price p={bike.price} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
