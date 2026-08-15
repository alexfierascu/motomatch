/**
 * Builds the standalone `clutchless.html`.
 *
 * Uses an IIFE bundle rather than an ES module so the file works when opened
 * directly from disk (file://), where module scripts are blocked by CORS.
 */
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("dist-single");

await build({
  configFile: false,
  plugins: [react(), tailwindcss()],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve("index.html"),
      output: { format: "iife", inlineDynamicImports: true, entryFileNames: "app.js" },
    },
  },
});

let js = fs.readFileSync(path.join(outDir, "app.js"), "utf8");

// The standalone file must work from file:// with nothing next to it, so the
// motorcycle photographs are embedded as data URIs. Only paths that exist are
// inlined — anything missing keeps its URL and falls back to the silhouette.
js = js.replace(/images\/bikes\/[a-z0-9-]+\.webp/g, (rel) => {
  const file = path.resolve("public", rel);
  if (!fs.existsSync(file)) return rel;
  return `data:image/webp;base64,${fs.readFileSync(file).toString("base64")}`;
});

// The IIFE bundle injects its own CSS, so there is no separate stylesheet to
// inline. Dropping type="module" is what lets the file run from file://.
const html = fs
  .readFileSync(path.join(outDir, "index.html"), "utf8")
  .replace(/<link[^>]+rel="modulepreload"[^>]*>/g, "")
  // Vite puts the entry script in <head>, relying on module deferral. A classic
  // inline script runs immediately, so it has to move below #root instead.
  .replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/, "")
  // A replacer FUNCTION is required here: the bundle contains "$&" and "$`"
  // sequences, which a replacement string would expand as patterns.
  .replace("</body>", () => `<script>\n${js}\n</script>\n</body>`);

const out = path.resolve("clutchless.html");
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} kB)`);
