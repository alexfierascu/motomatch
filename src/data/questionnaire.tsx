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

/* ─────────────────────────────── icons ────────────────────────────────────
 * One consistent thin-stroke set. Parametric helpers keep 40+ options from
 * needing 40+ bespoke drawings. */

const P = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  /* One optical size for the whole family; responsive via CSS. */
  className: "h-10 w-10 lg:h-11 lg:w-11",
} as const;

const HelmetIcon = (
  <svg {...P} aria-hidden>
    {/* full-face shell, 3/4 stance */}
    <path d="M4.6 12.1C4.6 7.3 7.9 4 12 4s7.4 3.3 7.4 8.1v3.4a3.3 3.3 0 0 1-3.3 3.3H7.9a3.3 3.3 0 0 1-3.3-3.3z" />
    {/* visor aperture */}
    <path d="M7 11.2h9.2a1.5 1.5 0 0 1 1.5 1.5v.1a1.5 1.5 0 0 1-1.5 1.5H9.8a2.8 2.8 0 0 1-2.8-2.8z" />
    {/* chin vent */}
    <path d="M13.6 17h3" />
  </svg>
);

const GlovesIcon = (
  <svg {...P} aria-hidden>
    {/* fingers */}
    <path d="M8.3 11.5V6.6a1.15 1.15 0 0 1 2.3 0V11" />
    <path d="M10.6 11V5.4a1.15 1.15 0 0 1 2.3 0V11" />
    <path d="M12.9 11V6a1.15 1.15 0 0 1 2.3 0v5.6" />
    {/* thumb + palm to gauntlet cuff */}
    <path d="M15.2 11.9l1.1-1.5a1.3 1.3 0 0 1 2.1 1.5l-2.1 4.4a4.9 4.9 0 0 1-4.4 2.8h-1.5A4.4 4.4 0 0 1 6 14.7V9.2a1.15 1.15 0 0 1 2.3 0" />
    {/* knuckle armour */}
    <path d="M8.7 13.5c1.8-.7 3.7-.7 5.4 0" />
  </svg>
);

const JacketIcon = (
  <svg {...P} aria-hidden>
    {/* torso + sleeves */}
    <path d="M9.3 4.4L5.9 6.6 4.6 11l2.2.8V19h10.4v-7.2l2.2-.8-1.3-4.4-3.4-2.2" />
    {/* collar */}
    <path d="M9.3 4.4L12 6.4l2.7-2" />
    {/* main zip */}
    <path d="M12 6.4V19" />
    {/* chest panel seams */}
    <path d="M7.6 13.4h2.6M13.8 13.4h2.6" />
  </svg>
);

const RoadIcon = (
  <svg {...P} aria-hidden>
    {/* road edges converging to the horizon */}
    <path d="M5.2 20c3.4-4.8 4-10.5 4.6-15.5" />
    <path d="M18.8 20c-3.4-4.8-4-10.5-4.6-15.5" />
    {/* centreline, foreshortened */}
    <path d="M12 19.6v-2.4M12 14.2v-1.9M12 9.4V7.9M12 5.4v-1" />
  </svg>
);

const CityIcon = (
  <svg {...P} aria-hidden>
    <path d="M4 20V8h6v12M10 20V4h6v16M16 20v-9h4v9M3 20h18" />
    <path d="M6.5 11h1M6.5 14h1M12.5 8h1M12.5 12h1" />
  </svg>
);

const SunRoadIcon = (
  <svg {...P} aria-hidden>
    <circle cx="17" cy="7" r="2.6" />
    <path d="M4 20c5-3.5 6-8 5-14M12 20c2.5-2.5 3.5-5.5 3.5-8.5" />
  </svg>
);

const HorizonIcon = (
  <svg {...P} aria-hidden>
    <path d="M3 16h18M6 16c2-5.5 10-5.5 12 0" />
    <path d="M12 5v2M12 11v1.5" />
  </svg>
);

