import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";
import path from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const jsFile = fs.readdirSync(path.join(dist, "assets")).find((f) => f.endsWith(".js"));
const js = fs.readFileSync(path.join(dist, "assets", jsFile), "utf8");

const routes = ["/", "/explore", "/find-my-bike", "/compare", "/about",
                "/find-my-bike/results", "/results",
                "/bikes/yamaha-mt-07-y-amt", "/bikes/cfmoto-450sr",
                "/bikes/honda-nc750x-dct", "/bikes/nope-does-not-exist"];

let failures = 0;
for (const route of routes) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message + "\n" + (e.detail?.stack ?? "")));
  vc.on("error", (m) => errors.push(String(m)));

  const dom = new JSDOM(html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/, ""), {
    url: "http://localhost" + route,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  dom.window.scrollTo = () => {};
  const s = dom.window.document.createElement("script");
  s.textContent = js;
  dom.window.document.body.appendChild(s);
  await new Promise((r) => setTimeout(r, 400));

  const root = dom.window.document.getElementById("root");
  const text = root?.textContent ?? "";
  const ok = text.length > 200 && errors.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${route.padEnd(36)} chars=${String(text.length).padStart(5)}  ${errors[0] ? errors[0].split("\n").slice(0,2).join(" | ") : ""}`);
  dom.window.close();
}
console.log(failures === 0 ? "\nAll routes rendered." : `\n${failures} route(s) failed.`);
process.exit(failures ? 1 : 0);
