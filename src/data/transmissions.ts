import type { TransmissionType } from "./types";

export interface TransmissionInfo {
  type: TransmissionType;
  label: string;
  /** Short badge text used on cards and in tables. */
  short: string;
  /** The three-way verdict that drives the colour coding across the whole site. */
  verdict: "automatic" | "semi" | "manual";
  verdictLabel: string;
  /** One line, plain language: what the rider actually does. */
  riderDoes: string;
  /** Longer explanation for the detail page. */
  explanation: string;
  /** Which manufacturers use it. */
  usedBy: string;
}

export const TRANSMISSIONS: Record<TransmissionType, TransmissionInfo> = {
  dct: {
    type: "dct",
    label: "Honda DCT",
    short: "DCT",
    verdict: "automatic",
    verdictLabel: "Fully automatic",
    riderDoes: "Twist the throttle and brake. Nothing else.",
    explanation:
      "Two clutches share the gearbox: one holds the odd gears, one the even. While you ride in third, the box has already pre-selected fourth, so the change happens by swapping which clutch is engaged. There is no clutch lever and no gear lever. You can leave it in Drive and never think about it, or press the handlebar triggers to pick gears yourself. Honda has been building DCT since 2010, so it is the most proven system here.",
    usedBy: "Honda — NC750X, Rebel 1100, Forza 750, X-ADV, Africa Twin, Gold Wing",
  },
  "y-amt": {
    type: "y-amt",
    label: "Yamaha Y-AMT",
    short: "Y-AMT",
    verdict: "automatic",
    verdictLabel: "Fully automatic",
    riderDoes: "Twist the throttle and brake. Nothing else.",
    explanation:
      "A conventional gearbox with two electric actuators doing the work — one operates the clutch, one moves the shift drum. There is no clutch lever and no foot lever. In AT mode the bike chooses gears for you; in MT mode you use a finger trigger and thumb button on the left switchgear. Lighter and cheaper to build than DCT, with slightly more noticeable shifts.",
    usedBy: "Yamaha — MT-07, MT-09, Tracer 7, Tracer 9",
  },
  cvt: {
    type: "cvt",
    label: "CVT (scooter automatic)",
    short: "CVT",
    verdict: "automatic",
    verdictLabel: "Fully automatic",
    riderDoes: "Twist the throttle and brake. Nothing else.",
    explanation:
      "A belt runs between two variable-width pulleys, so the ratio changes smoothly and continuously with no steps at all. There are no gears to speak of. This is what every twist-and-go scooter uses, and it is the simplest thing to ride that exists on two wheels — but it only comes in scooters, which changes the riding position, wheel size and feel considerably.",
    usedBy: "Honda Forza and ADV, Yamaha XMAX, BMW C 400, Suzuki Burgman",
  },
  "e-clutch": {
    type: "e-clutch",
    label: "Honda E-Clutch",
    short: "E-Clutch",
    verdict: "semi",
    verdictLabel: "Clutchless, but you still shift",
    riderDoes: "You still tap the gear lever with your left foot for every gear change.",
    explanation:
      "Motors on the side of the engine operate the clutch for you, so you can pull away, stop and change gear without touching the lever. The gearbox itself is entirely conventional and the foot shifter stays exactly where it was — you choose every gear. The clutch lever is still fitted and works normally if you want it. This is not an automatic, and this site does not count it as one. It is worth knowing about for a different reason: because it keeps a manual gearbox and a clutch lever, taking your licence test on one does not restrict you to automatics.",
    usedBy: "Honda — CB500 Hornet, CBR500R, NX500, CMX500 Rebel, CB650R, CB750 Hornet, Transalp",
  },
  manual: {
    type: "manual",
    label: "Conventional manual",
    short: "Manual",
    verdict: "manual",
    verdictLabel: "Manual — clutch and gears",
    riderDoes: "Left hand works the clutch, left foot selects all six gears.",
    explanation:
      "The standard motorcycle arrangement: a clutch lever on the left bar and a six-speed box operated by your left foot. Coordinating the two is the single biggest thing a new rider has to learn, and it is what makes stalling, hill starts and stop-start traffic difficult in the first months.",
    usedBy: "CFMOTO 450CL-C, CFMOTO 450SR, and most motorcycles on sale",
  },
};

export const VERDICT_ORDER = ["automatic", "semi", "manual"] as const;
