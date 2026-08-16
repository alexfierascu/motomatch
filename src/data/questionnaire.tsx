import type { QuestionnaireAnswers } from "../lib/questionnaire";

/* ────────────────────────────────────────────────────────────────────────────
 * The Find My Bike questionnaire: ten questions, centrally configured.
 * The UI renders exclusively from this file; answers are keyed by
 * `Question.key` into `QuestionnaireAnswers`.
 * ──────────────────────────────────────────────────────────────────────────*/

export interface QuestionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface Question {
  key: keyof QuestionnaireAnswers;
  category: string;
  /** Display heading; "\n" marks intentional line breaks. */
  title: string;
  description: string;
  note: { title: string; body: string };
  options: QuestionOption[];
}

/* ─────────────────────────── the emblem system ─────────────────────────────
 * Every answer renders as a technical emblem on a shared 48-unit grid:
 *
 *   · a fine track ring with four index marks — the container;
 *   · on ordinal questions, a stage arc that fills the ring with the
 *     option's position on its scale (25/50/75/100 …);
 *   · a minimal pictogram built from a small shared vocabulary — the
 *     position dot, the line, the arc.
 *
 * Everything draws in currentColor, so the card state (muted at rest,
 * accent when selected) recolors the whole mark. */

const R = 20;
const TAU = Math.PI * 2;

/** Point on a circle around (24,24); `frac` is clockwise from 12 o'clock. */
function pt(frac: number, r: number): [number, number] {
  const a = frac * TAU;
  return [+(24 + r * Math.sin(a)).toFixed(2), +(24 - r * Math.cos(a)).toFixed(2)];
}

/** Clockwise arc from 12 o'clock spanning `frac` of a circle of radius `r`. */
function arcPath(frac: number, r: number): string {
  const [x0, y0] = pt(0, r);
  const [x, y] = pt(frac, r);
  return `M${x0} ${y0}A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y}`;
}

/** Bezel index marks at the four diagonals, just outside the track ring. */
const TICKS =
  "M39.06 8.94l1.42-1.42M39.06 39.06l1.42 1.42M8.94 39.06l-1.42 1.42M8.94 8.94L7.52 7.52";

function Dot({ x, y, r = 2 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />;
}

function Emblem({
  stage,
  of,
  children,
}: {
  stage?: number;
  of?: number;
  children?: React.ReactNode;
}) {
  const frac = stage && of ? stage / of : null;
  const [ex, ey] = frac ? pt(frac >= 1 ? 0 : frac, R) : [0, 0];
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[52px] w-[52px] lg:h-14 lg:w-14"
      aria-hidden
    >
      <circle cx="24" cy="24" r={R} strokeWidth="1" opacity="0.22" />
      <path d={TICKS} strokeWidth="1" opacity="0.45" />
      {frac != null &&
        (frac >= 1 ? <circle cx="24" cy="24" r={R} /> : <path d={arcPath(frac, R)} />)}
      {frac != null && <Dot x={ex} y={ey} r={1.7} />}
      {children}
    </svg>
  );
}

/* ── experience: one mark in four stages — begin, develop, control, master ──*/

/** Stage 01 — the position reticle: on the grid, ready to start. */
const BeginEmblem = (
  <Emblem stage={1} of={4}>
    <circle cx="24" cy="24" r="7" strokeWidth="1.25" />
    <path d="M24 10.5v3.5M24 34v3.5M10.5 24h3.5M34 24h3.5" strokeWidth="1.25" />
    <Dot x={24} y={24} />
  </Emblem>
);

/** Stage 02 — first trajectory: the dot in motion, history dotted behind. */
const DevelopEmblem = (
  <Emblem stage={2} of={4}>
    <path d="M20 31.5C25 30 29 25.5 32.5 17.5" />
    <circle cx="32.5" cy="17.5" r="4.6" strokeWidth="1" opacity="0.5" />
    <circle cx="15.8" cy="32.7" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11.9" cy="33.8" r="0.9" fill="currentColor" stroke="none" />
    <Dot x={32.5} y={17.5} />
  </Emblem>
);

