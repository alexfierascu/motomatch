/**
 * Merges researched bike entries from data-drops/*.json into
 * src/data/motorcycles.ts.
 *
 * Validates every entry (enums, rating ranges, required fields, image files
 * present in images-src/) and refuses to write anything if any entry fails —
 * a partial merge is worse than no merge. Safe to re-run: ids that already
 * exist in the dataset are skipped.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA_TS = path.join(ROOT, "src/data/motorcycles.ts");
const DROPS = path.join(ROOT, "data-drops");
const IMG_SRC = path.join(ROOT, "images-src");

const CATEGORIES = ["sport", "naked", "cruiser", "adventure", "touring", "retro", "dual-sport", "scooter"];
const TRANSMISSIONS = ["manual", "dct", "y-amt", "cvt", "e-clutch"];
const STYLES = ["city", "commuting", "weekend", "touring", "mountain", "sport", "offroad", "cruising"];

const existing = fs.readFileSync(DATA_TS, "utf8");
const errors = [];
const entries = [];

function req(e, cond, msg) {
  if (!cond) errors.push(`${e.id ?? "?"}: ${msg}`);
}

function findImage(id, kind) {
  const f = fs.readdirSync(IMG_SRC).find((n) => n.match(new RegExp(`^${id}-${kind}\\.(jpe?g|png|webp)$`, "i")));
  return f ?? null;
}

for (const file of fs.readdirSync(DROPS).filter((f) => f.endsWith(".json"))) {
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(path.join(DROPS, file), "utf8"));
  } catch (err) {
    errors.push(`${file}: invalid JSON — ${err.message}`);
    continue;
  }
  if (!Array.isArray(arr)) {
    errors.push(`${file}: expected a top-level array`);
    continue;
  }
  for (const e of arr) {
    if (existing.includes(`id: "${e.id}"`)) {
      console.log(`skip (already in dataset): ${e.id}`);
      continue;
    }
    req(e, /^[a-z0-9-]+$/.test(e.id ?? ""), "bad id");
    req(e, CATEGORIES.includes(e.category), `bad category "${e.category}"`);
    req(e, TRANSMISSIONS.includes(e.transmission?.type), `bad transmission "${e.transmission?.type}"`);
    req(e, e.transmission?.type !== "e-clutch" || e.transmission?.fullyAutomatic === false, "e-clutch must not be fullyAutomatic");
    req(e, e.engine?.displacement > 0 && e.engine?.horsepower > 0 && e.engine?.torque > 0, "missing engine figures");
    req(e, e.dimensions?.weight > 0 && e.dimensions?.seatHeight > 0, "missing dimensions");
    req(e, e.price?.eur > 500, "missing price");
    req(e, typeof e.a2Compatible === "boolean", "missing a2Compatible");
    for (const k of ["beginnerRating", "passengerSuitability", "practicality", "performanceLevel"])
      req(e, Number.isFinite(e[k]) && e[k] >= 1 && e[k] <= 10, `bad ${k}`);
    req(e, Array.isArray(e.ridingStyles) && e.ridingStyles.length >= 1 && e.ridingStyles.every((s) => STYLES.includes(s)), "bad ridingStyles");
    for (const k of ["whoFor", "notFor", "about", "beginnerNote"]) req(e, typeof e[k] === "string" && e[k].length > 10, `missing ${k}`);
    req(e, Array.isArray(e.pros) && e.pros.length >= 3, "need ≥3 pros");
    req(e, Array.isArray(e.cons) && e.cons.length >= 2, "need ≥2 cons");
    req(e, Array.isArray(e.sources) && e.sources.length >= 1, "missing sources");
    req(e, e.imageMeta?.sourceName && e.imageMeta?.alt, "missing imageMeta");
    req(e, findImage(e.id, "hero"), "hero image not found in images-src/");
    entries.push(e);
  }
}

if (errors.length) {
  console.error(`\n${errors.length} validation error(s):`);
  errors.forEach((e) => console.error("  ✗ " + e));
  process.exit(1);
}

const js = (v) => JSON.stringify(v);

function renderEntry(e) {
  const hasStudio = Boolean(findImage(e.id, "studio"));
  const L = [];
  L.push(`  {`);
  L.push(`    id: ${js(e.id)},`);
  L.push(`    manufacturer: ${js(e.manufacturer)},`);
  L.push(`    model: ${js(e.model)},`);
  if (e.variant) L.push(`    variant: ${js(e.variant)},`);
  L.push(`    year: ${e.year},`);
  L.push(`    category: ${js(e.category)},`);
  L.push(`    vehicleType: ${js(e.vehicleType ?? "motorcycle")},`);
  L.push(`    images: {`);
  L.push(`      hero: ${js(`/images/bikes/${e.id}-hero.webp`)},`);
  L.push(`      card: ${js(`/images/bikes/${e.id}-card.webp`)},`);
  if (hasStudio) L.push(`      gallery: [${js(`/images/bikes/${e.id}-studio.webp`)}],`);
  L.push(`      alt: ${js(e.imageMeta.alt)},`);
  if (e.imageMeta.sourceUrl) L.push(`      source: ${js(e.imageMeta.sourceUrl)},`);
  L.push(`      sourceName: ${js(e.imageMeta.license?.includes("CC") ? `${e.imageMeta.sourceName} (${e.imageMeta.license})` : e.imageMeta.sourceName)},`);
  L.push(`    },`);
  const eng = { ...e.engine };
  L.push(`    engine: { displacement: ${eng.displacement}, cylinders: ${eng.cylinders}, horsepower: ${eng.horsepower}, torque: ${eng.torque}${eng.powerNote ? `, powerNote: ${js(eng.powerNote)}` : ""} },`);
  const d = e.dimensions;
  L.push(`    dimensions: { weight: ${d.weight}, seatHeight: ${d.seatHeight}${d.fuelCapacity ? `, fuelCapacity: ${d.fuelCapacity}` : ""} },`);
  const t = e.transmission;
  L.push(`    transmission: { type: ${js(t.type)}, fullyAutomatic: ${t.fullyAutomatic}, manualOverride: ${t.manualOverride}, clutchLever: ${t.clutchLever} },`);
  if (e.performance && (e.performance.topSpeed || e.performance.fuelConsumption)) {
    const perf = [];
    if (e.performance.topSpeed) perf.push(`topSpeed: ${e.performance.topSpeed}`);
    if (e.performance.zeroTo100) perf.push(`zeroTo100: ${e.performance.zeroTo100}`);
    if (e.performance.fuelConsumption) perf.push(`fuelConsumption: ${e.performance.fuelConsumption}`);
    L.push(`    performance: { ${perf.join(", ")} },`);
  }
  if (e.chassis?.drive) {
    L.push(`    chassis: { drive: ${js(e.chassis.drive)}, brakes: ${js(e.chassis.brakes ?? "")}, suspension: ${js(e.chassis.suspension ?? "")} },`);
  }
  L.push(`    price: { eur: ${e.price.eur}, country: ${js(e.price.country ?? "EU")}, confidence: ${js(e.price.confidence ?? "approximate")}, note: ${js(e.price.note ?? "")} },`);
  L.push(`    a2Compatible: ${e.a2Compatible},`);
  if (e.a2Note) L.push(`    a2Note: ${js(e.a2Note)},`);
  L.push(`    beginnerRating: ${e.beginnerRating},`);
  L.push(`    beginnerNote: ${js(e.beginnerNote)},`);
  L.push(`    ridingStyles: ${js(e.ridingStyles)},`);
  L.push(`    passengerSuitability: ${e.passengerSuitability},`);
  L.push(`    practicality: ${e.practicality},`);
  L.push(`    performanceLevel: ${e.performanceLevel},`);
  L.push(`    whoFor: ${js(e.whoFor)},`);
  L.push(`    notFor: ${js(e.notFor)},`);
  L.push(`    about: ${js(e.about)},`);
  L.push(`    pros: ${js(e.pros)},`);
  L.push(`    cons: ${js(e.cons)},`);
  L.push(`    sources: ${js(e.sources)},`);
  L.push(`    lastVerified: ${js(e.lastVerified ?? "August 2026")},`);
  L.push(`  },`);
  return L.join("\n");
}

if (entries.length === 0) {
  console.log("Nothing new to merge.");
  process.exit(0);
}

const block =
  `\n  // ─────────────────────────────── Researched additions ──────────────────────\n` +
  entries.map(renderEntry).join("\n");

const out = existing.replace(/\n\];/, `${block}\n];`);
fs.writeFileSync(DATA_TS, out);
console.log(`Merged ${entries.length} new bikes:`, entries.map((e) => e.id).join(", "));