const MountainsIcon = (
  <svg {...P} aria-hidden>
    <path d="M3 18L9 7l4 7 3-4 5 8z" />
  </svg>
);

const SpeedLinesIcon = (
  <svg {...P} aria-hidden>
    <path d="M13 5l6 7-6 7M4 9h6M2.5 12.5H10M4 16h6" />
  </svg>
);

const LeafIcon = (
  <svg {...P} aria-hidden>
    <path d="M6 18C6 10 11 5 19 5c0 8-5 13-13 13z" />
    <path d="M6 18c3-4 6-7 9-9" />
  </svg>
);

const SparkIcon = (
  <svg {...P} aria-hidden>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  </svg>
);

const BoltIcon = (
  <svg {...P} aria-hidden>
    <path d="M13 3L6 13h5l-1 8 7-10h-5z" />
  </svg>
);

const ArmchairIcon = (
  <svg {...P} aria-hidden>
    <path d="M6 12V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v5" />
    <path d="M5 12a2 2 0 0 1 2 2v2h10v-2a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" />
  </svg>
);

const CompassIcon = (
  <svg {...P} aria-hidden>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>
);

const LeverIcon = (
  <svg {...P} aria-hidden>
    <path d="M4 15h9M13 15a4 4 0 0 0 4-4V6" />
    <circle cx="17" cy="4.5" r="1.5" />
    <path d="M4 13v4" />
  </svg>
);

const AutoIcon = (
  <svg {...P} aria-hidden>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.2 15.5L12 8l2.8 7.5M10.2 13h3.6" />
  </svg>
);

const EitherIcon = (
  <svg {...P} aria-hidden>
    <path d="M7 8h10M14 5l3 3-3 3M17 16H7M10 13l-3 3 3 3" />
  </svg>
);

const QuestionIcon = (
  <svg {...P} aria-hidden>
    <path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.2-1.6 2.5" />
    <path d="M12 17.5v.2" />
  </svg>
);

/** Speedometer with a needle position: 0 (low) … 3 (max). */
function GaugeIcon({ level }: { level: 0 | 1 | 2 | 3 }) {
  const angles = [150, 105, 70, 30];
  const a = (angles[level] * Math.PI) / 180;
  const x = 12 + 6.4 * Math.cos(a);
  const y = 15 - 6.4 * Math.sin(a);
  return (
    <svg {...P} aria-hidden>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d={`M12 15L${x.toFixed(1)} ${y.toFixed(1)}`} />
      <path d="M4.5 18h15" />
    </svg>
  );
}

const SeatLowIcon = (
  <svg {...P} aria-hidden>
    <path d="M4 12c4 2 10 2 16-1M7 12.8V16M12 5.5v3M10.5 7l1.5 1.5L13.5 7" />
  </svg>
);

const SeatStdIcon = (
  <svg {...P} aria-hidden>
    <path d="M4 11c4 2 10 2 16-1M7 11.8V15M12 15v3M12 15h5" />
  </svg>
);

const SeatTallIcon = (
  <svg {...P} aria-hidden>
    <path d="M4 14c4 2 10 2 16-1M7 14.8V18M12 10.5v-3M10.5 9L12 7.5 13.5 9" />
  </svg>
);

const FeatherIcon = (
  <svg {...P} aria-hidden>
    <path d="M19 5c-7 0-11 4-12 11v3" />
    <path d="M19 5c0 7-4 11-11 11" />
    <path d="M13 8.5V11M15.5 7v2.5" />
  </svg>
);

const NeutralIcon = (
  <svg {...P} aria-hidden>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12h7" />
  </svg>
);

