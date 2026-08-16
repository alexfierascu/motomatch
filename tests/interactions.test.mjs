import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs"; import path from "node:path";

const SINGLE = process.env.TARGET === "single";
const dist = new URL("../dist/", import.meta.url).pathname;
const html = SINGLE
  ? fs.readFileSync(new URL("../motomatch.html", import.meta.url).pathname,"utf8")
  : fs.readFileSync(path.join(dist, "index.html"), "utf8");
const js = SINGLE ? null
  : fs.readFileSync(path.join(dist,"assets",fs.readdirSync(path.join(dist,"assets")).find(f=>f.endsWith(".js"))),"utf8");

export async function boot(route){
  const errors=[]; const vc=new VirtualConsole();
  vc.on("jsdomError",e=>errors.push(e.message)); vc.on("error",m=>errors.push(String(m)));
  const src = SINGLE ? html : html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/,"");
  const dom=new JSDOM(src,{url:"http://localhost"+route,runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc});
  dom.window.scrollTo=()=>{};
  if(!SINGLE){const s=dom.window.document.createElement("script"); s.textContent=js;
    dom.window.document.body.appendChild(s);}
  await new Promise(r=>setTimeout(r,400));
  return {dom,doc:dom.window.document,errors,
    tick:(ms=120)=>new Promise(r=>setTimeout(r,ms)),
    click:(el)=>el.dispatchEvent(new dom.window.MouseEvent("click",{bubbles:true})),
  };
}
export const byText=(doc,sel,t)=>[...doc.querySelectorAll(sel)].find(e=>e.textContent.trim()===t);
export const byLabel=(doc,label)=>[...doc.querySelectorAll("button")].find(b=>[...b.querySelectorAll("div,span")].some(d=>d.textContent.trim()===label));
export const byStart=(doc,prefix)=>[...doc.querySelectorAll("button")].find(b=>b.textContent.trim().startsWith(prefix));