/** Stage 03 — the calibrated axis: centred, level, in control. */
const ControlEmblem = (
  <Emblem stage={3} of={4}>
    <path d="M10.5 24h27" />
    <path d="M10.5 20.8v6.4M37.5 20.8v6.4" strokeWidth="1.25" />
    <path d="M17.25 22.2v3.6M30.75 22.2v3.6" strokeWidth="1" opacity="0.55" />
    <Dot x={24} y={24} r={2.2} />
  </Emblem>
);

/** Stage 04 — the full sweep: carving your own line, echo trailing. */
const MasterEmblem = (
  <Emblem stage={4} of={4}>
    <path d="M10.5 33.5C17.5 34 21 28.5 24 24C27 19.5 30.5 14.5 37.5 14" />
    <path d="M14 37C18.5 36 21.5 32.5 24.5 28" strokeWidth="1.25" opacity="0.45" />
    <Dot x={37.5} y={14} />
  </Emblem>
);

/* ── riding style: five routes, drawn with the same pen ─────────────────────*/

const CityEmblem = (
  <Emblem>
    <path d="M13 35V23h10.5V12.5H35" />
    <circle cx="13" cy="12.5" r="1" fill="currentColor" stroke="none" opacity="0.45" />
    <circle cx="31" cy="31" r="1" fill="currentColor" stroke="none" opacity="0.45" />
    <Dot x={35} y={12.5} />
  </Emblem>
);

const WeekendEmblem = (
  <Emblem>
    <path d="M21.5 34.4C13 31.8 9.8 23 15.3 17.2C20.4 11.8 30.6 12.4 34 18.4C37.1 24 33.6 31.4 27.6 33.9" />
    <Dot x={24.6} y={34.6} />
  </Emblem>
);

const TouringEmblem = (
  <Emblem>
    <path d="M9.8 28.5A20.5 20.5 0 0 1 38.2 28.5" />
    <path d="M9.8 31.2v-5.4" strokeWidth="1.25" />
    <path d="M14 33.5h20" strokeWidth="1" opacity="0.3" />
    <Dot x={38.2} y={28.5} />
  </Emblem>
);

const AdventureEmblem = (
  <Emblem>
    <path d="M10.5 31.5L18 20.5l4.8 5.8L29.5 15l8 11.5" />
    <path d="M13 35h22" strokeWidth="1" opacity="0.35" />
    <Dot x={29.5} y={15} />
  </Emblem>
);

const SportEmblem = (
  <Emblem>
    <path d="M11.5 34.5C19.5 33 26.5 28.5 31 21.5C32.5 19 33.6 16.3 34.2 13.8" />
    <path d="M12 27.5l4.6-1.7M11.5 21.5l3.6-1.3" strokeWidth="1.25" opacity="0.55" />
    <Dot x={34.2} y={13.8} />
  </Emblem>
);

/* ── personality: five temperament lines ────────────────────────────────────*/

const EasyEmblem = (
  <Emblem>
    <path d="M10.5 24.5c4.5-3 9-3 13.5 0s9 3 13.5 0" />
    <Dot x={37.5} y={24.5} />
  </Emblem>
);

const FunEmblem = (
  <Emblem>
    <path d="M10.5 26.5c2.6-6.5 5.8-6.5 8.4 0s5.8 6.5 8.4 0 5.8-6.5 8.4 0" />
    <Dot x={35.7} y={26.5} />
  </Emblem>
);

const FastEmblem = (
  <Emblem>
    <path d="M13 32.5L34.5 14" />
    <path d="M11.5 26l5.5-4.7M10.8 19.8l4.2-3.6" strokeWidth="1.25" opacity="0.5" />
    <Dot x={34.5} y={14} />
  </Emblem>
);