/** Euro wallet with 1–5 level bars. */
function BudgetIcon({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <svg {...P} aria-hidden>
      <path d="M15 8.5a4.5 4.5 0 1 0 0 7M7.5 10.7h6M7.5 13.3h5" />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${5.2 + i * 3.4} 21h2.2`} opacity={i < level ? 1 : 0.25} />
      ))}
    </svg>
  );
}

/** Luggage/practicality with fill level 0–3. */
function CargoIcon({ level }: { level: 0 | 1 | 2 | 3 }) {
  return (
    <svg {...P} aria-hidden>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      {level >= 1 && <path d="M8 16.5h8" />}
      {level >= 2 && <path d="M8 14h8" />}
      {level >= 3 && <path d="M8 11.5h8" />}
    </svg>
  );
}

/** One or two rider silhouettes; `second` = outline/faded pillion. */
function RidersIcon({ pillion }: { pillion: "solid" | "faded" | "none" }) {
  return (
    <svg {...P} aria-hidden>
      <circle cx="9" cy="7.5" r="2.6" />
      <path d="M4 19c.8-3.6 2.7-5.4 5-5.4s4.2 1.8 5 5.4" />
      {pillion !== "none" && (
        <g opacity={pillion === "faded" ? 0.4 : 1}>
          <circle cx="16.5" cy="8.5" r="2.1" />
          <path d="M13.5 19c.6-2.9 1.7-4.3 3-4.3s2.4 1.4 3 4.3" />
        </g>
      )}
    </svg>
  );
}

const TagNewIcon = (
  <svg {...P} aria-hidden>
    <path d="M4 11V5h6l9 9-6 6-9-9z" />
    <circle cx="8" cy="9" r="1.2" />
    <path d="M17 3l.8 2.2L20 6l-2.2.8L17 9l-.8-2.2L14 6l2.2-.8z" strokeWidth="1.2" />
  </svg>
);

const TagIcon = (
  <svg {...P} aria-hidden>
    <path d="M4 11V5h6l9 9-6 6-9-9z" />
    <circle cx="8" cy="9" r="1.2" />
  </svg>
);

const CycleIcon = (
  <svg {...P} aria-hidden>
    <path d="M6 8a7 7 0 0 1 12 2M18 16a7 7 0 0 1-12-2" />
    <path d="M18 5v5h-5M6 19v-5h5" />
  </svg>
);

const CycleBoldIcon = (
  <svg {...P} aria-hidden strokeWidth={1.9}>
    <path d="M6 8a7 7 0 0 1 12 2M18 16a7 7 0 0 1-12-2" />
    <path d="M18 5v5h-5M6 19v-5h5" />
  </svg>
);

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
      { id: "new", title: "I'm completely new", description: "I've never ridden or I'm just starting.", icon: HelmetIcon },
      { id: "little", title: "I've ridden a little", description: "Some experience, but I'm still learning.", icon: GlovesIcon },
      { id: "comfortable", title: "I'm comfortable on a bike", description: "I've ridden regularly and feel confident.", icon: JacketIcon },
      { id: "veteran", title: "I've been riding for years", description: "I have a lot of experience and know what I'm doing.", icon: RoadIcon },
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
      { id: "city", title: "City & commuting", description: "Traffic, short trips, everyday rides.", icon: CityIcon },
      { id: "weekend", title: "Weekend rides", description: "Fun rides when time allows.", icon: SunRoadIcon },
      { id: "touring", title: "Long-distance touring", description: "Big days, long routes, real distance.", icon: HorizonIcon },
      { id: "adventure", title: "Adventure & mixed terrain", description: "Asphalt, gravel and beyond.", icon: MountainsIcon },
      { id: "sport", title: "Sport & spirited riding", description: "Twisty roads, pace and precision.", icon: SpeedLinesIcon },
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
      { id: "easy", title: "Easy & approachable", description: "Light, forgiving, confidence-building.", icon: LeafIcon },
      { id: "fun", title: "Fun & playful", description: "Agile, lively, always up for it.", icon: SparkIcon },
      { id: "fast", title: "Fast & exciting", description: "Sharp, urgent, thrilling.", icon: BoltIcon },
      { id: "comfortable", title: "Comfortable & relaxed", description: "Unhurried, easygoing, smooth.", icon: ArmchairIcon },
      { id: "capable", title: "Capable & adventurous", description: "Ready for anything, anywhere.", icon: CompassIcon },
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
      { id: "manual", title: "I want a manual", description: "Clutch, gears, full control.", icon: LeverIcon },
      { id: "automatic", title: "I prefer automatic", description: "DCT, Y-AMT or CVT — no shifting.", icon: AutoIcon },
      { id: "either", title: "Either is fine", description: "The right bike matters more.", icon: EitherIcon },
      { id: "unknown", title: "I don't know yet", description: "Show me what fits and I'll decide.", icon: QuestionIcon },
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
      { id: "easy", title: "Easy & manageable", description: "Predictable and forgiving.", icon: <GaugeIcon level={0} /> },
      { id: "balanced", title: "Balanced", description: "Enough for everything, never scary.", icon: <GaugeIcon level={1} /> },
      { id: "strong", title: "Strong performance", description: "Properly quick when you want it.", icon: <GaugeIcon level={2} /> },
      { id: "maximum", title: "Maximum performance", description: "Performance is the priority.", icon: <GaugeIcon level={3} /> },
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
      { id: "low-seat", title: "Low, easy-to-reach seat", description: "Both feet flat on the ground.", icon: SeatLowIcon },
      { id: "standard", title: "Standard", description: "A typical riding position works for me.", icon: SeatStdIcon },
      { id: "tall", title: "Tall, commanding position", description: "I like sitting up high.", icon: SeatTallIcon },
      { id: "lightweight", title: "Lightweight & easy to handle", description: "Low weight beats everything else.", icon: FeatherIcon },
      { id: "no-preference", title: "No strong preference", description: "I'll adapt to the right bike.", icon: NeutralIcon },
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
      { id: "under-5000", title: "Under €5,000", description: "Value first.", icon: <BudgetIcon level={1} /> },
      { id: "5000-8000", title: "€5,000 – €8,000", description: "The sweet spot for first bikes.", icon: <BudgetIcon level={2} /> },
      { id: "8000-12000", title: "€8,000 – €12,000", description: "Serious mid-range choice.", icon: <BudgetIcon level={3} /> },
      { id: "12000-18000", title: "€12,000 – €18,000", description: "Premium territory.", icon: <BudgetIcon level={4} /> },
      { id: "18000-plus", title: "€18,000+", description: "The budget isn't the constraint.", icon: <BudgetIcon level={5} /> },
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
      { id: "extremely", title: "Extremely important", description: "It has to earn its keep every day.", icon: <CargoIcon level={3} /> },
      { id: "quite", title: "Quite important", description: "Practical matters, within reason.", icon: <CargoIcon level={2} /> },
      { id: "somewhat", title: "Somewhat important", description: "Nice to have, not decisive.", icon: <CargoIcon level={1} /> },
      { id: "not", title: "Not important", description: "I just want to ride.", icon: <CargoIcon level={0} /> },
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
      { id: "frequently", title: "Yes, frequently", description: "A passenger is part of the plan.", icon: <RidersIcon pillion="solid" /> },
      { id: "sometimes", title: "Sometimes", description: "Now and then, not every ride.", icon: <RidersIcon pillion="faded" /> },
      { id: "rarely", title: "Rarely", description: "Almost always riding solo.", icon: <RidersIcon pillion="none" /> },
      { id: "never", title: "Almost never", description: "This bike is just for me.", icon: <RidersIcon pillion="none" /> },
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
      { id: "new-only", title: "New only", description: "Zero kilometres, full warranty.", icon: TagNewIcon },
      { id: "mostly-new", title: "Mostly new", description: "New preferred, open to exceptions.", icon: TagIcon },
      { id: "new-or-used", title: "New or used", description: "Whatever the right bike is.", icon: CycleIcon },
      { id: "used-preferred", title: "Used is preferred", description: "Let someone else pay depreciation.", icon: CycleBoldIcon },
    ],
  },
];
