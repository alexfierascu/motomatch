import { useState } from "react";
import { Link } from "react-router-dom";
import { bikeName } from "../data/motorcycles";
import { recommend, type Answers } from "../lib/scoring";
import { BikePhoto } from "../components/Photo";
import { A2Badge, ShiftRail, TransmissionBadge, VehicleTypeBadge } from "../components/Transmission";
import { Price } from "../components/BikeCard";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

interface Question {
  key: keyof Answers;
  title: string;
  hint?: string;
  options: { value: string | number; label: string; sub?: string }[];
}

const QUESTIONS: Question[] = [
  {
    key: "experience",
    title: "What's your experience?",
    options: [
      { value: "beginner", label: "Complete beginner", sub: "first motorcycle" },
      { value: "some", label: "Some experience", sub: "ridden before, not recently" },
      { value: "experienced", label: "Experienced", sub: "years in the saddle" },
    ],
  },
  {
    key: "wantsToShift",
    title: "Do you want to change gears yourself?",
    hint: "Answering “no” prioritises DCT, Y-AMT and CVT — and rules out E-Clutch, which still needs foot shifts.",
    options: [
      { value: "no", label: "No", sub: "nothing to shift" },
      { value: "dontcare", label: "I don't mind" },
      { value: "yes", label: "Yes", sub: "I want a manual" },
    ],
  },
  {
    key: "bodyStyle",
    title: "What type do you prefer?",
    options: [
      { value: "cruiser", label: "Cruiser" },
      { value: "sport", label: "Sport" },
      { value: "naked", label: "Naked" },
      { value: "adventure", label: "Adventure" },
      { value: "touring", label: "Touring" },
      { value: "scooter", label: "Scooter" },
      { value: "unsure", label: "Don't know yet" },
    ],
  },
  {
    key: "budget",
    title: "Maximum budget?",
    hint: "On-the-road, before gear and insurance.",
    options: [
      { value: 6000, label: "€6,000" },
      { value: 8000, label: "€8,000" },
      { value: 10000, label: "€10,000" },
      { value: 12000, label: "€12,000" },
      { value: 15000, label: "€15,000+" },
    ],
  },
  {
    key: "performance",
    title: "How important is performance?",
    options: [
      { value: "relaxed", label: "Relaxed", sub: "around 30 hp" },
      { value: "balanced", label: "Balanced", sub: "around 47 hp, A2 level" },
      { value: "sporty", label: "Sporty", sub: "70 hp and up" },
    ],
  },
  {
    key: "seatHeight",
    title: "How important is a low seat?",
    options: [
      { value: "very", label: "Very important", sub: "I want both feet flat" },
      { value: "somewhat", label: "Somewhat" },
      { value: "not", label: "Not important" },
    ],
  },
  {
    key: "use",
    title: "What will you mainly use it for?",
    options: [
      { value: "city", label: "City" },
      { value: "commute", label: "Commuting" },
      { value: "weekend", label: "Weekend rides" },
      { value: "touring", label: "Long trips" },
      { value: "mixed", label: "Mixed" },
    ],
  },
];

