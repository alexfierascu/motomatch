/**
 * The §45 UX test: four very different riders must get clearly different
 * recommendations. Each persona drives the real quiz UI end-to-end against
 * the production bundle.
 */
import { boot, byText, byLabel } from "./interactions.test.mjs";

async function runPersona(name, plan, expectRe, forbidRe) {
  const { doc, tick, click } = await boot("/find-my-bike");
  for (const step of plan) {
    if (step.multi) {
      for (const label of step.multi) click(byLabel(doc, label));
      await tick();
      click(byText(doc, "button", "Continue"));
    } else if (step.skip) {
      click(byText(doc, "button", "Skip →"));
    } else {
      const btn = byLabel(doc, step.label);
      if (!btn) throw new Error(`${name}: option not found — "${step.label}"`);
      click(btn);
    }
    await tick();
  }
  await tick(2300); // analyzing transition
  const winner =
    [...doc.querySelectorAll("h2")]
      .find((h) => (h.className || "").includes("font-display"))
      ?.textContent.trim() ?? "";
  const ok = winner.length > 0 && expectRe.test(winner) && !(forbidRe && forbidRe.test(winner));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(38)} → ${winner}`);
  return { ok, winner };
}

const A = await runPersona(
  "A: beginner · cruiser · €6k · low seat",
  [
    { label: "I'm completely new" },
    { multi: ["Cruising"] },
    { label: "Relaxed" },
    { label: "I don't mind either way" },
    { label: "Easy-going" },
    { label: "Very important" },
    { label: "I want a low seat" },
    { label: "€5,000–€7,500" },
    { label: "Either" },
    { label: "Somewhat important" },
    { label: "Never" },
    { label: "Cruiser" },
  ],
  /450CL-C|Rebel|Eliminator|Meteor/i,
  /S 1000|Street Triple|Ténéré|R7/i,
);

const B = await runPersona(
  "B: beginner · sporty · €10k · no shifting",
  [
    { label: "I'm completely new" },
    { multi: ["Weekend rides", "Fast / sporty riding"] },
    { label: "Sporty" },
    { label: "Absolutely no gear shifting" },
    { label: "Quick" },
    { label: "Very important" },
    { label: "Average is fine" },
    { label: "€7,500–€10,000" },
    { label: "Either" },
    { label: "I just want to ride" },
    { label: "Never" },
    { skip: true },
  ],
  /Y-AMT|DCT/i,
  /E-Clutch/i,
);

const C = await runPersona(
  "C: veteran · adventure touring · passenger",
  [
    { label: "I've been riding for years" },
    { multi: ["Long-distance touring", "Off-road adventures"] },
    { label: "Adventure" },
    { label: "I want to shift myself" },
    { label: "Balanced" },
    { label: "Not particularly important" },
    { label: "I prefer a taller riding position" },
    { label: "€10,000–€15,000" },
    { label: "Either" },
    { label: "Very important" },
    { label: "Frequently" },
    { label: "Adventure" },
  ],
  /Ténéré|Tenere|Transalp|V-Strom|Tracer|NT1100|390 Adventure/i,
  /Rebel|Eliminator|Forza 350/i,
);

const D = await runPersona(
  "D: veteran · maximum performance · €15k+",
  [
    { label: "I've been riding for years" },
    { multi: ["Fast / sporty riding", "Mountain roads"] },
    { label: "Sporty" },
    { label: "I want to shift myself" },
    { label: "Serious performance" },
    { label: "Not particularly important" },
    { label: "I don't care" },
    { label: "€15,000+" },
    { label: "Either" },
    { label: "I just want to ride" },
    { label: "Never" },
    { label: "Sport" },
  ],
  /S 1000 RR|Street Triple/i,
  /Meteor|Eliminator|Forza|XMAX|Burgman/i,
);

const winners = [A, B, C, D].map((r) => r.winner);
const distinct = new Set(winners).size === winners.length;
console.log(`${distinct ? "PASS" : "FAIL"}  All four personas get different best matches`);

const allOk = [A, B, C, D].every((r) => r.ok) && distinct;
console.log(allOk ? "\nPersona divergence verified." : "\nPersona test FAILED.");
process.exit(allOk ? 0 : 1);
