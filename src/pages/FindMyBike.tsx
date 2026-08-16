import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data/questionnaire";
import {
  loadQuestionnaire,
  saveQuestionnaire,
  type QuestionnaireAnswers,
} from "../lib/questionnaire";
import { getBike, MOTORCYCLES } from "../data/motorcycles";
import { useParallax } from "../lib/motion";
import { usePageMeta } from "../lib/seo";

const GUTTER = "mx-auto w-full max-w-[1400px] px-4 md:px-8";
const TOTAL = QUESTIONS.length;

/** Cinematic rider imagery for the questionnaire panel. */
const PANEL_BIKE_ID = "yamaha-tenere-700";

export default function FindMyBike() {
  usePageMeta({
    title: "Find my motorcycle — MotoMatch",
    description:
      "Answer ten short questions about how you ride, what you like and what you want to spend. MotoMatch scores every motorcycle in its database against your answers.",
  });

  const navigate = useNavigate();
  const stored = useRef(loadQuestionnaire());
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(stored.current?.answers ?? {});
  const [step, setStep] = useState(() =>
    Math.min(stored.current?.step ?? 0, TOTAL - 1),
  );
  const [error, setError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const imgRef = useParallax<HTMLDivElement>(0.05, 26);

  const q = QUESTIONS[step];
  const selected = answers[q.key];
  const panelBike = getBike(PANEL_BIKE_ID) ?? MOTORCYCLES[0];

  /** Index of the first unanswered question — the furthest the user may jump. */
  const furthest = QUESTIONS.findIndex((question) => !answers[question.key]);
  const maxJump = furthest === -1 ? TOTAL - 1 : furthest;

  const persist = (next: QuestionnaireAnswers, nextStep: number, completed = false) =>
    saveQuestionnaire({ answers: next, step: nextStep, completed });

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const choose = (optionId: string) => {
    const next = { ...answers, [q.key]: optionId };
    setAnswers(next);
    setError(false);
    persist(next, step);
  };

  const goTo = (nextStep: number) => {
    setStep(nextStep);
    setError(false);
    persist(answers, nextStep);
  };

  const onContinue = () => {
    if (!selected) {
      setError(true);
      return;
    }
    if (step === TOTAL - 1) {
      persist(answers, step, true);
      navigate("/results");
      return;
    }
    goTo(step + 1);
  };

  const onBack = () => {
    if (step === 0) navigate("/");
    else goTo(step - 1);
  };

  const onSaveExit = () => {
    persist(answers, step);
    navigate("/");
  };

  return (
    <div className={`pb-4 pt-6 ${GUTTER}`}>
      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel">
        {/* Cinematic image — right of the heading on desktop, banner on mobile. */}
        <div
          className="pointer-events-none absolute right-0 top-0 hidden h-[440px] w-[54%] overflow-hidden lg:block"
          aria-hidden
        >
          <div ref={imgRef} className="absolute inset-[-4%] will-change-transform">
            <img
              src={panelBike.images.hero}
              alt=""
              className="h-full w-full object-cover object-[60%_30%]"
              decoding="async"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--color-panel) 0%, rgba(17,17,20,0.55) 22%, rgba(17,17,20,0) 55%), linear-gradient(180deg, rgba(17,17,20,0.25) 0%, rgba(17,17,20,0) 35%, var(--color-panel) 96%)",
            }}
          />
        </div>
        <div className="relative h-40 w-full lg:hidden" aria-hidden>
          <img
            src={panelBike.images.hero}
            alt=""
            className="h-full w-full object-cover object-[60%_30%]"
            decoding="async"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(17,17,20,0.3) 0%, var(--color-panel) 96%)",
            }}
          />
        </div>

        <div className="relative p-5 md:p-8 lg:p-10">
          {/* Back */}
          <button
            onClick={onBack}
            className="data text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
          >
            ← Back
          </button>

          {/* Progress */}
          <div className="mt-6">
            <span className="data text-[11px] uppercase tracking-[0.22em] text-accent">
              Question {step + 1} of {TOTAL}
            </span>
            <div
              className="mt-3 h-[3px] w-full max-w-xs bg-raised"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TOTAL}
              aria-valuenow={step + 1}
              aria-label={`Question ${step + 1} of ${TOTAL}`}
            >
              <div
                className="h-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              />
            </div>
          </div>

          {/* Question — keyed so transitions replay per step */}
          <div key={step} className="carousel-in">
            <div className="mt-8 lg:max-w-[46%]">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="font-display whitespace-pre-line text-[clamp(2rem,4.6vw,3.6rem)] uppercase leading-[1.02] outline-none"
              >
                {q.title}
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">{q.description}</p>
            </div>

            {/* Answer cards */}
            <div
              role="radiogroup"
              aria-label={q.title.replace(/\n/g, " ")}
              className={`mt-10 grid gap-3 sm:grid-cols-2 ${
                q.options.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
              }`}
            >
              {q.options.map((o) => {
                const on = selected === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => choose(o.id)}
                    className="group relative rounded-2xl border p-5 text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    style={
                      on
                        ? {
                            borderColor: "var(--color-accent)",
                            background:
                              "linear-gradient(180deg, rgba(217,194,154,0.12) 0%, rgba(217,194,154,0.05) 100%)",
                          }
                        : { borderColor: "var(--color-line)", background: "var(--color-raised)" }
                    }
                  >
                    {on && (
                      <span
                        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent"
                        aria-hidden
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 6.5L5 9l4.5-5.5" />
                        </svg>
                      </span>
                    )}
                    <span
                      className={`mx-auto flex justify-center transition-colors ${
                        on ? "text-accent" : "text-dim group-hover:text-muted"
                      }`}
                      aria-hidden
                    >
                      {o.icon}
                    </span>
                    <span
                      className={`data mt-4 block text-[11px] uppercase tracking-[0.14em] ${
                        on ? "text-fg" : "text-fg/90"
                      }`}
                    >
                      {o.title}
                    </span>
                    <span className="mt-2 block text-[12px] leading-relaxed text-muted">
                      {o.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Contextual note */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-line bg-ink/50 px-5 py-4 md:px-6">
              <div className="flex items-start gap-4 pr-20">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 text-accent"
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
                    <path d="M9 12l2 2 4-4.5" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-fg">{q.note.title}</span>
                  <span className="mt-1 block max-w-xl text-[13px] leading-relaxed text-muted">
                    {q.note.body}
                  </span>
                </span>
              </div>
              <span
                className="ghost-index pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 text-[5rem] leading-none md:text-[5.5rem]"
                aria-hidden
              >
                {String(step + 1).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={onSaveExit} className="btn btn-ghost gap-2 text-xs">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 4h11l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
                <path d="M8 4v5h7V4M8 20v-6h8v6" />
              </svg>
              Save & exit
            </button>
            <span
              className="min-h-[1.25rem] flex-1 text-center text-[13px] text-manual"
              role="status"
              aria-live="polite"
            >
              {error ? "Choose an option to continue." : ""}
            </span>
            <button onClick={onContinue} className="btn btn-primary px-8 text-xs">
              {step === TOTAL - 1 ? "See my results" : "Continue"} <span aria-hidden>→</span>
            </button>
          </div>

          {/* Step navigation */}
          <nav aria-label="Questionnaire steps" className="mt-8 border-t border-line pt-6">
            <ol className="flex items-start gap-0 overflow-x-auto pb-1">
              {QUESTIONS.map((question, i) => {
                const isActive = i === step;
                const isDone = Boolean(answers[question.key]) && !isActive;
                const reachable = i <= maxJump;
                return (
                  <li key={question.key} className="flex min-w-[92px] flex-1 items-start">
                    {i > 0 && <span className="mt-[15px] h-px w-full min-w-2 flex-1 bg-line" aria-hidden />}
                    <button
                      onClick={() => reachable && goTo(i)}
                      disabled={!reachable}
                      aria-label={`Question ${i + 1}: ${question.category}`}
                      aria-current={isActive ? "step" : undefined}
                      className="group flex shrink-0 flex-col items-center gap-2 px-2 disabled:cursor-default"
                    >
                      <span
                        className="data flex h-[30px] w-[30px] items-center justify-center rounded-full border text-[11px] transition-colors"
                        style={
                          isActive
                            ? { background: "var(--color-accent)", borderColor: "var(--color-accent)", color: "var(--color-on-accent)" }
                            : isDone
                              ? { borderColor: "rgba(217,194,154,0.55)", color: "var(--color-accent)" }
                              : { borderColor: "var(--color-line)", color: "var(--color-dim)" }
                        }
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      <span
                        className={`data whitespace-nowrap text-[9px] uppercase tracking-[0.12em] ${
                          isActive ? "text-accent" : isDone ? "text-muted" : "text-dim"
                        }`}
                      >
                        {question.category}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
}
