import { Link } from "react-router-dom";
import { MOTORCYCLES } from "../data/motorcycles";
import { usePageMeta } from "../lib/seo";

const GUTTER = "mx-auto max-w-[1400px] px-4 md:px-8";

export default function About() {
  usePageMeta({
    title: "About — MotoMatch",
    description:
      "How MotoMatch works: a weighted recommendation engine, manufacturer-verified specifications, real press photography and honest transmission classification.",
  });

  const manufacturers = new Set(MOTORCYCLES.map((b) => b.manufacturer)).size;

  return (
    <div className={`pt-10 ${GUTTER}`}>
      <span className="kicker">About</span>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.4rem,6vw,4rem)] uppercase leading-[0.95]">
        A motorcycle site that asks <span className="text-accent">about you</span> first
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-8 text-[15px] leading-relaxed text-muted">
          <p>
            Most motorcycle sites start with the machines: spec tables, engine sizes, horsepower
            charts. MotoMatch starts with the rider. Answer a short quiz about how you ride, how
            much experience you have and what you want to spend, and every one of the{" "}
            {MOTORCYCLES.length} motorcycles in the database is scored against your answers.
          </p>

          <div>
            <h2 className="font-display text-2xl uppercase text-fg">How the matching works</h2>
            <p className="mt-3">
              Nothing is filtered away — every bike gets a compatibility score built from eight
              weighted dimensions: riding style, transmission, budget, experience, performance,
              size and fit, practicality and passenger use. Power is scored as closeness to what
              you asked for, never as more-is-better, and the per-dimension breakdown is shown with
              every result so you can see exactly why a bike matched.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl uppercase text-fg">Honest about transmissions</h2>
            <p className="mt-3">
              “Automatic” is not one thing. Honda's DCT, Yamaha's Y-AMT and every CVT scooter are
              genuinely automatic — you never select a gear. Honda's E-Clutch removes the clutch
              lever but your left foot still shifts, so MotoMatch never classifies it as automatic.
              If you answer “absolutely no gear shifting”, E-Clutch bikes are scored accordingly.
            </p>
            <p className="mt-3">
              One licensing detail worth knowing: under EU rules, taking your A2 or A test on a
              vehicle with no clutch lever restricts your licence to automatics (code 78). That
              covers DCT, Y-AMT and CVT. E-Clutch bikes keep a working clutch lever, so they don't
              trigger the restriction. Confirm the current rule with your riding school before
              booking a test.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl uppercase text-fg">Honest about data</h2>
            <p className="mt-3">
              Specifications are manufacturer figures, checked against official product pages and
              press material. Prices are indicative European on-the-road figures and carry a “~”
              until confirmed against an importer pricelist — always check with a dealer. Beginner,
              practicality and passenger ratings are editorial judgement, stated as such. Every
              photograph shows the actual model, sourced from manufacturer press material and
              credited on the bike's page.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {(
                [
                  [String(MOTORCYCLES.length), "Motorcycles"],
                  [String(manufacturers), "Manufacturers"],
                  ["8", "Score dimensions"],
                ] as const
              ).map(([v, l]) => (
                <div key={l}>
                  <div className="bignum text-4xl">{v}</div>
                  <div className="eyebrow mt-1.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <div className="eyebrow mb-3">No account, no tracking</div>
            <p className="text-sm leading-relaxed text-muted">
              The quiz runs entirely in your browser. Your answers are kept in local storage so a
              refresh doesn't lose them — nothing is sent anywhere.
            </p>
          </div>

          <div className="panel p-6">
            <div className="eyebrow mb-3">Start here</div>
            <Link to="/find-my-bike" className="btn btn-primary w-full">
              Find my motorcycle
            </Link>
            <Link to="/explore" className="btn btn-ghost mt-2 w-full">
              Explore the database
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
