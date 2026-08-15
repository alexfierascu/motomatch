import type { Motorcycle } from "../data/types";

export interface FilterState {
  transmission: string[]; // "automatic" | "dct" | "y-amt" | "cvt" | "e-clutch" | "manual"
  engine: string[]; // bucket ids
  power: string[];
  price: string[];
  type: string[]; // category
  beginner: string[]; // excellent | good | moderate | poor
  a2: string[]; // yes | no
}

export const EMPTY_FILTERS: FilterState = {
  transmission: [],
  engine: [],
  power: [],
  price: [],
  type: [],
  beginner: [],
  a2: [],
};

export interface FilterGroup {
  key: keyof FilterState;
  label: string;
  options: { id: string; label: string; hint?: string }[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "transmission",
    label: "Transmission",
    options: [
      { id: "automatic", label: "Fully automatic", hint: "no gear changes at all" },
      { id: "dct", label: "Honda DCT" },
      { id: "y-amt", label: "Yamaha Y-AMT" },
      { id: "cvt", label: "CVT scooter" },
      { id: "e-clutch", label: "Honda E-Clutch", hint: "you still shift" },
      { id: "manual", label: "Manual" },
    ],
  },
  {
    key: "engine",
    label: "Engine",
    options: [
      { id: "lt400", label: "Under 400 cc" },
      { id: "400-500", label: "400–500 cc" },
      { id: "500-700", label: "500–700 cc" },
      { id: "700-1000", label: "700–1000 cc" },
      { id: "gt1000", label: "1000 cc and up" },
    ],
  },
  {
    key: "power",
    label: "Power",
    options: [
      { id: "lt35", label: "Under 35 hp" },
      { id: "35-50", label: "35–50 hp" },
      { id: "50-75", label: "50–75 hp" },
      { id: "gt75", label: "75 hp and up" },
    ],
  },
  {
    key: "price",
    label: "Price",
    options: [
      { id: "lt7000", label: "Under €7,000" },
      { id: "7000-9000", label: "€7,000–9,000" },
      { id: "9000-11000", label: "€9,000–11,000" },
      { id: "gt11000", label: "€11,000 and up" },
    ],
  },
  {
    key: "type",
    label: "Body style",
    options: [
      { id: "cruiser", label: "Cruiser" },
      { id: "naked", label: "Naked" },
      { id: "sport", label: "Sport" },
      { id: "adventure", label: "Adventure" },
      { id: "touring", label: "Touring" },
      { id: "scooter", label: "Scooter" },
    ],
  },
  {
    key: "beginner",
    label: "Beginner suitability",
    options: [
      { id: "excellent", label: "Excellent", hint: "9–10" },
      { id: "good", label: "Good", hint: "7–8" },
      { id: "moderate", label: "Moderate", hint: "5–6" },
      { id: "poor", label: "Poor", hint: "under 5" },
    ],
  },
  {
    key: "a2",
    label: "Licence",
    options: [
      { id: "yes", label: "A2-compatible" },
      { id: "no", label: "Full A licence only" },
    ],
  },
];

export function beginnerBand(rating: number): "excellent" | "good" | "moderate" | "poor" {
  if (rating >= 9) return "excellent";
  if (rating >= 7) return "good";
  if (rating >= 5) return "moderate";
  return "poor";
}

export function beginnerLabel(rating: number): string {
  const band = beginnerBand(rating);
  return band.charAt(0).toUpperCase() + band.slice(1);
}

function matchGroup(selected: string[], test: (id: string) => boolean): boolean {
  if (selected.length === 0) return true;
  return selected.some(test);
}

export function applyFilters(bikes: Motorcycle[], f: FilterState): Motorcycle[] {
  return bikes.filter((b) => {
    const cc = b.engine.displacement;
    const hp = b.engine.horsepower;
    const eur = b.price.eur;

    return (
      matchGroup(f.transmission, (id) =>
        id === "automatic" ? b.transmission.fullyAutomatic : b.transmission.type === id,
      ) &&
      matchGroup(f.engine, (id) =>
        id === "lt400"
          ? cc < 400
          : id === "400-500"
            ? cc >= 400 && cc < 500
            : id === "500-700"
              ? cc >= 500 && cc < 700
              : id === "700-1000"
                ? cc >= 700 && cc < 1000
                : cc >= 1000,
      ) &&
      matchGroup(f.power, (id) =>
        id === "lt35" ? hp < 35 : id === "35-50" ? hp >= 35 && hp < 50 : id === "50-75" ? hp >= 50 && hp < 75 : hp >= 75,
      ) &&
      matchGroup(f.price, (id) =>
        id === "lt7000"
          ? eur < 7000
          : id === "7000-9000"
            ? eur >= 7000 && eur < 9000
            : id === "9000-11000"
              ? eur >= 9000 && eur < 11000
              : eur >= 11000,
      ) &&
      matchGroup(f.type, (id) => b.category === id) &&
      matchGroup(f.beginner, (id) => beginnerBand(b.beginnerRating) === id) &&
      matchGroup(f.a2, (id) => (id === "yes" ? b.a2Compatible : !b.a2Compatible))
    );
  });
}

export function activeFilterCount(f: FilterState): number {
  return Object.values(f).reduce((n, arr) => n + arr.length, 0);
}

/* ───────────────────────────────── Sorting ─────────────────────────────────*/

export type SortKey =
  | "name"
  | "category"
  | "displacement"
  | "horsepower"
  | "torque"
  | "weight"
  | "seatHeight"
  | "transmission"
  | "price"
  | "a2"
  | "beginner";

export const SORT_ACCESSORS: Record<SortKey, (b: Motorcycle) => string | number> = {
  name: (b) => `${b.manufacturer} ${b.model}`,
  category: (b) => b.category,
  displacement: (b) => b.engine.displacement,
  horsepower: (b) => b.engine.horsepower,
  torque: (b) => b.engine.torque,
  weight: (b) => b.dimensions.weight,
  seatHeight: (b) => b.dimensions.seatHeight,
  transmission: (b) => b.transmission.type,
  price: (b) => b.price.eur,
  a2: (b) => (b.a2Compatible ? 1 : 0),
  beginner: (b) => b.beginnerRating,
};

export function sortBikes(bikes: Motorcycle[], key: SortKey, dir: "asc" | "desc"): Motorcycle[] {
  const acc = SORT_ACCESSORS[key];
  return [...bikes].sort((a, b) => {
    const av = acc(a);
    const bv = acc(b);
    const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });
}
