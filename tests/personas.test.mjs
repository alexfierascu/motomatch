/**
 * The §45 UX test: four very different riders must get clearly different
 * recommendations. Each persona drives the real 10-question questionnaire
 * end-to-end against the production bundle, through /results.
 */
import { boot, byText, byLabel, byStart } from "./interactions.test.mjs";

async function runPersona(name, answers, expectRe, forbidRe) {
  const { doc, tick, click } = await boot("/find-my-bike");
  for (const label of answers) {
    const btn = byLabel(doc, label);
    if (!btn) throw new Error(`${name}: option not found — "${label}"`);
    click(btn);
    await tick();
    click(byStart(doc, "Continue") ?? byStart(doc, "See my results"));
    await tick();
  }
  await tick(2300); // analyzing transition on /results
  const winner =
    [...doc.querySelectorAll("h2")]
      .find((h) => (h.className || "").includes("font-display"))
      ?.textContent.trim() ?? "";
  const ok = winner.length > 0 && expectRe.test(winner) && !(forbidRe && forbidRe.test(winner));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(40)} → ${winner}`);
  return { ok, winner };
}

const A = await runPersona(
  "A: beginner · cruiser · €6k · low seat",
  ["I'm completely new", "Weekend rides", "Comfortable & relaxed", "Either is fine",
   "Easy & manageable", "Low, easy-to-reach seat", "€5,000 – €8,000", "Somewhat important",
   "Almost never", "New or used"],
  /450CL-C|Rebel|Eliminator|Meteor/i,
  /S 1000|Street Triple|Ténéré|R7/i,
);

const B = await runPersona(
  "B: beginner · sporty-fun · €12k · automatic",
  ["I'm completely new", "City & commuting", "Fun & playful", "I prefer automatic",
   "Balanced", "Lightweight & easy to handle", "€8,000 – €12,000", "Not important",
   "Almost never", "New or used"],
  /Y-AMT|DCT|XMAX|Forza|ADV/i,
  /E-Clutch/i,
);

const C = await runPersona(
  "C: veteran · adventure touring · passenger",
  ["I've been riding for years", "Adventure & mixed terrain", "Capable & adventurous",
   "I want a manual", "Balanced", "Tall, commanding position", "€12,000 – €18,000",
   "Quite important", "Yes, frequently", "New or used"],
  /Ténéré|Tenere|Transalp|V-Strom|Tracer|NT1100|390 Adventure/i,
  /Rebel|Eliminator|Forza 350/i,
);

const D = await runPersona(
  "D: veteran · maximum performance · €18k+",
  ["I've been riding for years", "Sport & spirited riding", "Fast & exciting",
   "I want a manual", "Maximum performance", "No strong preference", "€18,000+",
   "Not important", "Almost never", "New or used"],
  /S 1000 RR|Street Triple/i,
  /Meteor|Eliminator|Forza|XMAX|Burgman/i,
);

const winners = [A, B, C, D].map((r) => r.winner);
const distinct = new Set(winners).size === winners.length;
console.log(`${distinct ? "PASS" : "FAIL"}  All four personas get different best matches`);

const allOk = [A, B, C, D].every((r) => r.ok) && distinct;
console.log(allOk ? "\nPersona divergence verified." : "\nPersona test FAILED.");
process.exit(allOk ? 0 : 1);