const isMain = process.argv[1] && process.argv[1].endsWith("interactions.test.mjs");
if (isMain) {

const results=[];
const check=(name,cond,detail="")=>{results.push([cond,name,detail]);console.log(`${cond?"PASS":"FAIL"}  ${name} ${detail}`);};

/* ---------- EXPLORE: FILTERS ---------- */
{
  const {doc,tick,click}=await boot("/explore");
  const countText=()=>doc.querySelector("p.data")?.textContent??"";
  const total=Number(countText().match(/of (\d+) bikes/)?.[1]??0);
  check("Explore shows full count", total>0 && new RegExp(`${total} of ${total} bikes`).test(countText()), `→ "${countText().trim()}"`);

  click(byText(doc,"button","Fully automatic")); await tick();
  const shown=Number(countText().match(/^(\d+) of/)?.[1]??-1);
  check("Filter: Fully automatic reduces the set", shown>0 && shown<total, `→ ${shown}/${total}`);
  const cards=[...doc.querySelectorAll("article h3")].map(h=>h.textContent);
  check("Filter: E-Clutch excluded from 'fully automatic'", !cards.some(c=>/E-Clutch/.test(c)));

  click(byText(doc,"button","Reset")); await tick();
  check("Filter reset restores all", new RegExp(`${total} of ${total} bikes`).test(countText()));

  click(byText(doc,"button","Cruiser")); await tick();
  click(byText(doc,"button","Sport")); await tick();
  const multi=[...doc.querySelectorAll("article h3")].length;
  check("Filter: multi-select is OR within a group", multi>=3, `→ ${multi} cards`);

  click(byText(doc,"button","Reset")); await tick();
  const mfr=byText(doc,"button","Yamaha");
  check("Manufacturer filter exists", Boolean(mfr));
  if (mfr) { click(mfr); await tick(); }
  const yamCount=Number(countText().match(/^(\d+) of/)?.[1]??-1);
  check("Manufacturer filter narrows the set", yamCount>0 && yamCount<total, `→ ${yamCount}/${total}`);

  click(byText(doc,"button","Reset")); await tick();
  click(byText(doc,"button","1000 cc and up")); await tick();
  click(byText(doc,"button","Under €7,000")); await tick();
  check("Filter: groups combine with AND (empty state)", /No bikes match/.test(doc.body.textContent));
  click(byText(doc,"button","Reset filters")); await tick();
  check("Empty-state reset works", new RegExp(`${total} of ${total} bikes`).test(countText()));
}

/* ---------- EXPLORE: CATEGORY DEEP LINK ---------- */
{
  const {doc}=await boot("/explore?category=cruiser");
  const countText=doc.querySelector("p.data")?.textContent??"";
  const m=countText.match(/^(\d+) of (\d+) bikes/);
  check("Category deep link pre-filters Explore", Boolean(m) && Number(m[1])>0 && Number(m[1])<Number(m[2]), `→ "${countText.trim()}"`);
  const cards=[...doc.querySelectorAll("article h3")].map(h=>h.textContent);
  check("Deep link shows cruisers", cards.some(c=>/450CL-C|Rebel|Eliminator|Meteor/.test(c)), `→ ${cards.length} cards`);
}

/* ---------- EXPLORE: SORTING + TABLE ---------- */
{
  const {doc,tick,click}=await boot("/explore");
  const total=Number(doc.querySelector("p.data")?.textContent.match(/of (\d+) bikes/)?.[1]??0);
  click(byText(doc,"button","table")); await tick();
  const rows=()=>[...doc.querySelectorAll("tbody tr")];
  check("Table view renders all rows", rows().length===total, `→ ${rows().length}/${total} rows`);

  const prices=()=>rows().map(r=>{
    const t=[...r.querySelectorAll("td")].map(c=>c.textContent).find(c=>c.includes("€"));
    return t?Number(t.replace(/[^0-9]/g,"")):0;});
  const p=prices();
  check("Default sort: price ascending", JSON.stringify(p)===JSON.stringify([...p].sort((a,b)=>a-b)), `→ ${p[0]}…${p[p.length-1]}`);

  const hpHeader=[...doc.querySelectorAll("thead button")].find(b=>b.textContent.startsWith("HP"));
  click(hpHeader); await tick();
  const hp=()=>rows().map(r=>Number(r.querySelectorAll("td")[4].textContent));
  const h1=hp();
  check("Sort by HP ascending", JSON.stringify(h1)===JSON.stringify([...h1].sort((a,b)=>a-b)));
  click([...doc.querySelectorAll("thead button")].find(b=>b.textContent.startsWith("HP"))); await tick();
  check("Sort by HP toggles to descending", JSON.stringify(hp())===JSON.stringify([...h1].reverse()));

  const colsBefore=doc.querySelectorAll("thead th").length;
  click(byText(doc,"button","Torque")); await tick();
  check("Hide column removes it", doc.querySelectorAll("thead th").length===colsBefore-1);
  click(byText(doc,"button","Torque")); await tick();
  check("Show column restores it", doc.querySelectorAll("thead th").length===colsBefore);
}

/* ---------- COMPARISON ---------- */
{
  const {doc,tick,click}=await boot("/explore");
  const addBtns=()=>[...doc.querySelectorAll("article button[aria-label^='Add']")];
  click(addBtns()[0]); await tick();
  click(addBtns()[0]); await tick();
  check("Compare bar appears after selecting", /Compare 2/.test(doc.body.textContent));
  click(addBtns()[0]); await tick(); click(addBtns()[0]); await tick();
  check("Selection cap reached at 4", /Compare 4/.test(doc.body.textContent));
  click(addBtns()[0]); await tick();
  check("Selecting a 5th is blocked", /Compare 4/.test(doc.body.textContent));

  const link=[...doc.querySelectorAll("a")].find(a=>/^Compare 4$/.test(a.textContent.trim()));
  click(link); await tick(); await tick();
  check("Compare page renders 4 columns + spec column", doc.querySelectorAll("thead th").length===5);
  check("Compare page renders all spec rows", doc.querySelectorAll("tbody tr").length===14, `→ ${doc.querySelectorAll("tbody tr").length} rows`);
  check("Compare highlights a best value", doc.querySelectorAll("td.text-accent").length>0);
  const removeBtn=doc.querySelector("thead button[aria-label^='Remove']");
  click(removeBtn); await tick();
  check("Removing a bike updates the table", doc.querySelectorAll("thead th").length===4);
  click(byText(doc,"button","Clear")); await tick();
  check("Clear empties the comparison", /Pick two to four bikes/.test(doc.body.textContent));
}

/* ---------- QUESTIONNAIRE ---------- */
{
  const {doc,tick,click}=await boot("/find-my-bike");
  check("Questionnaire starts at question 1", /Question 1 of 10/.test(doc.body.textContent));

  // Continue without an answer must not advance
  click(byStart(doc,"Continue")); await tick();
  check("Empty continue is blocked with inline validation",
    /Question 1 of 10/.test(doc.body.textContent) && /Choose an option/.test(doc.body.textContent));

  click(byLabel(doc,"I'm completely new")); await tick();
  check("Answer card selects", [...doc.querySelectorAll('[role="radio"][aria-checked="true"]')].length===1);
  click(byStart(doc,"Continue")); await tick();
  check("Advances to question 2", /Question 2 of 10/.test(doc.body.textContent));

  // Back preserves the previous answer
  click(byStart(doc,"← Back")); await tick();
  check("Back returns with answer preserved",
    /Question 1 of 10/.test(doc.body.textContent) &&
    [...doc.querySelectorAll('[role="radio"][aria-checked="true"]')].length===1);
  click(byStart(doc,"Continue")); await tick();

  // Multi-select: riding style allows 1–3 picks on the same premium cards
  const checked=()=>[...doc.querySelectorAll('[role="checkbox"][aria-checked="true"]')];
  check("Riding style renders as multi-select with its rule",
    doc.querySelectorAll('[role="checkbox"]').length===5 && /Select up to 3/i.test(doc.body.textContent));
  click(byLabel(doc,"City & commuting")); await tick();
  click(byLabel(doc,"Weekend rides")); await tick();
  click(byLabel(doc,"Long-distance touring")); await tick();
  check("Three selections stay selected together", checked().length===3);
  check("Selection counter shows 3/3", /3\/3 selected/i.test(doc.body.textContent));
  click(byLabel(doc,"Adventure & mixed terrain")); await tick();
  check("Cap blocks a 4th selection", checked().length===3 && !checked().some(b=>/Adventure/.test(b.textContent)));
  click(byLabel(doc,"Weekend rides")); await tick();
  check("Deselection still works at the cap", checked().length===2 && !checked().some(b=>/Weekend rides/.test(b.textContent)));
  click(byLabel(doc,"Adventure & mixed terrain")); await tick();
  check("Freed slot accepts a new selection", checked().length===3 && checked().some(b=>/Adventure/.test(b.textContent)));
  click(byStart(doc,"← Back")); await tick();
  click(byStart(doc,"Continue")); await tick();
  check("Multi selections persist across navigation", checked().length===3);
  click(byStart(doc,"Continue")); await tick();
  check("Multi-select advances to question 3", /Question 3 of 10/.test(doc.body.textContent));

  const remaining=["Easy & approachable","I prefer automatic","Balanced",
    "Lightweight & easy to handle","€8,000 – €12,000","Somewhat important","Almost never"];
  for (const label of remaining){ click(byLabel(doc,label)); await tick(); click(byStart(doc,"Continue")); await tick(); }
  check("Reaches question 10", /Question 10 of 10/.test(doc.body.textContent));

  // Save & exit → home, then re-enter: state preserved
  click(byStart(doc,"Save & exit")); await tick(); await tick();
  check("Save & exit returns home", /Find your\s*perfect ride/i.test(doc.body.textContent));
  click(doc.querySelector('a[href="/find-my-bike"]')); await tick(); await tick();
  check("Re-entering resumes at question 10", /Question 10 of 10/.test(doc.body.textContent));

  click(byLabel(doc,"New or used")); await tick();
  click(byStart(doc,"See my results")); await tick();
  check("Analyzing transition shows", /Analyzing your riding style/i.test(doc.body.textContent));
  await tick(2200);
  check("Results render at /find-my-bike/results",
    /Your matches/.test(doc.body.textContent) && /Best match/i.test(doc.body.textContent) &&
    /Other strong matches/i.test(doc.body.textContent));
  const winner=[...doc.querySelectorAll("h2")].find(h=>(h.className||"").includes("font-display"))?.textContent??"";
  check("Winner is not an E-Clutch bike (user prefers automatic)", winner.length>0 && !/E-Clutch/.test(winner), `→ ${winner.trim()}`);
  check("Why-it-matches reasons render", doc.querySelectorAll("section[aria-label='Best match'] li").length>=2);

  // Favorites: heart toggles centralized state
  const heart=doc.querySelector('article button[aria-pressed]');
  click(heart); await tick();
  check("Favorite heart toggles on", doc.querySelector('article button[aria-pressed="true"]')!==null);
  click(doc.querySelector('article button[aria-pressed="true"]')); await tick();
  check("Favorite heart toggles off", doc.querySelector('article button[aria-pressed="true"]')===null);

  // View all results expands beyond the initial four cards
  const cardsBefore=doc.querySelectorAll("article").length;
  click(byStart(doc,"View all results")); await tick();
  check("View all results expands the grid", doc.querySelectorAll("article").length>cardsBefore,
    `→ ${cardsBefore} → ${doc.querySelectorAll("article").length}`);

  // Progress rail returns to a specific question with answers intact
  click(doc.querySelector("button[aria-label='Edit question 4: Transmission']")); await tick(); await tick();
  check("Progress step jumps back into the questionnaire", /Question 4 of 10/.test(doc.body.textContent));

  // Answers are preserved, so Continue walks straight back to the end
  for (let i=0;i<6;i++){ click(byStart(doc,"Continue")); await tick(); }
  click(byStart(doc,"See my results")); await tick(); await tick(2200);
  check("Re-finishing returns to results", /Best match/i.test(doc.body.textContent));

  click(byText(doc,"button","Start over")); await tick(); await tick();
  check("Start over clears and returns to question 1", /Question 1 of 10/.test(doc.body.textContent));
}

/* ---------- MOBILE DRAWER + DETAIL ---------- */
{
  const {doc,tick,click}=await boot("/explore");
  const filterBtn=[...doc.querySelectorAll("button")].find(b=>/^Filters/.test(b.textContent.trim()));
  click(filterBtn); await tick();
  check("Mobile filter drawer opens", [...doc.querySelectorAll("button")].some(b=>/^Show \d+$/.test(b.textContent.trim())));
  const showBtn=[...doc.querySelectorAll("button")].find(b=>/^Show \d+$/.test(b.textContent.trim()));
  click(showBtn); await tick();
  check("Mobile filter drawer closes", ![...doc.querySelectorAll("button")].some(b=>/^Show \d+$/.test(b.textContent.trim())));
}
{
  const {doc,tick,click}=await boot("/bike/honda-cmx500-rebel-e-clutch");
  check("E-Clutch page labels it semi-automatic", /Clutchless, but you still shift/.test(doc.body.textContent));
  check("E-Clutch page states foot shifting", /still tap the gear lever/.test(doc.body.textContent));
  check("Who is it for section present", /Who is this bike for/.test(doc.body.textContent) && /Maybe not for you if/.test(doc.body.textContent));
  const src=byText(doc,"span","Sources")?.closest("button");
  click(src); await tick();
  check("Sources section expands", /Last verified: August 2026/.test(doc.body.textContent));
  check("Approximate price shows tilde", /~€/.test(doc.body.textContent));
}

/* ---------- HOME + NAVIGATION ---------- */
{
  const {doc,tick,click}=await boot("/");
  check("Hero pitch present", /Find your\s*perfect ride/i.test(doc.body.textContent) && /made for you/i.test(doc.body.textContent));
  check("How-it-works steps present", /How it works/i.test(doc.body.textContent) && /We find your match/i.test(doc.body.textContent));
  const cta=doc.querySelector('a[href="/find-my-bike"]');
  check("Primary CTA exists", Boolean(cta));
  click(cta); await tick(); await tick();
  check("CTA routes to the quiz", /Question 1 of 10/.test(doc.body.textContent));
  const menuBtn=doc.querySelector("button[aria-label='Toggle navigation menu']");
  click(menuBtn); await tick();
  check("Mobile nav menu opens", doc.querySelectorAll("nav").length>=2);
}

const failed=results.filter(r=>!r[0]);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
process.exit(failed.length?1:0);

}
