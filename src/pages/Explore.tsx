import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MOTORCYCLES, bikeName } from "../data/motorcycles";
import { TRANSMISSIONS } from "../data/transmissions";
import {
  EMPTY_FILTERS,
  FILTER_GROUPS,
  activeFilterCount,
  applyFilters,
  beginnerLabel,
  sortBikes,
  type FilterState,
  type SortKey,
} from "../lib/filters";
import { BikeCard, Price } from "../components/BikeCard";
import { A2Badge, TransmissionBadge } from "../components/Transmission";
import { useCompare, MAX_COMPARE } from "../App";
import { usePageMeta } from "../lib/seo";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean; optional?: boolean }[] = [
  { key: "name", label: "Bike" },
  { key: "category", label: "Type" },
  { key: "displacement", label: "Engine", numeric: true },
  { key: "horsepower", label: "HP", numeric: true },
  { key: "torque", label: "Torque", numeric: true, optional: true },
  { key: "weight", label: "Weight", numeric: true },
  { key: "seatHeight", label: "Seat", numeric: true, optional: true },
  { key: "transmission", label: "Transmission" },
  { key: "price", label: "Price", numeric: true },
  { key: "a2", label: "A2", optional: true },
  { key: "beginner", label: "Beginner", optional: true },
];

function FilterPanel({
  filters,
  setFilters,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}) {
  const toggle = (key: keyof FilterState, id: string) => {
    const current = filters[key];
    setFilters({
      ...filters,
      [key]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    });
  };

  return (
    <div className="space-y-6">
      {FILTER_GROUPS.map((g) => (
        <div key={g.key}>
          <div className="eyebrow mb-2.5">{g.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {g.options.map((o) => {
              const on = filters[g.key].includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => toggle(g.key, o.id)}
                  aria-pressed={on}
                  title={o.hint}
                  className="border px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={
                    on
                      ? {
                          background: "rgba(255,77,18,0.12)",
                          borderColor: "var(--color-accent)",
                          color: "var(--color-accent)",
                        }
                      : {
                          background: "var(--color-raised)",
                          borderColor: "var(--color-line)",
                          color: "var(--color-muted)",
                        }
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Explore() {
  usePageMeta({
    title: "Explore motorcycles — MotoMatch",
    description:
      "Browse every motorcycle in the MotoMatch database — filter by manufacturer, type, price, power, transmission and more.",
  });

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hidden, setHidden] = useState<SortKey[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { selected, toggle, isSelected, full } = useCompare();

  const results = useMemo(
    () => sortBikes(applyFilters(MOTORCYCLES, filters), sortKey, sortDir),
    [filters, sortKey, sortDir],
  );

  const visibleCols = COLUMNS.filter((c) => !hidden.includes(c.key));
  const count = activeFilterCount(filters);

  const clickSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="kicker">Every machine in the database</span>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4rem)] uppercase leading-none">
            Explore
          </h1>
          <p className="data mt-2 text-sm text-muted">
            {results.length} of {MOTORCYCLES.length} bikes
            {selected.length > 0 && ` · ${selected.length}/${MAX_COMPARE} selected`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost px-3 py-2 text-xs lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            Filters {count > 0 && <span className="data text-accent">({count})</span>}
          </button>
          <div className="flex overflow-hidden border border-line">
            {(["cards", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="data px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors"
                style={
                  view === v
                    ? { background: "var(--color-accent)", color: "#fff" }
                    : { background: "transparent", color: "var(--color-muted)" }
                }
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto border-r border-line pr-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-lg uppercase tracking-wide">Filters</span>
              {count > 0 && (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="data text-[11px] uppercase tracking-wider text-accent hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="panel p-12 text-center">
              <p className="text-sm text-muted">
                No bikes match those filters. Loosen one and they'll come back.
              </p>
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="btn btn-ghost mt-5">
                Reset filters
              </button>
            </div>
          ) : view === "cards" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((b) => (
                <BikeCard
                  key={b.id}
                  bike={b}
                  selected={isSelected(b.id)}
                  onToggle={(id) => {
                    if (!isSelected(id) && full) return;
                    toggle(id);
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="eyebrow mr-1">Columns</span>
                {COLUMNS.filter((c) => c.optional).map((c) => {
                  const on = !hidden.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() =>
                        setHidden((h) =>
                          h.includes(c.key) ? h.filter((x) => x !== c.key) : [...h, c.key],
                        )
                      }
                      aria-pressed={on}
                      className="border px-2 py-1 text-[11px]"
                      style={
                        on
                          ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
                          : { borderColor: "var(--color-line)", color: "var(--color-dim)" }
                      }
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <div className="panel overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="w-8 px-3 py-2.5" />
                      {visibleCols.map((c) => (
                        <th
                          key={c.key}
                          className={`px-3 py-2.5 ${c.numeric ? "text-right" : "text-left"}`}
                        >
                          <button
                            onClick={() => clickSort(c.key)}
                            className="eyebrow hover:text-accent"
                            style={sortKey === c.key ? { color: "var(--color-accent)" } : undefined}
                          >
                            {c.label}
                            {sortKey === c.key && (sortDir === "asc" ? " ▲" : " ▼")}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((b) => (
                      <tr key={b.id} className="border-b border-line/50 hover:bg-raised/50">
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected(b.id)}
                            disabled={!isSelected(b.id) && full}
                            onChange={() => toggle(b.id)}
                            aria-label={`Compare ${bikeName(b)}`}
                            className="h-4 w-4 accent-[var(--color-accent)]"
                          />
                        </td>
                        {visibleCols.map((c) => (
                          <td
                            key={c.key}
                            className={`px-3 py-2.5 ${c.numeric ? "data text-right whitespace-nowrap" : ""}`}
                          >
                            {c.key === "name" && (
                              <Link to={`/bikes/${b.id}`} className="font-medium hover:text-accent">
                                {bikeName(b)}
                              </Link>
                            )}
                            {c.key === "category" && (
                              <span className="capitalize text-muted">
                                {b.vehicleType === "scooter" ? "🛵" : "🏍"} {b.category}
                              </span>
                            )}
                            {c.key === "displacement" && `${b.engine.displacement} cc`}
                            {c.key === "horsepower" && b.engine.horsepower}
                            {c.key === "torque" && `${b.engine.torque} Nm`}
                            {c.key === "weight" && `${b.dimensions.weight} kg`}
                            {c.key === "seatHeight" && `${b.dimensions.seatHeight} mm`}
                            {c.key === "transmission" && <TransmissionBadge bike={b} compact />}
                            {c.key === "price" && <Price p={b.price} />}
                            {c.key === "a2" && <A2Badge bike={b} />}
                            {c.key === "beginner" && (
                              <span className="text-muted">
                                {beginnerLabel(b.beginnerRating)}{" "}
                                <span className="data text-dim">{b.beginnerRating}</span>
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-dim lg:hidden">Scroll the table sideways to see every column.</p>
            </>
          )}

          {/* Legend */}
          <div className="mt-8 border-t border-line pt-5">
            <div className="eyebrow mb-3">Transmission key</div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["y-amt", "e-clutch", "manual"] as const).map((t) => {
                const info = TRANSMISSIONS[t];
                const color =
                  info.verdict === "automatic"
                    ? "var(--color-auto)"
                    : info.verdict === "semi"
                      ? "var(--color-semi)"
                      : "var(--color-manual)";
                return (
                  <div key={t}>
                    <div className="text-xs font-semibold" style={{ color }}>
                      {info.verdict === "automatic" ? "🟢" : info.verdict === "semi" ? "🟡" : "🔴"}{" "}
                      {info.verdictLabel}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{info.riderDoes}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 w-[86%] max-w-sm overflow-y-auto border-l border-line bg-panel p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-xl uppercase tracking-wide">Filters</span>
              <button onClick={() => setDrawerOpen(false)} className="btn btn-ghost px-3 py-1.5">
                ✕
              </button>
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} />
            <div className="mt-6 flex gap-2">
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="btn btn-ghost flex-1">
                Reset
              </button>
              <button onClick={() => setDrawerOpen(false)} className="btn btn-primary flex-1">
                Show {results.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