export default function Recommend() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [done, setDone] = useState(false);

  const q = QUESTIONS[step];

  const choose = (value: string | number) => {
    const next = { ...answers, [q.key]: value } as Partial<Answers>;
    setAnswers(next);
    if (step === QUESTIONS.length - 1) setDone(true);
    else setStep(step + 1);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
  };

  if (done) {
    const results = recommend(answers as Answers, 5);
    const top = results[0];

    return (
      <div className={`pt-10 ${GUTTER}`}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <span className="kicker">Your result</span>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4rem)] uppercase leading-none">
              Your best matches
            </h1>
          </div>
          <button onClick={restart} className="btn btn-ghost px-3 py-2 text-xs">
            Start over
          </button>
        </div>

        {/* Winner */}
        <div className="overflow-hidden border border-line" style={{ borderColor: "rgba(255,77,18,0.4)" }}>
          <div className="grid md:grid-cols-[1.2fr_1fr]">
            <div className="relative">
              <BikePhoto bike={top.bike} kind="hero" ratio="16/10" scrim="b" priority />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6">
                <div className="eyebrow">Your best match · {top.bike.manufacturer}</div>
                <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.95]">
                  {top.bike.model}
                  {top.bike.variant && <span className="text-accent"> {top.bike.variant}</span>}
                </h2>
              </div>
            </div>

            <div className="flex flex-col bg-panel p-6 md:p-8">
              <div className="flex items-baseline justify-between border-b border-line pb-4">
                <span className="eyebrow">Match score</span>
                <span className="bignum text-4xl text-accent">{top.score.toFixed(1)}<span className="text-lg text-dim">/10</span></span>
              </div>

              <div className="mt-4">
                <ShiftRail bike={top.bike} size="lg" />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <TransmissionBadge bike={top.bike} />
                  <VehicleTypeBadge bike={top.bike} />
                  <A2Badge bike={top.bike} />
                </div>
              </div>

              <div className="data mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span>{top.bike.engine.horsepower} hp</span>
                <span>{top.bike.dimensions.weight} kg</span>
                <span>{top.bike.dimensions.seatHeight} mm seat</span>
                <span className="font-semibold text-accent">
                  <Price p={top.bike.price} />
                </span>
              </div>

              <div className="mt-6">
                <div className="eyebrow mb-2">Why it matches you</div>
                <ul className="space-y-1.5">
                  {top.reasons.map((r) => (
                    <li key={r} className="flex gap-2 text-sm leading-relaxed">
                      <span style={{ color: "var(--color-auto)" }} aria-hidden>
                        ✓
                      </span>
                      <span className="text-muted">{r}</span>
                    </li>
                  ))}
                </ul>
                {top.warnings.length > 0 && (
                  <>
                    <div className="eyebrow mb-2 mt-4">Worth knowing</div>
                    <ul className="space-y-1.5">
                      {top.warnings.map((w) => (
                        <li key={w} className="flex gap-2 text-sm leading-relaxed">
                          <span style={{ color: "var(--color-semi)" }} aria-hidden>
                            !
                          </span>
                          <span className="text-muted">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <Link to={`/bikes/${top.bike.id}`} className="btn btn-primary mt-auto self-start pt-3">
                See full details
              </Link>
            </div>
          </div>
        </div>

        {/* Alternatives */}
        <h2 className="mb-5 mt-14 font-display text-2xl uppercase">Alternatives</h2>
        <div className="grid gap-px overflow-hidden border border-line bg-line">
          {results.slice(1).map((r, i) => (
            <Link
              key={r.bike.id}
              to={`/bikes/${r.bike.id}`}
              className="flex items-center gap-5 bg-panel p-4 transition-colors hover:bg-raised"
            >
              <span className="bignum w-8 shrink-0 text-2xl text-dim">{i + 2}</span>
              <div className="hidden w-32 shrink-0 sm:block">
                <BikePhoto bike={r.bike} kind="card" ratio="16/10" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg uppercase">{bikeName(r.bike)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <TransmissionBadge bike={r.bike} compact />
                  <span className="data text-[11px] text-muted">
                    {r.bike.engine.horsepower} hp · {r.bike.dimensions.weight} kg
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] text-dim">{r.reasons[0]}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="bignum text-2xl text-accent">{r.score.toFixed(1)}</div>
                <div className="data text-xs text-muted">
                  <Price p={r.bike.price} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-dim">
          Scores blend transmission fit, budget, beginner suitability, how close the power is to
          what you asked for, body style, seat height, intended use and licence category. A bigger
          engine does not win on its own.
        </p>
      </div>
    );
  }

  return (
    <div className={`pt-10 ${GUTTER}`}>
      <span className="kicker">Recommendation engine</span>
      <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4rem)] uppercase leading-none">
        Find my motorcycle
      </h1>
      <p className="mt-2 text-sm text-muted">Seven questions. No email, nothing saved.</p>

      {/* Progress */}
      <div className="mt-8 flex gap-1">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 transition-colors"
            style={{ background: i <= step ? "var(--color-accent)" : "var(--color-raised)" }}
          />
        ))}
      </div>

      <div className="mt-8 max-w-4xl">
        <div className="data text-[11px] uppercase tracking-[0.22em] text-dim">
          Question {step + 1} of {QUESTIONS.length}
        </div>
        <h2 className="mt-3 font-display text-[clamp(1.8rem,4.5vw,3rem)] uppercase leading-tight">
          {q.title}
        </h2>
        {q.hint && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{q.hint}</p>}

        <div className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {q.options.map((o, i) => (
            <button
              key={String(o.value)}
              onClick={() => choose(o.value)}
              className="group bg-panel p-5 text-left transition-colors hover:bg-raised"
            >
              <div className="font-semibold group-hover:text-accent">{o.label}</div>
              {o.sub && <div className="mt-1 text-xs text-muted">{o.sub}</div>}
              <span className="data mt-3 block text-[10px] text-dim" aria-hidden>
                {String.fromCharCode(65 + i)}
              </span>
            </button>
          ))}
        </div>

        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="data mt-6 text-[11px] uppercase tracking-[0.18em] text-muted hover:text-accent"
          >
            ← Previous question
          </button>
        )}
      </div>
    </div>
  );
}
