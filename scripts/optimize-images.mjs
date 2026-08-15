/**
 * Image pipeline.
 *
 * Verified original photographs live in `images-src/` (kept out of `public/`
 * so multi-megabyte originals never ship). This script generates the WebP
 * files the site actually loads:
 *
 *   <id>-hero.webp   — max 1920w, q72  (full-bleed heroes, editorial sections)
 *   <id>-card.webp   — max 900w,  q78  (cards, comparison columns — always the
 *                                       environmental hero so cards stay
 *                                       visually consistent on the dark UI)
 *   <id>-studio.webp — max 1280w, q80  (clean product shot, detail pages only)
 *
 * Requires macOS `sips` and `cwebp` (brew install webp). Run after adding or
 * replacing any original:  node scripts/optimize-images.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = path.join(ROOT, "images-src");
const OUT = path.join(ROOT, "public/images/bikes");

if (!fs.existsSync(SRC)) {
  console.error(`No ${SRC} directory. Put original photographs there first.`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
const byId = new Map();
for (const f of files) {
  const m = f.match(/^(.+)-(hero|studio)\.(jpe?g|png|webp)$/i);
  if (!m) continue;
  const entry = byId.get(m[1]) ?? {};
  entry[m[2].toLowerCase()] = path.join(SRC, f);
  byId.set(m[1], entry);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "moto-img-"));

function widthOf(file) {
  const out = execFileSync("sips", ["-g", "pixelWidth", file], { encoding: "utf8" });
  return Number(out.match(/pixelWidth: (\d+)/)?.[1] ?? 0);
}

function makeWebp(input, outFile, maxWidth, quality) {
  let source = input;
  // sips reads WebP but cannot write it — decode to PNG first so it can resize.
  if (/\.webp$/i.test(source)) {
    const decoded = path.join(tmp, path.basename(outFile) + ".src.png");
    execFileSync("dwebp", [source, "-o", decoded], { stdio: "pipe" });
    source = decoded;
  }
  if (widthOf(source) > maxWidth) {
    const resized = path.join(tmp, path.basename(outFile) + path.extname(source));
    execFileSync("sips", ["--resampleWidth", String(maxWidth), source, "--out", resized], {
      stdio: "pipe",
    });
    source = resized;
  }
  execFileSync("cwebp", ["-q", String(quality), "-metadata", "none", source, "-o", outFile], {
    stdio: "pipe",
  });
  const kb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`  ${path.basename(outFile)}  ${kb} KB`);
}

for (const [id, entry] of [...byId.entries()].sort()) {
  console.log(id);
  if (entry.hero) {
    makeWebp(entry.hero, path.join(OUT, `${id}-hero.webp`), 1920, 72);
    makeWebp(entry.hero, path.join(OUT, `${id}-card.webp`), 900, 78);
  }
  if (entry.studio) makeWebp(entry.studio, path.join(OUT, `${id}-studio.webp`), 1280, 80);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${byId.size} bikes processed → ${OUT}`);
