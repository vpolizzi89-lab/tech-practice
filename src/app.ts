import { SECS, makeSet, shuffle, Q, Sec } from "./bank";
type Att = { date: string; mode: string; score: number; total: number; per: Record<string, number> };
const KEY = "techPracticeHistory";
const load = (): Att[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const save = (h: Att[]) => { try { localStorage.setItem(KEY, JSON.stringify(h)); } catch {} };
const $ = (id: string) => document.getElementById("app")!;
let qs: Q[] = [], ans: number[] = [], i = 0, mode = "", timer = 0, deadline = 0, secEnds: number[] = [];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function home() {
  clearInterval(timer); const h = load();
  const weak = weakest(h);
  $("").innerHTML = `<h1>TECH Practice</h1><p class=sub>Matches EEI's official TECH format: Graphic Problem Solving 16 Q / 15 min (EEI provides a calculator and scratch paper), Interpreting Diagrams 16 Q / 15 min (2 maps, 8 Q each), Mechanical Concepts 44 Q / 20 min (3 choices), Reasoning from Rules 15 Q / 15 min. Tip: zoom in on maps.</p>
  <button class=big data-m=full>Full timed practice (91 Q, 65 min)</button>
  ${SECS.map(s => `<button class=big data-m=${s.id}>10-Q drill: ${s.name}</button>`).join("")}
  <button class=big data-m=miss ${missed().length ? "" : "disabled"}>Review missed (${missed().length})</button>
  <h2>History</h2>${h.length ? trend(h) + (weak ? `<p>Weakest section: <b>${weak}</b></p>` : "") + `<table>${h.slice(-15).reverse().map(a => `<tr><td>${a.date}</td><td>${a.mode}</td><td>${Math.round(100 * a.score / a.total)}%</td></tr>`).join("")}</table>` : "<p class=sub>Take a test to start tracking.</p>"}`;
  document.querySelectorAll("button[data-m]").forEach(b => (b as HTMLButtonElement).onclick = () => start((b as HTMLElement).dataset.m!));
}
function missed(): Q[] { try { return JSON.parse(localStorage.getItem(KEY + "Missed") || "[]"); } catch { return []; } }
function weakest(h: Att[]): string { const t: Record<string, number[]> = {}; h.slice(-10).forEach(a => Object.entries(a.per).forEach(([k, v]) => (t[k] = t[k] || []).push(v))); let w = "", m = 101; for (const k in t) { const av = t[k].reduce((x, y) => x + y, 0) / t[k].length; if (av < m) { m = av; w = k; } } return w ? `${SECS.find(s => s.id === w)!.name} (${Math.round(m)}%)` : ""; }
function trend(h: Att[]): string { const p = h.slice(-12).map(a => 100 * a.score / a.total); const n = p.length; const xs = (k: number) => n === 1 ? 150 : 10 + k * 280 / (n - 1);
  return `<svg viewBox="0 0 300 110" width=100%><line x1=0 y1=100 x2=300 y2=100 stroke=#8884 /><polyline fill=none stroke=#3b82f6 stroke-width=3 points="${p.map((v, k) => `${xs(k)},${100 - v * .9}`).join(" ")}"/>${p.map((v, k) => `<circle cx=${xs(k)} cy=${100 - v * .9} r=4 fill=#3b82f6 />`).join("")}</svg>`; }
function start(m: string) {
  mode = m; i = 0; secEnds = [];
  if (m === "full") { qs = []; SECS.forEach(s => { qs = qs.concat(makeSet(s.id, s.n)); secEnds.push(qs.length); }); }
  else if (m === "miss") qs = shuffle(missed()).slice(0, 20).map(q => { const o = shuffle(q.choices.map((_, k) => k)); return { ...q, choices: o.map(k => q.choices[k]), answer: o.indexOf(q.answer) }; });
  else qs = makeSet(m as Sec, 10);
  ans = qs.map(() => -1);
  if (m === "full") { secStart(0); } else deadline = 0;
  clearInterval(timer); timer = window.setInterval(tick, 1000); show();
}
function secIdx(k: number) { return secEnds.findIndex(e => k < e); }
function secStart(s: number) { deadline = Date.now() + SECS[s].min * 60000; }
function tick() { const el = document.getElementById("clk"); if (!deadline || !el) return; const r = Math.max(0, deadline - Date.now()); el.textContent = `${Math.floor(r / 60000)}:${String(Math.floor(r / 1000) % 60).padStart(2, "0")}`; if (r <= 0) { const s = secIdx(i); if (s < SECS.length - 1) { i = secEnds[s]; secStart(s + 1); show(); } else finish(); } }
function show() {
  const q = qs[i]; const s = SECS.find(x => x.id === q.sec)!;
  $("").innerHTML = `<div class=bar><span>${s.name}</span><span>${i + 1}/${qs.length}</span><span id=clk></span></div>
  ${q.rules ? `<div class=rules>${q.rules.map(r => `<p>${esc(r)}</p>`).join("")}</div>` : ""}<p class=q>${esc(q.prompt)}</p>${q.svg ? `<div class=fig>${q.svg}</div>` : ""}${q.table ? `<table class=t><tr>${q.table.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr>${q.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>` : ""}
  ${q.choices.map((c, k) => `<button class="ch ${ans[i] === k ? "sel" : ""}" data-k=${k}><b>${"ABCD"[k]}</b> ${esc(c)}</button>`).join("")}
  <div class=nav><button id=pv ${i === 0 ? "disabled" : ""}>Back</button><button id=nx>${i === qs.length - 1 ? "Finish" : "Next"}</button></div><button id=quit class=link>Quit</button>`;
  document.querySelectorAll(".ch").forEach(b => (b as HTMLButtonElement).onclick = () => { ans[i] = +(b as HTMLElement).dataset.k!; show(); });
  (document.getElementById("pv") as HTMLButtonElement).onclick = () => { if (mode === "full" && secIdx(i - 1) !== secIdx(i)) return; i--; show(); };
  (document.getElementById("nx") as HTMLButtonElement).onclick = () => { if (i === qs.length - 1) return finish(); if (mode === "full" && secIdx(i + 1) !== secIdx(i)) secStart(secIdx(i + 1)); i++; show(); };
  (document.getElementById("quit") as HTMLButtonElement).onclick = () => { if (confirm("Quit without saving?")) home(); };
  tick();
}
function finish() {
  clearInterval(timer); const per: Record<string, number> = {}; const cnt: Record<string, [number, number]> = {};
  qs.forEach((q, k) => { const c = cnt[q.sec] || [0, 0]; c[1]++; if (ans[k] === q.answer) c[0]++; cnt[q.sec] = c; });
  for (const k in cnt) per[k] = Math.round(100 * cnt[k][0] / cnt[k][1]);
  const score = qs.filter((q, k) => ans[k] === q.answer).length; const h = load();
  const label = mode === "full" ? "Full test" : mode === "miss" ? "Missed review" : "Drill: " + SECS.find(s => s.id === mode)!.name;
  h.push({ date: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), mode: label, score, total: qs.length, per }); save(h);
  const wrong = qs.filter((q, k) => ans[k] !== q.answer);
  let m = missed().filter(x => !qs.some((q, k) => ans[k] === q.answer && q.prompt === x.prompt)); m = m.concat(wrong).slice(-60);
  try { localStorage.setItem(KEY + "Missed", JSON.stringify(m)); } catch {}
  $("").innerHTML = `<h1>${score}/${qs.length} (${Math.round(100 * score / qs.length)}%)</h1><table>${Object.keys(cnt).map(k => `<tr><td>${SECS.find(s => s.id === k)!.name}</td><td>${cnt[k][0]}/${cnt[k][1]}</td><td>${per[k]}%</td></tr>`).join("")}</table>
  <h2>Missed (${wrong.length})</h2>${qs.map((q, k) => ans[k] === q.answer ? "" : `<div class=rev><p>${esc(q.prompt)}</p>${q.svg ? `<div class=fig>${q.svg}</div>` : ""}<p>Your answer: ${ans[k] < 0 ? "blank" : esc(q.choices[ans[k]])}<br><b>Correct: ${esc(q.choices[q.answer])}</b></p><p class=sub>${esc(q.expl)}</p></div>`).join("")}
  <button class=big id=hm>Home</button>`;
  (document.getElementById("hm") as HTMLButtonElement).onclick = home;
}
home();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