const ComfortEmblem = (
  <Emblem>
    <path d="M10.5 20.5C12.5 28.5 17.5 32.5 24 32.5s11.5-4 13.5-12" />
    <Dot x={24} y={32.5} />
  </Emblem>
);

const CapableEmblem = (
  <Emblem>
    <path d="M11.5 31.5L24 13.5l12.5 18" />
    <path d="M14 35h20" strokeWidth="1" opacity="0.35" />
    <Dot x={24} y={13.5} />
  </Emblem>
);

/* ── transmission ───────────────────────────────────────────────────────────*/

/** Sequential gear ladder, first position engaged. */
const ManualEmblem = (
  <Emblem>
    <path d="M24 12.5v23M19 17.5h10M19 24h10M19 30.5h10" />
    <Dot x={24} y={17.5} />
  </Emblem>
);

/** Seamless loop — drive without interruption. */
const AutoEmblem = (
  <Emblem>
    <path d="M24 14A10 10 0 1 1 15.34 19" />
    <path d="M12.1 21.3L15.34 19L15 23" />
    <Dot x={24} y={24} />
  </Emblem>
);

/** The junction: both paths open. */
const EitherEmblem = (
  <Emblem>
    <path d="M10.5 24h8M18.5 24c6 0 6-6.5 12-7.5M18.5 24c6 0 6 6.5 12 7.5" />
    <Dot x={30.5} y={16.5} />
    <Dot x={30.5} y={31.5} />
  </Emblem>
);

/** An orbit not yet settled. */
const UndecidedEmblem = (
  <Emblem>
    <circle cx="24" cy="24" r="9.5" strokeDasharray="0.1 4.87" />
    <Dot x={24} y={24} />
  </Emblem>
);

/* ── performance: dial and needle, four positions ───────────────────────────*/

function GaugeEmblem({ level }: { level: 0 | 1 | 2 | 3 }) {
  const a = ([-105, -35, 35, 105][level] * Math.PI) / 180;
  const x = (24 + 10 * Math.sin(a)).toFixed(2);
  const y = (24 - 10 * Math.cos(a)).toFixed(2);
  return (
    <Emblem stage={level + 1} of={4}>
      <path d="M16.22 31.78A11 11 0 1 1 31.78 31.78" strokeWidth="1" opacity="0.4" />
      <path d={`M24 24L${x} ${y}`} />
      <Dot x={24} y={24} r={2.2} />
    </Emblem>
  );
}

/* ── size & fit ─────────────────────────────────────────────────────────────*/

/** Seat-height gauge: ground line, stem, seat line at `h`. */
function SeatEmblem({ h }: { h: number }) {
  return (
    <Emblem>
      <path d="M11.5 33.5h25" strokeWidth="1.25" opacity="0.55" />
      <path d={`M17.5 33.5V${h}H31.5`} />
      <Dot x={31.5} y={h} />
    </Emblem>
  );
}

/** Mass, lifted: light and easy to handle. */
const LightweightEmblem = (
  <Emblem>
    <circle cx="24" cy="17.5" r="4.6" />
    <path d="M20 27l4-3.8 4 3.8M20 33l4-3.8 4 3.8" strokeWidth="1.25" />
  </Emblem>
);

/** Open in every direction. */
const AnyFitEmblem = (
  <Emblem>
    <path d="M28.4 19.6l4.2-4.2M28.4 28.4l4.2 4.2M19.6 28.4l-4.2 4.2M19.6 19.6l-4.2-4.2" strokeWidth="1.25" />
    <Dot x={24} y={24} />
  </Emblem>
);

/* ── budget: a range meter in five steps ────────────────────────────────────*/

