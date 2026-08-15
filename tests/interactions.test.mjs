import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs"; import path from "node:path";

const SINGLE = process.env.TARGET === "single";
const dist = new URL("../dist/", import.meta.url).pathname;
const html = SINGLE
  ? fs.readFileSync(new URL("../clutchless.html", import.meta.url).pathname,"utf8")
  : fs.readFileSync(path.join(dist, "index.html"), "utf8");
const js = SINGLE ? null
  : fs.readFileSync(path.join(dist,"assets",fs.readdirSync(path.join(dist,"assets")).find(f=>f.endsWith(".js"))),"utf8");

async function boot(route){
  const errors=[]; const vc=new VirtualConsole();
  vc.on("jsdomError",e=>errors.push(e.message)); vc.on("error",m=>errors.push(String(m)));
  const src = SINGLE ? html : html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/,"");
  const dom=new JSDOM(src,{url:"http://localhost/"+route,runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc});
  dom.window.scrollTo=()=>{};
  if(!SINGLE){const s=dom.window.document.createElement("script"); s.textContent=js;
    dom.window.document.body.appendChild(s);}
  await new Promise(r=>setTimeout(r,400));
  return {dom,doc:dom.window.document,errors,
    tick:()=>new Promise(r=>setTimeout(r,120)),
    click:(el)=>el.dispatchEvent(new dom.window.MouseEvent("click",{bubbles:true})),
  };
}
const results=[];
const check=(name,cond,detail="")=>{results.push([cond,name,detail]);console.log(`${cond?"PASS":"FAIL"}  ${name} ${detail}`);};
const byText=(doc,sel,t)=>[...doc.querySelectorAll(sel)].find(e=>e.textContent.trim()===t);

/* ---------- FILTERS ---------- */
{
  const {doc,tick,click}=await boot("#/browse");
  const countText=()=>doc.querySelector("p.data")?.textContent??"";
  const before=countText();
  check("Browse shows full count", /15 of 15 bikes/.test(before), `→ "${before.trim()}"`);

  click(byText(doc,"button","Fully automatic")); await tick();
  const afterAuto=countText();
  check("Filter: Fully automatic reduces the set", /of 15/.test(afterAuto) && !/15 of 15/.test(afterAuto), `→ "${afterAuto.trim()}"`);
  const cards=[...doc.querySelectorAll("article h3")].map(h=>h.textContent);
  check("Filter: no manual bikes remain", !cards.some(c=>/450SR|450CL-C/.test(c)), `→ ${cards.length} cards`);
  check("Filter: E-Clutch excluded from 'fully automatic'", !cards.some(c=>/E-Clutch/.test(c)));

  click(byText(doc,"button","Reset")); await tick();
  check("Filter reset restores all", /15 of 15/.test(countText()));

  click(byText(doc,"button","Cruiser")); await tick();
  click(byText(doc,"button","Sport")); await tick();
  const multi=[...doc.querySelectorAll("article h3")].map(h=>h.textContent.trim());
  check("Filter: multi-select is OR within a group", multi.length>=5, `→ ${multi.length} cards`);

  click(byText(doc,"button","Reset")); await tick();
  click(byText(doc,"button","1000 cc and up")); await tick();
  click(byText(doc,"button","Under €7,000")); await tick();
  check("Filter: groups combine with AND (empty state)", /No bikes match/.test(doc.body.textContent));
  click(byText(doc,"button","Reset filters")); await tick();
  check("Empty-state reset works", /15 of 15/.test(countText()));
}

/* ---------- SORTING ---------- */
{
  const {doc,tick,click}=await boot("#/browse");
  click(byText(doc,"button","table")); await tick();
  const names=()=>[...doc.querySelectorAll("tbody tr td:nth-child(2) a")].map(a=>a.textContent.trim());
  const prices=()=>[...doc.querySelectorAll("tbody tr")].map(r=>{
    const t=[...r.querySelectorAll("td")].map(c=>c.textContent).find(c=>c.includes("€"));
    return t?Number(t.replace(/[^0-9]/g,"")):0;});
  check("Table view renders rows", names().length===15, `→ ${names().length} rows`);
  const p=prices();
  check("Default sort: price ascending", JSON.stringify(p)===JSON.stringify([...p].sort((a,b)=>a-b)), `→ ${p[0]}…${p[p.length-1]}`);

  const hpHeader=[...doc.querySelectorAll("thead button")].find(b=>b.textContent.startsWith("HP"));
  click(hpHeader); await tick();
  const hp=()=>[...doc.querySelectorAll("tbody tr")].map(r=>Number(r.querySelectorAll("td")[4].textContent));
  const h1=hp();
  check("Sort by HP ascending", JSON.stringify(h1)===JSON.stringify([...h1].sort((a,b)=>a-b)), `→ ${h1.join(",")}`);
  click([...doc.querySelectorAll("thead button")].find(b=>b.textContent.startsWith("HP"))); await tick();
  const h2=hp();
  check("Sort by HP toggles to descending", JSON.stringify(h2)===JSON.stringify([...h1].reverse()));

  // hide a column
  const colsBefore=doc.querySelectorAll("thead th").length;
  click(byText(doc,"button","Torque")); await tick();
  check("Hide column removes it", doc.querySelectorAll("thead th").length===colsBefore-1);
  click(byText(doc,"button","Torque")); await tick();
  check("Show column restores it", doc.querySelectorAll("thead th").length===colsBefore);
}

