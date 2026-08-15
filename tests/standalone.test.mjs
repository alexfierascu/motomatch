import { JSDOM, VirtualConsole } from "jsdom"; import fs from "node:fs";
const html=fs.readFileSync(new URL("../clutchless.html", import.meta.url).pathname,"utf8");
const errs=[]; const vc=new VirtualConsole(); vc.on("jsdomError",e=>errs.push(e.message));
const dom=new JSDOM(html,{url:"http://localhost/#/browse",runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc,resources:undefined});
dom.window.scrollTo=()=>{};
await new Promise(r=>setTimeout(r,600));
const t=dom.window.document.getElementById("root").textContent;
console.log(errs.length===0 && t.length>500 ? `PASS  single-file boots (${t.length} chars rendered)` : `FAIL ${errs[0]??""} len=${t.length}`);
process.exit(errs.length===0 && t.length>500?0:1);
