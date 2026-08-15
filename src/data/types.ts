/**
 * Domain types for the motorcycle dataset.
 * The UI must never hard-code bike facts — everything comes from `motorcycles.ts`.
 */

export type Category =
  | "cruiser"
  | "naked"
  | "sport"
  | "adventure"
  | "touring"
  | "scooter";

export type VehicleType = "motorcycle" | "scooter";

/** How the gearbox is operated. This is the axis the whole site is organised around. */
export type TransmissionType = "manual" | "dct" | "y-amt" | "cvt" | "e-clutch";

/** Confidence in a stored figure. Drives the "~" prefix and the sourcing notes. */
export type Confidence = "confirmed" | "approximate";

/**
 * Real photography for one bike. Files live in `public/images/bikes/` and are
 * generated from verified originals by `scripts/optimize-images.mjs`.
 * Components never hard-code image URLs — they read them from here.
 */
export interface BikeImages {
  /** Large cinematic shot for heroes and editorial sections (~1920w). */
  hero: string;
  /** Card-sized crop (~800w). Often the same photograph, resized. */
  card: string;
  gallery?: string[];
  /** Meaningful alt text describing the actual photograph. */
  alt: string;
  /** Where the photograph came from. */
  source?: string;
  sourceName?: string;
}

export interface PriceInfo {
  /** Indicative on-the-road price in EUR. */
  eur: number;
  /** Market the price refers to. */
  country: string;
  confidence: Confidence;
  /** Where the figure came from, in plain words. Never a fabricated URL. */
  note: string;
}

export interface Motorcycle {
  id: string;
  manufacturer: string;
  model: string;
  /** Trim / variant suffix shown after the model name, e.g. "Y-AMT". */
  variant?: string;
  year: number;
  category: Category;
  vehicleType: VehicleType;

  engine: {
    displacement: number; // cc
    cylinders: number;
    horsepower: number; // hp, in the configuration described by `powerNote`
    torque: number; // Nm
    powerNote?: string;
  };

  dimensions: {
    weight: number; // kg, wet/kerb
    seatHeight: number; // mm
    fuelCapacity?: number; // litres
  };

  transmission: {
    type: TransmissionType;
    /** True only when the rider never selects a gear. E-Clutch is deliberately false. */
    fullyAutomatic: boolean;
    /** Can the rider override and pick gears themselves? */
    manualOverride: boolean;
    /** Does the bike have a clutch lever the rider must use? */
    clutchLever: boolean;
  };

  performance?: {
    topSpeed?: number; // km/h
    zeroTo100?: number; // seconds
    fuelConsumption?: number; // l/100km
  };

  chassis?: {
    drive: "chain" | "belt" | "shaft";
    brakes: string;
    suspension: string;
  };

  images: BikeImages;

  price: PriceInfo;

  /** A2 licence: ≤35 kW and ≤0.2 kW/kg, either natively or via an official restrictor. */
  a2Compatible: boolean;
  a2Note?: string;

  /** 1–10. Weighted blend of weight, seat height, power delivery and gearbox workload. */
  beginnerRating: number;
  beginnerNote: string;

  pros: string[];
  cons: string[];

  /** Plain-language provenance. Deliberately descriptive rather than invented links. */
  sources: string[];
  lastVerified: string;
}