/* ---------- COMPARISON ---------- */
{
  const {doc,tick,click}=await boot("#/browse");
  const addBtns=()=>[...doc.querySelectorAll("article button[aria-label^='Add']")];
  click(addBtns()[0]); await tick();
  click(addBtns()[0]); await tick();
  check("Compare bar appears after selecting", /Compare 2/.test(doc.body.textContent));
  click(addBtns()[0]); await tick(); click(addBtns()[0]); await tick();
  check("Selection cap reached at 4", /Compare 4/.test(doc.body.textContent));
  const remaining=addBtns().length;
  click(addBtns()[0]); await tick();
  check("Selecting a 5th is blocked", /Compare 4/.test(doc.body.textContent), `→ ${remaining} unselected remained`);

  const link=[...doc.querySelectorAll("a")].find(a=>/^Compare 4$/.test(a.textContent.trim()));
  click(link); await tick(); await tick();
  const heads=[...doc.querySelectorAll("thead th")].length;
  check("Compare page renders 4 columns + spec column", heads===5, `→ ${heads} columns`);
  const rows=doc.querySelectorAll("tbody tr").length;
  check("Compare page renders all spec rows", rows===14, `→ ${rows} rows`);
  check("Compare highlights a best value", doc.querySelectorAll("td.text-accent").length>0);
  const removeBtn=doc.querySelector("thead button[aria-label^='Remove']");
  click(removeBtn); await tick();
  check("Removing a bike updates the table", doc.querySelectorAll("thead th").length===4);
  click(byText(doc,"button","Clear")); await tick();
  check("Clear empties the comparison", /Pick two to four bikes/.test(doc.body.textContent));
}

/* ---------- QUESTIONNAIRE ---------- */
{
  const {doc,tick,click}=await boot("#/recommendation");
  const answer=(label)=>{const b=[...doc.querySelectorAll("button")].find(x=>x.querySelector("div")?.textContent.trim()===label);
    if(!b) throw new Error("option not found: "+label); click(b);};
  check("Questionnaire starts at Q1", /Question 1 of 7/.test(doc.body.textContent));
  answer("Complete beginner"); await tick();
  check("Advances to Q2", /Question 2 of 7/.test(doc.body.textContent));
  answer("No"); await tick();
  answer("Cruiser"); await tick();
  answer("€10,000"); await tick();
  answer("Balanced"); await tick();
  answer("Very important"); await tick();
  check("Reaches final question", /Question 7 of 7/.test(doc.body.textContent));
  answer("Weekend rides"); await tick(); await tick();
  check("Results render", /Your best match/.test(doc.body.textContent));
  const winner=doc.querySelector("h2.font-display")?.textContent.trim();
  check("A winner is named", Boolean(winner), `→ ${winner}`);
  const bodyText=doc.body.textContent;
  check("Winner is fully automatic (user said no shifting)", /Fully automatic/.test(bodyText), "");
  check("Alternatives listed", (doc.body.textContent.match(/Alternatives/)||[]).length>0);
  const back=byText(doc,"button","Start over"); click(back); await tick();
  check("Start over resets to Q1", /Question 1 of 7/.test(doc.body.textContent));
}

/* ---------- MOBILE DRAWER + DETAIL EXPANDERS ---------- */
{
  const {doc,tick,click}=await boot("#/browse");
  const filterBtn=[...doc.querySelectorAll("button")].find(b=>/^Filters/.test(b.textContent.trim()));
  click(filterBtn); await tick();
  check("Mobile filter drawer opens", [...doc.querySelectorAll("button")].some(b=>/^Show \d+$/.test(b.textContent.trim())));
  const showBtn=[...doc.querySelectorAll("button")].find(b=>/^Show \d+$/.test(b.textContent.trim()));
  click(showBtn); await tick();
  check("Mobile filter drawer closes", ![...doc.querySelectorAll("button")].some(b=>/^Show \d+$/.test(b.textContent.trim())));
}
{
  const {doc,tick,click}=await boot("#/bikes/honda-cmx500-rebel-e-clutch");
  check("E-Clutch page labels it semi-automatic", /Clutchless, but you still shift/.test(doc.body.textContent));
  check("E-Clutch page states foot shifting", /still tap the gear lever/.test(doc.body.textContent));
  const src=byText(doc,"span","Sources")?.closest("button");
  click(src); await tick();
  check("Sources section expands", /Last verified: August 2026/.test(doc.body.textContent));
  check("Approximate price shows tilde", /~€/.test(doc.body.textContent));
}

/* ---------- NAVIGATION ---------- */
{
  const {doc,tick,click}=await boot("#/");
  check("Hero headline present", /Find your/i.test(doc.body.textContent) && /automatic/i.test(doc.body.textContent));
  check("Home shows 5 stat tiles", doc.querySelectorAll("section .panel-hover").length>=5);
  const cta=[...doc.querySelectorAll("a")].find(a=>a.textContent.trim()==="Find my bike");
  click(cta); await tick(); await tick();
  check("CTA routes to questionnaire", /Question 1 of 7/.test(doc.body.textContent));
  const menuBtn=doc.querySelector("button[aria-label='Toggle navigation menu']");
  click(menuBtn); await tick();
  check("Mobile nav menu opens", doc.querySelectorAll("nav").length>=2);
}

const failed=results.filter(r=>!r[0]);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
process.exit(failed.length?1:0);