function BudgetEmblem({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const w = (26 * level) / 5;
  return (
    <Emblem stage={level} of={5}>
      <path d="M11 25.5h26" strokeWidth="1" opacity="0.3" />
      <path d={`M11 25.5h${w.toFixed(1)}`} />
      <path d="M11 30.5v1.8M17.5 30.5v1.8M24 30.5v1.8M30.5 30.5v1.8M37 30.5v1.8" strokeWidth="1" opacity="0.4" />
      <Dot x={11 + w} y={25.5} />
    </Emblem>
  );
}

/* ── practicality: modular capacity, cell by cell ───────────────────────────*/

function CargoEmblem({ level }: { level: 0 | 1 | 2 | 3 }) {
  const cells: Array<[number, number]> = [
    [14.5, 14.5],
    [26, 14.5],
    [14.5, 26],
    [26, 26],
  ];
  return (
    <Emblem stage={level + 1} of={4}>
      {cells.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="7.5" height="7.5" rx="1.5" strokeWidth="1.25" opacity={i <= level ? 1 : 0.28} />
      ))}
    </Emblem>
  );
}

/* ── passenger: two seats on the bench ──────────────────────────────────────*/

function PillionEmblem({ mode, stage }: { mode: "solid" | "open" | "dashed" | "none"; stage: number }) {
  return (
    <Emblem stage={stage} of={4}>
      <path d="M12.5 31h23" strokeWidth="1.25" opacity="0.55" />
      <path d="M18.5 28.2V31" strokeWidth="1" opacity="0.5" />
      {mode !== "none" && <path d="M29.5 28.2V31" strokeWidth="1" opacity="0.5" />}
      <Dot x={18.5} y={25.8} r={2.4} />
      {mode === "solid" && <Dot x={29.5} y={25.8} r={2.4} />}
      {mode === "open" && <circle cx="29.5" cy="25.8" r="2.4" strokeWidth="1.25" />}
      {mode === "dashed" && <circle cx="29.5" cy="25.8" r="2.4" strokeWidth="1.25" strokeDasharray="1.6 2.1" />}
      {mode === "none" && <path d="M27.4 25.8h4.2" strokeWidth="1.25" opacity="0.5" />}
    </Emblem>
  );
}

/* ── condition: how much "new" you're asking for ────────────────────────────*/

function ConditionEmblem({ frac }: { frac: number }) {
  const r = 9.5;
  const [ex, ey] = pt(frac >= 1 ? 0 : frac, r);
  return (
    <Emblem>
      <circle cx="24" cy="24" r={r} strokeWidth="1" opacity="0.28" />
      {frac >= 1 ? <circle cx="24" cy="24" r={r} /> : <path d={arcPath(frac, r)} />}
      <Dot x={ex} y={ey} r={1.7} />
      <Dot x={24} y={24} />
    </Emblem>
  );
}

/* ─────────────────────────────── questions ────────────────────────────────*/

export const QUESTIONS: Question[] = [
  {
    key: "experience",
    category: "Experience",
    title: "How much\nriding experience\ndo you have?",
    description:
      "This helps us match you with motorcycles that fit your skill level and keep every ride safe and enjoyable.",
    note: {
      title: "Your safety is important",
      body: "We'll recommend bikes that match your experience so you can enjoy every ride with confidence.",
    },
    options: [
      { id: "new", title: "I'm completely new", description: "I've never ridden or I'm just starting.", icon: BeginEmblem },
      { id: "little", title: "I've ridden a little", description: "Some experience, but I'm still learning.", icon: DevelopEmblem },
      { id: "comfortable", title: "I'm comfortable on a bike", description: "I've ridden regularly and feel confident.", icon: ControlEmblem },
      { id: "veteran", title: "I've been riding for years", description: "I have a lot of experience and know what I'm doing.", icon: MasterEmblem },
    ],
  },
  {
    key: "ridingStyle",
    category: "Riding style",
    title: "What kind of riding\nwill you do most?",
    description: "Where and how you actually ride shapes the recommendation more than any single specification.",
    note: {
      title: "Real riding beats spec sheets",
      body: "A bike that fits your routes will always beat one that only looks good on paper.",
    },
    options: [
      { id: "city", title: "City & commuting", description: "Traffic, short trips, everyday rides.", icon: CityEmblem },
      { id: "weekend", title: "Weekend rides", description: "Fun rides when time allows.", icon: WeekendEmblem },
      { id: "touring", title: "Long-distance touring", description: "Big days, long routes, real distance.", icon: TouringEmblem },
      { id: "adventure", title: "Adventure & mixed terrain", description: "Asphalt, gravel and beyond.", icon: AdventureEmblem },
      { id: "sport", title: "Sport & spirited riding", description: "Twisty roads, pace and precision.", icon: SportEmblem },
    ],
  },
  {
    key: "personality",
    category: "Personality",
    title: "What do you want\nyour bike to feel like?",
    description: "Two bikes with identical numbers can feel completely different. Character counts.",
    note: {
      title: "Character is a real spec",
      body: "We score feel and temperament alongside the measurable numbers.",
    },
    options: [
      { id: "easy", title: "Easy & approachable", description: "Light, forgiving, confidence-building.", icon: EasyEmblem },
      { id: "fun", title: "Fun & playful", description: "Agile, lively, always up for it.", icon: FunEmblem },
      { id: "fast", title: "Fast & exciting", description: "Sharp, urgent, thrilling.", icon: FastEmblem },
      { id: "comfortable", title: "Comfortable & relaxed", description: "Unhurried, easygoing, smooth.", icon: ComfortEmblem },
      { id: "capable", title: "Capable & adventurous", description: "Ready for anything, anywhere.", icon: CapableEmblem },
    ],
  },
  {
    key: "transmission",
    category: "Transmission",
    title: "How do you feel\nabout shifting gears?",
    description: "Manual, automatic or undecided — there's no wrong answer, and it changes the matches meaningfully.",
    note: {
      title: "No wrong answers",
      body: "DCT, Y-AMT and CVT are fully automatic; Honda's E-Clutch still shifts with your foot. We score them differently because they are different.",
    },
    options: [
      { id: "manual", title: "I want a manual", description: "Clutch, gears, full control.", icon: ManualEmblem },
      { id: "automatic", title: "I prefer automatic", description: "DCT, Y-AMT or CVT — no shifting.", icon: AutoEmblem },
      { id: "either", title: "Either is fine", description: "The right bike matters more.", icon: EitherEmblem },
      { id: "unknown", title: "I don't know yet", description: "Show me what fits and I'll decide.", icon: UndecidedEmblem },
    ],
  },
  {
    key: "performance",
    category: "Performance",
    title: "How much performance\nare you looking for?",
    description: "We score power as closeness to what you ask for — more is not automatically better.",
    note: {
      title: "More isn't always better",
      body: "A 200 hp superbike is a poor match for a relaxed brief. Honest answers get better matches.",
    },
    options: [
      { id: "easy", title: "Easy & manageable", description: "Predictable and forgiving.", icon: <GaugeEmblem level={0} /> },
      { id: "balanced", title: "Balanced", description: "Enough for everything, never scary.", icon: <GaugeEmblem level={1} /> },
      { id: "strong", title: "Strong performance", description: "Properly quick when you want it.", icon: <GaugeEmblem level={2} /> },
      { id: "maximum", title: "Maximum performance", description: "Performance is the priority.", icon: <GaugeEmblem level={3} /> },
    ],
  },
  {
    key: "sizeFit",
    category: "Size & fit",
    title: "What kind of physical fit\nare you looking for?",
    description: "Seat height and weight decide how a bike feels at walking pace — where confidence is really made.",
    note: {
      title: "Fit builds confidence",
      body: "Flat feet at a stop light matter more than any spec-sheet bragging right.",
    },
    options: [
      { id: "low-seat", title: "Low, easy-to-reach seat", description: "Both feet flat on the ground.", icon: <SeatEmblem h={27.5} /> },
      { id: "standard", title: "Standard", description: "A typical riding position works for me.", icon: <SeatEmblem h={21.5} /> },
      { id: "tall", title: "Tall, commanding position", description: "I like sitting up high.", icon: <SeatEmblem h={15} /> },
      { id: "lightweight", title: "Lightweight & easy to handle", description: "Low weight beats everything else.", icon: LightweightEmblem },
      { id: "no-preference", title: "No strong preference", description: "I'll adapt to the right bike.", icon: AnyFitEmblem },
    ],
  },
  {
    key: "budget",
    category: "Budget",
    title: "What is your\napproximate budget?",
    description: "Indicative European on-the-road prices, before gear and insurance.",
    note: {
      title: "Honest pricing",
      body: "We use indicative European list prices and flag every approximation — always confirm with a dealer.",
    },
    options: [
      { id: "under-5000", title: "Under €5,000", description: "Value first.", icon: <BudgetEmblem level={1} /> },
      { id: "5000-8000", title: "€5,000 – €8,000", description: "The sweet spot for first bikes.", icon: <BudgetEmblem level={2} /> },
      { id: "8000-12000", title: "€8,000 – €12,000", description: "Serious mid-range choice.", icon: <BudgetEmblem level={3} /> },
      { id: "12000-18000", title: "€12,000 – €18,000", description: "Premium territory.", icon: <BudgetEmblem level={4} /> },
      { id: "18000-plus", title: "€18,000+", description: "The budget isn't the constraint.", icon: <BudgetEmblem level={5} /> },
    ],
  },
  {
    key: "practicality",
    category: "Practicality",
    title: "How important\nis practicality?",
    description: "Storage, range, weather protection and everyday usability.",
    note: {
      title: "Daily life counts",
      body: "If the bike is part of your routine, practicality quietly decides how much you'll actually ride.",
    },
    options: [
      { id: "extremely", title: "Extremely important", description: "It has to earn its keep every day.", icon: <CargoEmblem level={3} /> },
      { id: "quite", title: "Quite important", description: "Practical matters, within reason.", icon: <CargoEmblem level={2} /> },
      { id: "somewhat", title: "Somewhat important", description: "Nice to have, not decisive.", icon: <CargoEmblem level={1} /> },
      { id: "not", title: "Not important", description: "I just want to ride.", icon: <CargoEmblem level={0} /> },
    ],
  },
  {
    key: "passenger",
    category: "Passenger",
    title: "Will you regularly ride\nwith a passenger?",
    description: "Two-up riding needs a real pillion seat, sensible ergonomics and power in reserve.",
    note: {
      title: "Two-up changes things",
      body: "A great solo bike can be a miserable passenger bike. We score pillion comfort explicitly.",
    },
    options: [
      { id: "frequently", title: "Yes, frequently", description: "A passenger is part of the plan.", icon: <PillionEmblem mode="solid" stage={4} /> },
      { id: "sometimes", title: "Sometimes", description: "Now and then, not every ride.", icon: <PillionEmblem mode="open" stage={3} /> },
      { id: "rarely", title: "Rarely", description: "Almost always riding solo.", icon: <PillionEmblem mode="dashed" stage={2} /> },
      { id: "never", title: "Almost never", description: "This bike is just for me.", icon: <PillionEmblem mode="none" stage={1} /> },
    ],
  },
  {
    key: "condition",
    category: "New or used",
    title: "What are you\nlooking for?",
    description: "MotoMatch currently lists new-bike prices; used listings are on the roadmap.",
    note: {
      title: "Almost there",
      body: "Your matches are one question away. We'll score every motorcycle in the database against your answers.",
    },
    options: [
      { id: "new-only", title: "New only", description: "Zero kilometres, full warranty.", icon: <ConditionEmblem frac={1} /> },
      { id: "mostly-new", title: "Mostly new", description: "New preferred, open to exceptions.", icon: <ConditionEmblem frac={0.75} /> },
      { id: "new-or-used", title: "New or used", description: "Whatever the right bike is.", icon: <ConditionEmblem frac={0.5} /> },
      { id: "used-preferred", title: "Used is preferred", description: "Let someone else pay depreciation.", icon: <ConditionEmblem frac={0.25} /> },
    ],
  },
];
