export type Sec = "GPS" | "ID" | "MC" | "RR";
export interface Q { sec: Sec; prompt: string; svg?: string; table?: { cols: string[]; rows: string[][] }; choices: string[]; answer: number; expl: string; rules?: string[]; }
export const SECS: { id: Sec; name: string; n: number; min: number }[] = [
  { id: "GPS", name: "Graphic Problem Solving", n: 16, min: 15 },
  { id: "ID", name: "Interpreting Diagrams", n: 16, min: 15 },
  { id: "MC", name: "Mechanical Concepts", n: 44, min: 20 },
  { id: "RR", name: "Reasoning from Rules", n: 15, min: 15 },
];
const R = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export function shuffle<T>(a: T[]): T[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
const fmt = (n: number): string => (Math.round(n * 100) / 100).toString();
// build a numeric MCQ with unique distractors, shuffled
function num(sec: Sec, prompt: string, ans: number, wrong: number[], expl: string, unit = "", extra: Partial<Q> = {}): Q {
  const seen = new Set<string>([fmt(ans)]); const ds: string[] = [];
  for (const w of wrong.concat([ans * 2, ans + 1, ans - 1, ans * 1.5, ans + 10])) { const s = fmt(w); if (w > 0 && !seen.has(s) && ds.length < (sec === "MC" ? 2 : 3)) { seen.add(s); ds.push(s); } }
  const all = shuffle([fmt(ans)].concat(ds)).map((s: string) => s + unit);
  return { sec, prompt, choices: all, answer: all.indexOf(fmt(ans) + unit), expl, ...extra };
}
function mc3(prompt: string, choices: string[], answer: number, expl: string, svg?: string): Q {
  // keep "C" (both/equal) answers last when the item says so
  const fixed = choices.length === 3 && /^(Both|Equal|Same|No difference|Neither)/i.test(choices[2]);
  if (fixed) return { sec: "MC", prompt, choices, answer, expl, svg };
  const order = shuffle([0, 1, 2].slice(0, choices.length));
  return { sec: "MC", prompt, choices: order.map((i: number) => choices[i]), answer: order.indexOf(answer), expl, svg };
}
const S = (w: number, h: number, body: string): string => `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w * 1.6}px" fill="none" stroke="currentColor" stroke-width="2" font-size="13" font-family="sans-serif">${body}</svg>`;
const T = (x: number, y: number, s: string): string => `<text x="${x}" y="${y}" fill="currentColor" stroke="none" text-anchor="middle">${s}</text>`;

// ---------- DRAWING HELPERS ----------
const F = (s: string, sz = 14, x = 0, y = 0, anchor = "middle", w = 600): string => `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-size="${sz}" font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const L = (x: number, y: number, s: string, sz = 14): string => F(s, sz, x, y);
const DEFS = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor" stroke="none"/></marker><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="1.2"/></pattern></defs>`;
const P = (w: number, h: number, body: string): string => `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${Math.round(w * 1.5)}px;display:block;margin:auto" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" font-family="system-ui,sans-serif">${DEFS}${body}</svg>`;
const ground = (x1: number, x2: number, y: number): string => `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="8" fill="url(#hatch)" stroke="none"/><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
const ceiling = (x1: number, x2: number, y: number): string => `<rect x="${x1}" y="${y - 8}" width="${x2 - x1}" height="8" fill="url(#hatch)" stroke="none"/><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
function gear(cx: number, cy: number, r: number, teeth: number): string {
  const pts: string[] = []; const n = teeth; const ro = r + 5, ri = r - 2;
  for (let k = 0; k < n; k++) { const a = (k / n) * 2 * Math.PI, s = Math.PI / n;
    [[a - s * 0.5, ri], [a - s * 0.3, ro], [a + s * 0.3, ro], [a + s * 0.5, ri]].forEach((p: number[]) => pts.push(`${(cx + p[1] * Math.cos(p[0])).toFixed(1)},${(cy + p[1] * Math.sin(p[0])).toFixed(1)}`)); }
  return `<polygon points="${pts.join(" ")}" fill="currentColor" fill-opacity="0.08"/><circle cx="${cx}" cy="${cy}" r="4" fill="currentColor"/>`;
}
const rot = (cx: number, cy: number, r: number, cw: boolean): string => { // arc arrow above
  const a1 = -2.4, a2 = -0.8; const [s, e] = cw ? [a1, a2] : [a2, a1];
  return `<path d="M${(cx + r * Math.cos(s)).toFixed(1)} ${(cy + r * Math.sin(s)).toFixed(1)} A${r} ${r} 0 0 ${cw ? 1 : 0} ${(cx + r * Math.cos(e)).toFixed(1)} ${(cy + r * Math.sin(e)).toFixed(1)}" stroke-width="2.5" marker-end="url(#ah)"/>`; };
const weight = (x: number, yBottom: number, w: number, label: string): string => `<rect x="${x - w / 2}" y="${yBottom - 28}" width="${w}" height="28" rx="3" fill="currentColor" fill-opacity="0.15"/>${L(x, yBottom - 9, label, 13)}`;
const fulcrum = (x: number, y: number): string => `<path d="M${x} ${y} l-14 26 h28z" fill="currentColor" fill-opacity="0.25"/>`;
const dim = (x1: number, x2: number, y: number, label: string): string => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke-width="1.2" marker-start="url(#ah)" marker-end="url(#ah)"/><line x1="${x1}" y1="${y - 6}" x2="${x1}" y2="${y + 6}" stroke-width="1"/><line x1="${x2}" y1="${y - 6}" x2="${x2}" y2="${y + 6}" stroke-width="1"/>${L((x1 + x2) / 2, y - 5, label, 13)}`;
const vdim = (x: number, y1: number, y2: number, label: string): string => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke-width="1.2" marker-start="url(#ah)" marker-end="url(#ah)"/>${F(label, 13, x + 6, (y1 + y2) / 2 + 4, "start")}`;
const resistor = (x1: number, y: number, x2: number, label: string): string => { const m = (x1 + x2) / 2; let d = `M${x1} ${y} L${m - 24} ${y}`; for (let k = 0; k < 6; k++) d += ` L${m - 24 + k * 8 + 4} ${y + (k % 2 ? 8 : -8)}`; d += ` L${m + 24} ${y} L${x2} ${y}`; return `<path d="${d}"/>${L(m, y - 14, label, 13)}`; };
const vresistor = (x: number, y1: number, y2: number, label: string): string => { const m = (y1 + y2) / 2; let d = `M${x} ${y1} L${x} ${m - 24}`; for (let k = 0; k < 6; k++) d += ` L${x + (k % 2 ? 8 : -8)} ${m - 24 + k * 8 + 4}`; d += ` L${x} ${m + 24} L${x} ${y2}`; return `<path d="${d}"/>${F(label, 13, x + 14, m + 4, "start")}`; };
const battery = (x: number, y1: number, y2: number, label: string): string => { const m = (y1 + y2) / 2; return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${m - 5}"/><line x1="${x - 14}" y1="${m - 5}" x2="${x + 14}" y2="${m - 5}" stroke-width="3"/><line x1="${x - 7}" y1="${m + 5}" x2="${x + 7}" y2="${m + 5}" stroke-width="3"/><line x1="${x}" y1="${m + 5}" x2="${x}" y2="${y2}"/>${F(label, 13, x + 18, m + 22, "start")}${F("+", 12, x + 20, m - 6, "start")}`; };
const lamp = (x: number, y: number, label: string, out = false): string => `<circle cx="${x}" cy="${y}" r="12" fill="white" fill-opacity="0"/><circle cx="${x}" cy="${y}" r="12"/><path d="M${x - 8} ${y - 8} L${x + 8} ${y + 8} M${x + 8} ${y - 8} L${x - 8} ${y + 8}" stroke-width="1.5"/>${out ? L(x, y + 30, "burned out", 11) : ""}${L(x, y - 18, label, 13)}`;
const pic = (prompt: string, svg: string, choices: string[], answer: number, expl: string): Q => ({ sec: "MC", prompt, svg, choices, answer, expl });

// ---------- MECHANICAL CONCEPTS (every item has a picture) ----------
const mcGen: (() => Q)[] = [
  // 1 gear speed, labeled
  () => { const t1 = pick([12, 16, 20, 24, 30, 36]); let t2 = pick([12, 16, 20, 24, 30, 36]); while (t2 === t1) t2 = pick([12, 18, 24, 32, 40]);
    const r1 = 16 + t1 * 1.2, r2 = 16 + t2 * 1.2; const x2 = 38 + 2 * r1 + r2 + 4;
    const svg = P(x2 + r2 + 40, 2 * Math.max(r1, r2) + 50, gear(30 + r1 + 8, Math.max(r1, r2) + 25, r1, t1) + gear(x2, Math.max(r1, r2) + 25, r2, t2) + L(30 + r1 + 8, Math.max(r1, r2) + 25 + r1 + 22, `A: ${t1} teeth`) + L(x2, Math.max(r1, r2) + 25 - r2 - 8, `B: ${t2} teeth`));
    return pic(`Gear A drives gear B as shown. Which gear turns faster?`, svg, ["A", "B", "Same speed"], t1 < t2 ? 0 : 1, `The gear with fewer teeth turns faster. A has ${t1}, B has ${t2}.`); },
  // 2 gear train direction
  () => { const n = R(3, 5); const r = 26; const names = "ABCDE"; let b = ""; for (let k = 0; k < n; k++) { b += gear(40 + k * 62, 70, r, 12) + L(40 + k * 62, 125, names[k], 15); } b += rot(40, 70, r + 14, true);
    const last = names[n - 1]; const cw = n % 2 === 1;
    return pic(`Gear A turns clockwise (arrow). Which way does gear ${last} turn?`, P(40 + (n - 1) * 62 + 50, 140, b), ["Clockwise", "Counterclockwise", "It cannot turn"], cw ? 0 : 1, `Each meshing gear reverses direction. Gear ${last} is gear #${n}, so it turns ${cw ? "clockwise" : "counterclockwise"}.`); },
  // 3 gear revolutions numeric
  () => { const t2 = pick([10, 12, 15, 20]), m = pick([2, 3, 4]); const t1 = t2 * m; const rev = R(2, 6);
    const r1 = 14 + t1 * 0.6, r2 = 14 + t2 * 0.6; const cy = r1 + 25, x2 = 28 + 2 * r1 + r2 + 10;
    const svg = P(x2 + r2 + 30, 2 * r1 + 70, gear(28 + r1, cy, r1, t1) + gear(x2, cy, r2, t2) + L(28 + r1, cy + r1 + 26, `A: ${t1} teeth`) + L(28 + r1, cy + r1 + 44, `${rev} turns`, 12) + L(x2, cy - r2 - 8, `B: ${t2} teeth`));
    return num("MC", `Gear A (${t1} teeth) makes ${rev} turns. How many turns does gear B (${t2} teeth) make?`, rev * m, [rev, rev * m + 1, Math.max(1, rev / m)], `Turns × teeth stays equal: ${rev} × ${t1} = B × ${t2}, B = ${rev * m}.`, "", { svg }); },
  // 4 open belt pulley sizes
  () => { const a = R(14, 26), b = R(36, 52); const swap = Math.random() < 0.5; const [ra, rb] = swap ? [b, a] : [a, b];
    const xa = 20 + ra + 10, xb = xa + 150; const cy = 70;
    const svg = P(xb + rb + 30, 150, `<circle cx="${xa}" cy="${cy}" r="${ra}"/><circle cx="${xb}" cy="${cy}" r="${rb}"/><circle cx="${xa}" cy="${cy}" r="3" fill="currentColor"/><circle cx="${xb}" cy="${cy}" r="3" fill="currentColor"/><line x1="${xa}" y1="${cy - ra}" x2="${xb}" y2="${cy - rb}"/><line x1="${xa}" y1="${cy + ra}" x2="${xb}" y2="${cy + rb}"/>${L(xa, cy + Math.max(ra, rb) + 20, "A")}${L(xb, cy + Math.max(ra, rb) + 20, "B")}`);
    return pic("Two pulleys are connected by a belt. Which pulley turns more revolutions per minute?", svg, ["A", "B", "Same"], ra < rb ? 0 : 1, "Belt speed is equal on both; the smaller pulley turns more times."); },
  // 5 crossed/open belt direction
  () => { const crossed = Math.random() < 0.6; const xa = 60, xb = 220, cy = 70, r = 34;
    const belt = crossed ? `<line x1="${xa}" y1="${cy - r}" x2="${xb}" y2="${cy + r}"/><line x1="${xa}" y1="${cy + r}" x2="${xb}" y2="${cy - r}"/>` : `<line x1="${xa}" y1="${cy - r}" x2="${xb}" y2="${cy - r}"/><line x1="${xa}" y1="${cy + r}" x2="${xb}" y2="${cy + r}"/>`;
    const svg = P(290, 140, `<circle cx="${xa}" cy="${cy}" r="${r}"/><circle cx="${xb}" cy="${cy}" r="${r}"/>${belt}${rot(xa, cy, r + 12, true)}${L(xa, 132, "Driver")}${L(xb, 132, "X")}`);
    return pic(`The driver turns clockwise. Which way does pulley X turn?`, svg, ["Clockwise", "Counterclockwise", "It does not turn"], crossed ? 1 : 0, crossed ? "A crossed belt reverses direction." : "An open belt keeps the same direction."); },
  // 6 lever balance numeric
  () => { const w = R(2, 12) * 10, d1 = R(2, 6), d2 = R(3, 8); const f = w * d1 / d2;
    const sc = 260 / (d1 + d2); const fx = 20 + d1 * sc;
    const svg = P(300, 130, `<line x1="20" y1="70" x2="280" y2="70" stroke-width="5"/>${fulcrum(fx, 72)}${ground(5, 295, 98)}${weight(20 + 14, 68, 40, w + " lb")}<line x1="280" y1="20" x2="280" y2="66" marker-end="url(#ah)" stroke-width="2.5"/>${L(268, 18, "F", 15)}${dim(20, fx, 118, d1 + " ft")}${dim(fx, 280, 118, d2 + " ft")}`.replace('viewBox="0 0 300 130"', 'viewBox="0 0 300 130"'));
    return num("MC", `What force F balances the lever?`, f, [w * d2 / d1, w, w / 2 === f ? w * 2 : w / 2], `Moments: ${w} × ${d1} = F × ${d2}, so F = ${fmt(f)} lb.`, " lb", { svg }); },
  // 7 seesaw which side goes down
  () => { const wa = R(2, 9) * 10, wb = R(2, 9) * 10, da = R(2, 6), db = R(2, 6); const ma = wa * da, mb = wb * db;
    const sc = 120 / 6; const fx = 150;
    const svg = P(300, 140, `<line x1="20" y1="70" x2="280" y2="70" stroke-width="5"/>${fulcrum(fx, 72)}${ground(5, 295, 98)}${weight(fx - da * sc, 68, 38, wa + " lb")}${weight(fx + db * sc, 68, 38, wb + " lb")}${dim(fx - da * sc, fx, 120, da + " ft")}${dim(fx, fx + db * sc, 120, db + " ft")}${L(fx - da * sc, 30, "A")}${L(fx + db * sc, 30, "B")}`);
    return pic("The board is released. What happens?", svg, ["Side A goes down", "Side B goes down", "It stays balanced"], ma > mb ? 0 : mb > ma ? 1 : 2, `Moments: A = ${wa}×${da} = ${ma}, B = ${wb}×${db} = ${mb}.`); },
  // 8 pulley system MA
  () => { const n = pick([2, 3, 4]); const w = n * R(10, 40); let b = ceiling(20, 220, 18);
    b += `<line x1="120" y1="18" x2="120" y2="32"/><rect x="50" y="32" width="140" height="18" rx="6" fill="currentColor" fill-opacity="0.15"/>`;
    for (let k = 0; k < n; k++) { const x = 62 + k * (116 / (n - 1)); b += `<line x1="${x}" y1="50" x2="${x}" y2="120"/>`; }
    b += `<rect x="50" y="120" width="140" height="16" rx="6" fill="currentColor" fill-opacity="0.15"/><line x1="120" y1="136" x2="120" y2="150"/>${weight(120, 182, 70, w + " lb")}`;
    b += `<line x1="190" y1="41" x2="240" y2="41"/><line x1="240" y1="41" x2="240" y2="140" marker-end="url(#ah)"/>${L(250, 158, "Pull")}${F(n + " strands", 12, 196, 100, "start")}`;
    return num("MC", `${n} rope strands hold up the lower block. Ignoring friction, what pull lifts the ${w} lb load?`, w / n, [w, w * n, w / (n + 1)], `Supporting strands = ${n}, so ${w} / ${n} = ${fmt(w / n)} lb.`, " lb", { svg: P(280, 195, b) }); },
  // 9 fixed vs movable pulley (picture A/B)
  () => { const w = R(4, 12) * 10;
    const A = `${ceiling(10, 130, 18)}<line x1="70" y1="18" x2="70" y2="38"/><circle cx="70" cy="50" r="12"/><line x1="58" y1="50" x2="58" y2="130"/><line x1="82" y1="50" x2="82" y2="150" marker-end="url(#ah)"/>${weight(58, 158, 44, w + " lb")}${L(70, 190, "A")}`;
    const B = `${ceiling(160, 290, 18)}<line x1="190" y1="18" x2="190" y2="110"/><circle cx="210" cy="115" r="20"/><line x1="230" y1="115" x2="230" y2="40"/><line x1="230" y1="40" x2="230" y2="24" marker-end="url(#ah)"/><line x1="210" y1="135" x2="210" y2="145"/>${weight(210, 173, 44, w + " lb")}${L(225, 190, "B")}`;
    return pic(`Which setup takes LESS pull to lift the ${w} lb load?`, P(300, 200, A + B), ["A", "B", "Same"], 1, "B is a movable pulley with 2 supporting strands (half the pull). A is a fixed pulley — it only changes direction."); },
  // 10 piston force
  () => { const p = R(2, 10) * 10, a = pick([2, 3, 4, 5, 10]);
    const svg = P(300, 130, `<rect x="40" y="35" width="160" height="60"/><rect x="120" y="38" width="14" height="54" fill="currentColor" fill-opacity="0.4"/><line x1="134" y1="65" x2="270" y2="65" stroke-width="5"/><line x1="10" y1="65" x2="40" y2="65"/><circle cx="20" cy="40" r="16"/><line x1="20" y1="40" x2="29" y2="31"/>${L(20, 18, p + " psi", 12)}${L(80, 70, "air", 12)}${L(127, 115, "area " + a + " sq in", 13)}${L(270, 55, "Force?", 13)}`);
    return num("MC", `Air at ${p} psi pushes on a piston with area ${a} sq in. What force does the rod deliver?`, p * a, [p / a, p + a, p], `F = P × A = ${p} × ${a} = ${p * a} lb.`, " lb", { svg }); },
  // 11 hydraulic jack
  () => { const f = R(1, 5) * 10, a1 = R(1, 3), a2 = a1 * pick([5, 10, 20]);
    const svg = P(300, 150, `<path d="M30 40 V120 H260 V40" /><path d="M80 40 V95 H210 V40" /><rect x="34" y="50" width="42" height="12" fill="currentColor" fill-opacity="0.4"/><rect x="214" y="50" width="42" height="12" fill="currentColor" fill-opacity="0.4"/><line x1="55" y1="10" x2="55" y2="48" marker-end="url(#ah)"/>${L(55, 30, "", 1)}${F(f + " lb", 13, 64, 22, "start")}${L(55, 140, a1 + " sq in", 13)}${L(235, 140, a2 + " sq in", 13)}${L(235, 30, "Lift?", 13)}<rect x="31" y="62" width="48" height="56" fill="currentColor" fill-opacity="0.08" stroke="none"/><rect x="81" y="96" width="128" height="22" fill="currentColor" fill-opacity="0.08" stroke="none"/><rect x="211" y="62" width="48" height="56" fill="currentColor" fill-opacity="0.08" stroke="none"/>`);
    return num("MC", `${f} lb pushes the small piston (${a1} sq in). What force lifts the large piston (${a2} sq in)?`, f * a2 / a1, [f, f * a1 / a2, f * a2], `Pressure ${fmt(f / a1)} psi × ${a2} sq in = ${fmt(f * a2 / a1)} lb.`, " lb", { svg }); },
  // 12 tanks: which bottom pressure greatest
  () => { const hs = shuffle([R(3, 5), R(6, 8), R(9, 12)]); const ws = shuffle([30, 60, 80]); const eq = Math.random() < 0.25; if (eq) { const h = hs[0]; hs[0] = h; hs[1] = h; hs[2] = h; }
    let b = ground(5, 295, 170); let x = 15; const lab = "ABC";
    hs.forEach((h: number, k: number) => { const H = h * 12; b += `<path d="M${x} 30 V170 H${x + ws[k]} V30"/><rect x="${x}" y="${170 - H}" width="${ws[k]}" height="${H}" fill="currentColor" fill-opacity="0.18" stroke="none"/>${L(x + ws[k] / 2, 190, lab[k])}${L(x + ws[k] / 2, 165 - H, h + " ft", 12)}`; x += ws[k] + 22; });
    const mx = Math.max(...hs); const ans = eq ? 3 : hs.indexOf(mx);
    return pic("The tanks hold water to the depths shown. At the bottom of which tank is the pressure greatest?", P(x + 5, 200, b), ["A", "B", "C", "All equal"], ans, eq ? "Same depth → same pressure, regardless of width." : `Pressure depends only on depth; the deepest water (${mx} ft) is in ${lab[hs.indexOf(mx)]}.`); },
  // 13 water column psi
  () => { const ft = R(2, 20) * 5; const v = Math.round(ft * 0.433 * 10) / 10;
    const svg = P(240, 200, `<path d="M90 10 V170 H150 V10"/><rect x="90" y="20" width="60" height="150" fill="currentColor" fill-opacity="0.18" stroke="none"/>${vdim(170, 20, 170, ft + " ft")}<line x1="120" y1="170" x2="120" y2="185"/><circle cx="120" cy="190" r="0" />${L(60, 185, "gauge ?", 13)}${F("0.433 psi/ft", 11, 236, 195, "end")}<circle cx="60" cy="160" r="14"/><line x1="74" y1="166" x2="90" y2="166"/>`);
    return num("MC", `Water stands ${ft} ft deep. Using 0.433 psi per foot, what does the bottom gauge read?`, v, [ft, Math.round(ft * 2.31 * 10) / 10, Math.round(ft / 10 * 10) / 10], `${ft} × 0.433 = ${fmt(v)} psi.`, " psi", { svg }); },
  // 14 pipe narrowing velocity
  () => { const narrowFirst = Math.random() < 0.5;
    const d = narrowFirst ? "M10 60 H110 L140 40 H290 M10 100 H110 L140 120 H290" : "M10 40 H120 L150 60 H290 M10 120 H120 L150 100 H290";
    const svg = P(300, 150, `<path d="${d}"/><line x1="20" y1="80" x2="60" y2="80" marker-end="url(#ah)"/>${L(40, 72, "flow", 12)}${L(70, 140, "A")}${L(230, 140, "B")}<circle cx="70" cy="80" r="4" fill="currentColor"/><circle cx="230" cy="80" r="4" fill="currentColor"/>`);
    return pic("Water flows through the pipe. At which point is the water moving faster?", svg, ["A", "B", "Same"], narrowFirst ? 0 : 1, "The same flow through a smaller pipe must move faster."); },
  // 15 Ohm's law circuit
  () => { const r = pick([2, 3, 4, 6, 8, 12]); const v = r * R(1, 10);
    const svg = P(260, 160, `${battery(40, 30, 130, v + " V")}<line x1="40" y1="30" x2="80" y2="30"/>${resistor(80, 30, 200, r + " Ω")}<line x1="200" y1="30" x2="220" y2="30"/><line x1="220" y1="30" x2="220" y2="130"/><line x1="40" y1="130" x2="220" y2="130"/><circle cx="130" cy="130" r="14" fill="currentColor" fill-opacity="0.05"/>${L(130, 135, "A", 13)}`);
    return num("MC", `What current does the ammeter (A) read?`, v / r, [v * r, r / v, v + r], `I = V / R = ${v} / ${r} = ${fmt(v / r)} A.`, " A", { svg }); },
  // 16 series resistors
  () => { const a = R(2, 12), b = R(2, 12), c = R(1, 10);
    const svg = P(300, 140, `<line x1="10" y1="40" x2="20" y2="40"/>${resistor(20, 40, 110, a + " Ω")}${resistor(110, 40, 200, b + " Ω")}${resistor(200, 40, 290, c + " Ω")}<circle cx="10" cy="40" r="4"/><circle cx="290" cy="40" r="4"/>${L(10, 70, "X", 15)}${L(290, 70, "Y", 15)}`);
    return num("MC", `What is the total resistance between X and Y?`, a + b + c, [a + b, a * b + c, Math.max(a, b, c)], `Series: ${a} + ${b} + ${c} = ${a + b + c} Ω.`, " Ω", { svg }); },
  // 17 parallel resistors
  () => { const n = pick([2, 3, 4]); const r = pick([6, 12, 24]);
    let b = `<line x1="20" y1="30" x2="${40 + (n - 1) * 70 + 20}" y2="30"/><line x1="20" y1="140" x2="${40 + (n - 1) * 70 + 20}" y2="140"/><circle cx="20" cy="30" r="4"/><circle cx="20" cy="140" r="4"/>${F("X", 15, 8, 26, "end")}${F("Y", 15, 8, 146, "end")}`;
    for (let k = 0; k < n; k++) b += vresistor(50 + k * 70, 30, 140, r + " Ω"); b += F(n + " resistors", 12, 20, 158, "start");
    return num("MC", `${n} equal resistors are in parallel. Total resistance between X and Y?`, r / n, [r * n, r, r / (n + 1)], `Equal parallel resistors: ${r} / ${n} = ${fmt(r / n)} Ω.`, " Ω", { svg: P(40 + (n - 1) * 70 + 70, 160, b) }); },
  // 18 lamps series/parallel burnout
  () => { const par = Math.random() < 0.5; const out = R(1, 3); let b: string;
    if (!par) b = `${battery(30, 40, 140, "")}<line x1="30" y1="40" x2="270" y2="40"/><line x1="270" y1="40" x2="270" y2="140"/><line x1="30" y1="140" x2="270" y2="140"/>${[1, 2, 3].map((k: number) => `<rect x="${40 + k * 55}" y="28" width="30" height="24" fill="currentColor" fill-opacity="0" stroke="none"/>` + lamp(55 + k * 55, 40, "L" + k, k === out)).join("")}`;
    else b = `${battery(30, 40, 160, "")}<line x1="30" y1="40" x2="250" y2="40"/><line x1="30" y1="160" x2="250" y2="160"/>${[1, 2, 3].map((k: number) => `<line x1="${30 + k * 70}" y1="40" x2="${30 + k * 70}" y2="88"/><line x1="${30 + k * 70}" y1="112" x2="${30 + k * 70}" y2="160"/>` + lamp(30 + k * 70, 100, "", k === out) + F("L" + k, 13, 30 + k * 70 + 18, 104, "start")).join("")}`;
    return pic(`Lamp L${out} burns out. How many of the other lamps stay lit?`, P(290, par ? 185 : 175, b), ["0", "1", "2"], par ? 2 : 0, par ? "Parallel: each lamp has its own path, so the other 2 stay lit." : "Series: one path; a burned-out lamp opens the circuit and all go dark."); },
  // 19 ramp force
  () => { const w = R(2, 10) * 50, h = R(2, 6), l = h * pick([2, 3, 4]);
    const W = 240, H = 240 * h / l * 0.9; const ang = Math.atan2(H, Math.sqrt(W * W)); void ang;
    const svg = P(340, H + 70, `${ground(10, 330, H + 30)}<path d="M30 ${H + 30} L${30 + W} ${H + 30} L${30 + W} 30 Z" fill="currentColor" fill-opacity="0.07"/><rect x="100" y="${H + 30 - (70 / W) * H - 30}" width="34" height="24" transform="rotate(${-(Math.atan2(H, W) * 180 / Math.PI).toFixed(1)} 117 ${H + 30 - (70 / W) * H - 18})" fill="currentColor" fill-opacity="0.2"/>${L(117, H + 30 - (70 / W) * H - 40, w + " lb", 13)}${vdim(30 + W + 6, 30, H + 30, h + " ft")}${L(30 + W / 2 + 40, H / 2 + 30 + 34, l + " ft long", 13)}`);
    return num("MC", `Ignoring friction, what force along the ramp pushes the ${w} lb load up?`, w * h / l, [w, w * l / h, w / 2 === w * h / l ? w / 5 : w / 2], `Work in = work out: F × ${l} = ${w} × ${h}, so F = ${fmt(w * h / l)} lb.`, " lb", { svg }); },
  // 20 two ramps
  () => { const h = R(3, 6); const la = R(6, 10), lb = la + R(3, 6); const sw = Math.random() < 0.5; const [LA, LB] = sw ? [lb, la] : [la, lb];
    const drawR = (x: number, len: number, lab: string): string => `<path d="M${x} 130 L${x + len * 10} 130 L${x + len * 10} ${130 - h * 12} Z" fill="currentColor" fill-opacity="0.07"/>${L(x + len * 5, 150, lab + ": " + len + " ft long", 12)}${F(h + " ft", 12, x + len * 10 + 4, 130 - h * 6, "start")}`;
    const svg = P(30 + (LA + LB) * 10 + 60, 160, ground(5, 30 + (LA + LB) * 10 + 55, 130) + drawR(10, LA, "A") + drawR(40 + LA * 10, LB, "B"));
    return pic("Both ramps rise to the same height. On which ramp is LESS force needed to push the same box up?", svg, ["A", "B", "Same"], LA > LB ? 0 : 1, "The longer ramp spreads the same work over more distance, so it takes less force."); },
  // 21 screw advance
  () => { const tpi = pick([8, 10, 16, 20]), k = R(2, 10); const turns = k * tpi / 2;
    let b = `<rect x="20" y="40" width="40" height="50" fill="currentColor" fill-opacity="0.2"/><line x1="60" y1="50" x2="270" y2="50"/><line x1="60" y1="80" x2="270" y2="80"/>`;
    for (let x = 64; x < 268; x += 10) b += `<line x1="${x}" y1="50" x2="${x + 6}" y2="80" stroke-width="1.5"/>`;
    b += dim(60, 140, 112, `${tpi} threads per inch`) + L(150, 25, `${turns} turns`, 13) + rot(40, 65, 34, true);
    return num("MC", `The screw has ${tpi} threads per inch. How far does it move in ${turns} turns?`, k / 2, [turns, k, tpi / k], `Each turn advances 1/${tpi} in: ${turns} ÷ ${tpi} = ${fmt(k / 2)} in.`, " in", { svg: P(290, 125, b) }); },
  // 22 beam supports: which carries more
  () => { const pos = R(1, 9); const x = 30 + pos * 24;
    const svg = P(300, 140, `<rect x="30" y="56" width="240" height="12" fill="currentColor" fill-opacity="0.15"/>${fulcrum(40, 68)}${fulcrum(260, 68)}${ground(10, 290, 96)}${weight(x, 56, 40, "W")}${L(40, 120, "A")}${L(260, 120, "B")}`.replace(/<path d="M40 68 l-14 26 h28z"/, `<path d="M40 68 l-14 26 h28z"`));
    return pic("A weight W sits on a beam held up by supports A and B. Which support carries more of the weight?", svg, ["A", "B", "Equal"], pos < 5 ? 0 : pos > 5 ? 1 : 2, "The support closer to the load carries more of it; at the exact middle they share it equally."); },
  // 23 beam lift hook point
  () => { const heavy = Math.random() < 0.5 ? "left" : "right"; const hooks = [90, 150, 210];
    const wx = heavy === "left" ? 50 : 250;
    const svg = P(300, 150, `<rect x="30" y="80" width="240" height="14" fill="currentColor" fill-opacity="0.15"/>${weight(wx, 80, 44, "heavy")}${hooks.map((x: number, k: number) => `<circle cx="${x}" cy="80" r="5"/>${L(x, 116, "ABC"[k], 15)}`).join("")}<path d="M150 10 v20" />${L(150, 40, "crane hook", 11)}`);
    return pic("A beam carries a heavy block on one end. At which point should the crane hook attach to lift it level?", svg, ["A", "B", "C"], heavy === "left" ? 0 : 2, "Hook above the center of gravity, which shifts toward the heavy end."); },
  // 24 cylinder ports
  () => { const dir = Math.random() < 0.5 ? "lower" : "raise";
    const svg = P(220, 200, `<rect x="70" y="30" width="80" height="140"/><rect x="72" y="90" width="76" height="16" fill="currentColor" fill-opacity="0.4"/><line x1="110" y1="106" x2="110" y2="195" stroke-width="5"/><line x1="150" y1="45" x2="200" y2="45"/>${L(208, 50, "A", 15)}<line x1="150" y1="155" x2="200" y2="155"/>${L(208, 160, "B", 15)}${L(40, 100, "piston", 12)}`);
    return pic(`At which port should pressurized air enter to ${dir} the piston?`, svg, ["A", "B", "Both"], dir === "lower" ? 0 : 1, dir === "lower" ? "Air at A (above) pushes the piston down." : "Air at B (below) pushes the piston up."); },
  // 25 wrench torque
  () => { const la = R(6, 18), lb = R(6, 18) === la ? la + 4 : R(6, 18); const f = R(2, 8) * 10; const LB2 = lb === la ? la + 4 : lb;
    const w = (y: number, len: number, lab: string): string => `<circle cx="30" cy="${y}" r="12"/><rect x="40" y="${y - 6}" width="${len * 12}" height="12" rx="5" fill="currentColor" fill-opacity="0.15"/><line x1="${40 + len * 12}" y1="${y - 34}" x2="${40 + len * 12}" y2="${y - 8}" marker-end="url(#ah)"/>${F(f + " lb", 12, 44 + len * 12, y - 24, "start")}${F(lab + ": " + len + " in", 13, 40, y + 26, "start")}`;
    return pic(`The same ${f} lb force is applied at the end of each wrench. Which gives more torque on the nut?`, P(Math.max(la, LB2) * 12 + 110, 190, w(60, la, "A") + w(150, LB2, "B")), ["A", "B", "Same"], la > LB2 ? 0 : 1, `Torque = force × length: A = ${f * la} in-lb, B = ${f * LB2} in-lb.`); },
  // 26 wheel and axle
  () => { const R1 = pick([12, 15, 18, 20, 24]), r = pick([3, 4, 6]); const w = r === 0 ? 1 : R(2, 8) * R1 / gcd(R1, r);
    const svg = P(300, 200, `<circle cx="110" cy="70" r="${R1 * 2.5}"/><circle cx="110" cy="70" r="${r * 2.5}" fill="currentColor" fill-opacity="0.2"/><line x1="${110 - r * 2.5}" y1="70" x2="${110 - r * 2.5}" y2="150"/>${weight(110 - r * 2.5, 178, 50, w + " lb")}<line x1="${110 + R1 * 2.5}" y1="70" x2="${110 + R1 * 2.5}" y2="150" marker-end="url(#ah)"/>${F("F?", 14, 116 + R1 * 2.5, 140, "start")}${F("wheel radius " + R1 + " in", 12, 190, 25, "start")}${F("axle radius " + r + " in", 12, 190, 45, "start")}`);
    return num("MC", `A ${w} lb load hangs from the axle (radius ${r} in). What force F on the wheel rim (radius ${R1} in) holds it?`, w * r / R1, [w, w * R1 / r, w / 2], `F × ${R1} = ${w} × ${r}, F = ${fmt(w * r / R1)} lb.`, " lb", { svg }); },
  // 27 bimetal strip
  () => { const top = Math.random() < 0.5 ? "brass" : "steel";
    const svg = P(300, 150, `<rect x="40" y="60" width="200" height="12" fill="currentColor" fill-opacity="0.35"/><rect x="40" y="72" width="200" height="12" fill="currentColor" fill-opacity="0.1"/>${F(top, 12, 250, 70, "start")}${F(top === "brass" ? "steel" : "brass", 12, 250, 84, "start")}<rect x="20" y="50" width="20" height="44" fill="url(#hatch)"/>${L(140, 130, "heated", 13)}<path d="M120 120 q5 -8 0 -16 q-5 -8 0 -16" stroke-width="1.5"/><path d="M160 120 q5 -8 0 -16 q-5 -8 0 -16" stroke-width="1.5"/>${L(150, 30, "↑ Up = A     ↓ Down = B", 13)}`);
    return pic("The strip is brass (expands more when hot) bonded to steel, as shown. When heated, the free end bends:", svg, ["A (up)", "B (down)", "It stays straight"], top === "brass" ? 1 : 0, "Brass grows more, so it ends up on the outside of the curve; the strip bends toward the steel."); },
  // 28 holes in tank: which squirts farthest
  () => { const hs = [50, 95, 140];
    const svg = P(300, 200, `<path d="M40 20 V170 H120 V20"/><rect x="40" y="30" width="80" height="140" fill="currentColor" fill-opacity="0.15" stroke="none"/>${ground(10, 290, 170)}${hs.map((y: number, k: number) => `<circle cx="120" cy="${y}" r="3" fill="currentColor"/>${F("ABC"[k], 15, 105, y + 5, "end")}`).join("")}`);
    return pic("The tank has three equal holes. From which hole does water spray out with the most pressure?", svg, ["A", "B", "C"], 2, "Pressure increases with depth; C is deepest."); },
  // 29 sling angles
  () => { const w = R(4, 20) * 50;
    const svg = P(300, 180, `<circle cx="80" cy="20" r="5"/><line x1="80" y1="25" x2="55" y2="120"/><line x1="80" y1="25" x2="105" y2="120"/>${weight(80, 148, 70, w + " lb")}${L(80, 172, "A")}<circle cx="220" cy="80" r="5"/><line x1="220" y1="85" x2="160" y2="120"/><line x1="220" y1="85" x2="280" y2="120"/>${weight(220, 148, 70, w + " lb")}${L(220, 172, "B")}`);
    return pic(`Each ${w} lb load hangs from two slings. In which setup is the tension in each sling GREATER?`, svg, ["A", "B", "Same"], 1, "The wider the sling angle, the higher the tension in each leg."); },
  // 30 heated ring on shaft
  () => { const svg = P(260, 140, `<rect x="20" y="58" width="220" height="24" fill="currentColor" fill-opacity="0.12"/><rect x="110" y="40" width="40" height="60" fill="currentColor" fill-opacity="0.3"/>${L(130, 30, "ring", 12)}${L(60, 110, "shaft", 12)}`);
    return pic("A steel ring is stuck tight on a steel shaft. What will help remove it?", svg, ["Heat the ring", "Cool the ring", "Heat the whole shaft and ring equally"], 0, "Heating the ring expands its bore, loosening its grip on the shaft."); },
  // 31 meshing gear + rack
  () => { const cw = Math.random() < 0.5;
    let b = gear(140, 60, 40, 16) + rot(140, 60, 56, cw) + `<rect x="30" y="107" width="220" height="14" fill="currentColor" fill-opacity="0.15"/>`; for (let x = 34; x < 250; x += 12) b += `<path d="M${x} 107 l3 -6 h4 l3 6" stroke-width="1.5"/>`;
    b += L(60, 145, "← A", 14) + L(220, 145, "B →", 14);
    return pic(`The gear turns ${cw ? "clockwise" : "counterclockwise"} and drives the rack below it. Which way does the rack move?`, P(280, 155, b), ["Toward A", "Toward B", "It doesn't move"], cw ? 0 : 1, `The bottom of a ${cw ? "clockwise" : "counterclockwise"} gear moves ${cw ? "left" : "right"}, carrying the rack with it.`); },
];
function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a; }

// ---------- GRAPHIC PROBLEM SOLVING ----------
const gpsGen: (() => Q)[] = [
  () => { const a = R(3, 12), b = R(3, 12), c = R(3, 12); const tot = a + b + c;
    return num("GPS", `A pipe run is drawn below. What is its total length?`, tot, [a + b, tot + c, a * b], `Add the segments: ${a} + ${b} + ${c} = ${tot} ft.`, " ft",
      { svg: S(260, 110, `<polyline points="20,90 120,90 120,30 240,30"/>${T(70, 105, a + "' ")}${T(140, 65, b + "'")}${T(180, 22, c + "'")}`) }); },
  () => { const L = R(8, 30), W = R(5, 20);
    return num("GPS", `A rectangular pad measures ${L} ft by ${W} ft (see sketch). What is its area?`, L * W, [2 * (L + W), L + W, L * W / 2], `Area = length × width = ${L} × ${W} = ${L * W} sq ft.`, " sq ft",
      { svg: S(220, 110, `<rect x="30" y="20" width="160" height="70"/>${T(110, 15, L + " ft")}${T(205, 60, W + " ft")}`) }); },
  () => { const L = R(10, 40), W = R(6, 20);
    return num("GPS", `How many feet of fence surround a ${L} ft by ${W} ft rectangular yard (sketch)?`, 2 * (L + W), [L * W, L + W, 2 * L + W], `Perimeter = 2 × (${L} + ${W}) = ${2 * (L + W)} ft.`, " ft",
      { svg: S(220, 110, `<rect x="30" y="20" width="160" height="70" stroke-dasharray="6 4"/>${T(110, 15, L + " ft")}${T(205, 60, W + " ft")}`) }); },
  () => { const total = R(30, 90), a = R(5, 15), b = R(5, 15); const x = total - a - b;
    return num("GPS", `The overall length of the part below is ${total} in. Find dimension X.`, x, [x + a, total - a, x - 2], `X = ${total} − ${a} − ${b} = ${x} in.`, " in",
      { svg: S(280, 90, `<rect x="20" y="30" width="240" height="30"/><line x1="20" y1="75" x2="260" y2="75"/>${T(140, 88, "overall " + total + "\"")}${T(50, 22, a + "\"")}${T(140, 22, "X")}${T(230, 22, b + "\"")}<line x1="80" y1="30" x2="80" y2="60"/><line x1="200" y1="30" x2="200" y2="60"/>`) }); },
  () => { const items = [["Gasket", R(2, 9)], ["Bolt", R(1, 4)], ["Filter", R(10, 30)]] as [string, number][]; const q = [R(2, 6), R(4, 12), R(1, 3)]; const tot = items.reduce((s: number, it: [string, number], i: number) => s + it[1] * q[i], 0);
    return num("GPS", `Using the parts list, what is the total cost of the order?`, tot, [tot + items[0][1], items.reduce((s: number, it: [string, number]) => s + it[1], 0), tot - items[2][1]], `Multiply each price × qty and add: ${items.map((it: [string, number], i: number) => `${it[1]}×${q[i]}`).join(" + ")} = $${tot}.`, "",
      { table: { cols: ["Part", "Price ($)", "Qty"], rows: items.map((it: [string, number], i: number) => [it[0], String(it[1]), String(q[i])]) } }); },
  () => { const r = R(4, 12) * 5; const h = R(2, 8);
    return num("GPS", `A tank gauge shows level dropping at ${r} gal/hr. How many gallons are used in ${h} hr?`, r * h, [r + h, r * (h + 1), r * h / 2], `${r} × ${h} = ${r * h} gal.`, " gal"); },
  () => { const sc = pick([4, 8, 10, 20]), m = R(2, 9) + pick([0, 0.5]);
    return num("GPS", `On a drawing with scale 1 in. = ${sc} ft, a wall measures ${m} in. Actual length?`, sc * m, [sc + m, sc * m / 2, m * 12], `${m} × ${sc} = ${fmt(sc * m)} ft.`, " ft", { svg: P(300, 110, `<rect x="20" y="30" width="${m * 26}" height="16" fill="url(#hatch)"/>${dim(20, 20 + m * 26, 72, m + " in on drawing")}${F("SCALE 1 in = " + sc + " ft", 12, 20, 100, "start")}`) }); },
  () => { const d = R(2, 10) * 2; const area = Math.round(3.14 * (d / 2) ** 2 * 100) / 100;
    return num("GPS", `A round plate has diameter ${d} in. Using π = 3.14, its area is:`, area, [Math.round(3.14 * d * 100) / 100, Math.round(3.14 * d * d * 100) / 100, d * d], `A = πr² = 3.14 × ${d / 2}² = ${area} sq in.`, " sq in", { svg: P(200, 150, `<circle cx="100" cy="70" r="55" fill="currentColor" fill-opacity="0.08"/>${dim(45, 155, 140, "Ø " + d + " in")}`) }); },
  () => { const L = R(4, 10), W = R(3, 8), H = R(2, 6);
    return num("GPS", `A box-shaped sump is ${L} ft long, ${W} ft wide, ${H} ft deep. Volume?`, L * W * H, [L * W + H, 2 * (L * W + W * H + L * H), L * W], `V = ${L} × ${W} × ${H} = ${L * W * H} cu ft.`, " cu ft", { svg: P(260, 160, `<path d="M30 60 H170 V140 H30 Z M30 60 L80 25 H220 L170 60 M220 25 V105 L170 140" fill="currentColor" fill-opacity="0.06"/>${F(L + " ft", 13, 100, 155)}${F(W + " ft", 13, 205, 140, "start")}${F(H + " ft", 13, 26, 104, "end")}`) }); },
  () => { const hrs = [R(6, 10), R(6, 10), R(6, 10), R(6, 10), R(6, 10)]; const rate = R(38, 46); const t = hrs.reduce((a: number, b: number) => a + b, 0);
    return num("GPS", `Using the timesheet, what is gross pay at $${rate}/hr (no overtime)?`, t * rate, [t * rate + rate, 40 * rate, (t - 1) * rate], `Total hours ${t} × $${rate} = $${t * rate}.`, "",
      { table: { cols: ["Day", "Hours"], rows: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d: string, i: number) => [d, String(hrs[i])]) } }); },
  () => { const a = R(30, 70), b = R(20, 60);
    return num("GPS", `A right-angle bend: the horizontal leg is ${a % 2 ? a + 1 : a} in. and the vertical leg ${b % 2 ? b + 1 : b} in. Total pipe?`, (a % 2 ? a + 1 : a) + (b % 2 ? b + 1 : b), [a * b, a + b + 20, Math.abs(a - b) + 1], `Add the two legs.`, " in", { svg: P(200, 170, `<polyline points="30,140 160,140 160,20" stroke-width="8" stroke-opacity="0.35"/>${L(95, 162, (a % 2 ? a + 1 : a) + " in", 13)}${F((b % 2 ? b + 1 : b) + " in", 13, 170, 85, "start")}`) }); },
  () => { const pct = pick([10, 15, 20, 25]), p = R(4, 20) * 20;
    return num("GPS", `A part listed at $${p} has a ${pct}% discount. Sale price?`, p * (100 - pct) / 100, [p * pct / 100, p - pct, p], `${p} − ${pct}% of ${p} (${p * pct / 100}) = ${p * (100 - pct) / 100}.`, ""); },
  () => { const n = R(3, 8), sp = R(12, 24); 
    return num("GPS", `${n} posts are set in a straight line ${sp} in. apart (center to center). Distance from first to last post?`, (n - 1) * sp, [n * sp, (n + 1) * sp, (n - 2) * sp], `There are ${n - 1} gaps: ${n - 1} × ${sp} = ${(n - 1) * sp} in.`, " in", { svg: P(300, 100, ground(5, 295, 70) + Array.from({ length: n }, (_: unknown, k: number) => `<rect x="${20 + k * 250 / (n - 1) - 4}" y="25" width="8" height="45" fill="currentColor" fill-opacity="0.4"/>`).join("") + dim(20, 20 + 250 / (n - 1), 15, sp + " in") + L(150, 92, n + " posts", 12)) }); },
  () => { const v = [R(10, 40), R(10, 40), R(10, 40), R(10, 40)]; const avg = (v[0] + v[1] + v[2] + v[3]) / 4;
    return num("GPS", `The chart shows weekly runtime hours for 4 pumps. Average runtime?`, avg, [avg + 5, Math.max(...v), v[0] + v[1]], `Sum ${v.join(" + ")} = ${v[0] + v[1] + v[2] + v[3]}; ÷ 4 = ${fmt(avg)} hr.`, " hr",
      { svg: S(260, 130, v.map((x: number, i: number) => `<rect x="${30 + i * 55}" y="${110 - x * 2}" width="35" height="${x * 2}"/>${T(47 + i * 55, 104 - x * 2, String(x))}${T(47 + i * 55, 125, "P" + (i + 1))}`).join("") + `<line x1="20" y1="110" x2="250" y2="110"/>`) }); },
];

// ---------- INTERPRETING DIAGRAMS ----------
function grid(): Q {
  const syms = [["●", "Valve OPEN"], ["○", "Valve CLOSED"], ["▲", "Pump RUNNING"], ["△", "Pump STOPPED"], ["■", "Breaker CLOSED"], ["□", "Breaker OPEN"]];
  const rows = ["A", "B", "C", "D"], cols = [1, 2, 3, 4];
  const cells: string[][] = rows.map(() => cols.map(() => ""));
  const placed: [number, number, number][] = [];
  const idx = shuffle([...Array(16).keys()]).slice(0, 6);
  idx.forEach((k: number, i: number) => { const r = Math.floor(k / 4), c = k % 4; const s = i % 6; cells[r][c] = syms[s][0]; placed.push([r, c, s]); });
  const legend = syms.map((s: string[]) => `${s[0]} = ${s[1]}`).join(", ");
  const tbl = { cols: ["", "1", "2", "3", "4"], rows: rows.map((r: string, i: number) => [r].concat(cells[i].map((x: string) => x || "·"))) };
  const gsvg = P(260, 230, `<rect x="40" y="30" width="200" height="190" fill="currentColor" fill-opacity="0.04"/>` + [0,1,2,3,4].map((k: number) => `<line x1="${40+k*50}" y1="30" x2="${40+k*50}" y2="220" stroke-width="1"/>` + (k<5?`<line x1="40" y1="${30+k*47.5}" x2="240" y2="${30+k*47.5}" stroke-width="1"/>`:"")).join("") + [1,2,3,4].map((c: number) => L(15+c*50, 22, String(c))).join("") + rows.map((r: string, i: number) => F(r, 14, 28, 60+i*47.5, "middle")).join("") + cells.map((row: string[], i: number) => row.map((x: string, c: number) => x ? F(x, 28, 65+c*50, 64+i*47.5, "middle", 400) : "").join("")).join(""));
  const t = R(0, 2);
  if (t === 0) { const p = pick(placed); const ans = syms[p[2]][1]; const others = shuffle(syms.map((s: string[]) => s[1]).filter((x: string) => x !== ans)).slice(0, 3); const ch = shuffle([ans].concat(others));
    return { sec: "ID", prompt: `Legend: ${legend}. What is the status of the equipment at grid ${rows[p[0]]}${p[1] + 1}?`, svg: gsvg, choices: ch, answer: ch.indexOf(ans), expl: `${rows[p[0]]}${p[1] + 1} shows ${syms[p[2]][0]}, which is ${ans}.` }; }
  if (t === 1) { const p = pick(placed); const ans = `${rows[p[0]]}${p[1] + 1}`; const opts = new Set<string>([ans]); while (opts.size < 4) opts.add(`${pick(rows)}${R(1, 4)}`); const ch = shuffle([...opts]);
    return { sec: "ID", prompt: `Legend: ${legend}. Where is the ${syms[p[2]][1].toLowerCase()} located?`, svg: gsvg, choices: ch, answer: ch.indexOf(ans), expl: `The symbol ${syms[p[2]][0]} appears only at ${ans}.` }; }
  const r = R(0, 3); const cnt = placed.filter((p: [number, number, number]) => p[0] === r).length;
  return num("ID", `Legend: ${legend}. How many pieces of equipment (any symbol) are in row ${rows[r]}?`, cnt === 0 ? 0.0001 : cnt, [cnt + 1, cnt + 2, cnt + 3], `Count the symbols across row ${rows[r]}: ${cnt}.`, "", { svg: gsvg });
}
function sld(): Q {
  // feeders from a bus; each through breaker; status random
  const n = 4; const st = [0, 1, 2, 3].map(() => Math.random() < 0.5);
  const busOn = Math.random() < 0.8; const k = R(0, 3);
  const energized = busOn && st[k];
  const svg = S(300, 150, `<line x1="20" y1="25" x2="280" y2="25" stroke-width="4"/>${T(150, 15, "MAIN BUS " + (busOn ? "(energized)" : "(de-energized)"))}` + [0, 1, 2, 3].map((i: number) => { const x = 50 + i * 65; return `<line x1="${x}" y1="25" x2="${x}" y2="60"/>${st[i] ? `<rect x="${x - 10}" y="60" width="20" height="20" fill="currentColor"/>` : `<rect x="${x - 10}" y="60" width="20" height="20"/>`}<line x1="${x}" y1="80" x2="${x}" y2="120"/>${T(x, 140, "F" + (i + 1))}`; }).join(""));
  const ch = ["Energized", "De-energized"];
  return { sec: "ID", prompt: "Filled square = breaker CLOSED, open square = breaker OPEN. Is feeder F" + (k + 1) + " energized?", svg, choices: ch, answer: energized ? 0 : 1, expl: `A feeder is energized only if the bus is energized AND its breaker is closed. Bus ${busOn ? "on" : "off"}, F${k + 1} breaker ${st[k] ? "closed" : "open"}.` };
}
function mapQ(): Q {
  const names = shuffle(["Pump House", "Substation", "Warehouse", "Boiler Bldg", "Tank Farm", "Gate 2"]).slice(0, 4);
  const pos: [number, number][] = []; const used = new Set<string>();
  while (pos.length < 4) { const p: [number, number] = [R(0, 4), R(0, 4)]; if (!used.has(p.join())) { used.add(p.join()); pos.push(p); } }
  const L = "ABCDE";
  const svg = S(260, 230, [0, 1, 2, 3, 4, 5].map((i: number) => `<line x1="${30 + i * 44}" y1="20" x2="${30 + i * 44}" y2="240" stroke-width="0.5"/><line x1="30" y1="${20 + i * 44}" x2="250" y2="${20 + i * 44}" stroke-width="0.5"/>`).join("")
    + [0, 1, 2, 3, 4].map((i: number) => T(52 + i * 44, 14, String(i + 1)) + T(18, 46 + i * 44, L[i])).join("")
    + pos.map((p: [number, number], i: number) => `<circle cx="${52 + p[1] * 44}" cy="${42 + p[0] * 44}" r="12"/>${T(52 + p[1] * 44, 47 + p[0] * 44, String(i + 1))}`).join("")).replace('viewBox="0 0 260 230"', 'viewBox="0 0 260 245"');
  const key = names.map((n: string, i: number) => `${i + 1} = ${n}`).join(", ");
  const k = R(0, 3); const ans = `${L[pos[k][0]]}${pos[k][1] + 1}`; const opts = new Set<string>([ans]); pos.forEach((p: [number, number]) => opts.add(`${L[p[0]]}${p[1] + 1}`)); while (opts.size < 4) opts.add(`${L[R(0, 4)]}${R(1, 5)}`);
  const ch = shuffle([...opts].slice(0, 4).includes(ans) ? [...opts].slice(0, 4) : [ans].concat([...opts].slice(1, 4)));
  return { sec: "ID", prompt: `Site map key: ${key}. In which grid square is the ${names[k]}? (row letter, column number)`, svg, choices: ch, answer: ch.indexOf(ans), expl: `Marker ${k + 1} sits in row ${L[pos[k][0]]}, column ${pos[k][1] + 1}.` };
}
function valveQ(): Q {
  const v = [Math.random() < 0.6, Math.random() < 0.6, Math.random() < 0.6]; // V1 series, V2 & V3 parallel branches
  const flow = v[0] && (v[1] || v[2]);
  const svg = S(300, 120, `<line x1="10" y1="60" x2="90" y2="60"/>${T(30, 50, "IN")}<rect x="60" y="50" width="20" height="20" ${v[0] ? 'fill="currentColor"' : ""}/>${T(70, 90, "V1")}<line x1="90" y1="60" x2="120" y2="60"/><line x1="120" y1="30" x2="120" y2="90"/><line x1="120" y1="30" x2="240" y2="30"/><line x1="120" y1="90" x2="240" y2="90"/><rect x="170" y="20" width="20" height="20" ${v[1] ? 'fill="currentColor"' : ""}/>${T(180, 15, "V2")}<rect x="170" y="80" width="20" height="20" ${v[2] ? 'fill="currentColor"' : ""}/>${T(180, 115, "V3")}<line x1="240" y1="30" x2="240" y2="90"/><line x1="240" y1="60" x2="290" y2="60"/>${T(275, 50, "OUT")}`);
  const ch = ["Yes", "No"];
  return { sec: "ID", prompt: "Filled square = valve OPEN, empty square = valve CLOSED. V1 is in the main line; V2 and V3 are on parallel branches. Can water reach OUT?", svg, choices: ch, answer: flow ? 0 : 1, expl: `Flow needs V1 open AND (V2 or V3) open. V1 ${v[0] ? "open" : "closed"}, V2 ${v[1] ? "open" : "closed"}, V3 ${v[2] ? "open" : "closed"}.` };
}
const idGen: (() => Q)[] = [grid, grid, sld, mapQ, valveQ];

// ---------- REASONING FROM RULES ----------
function schedRule(): Q {
  const regions = shuffle(["North", "South", "East", "West"]).slice(0, 2); const cost = R(3, 9) * 1000;
  const rules = `Rules: 1) Grade A orders over $${cost.toLocaleString()}: use Line 1 if from ${regions[0]}, Line 2 if from ${regions[1]}. 2) Grade A orders $${cost.toLocaleString()} or less: use Line 3. 3) Grade B: Line 4 if coiled, Line 5 if stacked.`;
  const g = pick(["A", "B"]); let prompt: string, ans: string, why: string;
  if (g === "A") { const c = cost + pick([-1, 1]) * R(1, 3) * 500; const reg = pick(regions); ans = c > cost ? (reg === regions[0] ? "Line 1" : "Line 2") : "Line 3"; prompt = `A Grade A order from ${reg} costs $${c.toLocaleString()}. Which line?`; why = c > cost ? `Over $${cost.toLocaleString()} and from ${reg} → ${ans}.` : `Not over $${cost.toLocaleString()} → Line 3 regardless of region.`; }
  else { const f = pick(["coiled", "stacked"]); ans = f === "coiled" ? "Line 4" : "Line 5"; prompt = `A Grade B order is to be ${f}. Which line?`; why = `Grade B ${f} → ${ans}.`; }
  const ch = shuffle(["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"].filter((x: string) => x !== ans)).slice(0, 3).concat([ans]); const c2 = shuffle(ch);
  return { sec: "RR", prompt: rules + " " + prompt, choices: c2, answer: c2.indexOf(ans), expl: why };
}
function permitRule(): Q {
  const lim = R(4, 8) * 10;
  const rules = `Work rules: A hot-work permit is required for any welding. A confined-space permit is required to enter any tank or vessel. Lockout is required whenever equipment is above ${lim} V or is pressurized. A fire watch is required whenever a hot-work permit is required.`;
  const weld = Math.random() < 0.5, tank = Math.random() < 0.5, volts = pick([24, 120, 480, lim - 10, lim + 10]), press = Math.random() < 0.4;
  const need: string[] = []; if (weld) need.push("Hot-work permit", "Fire watch"); if (tank) need.push("Confined-space permit"); if (volts > lim || press) need.push("Lockout");
  const n = need.length;
  return num("RR", `${rules} Job: ${weld ? "welding a bracket" : "replacing a gauge"}${tank ? " inside a tank" : " on a skid"}, equipment ${volts} V, ${press ? "pressurized" : "depressurized"}. How many of these four requirements apply (hot-work permit, confined-space permit, lockout, fire watch)?`, n === 0 ? 0.0001 : n, [n + 1, n + 2, Math.max(n - 1, 0.0001) === n ? n + 3 : Math.max(n - 1, 0.0001)], `Required: ${need.length ? need.join(", ") : "none"}.`, "");
}
const gshape = (x: number, y: number, g: string): string => g === "AND" ? `<path d="M${x} ${y} H${x + 30} A30 40 0 0 1 ${x + 30} ${y + 80} H${x} Z" transform="scale(1,0.75) translate(0,${y / 3})" fill="currentColor" fill-opacity="0.08"/>${L(x + 25, y + 45, "AND", 12)}` : `<path d="M${x} ${y} Q${x + 20} ${y + 40} ${x} ${y + 80} Q${x + 45} ${y + 80} ${x + 60} ${y + 40} Q${x + 45} ${y} ${x} ${y} Z" transform="scale(1,0.75) translate(0,${y / 3})" fill="currentColor" fill-opacity="0.08"/>${L(x + 27, y + 45, "OR", 12)}`;
function gateQ(): Q {
  const ops = ["AND", "OR"]; const g1 = pick(ops), g2 = pick(ops); const a = Math.random() < 0.5, b = Math.random() < 0.5, c = Math.random() < 0.5;
  const f = (o: string, x: boolean, y: boolean): boolean => o === "AND" ? x && y : x || y; const x = f(g1, a, b); const out = f(g2, x, c);
  const on = (v: boolean): string => v ? "ON" : "OFF";
  const ch = ["ON", "OFF"];
  return { sec: "RR", prompt: `Logic network: Gate 1 (${g1}) takes inputs A and B. Gate 2 (${g2}) takes Gate 1's output and input C. An AND gate is ON only if all inputs are ON; an OR gate is ON if any input is ON. A = ${on(a)}, B = ${on(b)}, C = ${on(c)}. What is the final output?`,
    svg: P(320, 150, `${F("A = " + on(a), 13, 8, 34, "start")}${F("B = " + on(b), 13, 8, 84, "start")}${F("C = " + on(c), 13, 8, 134, "start")}<line x1="70" y1="30" x2="110" y2="30"/><line x1="70" y1="80" x2="110" y2="80"/><line x1="70" y1="130" x2="200" y2="130"/>${gshape(110, 15, g1)}<line x1="170" y1="55" x2="200" y2="55"/><line x1="200" y1="55" x2="200" y2="70"/><line x1="200" y1="130" x2="200" y2="110"/>${gshape(200, 60, g2)}<line x1="260" y1="90" x2="300" y2="90" marker-end="url(#ah)"/>${L(300, 80, "OUT", 12)}`),
    choices: ch, answer: out ? 0 : 1, expl: `Gate 1 ${g1}(${on(a)}, ${on(b)}) = ${on(x)}; Gate 2 ${g2}(${on(x)}, ${on(c)}) = ${on(out)}.` };
}
function troubleQ(): Q {
  const outIsOff = true; void outIsOff;
  // series chain of 4 relays; lights show which test points are energized
  const k = R(1, 4); const pts = [1, 2, 3, 4, 5].map((i: number) => i <= k ? "ON" : "OFF");
  const ans = `Relay ${k}`; const ch = shuffle(["Relay 1", "Relay 2", "Relay 3", "Relay 4"]);
  const rsvg = P(320, 110, `<line x1="10" y1="50" x2="310" y2="50"/>` + [1, 2, 3, 4].map((j: number) => `<rect x="${j * 62 - 6}" y="36" width="36" height="28" fill="currentColor" fill-opacity="0.1"/>${L(j * 62 + 12, 55, "R" + j, 12)}`).join("") + [1, 2, 3, 4, 5].map((j: number) => `<circle cx="${j * 62 - 22}" cy="50" r="5" fill="${pts[j - 1] === "ON" ? "currentColor" : "white"}"/>${L(j * 62 - 22, 85, "TP" + j, 11)}${L(j * 62 - 22, 100, pts[j - 1], 11)}`).join(""));
  return { sec: "RR", svg: rsvg, prompt: `Power flows through Relays 1→2→3→4 in series. Test point TP1 is before Relay 1, TP2 between 1 and 2, TP3 between 2 and 3, TP4 between 3 and 4, TP5 after 4. Readings: ${pts.map((p: string, i: number) => `TP${i + 1} ${p}`).join(", ")}. Which relay has failed open?`, choices: ch, answer: ch.indexOf(ans), expl: `Power is present at TP${k} but not TP${k + 1}, so the open is between them: Relay ${k}.` };
}
function shiftRule(): Q {
  const hrs = R(10, 14);
  const rules = `Overtime rules: Offer overtime first to the qualified employee with the FEWEST overtime hours this quarter. Employees who have worked more than ${hrs} hours in the last 24 are skipped. Only employees with the required qualification may be offered.`;
  const ppl = shuffle(["Ruiz", "Kim", "Patel", "Okafor"]).map((n: string) => ({ n, ot: R(0, 60), h: R(6, 16), q: Math.random() < 0.75 }));
  const elig = ppl.filter((p: { n: string; ot: number; h: number; q: boolean }) => p.q && p.h <= hrs).sort((a: { ot: number }, b: { ot: number }) => a.ot - b.ot);
  const ans = elig.length ? elig[0].n : "No one is eligible"; const ch = ppl.map((p: { n: string }) => p.n).concat(["No one is eligible"]);
  const c2 = elig.length && new Set(ppl.map((p: { ot: number }) => p.ot)).size === 4 ? ch : null;
  if (!c2) return shiftRule();
  return { sec: "RR", prompt: rules + " Who is offered overtime first?", table: { cols: ["Name", "OT hrs (qtr)", "Hrs last 24", "Qualified"], rows: ppl.map((p: { n: string; ot: number; h: number; q: boolean }) => [p.n, String(p.ot), String(p.h), p.q ? "Yes" : "No"]) }, choices: c2, answer: c2.indexOf(ans), expl: `Remove unqualified and those over ${hrs} hrs; of the rest, ${ans} has the fewest OT hours.` };
}
const rrGen: (() => Q)[] = [schedRule, permitRule, troubleQ, shiftRule];
// ===================== v3 additions: official-format sets (original content) =====================
type Grp = () => Q[];
const q4 = (sec: Sec, prompt: string, ans: string, wrong: string[], expl: string, extra: Partial<Q> = {}): Q => {
  const ws: string[] = []; for (const w of wrong) if (w !== ans && !ws.includes(w) && ws.length < 3) ws.push(w);
  const ch = shuffle([ans].concat(ws)); return { sec, prompt, choices: ch, answer: ch.indexOf(ans), expl, ...extra };
};
const n4 = (sec: Sec, prompt: string, ans: number, wrong: number[], expl: string, unit = "", extra: Partial<Q> = {}): Q => {
  const pool = wrong.concat([ans + 1, ans - 1, ans + 2, ans - 2, ans + 3]).filter((w: number) => (w >= 0 || ans < 0) && fmt(w) !== fmt(ans));
  const ws: string[] = []; for (const w of pool) { const s = fmt(w) + unit; if (!ws.includes(s) && ws.length < 3) ws.push(s); }
  const a = fmt(ans) + unit; const ch = [a].concat(ws).sort((x: string, y: string) => parseFloat(x) - parseFloat(y));
  return { sec, prompt, choices: ch, answer: ch.indexOf(a), expl, ...extra };
};
const f1 = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);

function gpsDrawingSet(): Q[] {
  const u = pick(["m", "ft"]);
  const h1 = R(150, 400) / 10, h2 = R(300, 900) / 10, h3 = R(80, 250) / 10, hm = R(50, 150) / 10;
  const w1 = R(600, 1100) / 10, w2 = R(300, Math.floor(w1 * 10) - 120) / 10, w3 = R(150, Math.floor(w2 * 10) - 60) / 10;
  const H = h1 + h2 + h3 + hm; const off = (w1 - w2) / 2;
  const kind = pick(["boiler house", "cooling tower deck", "transformer stand", "pipe rack"]);
  const sx = 200 / w1, sy = 250 / H; const cx = 150, gy = 290;
  const y1 = gy - h1 * sy, y2 = y1 - h2 * sy, y3 = y2 - h3 * sy, y4 = y3 - hm * sy;
  const rect = (w: number, yTop: number, yBot: number, op: number): string => `<rect x="${(cx - w * sx / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${(w * sx).toFixed(1)}" height="${(yBot - yTop).toFixed(1)}" fill="currentColor" fill-opacity="${op}"/>`;
  const lab = (s: string): string => s + " " + u;
  const svg = P(340, 330, ground(10, 330, gy) + rect(w1, y1, gy, 0.12) + rect(w2, y2, y1, 0.06) + rect(w3, y3, y2, 0.18) + `<line x1="${cx}" y1="${y3}" x2="${cx}" y2="${y4}" stroke-width="3"/>`
    + vdim(cx + w1 * sx / 2 + 8, y1, gy, lab(f1(h1))) + vdim(cx + w2 * sx / 2 + 8, y2, y1, "B") + vdim(cx + w3 * sx / 2 + 8, y3, y2, lab(f1(h3))) + vdim(cx + 12, y4, y3, lab(f1(hm)))
    + `<line x1="34" y1="${y4}" x2="34" y2="${gy}" stroke-width="1.2" marker-start="url(#ah)" marker-end="url(#ah)"/>${F("H", 14, 28, (y4 + gy) / 2, "end")}`
    + dim(cx - w1 * sx / 2, cx + w1 * sx / 2, gy + 24, "") + F(lab(f1(w1)), 12, cx, gy + 38) + dim(cx - w2 * sx / 2, cx + w2 * sx / 2, y1 - 10, "") + F("W", 13, cx, y1 - 14) + F(lab(f1(w3)), 12, cx, y3 + 15)
    + dim(cx - w1 * sx / 2, cx - w2 * sx / 2, y1 + 14, "") + F("X", 13, cx - (w1 + w2) * sx / 4, y1 + 30) + F("Not to scale", 11, 335, 14, "end", 400));
  const B = h2;
  const intro = `Use the ${kind} drawing (dimensions in ${u}). Overall height H = ${f1(H)} ${u}; middle section width W = ${f1(w2)} ${u}.`;
  const ex = { svg }; const U = " " + u;
  return shuffle([
    n4("GPS", `${intro} What is height B of the middle section?`, +f1(B), [+f1(H - h1 - h3), +f1(H - h1 - hm), +f1(B + hm)], `B = H − ${f1(h1)} − ${f1(h3)} − ${f1(hm)} = ${f1(B)} ${u}.`, U, ex),
    n4("GPS", `${intro} The middle section is centered on the base. What is distance X?`, +f1(off), [+f1(w1 - w2), +f1(off / 2), +f1(off + w3 / 2)], `X = (${f1(w1)} − ${f1(w2)}) ÷ 2 = ${f1(off)} ${u}.`, U, ex),
    n4("GPS", `${intro} What is three times the height of the base block?`, +f1(3 * h1), [+f1(3 * h3), +f1(2 * h1), +f1(3 * h1 + 3)], `3 × ${f1(h1)} = ${f1(3 * h1)} ${u}.`, U, ex),
    n4("GPS", `${intro} What is half the height from the ground to the top of the middle section?`, +f1((h1 + B) / 2), [+f1(h1 + B), +f1((h1 + B + h3) / 2), +f1(B / 2)], `(${f1(h1)} + ${f1(B)}) ÷ 2 = ${f1((h1 + B) / 2)} ${u}.`, U, ex),
    n4("GPS", `${intro} What is the top block width plus the mast height?`, +f1(w3 + hm), [+f1(w2 + hm), +f1(w3 + h3), +f1(w3 + hm + 10)], `${f1(w3)} + ${f1(hm)} = ${f1(w3 + hm)} ${u}.`, U, ex),
    n4("GPS", `${intro} How much wider is the base block than the top block?`, +f1(w1 - w3), [+f1(w1 - w2), +f1(w2 - w3), +f1(w1 + w3)], `${f1(w1)} − ${f1(w3)} = ${f1(w1 - w3)} ${u}.`, U, ex),
    n4("GPS", `${intro} What is the height from the ground to the bottom of the mast?`, +f1(h1 + B + h3), [+f1(H), +f1(h1 + B), +f1(H - h1)], `${f1(h1)} + ${f1(B)} + ${f1(h3)} = ${f1(h1 + B + h3)} ${u}.`, U, ex),
    n4("GPS", `${intro} If H were increased by 50%, what would the new H be?`, +f1(H * 1.5), [+f1(H + 1.5), +f1(H * 2), +f1(H * 1.25)], `${f1(H)} × 1.5 = ${f1(H * 1.5)} ${u}.`, U, ex),
  ]);
}
function gpsGraphSet(): Q[] {
  const xs = [100, 200, 300, 400, 500, 600, 700, 800];
  const names = shuffle(["Unit 1", "Unit 2", "Unit 3", "Unit 4"]).slice(0, 3).sort();
  const ser = names.map(() => { let v = R(4, 14) * 5; return xs.map(() => { const cur = v; v = Math.max(10, Math.min(95, v + pick([-15, -10, -5, 0, 5, 10, 15]))); return cur; }); });
  const metric = pick([["Load (MW)", "Fuel flow (gal/min)"], ["Pressure (psi)", "Flow (gpm)"], ["Output (kW)", "Speed (rpm)"]]);
  const yl = metric[0], xl = metric[1];
  const gx = (k: number): number => 50 + k * 38, gy = (v: number): number => 250 - v * 2.2;
  const dash = ["", "8 5", "2 4"]; const mk = ["circle", "rect", "tri"];
  const mark = (t: string, x: number, y: number): string => t === "circle" ? `<circle cx="${x}" cy="${y}" r="3.5" fill="currentColor"/>` : t === "rect" ? `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="white" stroke-width="1.5"/>` : `<path d="M${x} ${y - 4.5} l4.5 8 h-9z" fill="currentColor"/>`;
  let b = "";
  for (let v = 0; v <= 100; v += 10) b += `<line x1="50" y1="${gy(v)}" x2="${gx(7)}" y2="${gy(v)}" stroke-width="${v % 50 ? 0.4 : 0.8}" stroke-opacity="0.6"/>${F(String(v), 11, 45, gy(v) + 4, "end", 400)}`;
  for (let v = 5; v < 100; v += 10) b += `<line x1="50" y1="${gy(v)}" x2="${gx(7)}" y2="${gy(v)}" stroke-width="0.25" stroke-dasharray="2 3" stroke-opacity="0.6"/>`;
  xs.forEach((x: number, k: number) => { b += `<line x1="${gx(k)}" y1="${gy(0)}" x2="${gx(k)}" y2="${gy(100)}" stroke-width="0.4" stroke-opacity="0.6"/>${F(String(x), 11, gx(k), 266, "middle", 400)}`; });
  ser.forEach((s: number[], i: number) => { b += `<polyline points="${s.map((v: number, k: number) => gx(k) + "," + gy(v)).join(" ")}" stroke-width="2" ${dash[i] ? `stroke-dasharray="${dash[i]}"` : ""}/>` + s.map((v: number, k: number) => mark(mk[i], gx(k), gy(v))).join(""); });
  b += names.map((n: string, i: number) => `<line x1="${60 + i * 95}" y1="300" x2="${85 + i * 95}" y2="300" stroke-width="2" ${dash[i] ? `stroke-dasharray="${dash[i]}"` : ""}/>${mark(mk[i], 72 + i * 95, 300)}${F(n, 12, 90 + i * 95, 304, "start", 500)}`).join("");
  b += F(xl, 12, 185, 283, "middle", 500) + `<text transform="translate(14 140) rotate(-90)" fill="currentColor" stroke="none" font-size="12" text-anchor="middle">${yl}</text>`;
  const svg = P(350, 312, b);
  const intro = `Use the graph (${yl} vs ${xl}).`; const ex = { svg }; const qs: Q[] = [];
  const s0 = R(0, 2), k0 = R(0, 7);
  qs.push(n4("GPS", `${intro} What is ${names[s0]}'s value at ${xs[k0]}?`, ser[s0][k0], [ser[s0][k0] + 5, ser[s0][k0] - 5, ser[(s0 + 1) % 3][k0]], `Read ${names[s0]} at ${xs[k0]}: ${ser[s0][k0]}.`, "", ex));
  const s1 = R(0, 2); const ka = R(0, 3), kb = R(4, 7); const d1 = Math.abs(ser[s1][ka] - ser[s1][kb]);
  qs.push(n4("GPS", `${intro} For ${names[s1]}, what is the difference between its values at ${xs[ka]} and ${xs[kb]}?`, d1, [ser[s1][ka] + ser[s1][kb], d1 + 5, d1 + 10], `|${ser[s1][ka]} − ${ser[s1][kb]}| = ${d1}.`, "", ex));
  const k2 = R(0, 7); const tot = ser[0][k2] + ser[1][k2] + ser[2][k2];
  qs.push(n4("GPS", `${intro} What is the combined total of all three units at ${xs[k2]}?`, tot, [tot + 5, tot - 5, tot + 10], `${ser[0][k2]} + ${ser[1][k2]} + ${ser[2][k2]} = ${tot}.`, "", ex));
  const k3 = R(0, 7); const sm = ser[0][k3] + ser[1][k3] + ser[2][k3]; const av3 = sm / 3;
  qs.push(n4("GPS", `${intro} What is the average of the three units at ${xs[k3]}? (round to 0.1)`, +f1(av3), [+f1(av3 + 5), +f1(av3 - 2.5), +f1(sm / 2)], `${sm} ÷ 3 = ${f1(av3)}.`, "", ex));
  const s4 = R(0, 2); const chg = ser[s4].slice(1).map((v: number, k: number) => Math.abs(v - ser[s4][k])); const mx = Math.max(...chg);
  if (chg.filter((c: number) => c === mx).length === 1) { const kk = chg.indexOf(mx); const lab = (k: number): string => `${xs[k]} to ${xs[k + 1]}`;
    qs.push(q4("GPS", `${intro} Between which two neighboring points does ${names[s4]} change the most?`, lab(kk), shuffle([0, 1, 2, 3, 4, 5, 6].filter((k: number) => k !== kk)).slice(0, 3).map(lab), `Largest step for ${names[s4]} is ${mx}, from ${lab(kk)}.`, ex)); }
  const k5 = R(0, 7); const pairs: number[][] = [[0, 1], [0, 2], [1, 2]]; const sums = pairs.map((p: number[]) => ser[p[0]][k5] + ser[p[1]][k5]); const best = Math.max(...sums);
  if (sums.filter((s: number) => s === best).length === 1) { const pl = pairs.map((p: number[]) => names[p[0]] + " + " + names[p[1]]);
    qs.push({ sec: "GPS", prompt: `${intro} At ${xs[k5]}, which two units have the highest combined value?`, choices: pl.concat(["All pairs are equal"]), answer: sums.indexOf(best), expl: pl.map((p: string, i: number) => p + " = " + sums[i]).join("; ") + ".", svg }); }
  const s6 = R(0, 2); const k6a = R(0, 7); let k6b = R(0, 7); while (k6b === k6a) k6b = R(0, 7);
  const hi = Math.max(ser[s6][k6a], ser[s6][k6b]), lo = Math.min(ser[s6][k6a], ser[s6][k6b]);
  if (hi !== lo) { const kh = ser[s6][k6a] >= ser[s6][k6b] ? k6a : k6b, kl = kh === k6a ? k6b : k6a; const r = Math.round(hi / lo * 100) / 100;
    qs.push(n4("GPS", `${intro} ${names[s6]}'s value at ${xs[kh]} is how many times its value at ${xs[kl]}? (round to 0.01)`, r, [Math.round(lo / hi * 100) / 100, Math.round((hi - lo) / lo * 100) / 100, Math.round(r * 100 + 25) / 100], `${hi} ÷ ${lo} = ${fmt(r)}.`, "", ex)); }
  const s7 = R(0, 2); const k7 = R(0, 6); const dd = ser[s7][k7 + 1] - ser[s7][k7]; const pct = Math.round(dd / ser[s7][k7] * 1000) / 10;
  qs.push(n4("GPS", `${intro} By what percent does ${names[s7]} change from ${xs[k7]} to ${xs[k7 + 1]}? (negative = drop; round to 0.1)`, pct, [-pct, Math.round(pct * 20) / 10, dd === pct ? pct + 5 : dd, pct + 10], `(${ser[s7][k7 + 1]} − ${ser[s7][k7]}) ÷ ${ser[s7][k7]} × 100 = ${pct}%.`, "%", ex));
  return shuffle(qs);
}

function idMapSet(): Q[] {
  const RL = pick([["A", "B", "C", "D", "E"], ["F", "G", "H", "J", "K"], ["P", "Q", "R", "S", "T"]]), CN = pick([[1, 2, 3, 4], [3, 4, 5, 6], [5, 6, 7, 8]]);
  const co1 = pick(["Valley Electric", "Ridge Power", "Northline Co-op"]), co2 = pick(["Keystone Telecom", "Metro Fiber", "Delta Cable"]);
  const SY = [{ k: "w", name: `${co1} pole (wood)` }, { k: "s", name: `${co1} pole (steel)` }, { k: "t", name: `${co2} pole` }, { k: "x", name: "Transformer" }, { k: "r", name: "Repeater (installed)" }, { k: "p", name: "Repeater (planned)" }, { k: "m", name: "Microwave tower" }];
  const nr = 5, nc = 4, cw = 78, ch = 66, ox = 30, oy = 26;
  const riverCol = R(1, 3);
  type It = { k: string; r: number; c: number; x: number; y: number };
  const items: It[] = [];
  const park = new Set<string>(); while (park.size < 2) park.add(`${R(0, nr - 1)},${R(0, nc - 1)}`);
  for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
    const pk = park.has(`${r},${c}`); const slots = shuffle(pk ? [0, 1, 2] : [0, 1, 2, 3, 4, 5, 6, 7, 8]); const n = R(1, pk ? 3 : 5);
    for (let j = 0; j < n; j++) { const s = slots[j]; items.push({ k: pick(["w", "w", "s", "s", "t", "t", "x", "r", "p", "m"]), r, c, x: ox + c * cw + 16 + (s % 3) * 24, y: oy + r * ch + 15 + Math.floor(s / 3) * 19 }); }
  }
  const oh: { r: number; c1: number; c2: number }[] = []; const ug: { c: number; r1: number; r2: number }[] = [];
  shuffle([0, 1, 2, 3, 4]).slice(0, 2).forEach((r: number) => { const c1 = R(0, 2); oh.push({ r, c1, c2: R(c1 + 1, 3) }); });
  shuffle([0, 1, 2, 3]).slice(0, 2).forEach((c: number) => { const r1 = R(0, 3); ug.push({ c, r1, r2: R(r1 + 1, 4) }); });
  const hasOH = (r: number, c: number): boolean => oh.some((l) => l.r === r && c >= l.c1 && c <= l.c2);
  const hasUG = (r: number, c: number): boolean => ug.some((l) => l.c === c && r >= l.r1 && r <= l.r2);
  const sym = (k: string, x: number, y: number): string => {
    switch (k) {
      case "w": return `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="currentColor" stroke-width="1"/>`;
      case "s": return `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="white" stroke-width="1.5"/><line x1="${x - 5}" y1="${y + 5}" x2="${x + 5}" y2="${y - 5}" stroke-width="1.2"/>`;
      case "t": return `<circle cx="${x}" cy="${y}" r="5.5" fill="white" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="2" fill="currentColor" stroke="none"/>`;
      case "x": return `<path d="M${x - 5} ${y - 5} L${x + 5} ${y + 5} M${x + 5} ${y - 5} L${x - 5} ${y + 5}" stroke-width="2.2"/>`;
      case "r": return `<path d="M${x} ${y - 6} L${x + 6} ${y + 5} H${x - 6} Z" fill="currentColor" stroke-width="1"/>`;
      case "p": return `<path d="M${x} ${y - 6} L${x + 6} ${y + 5} H${x - 6} Z" fill="white" stroke-width="1.5"/>`;
      default: return `<path d="M${x} ${y - 6} L${x + 5} ${y + 6} M${x} ${y - 6} L${x - 5} ${y + 6} M${x - 3} ${y + 1} H${x + 3}" stroke-width="1.6"/><circle cx="${x}" cy="${y - 7}" r="2" fill="currentColor"/>`;
    }
  };
  let b = "";
  park.forEach((p: string) => { const [r, c] = p.split(",").map(Number); b += `<rect x="${ox + c * cw + 4}" y="${oy + r * ch + 32}" width="${cw - 8}" height="${ch - 36}" fill="url(#hatch)" stroke-width="0.8" opacity="0.5"/>${F("PARK", 9, ox + c * cw + cw / 2, oy + r * ch + 58, "middle", 700)}`; });
  const rx = ox + riverCol * cw; let rp = `M${rx} ${oy}`; for (let y = oy; y < oy + nr * ch; y += 22) rp += ` Q${rx + 6} ${y + 5.5} ${rx} ${y + 11} T${rx} ${y + 22}`;
  b += `<path d="${rp}" stroke-width="6" stroke-opacity="0.25"/><path d="${rp}" stroke-width="1"/>`;
  oh.forEach((l) => { const y = oy + l.r * ch + 5; b += `<line x1="${ox + l.c1 * cw + 2}" y1="${y}" x2="${ox + (l.c2 + 1) * cw - 2}" y2="${y}" stroke-width="2"/>`; for (let x = ox + l.c1 * cw + 8; x < ox + (l.c2 + 1) * cw; x += 10) b += `<line x1="${x}" y1="${y - 3}" x2="${x}" y2="${y + 3}" stroke-width="1"/>`; });
  ug.forEach((l) => { const x = ox + l.c * cw + 5; b += `<line x1="${x}" y1="${oy + l.r1 * ch + 2}" x2="${x}" y2="${oy + (l.r2 + 1) * ch - 2}" stroke-width="2" stroke-dasharray="2 3"/>`; });
  for (let r = 0; r <= nr; r++) b += `<line x1="${ox}" y1="${oy + r * ch}" x2="${ox + nc * cw}" y2="${oy + r * ch}" stroke-width="0.6" ${r % nr ? `stroke-dasharray="4 3"` : ""}/>`;
  for (let c = 0; c <= nc; c++) b += `<line x1="${ox + c * cw}" y1="${oy}" x2="${ox + c * cw}" y2="${oy + nr * ch}" stroke-width="0.6" ${c % nc ? `stroke-dasharray="4 3"` : ""}/>`;
  RL.forEach((r: string, i: number) => { b += F(r, 14, 15, oy + i * ch + ch / 2 + 5); });
  CN.forEach((c: number, i: number) => { b += F(String(c), 14, ox + i * cw + cw / 2, 18); });
  items.forEach((it) => { b += sym(it.k, it.x, it.y); });
  let ly = oy + nr * ch + 22; const lx = [ox, ox + 165];
  SY.forEach((s, i: number) => { const x = lx[i % 2], y = ly + Math.floor(i / 2) * 20; b += sym(s.k, x + 6, y - 4) + F(s.name, 10.5, x + 18, y, "start", 400); });
  const extra = [["oh", "Overhead line"], ["ug", "Underground cable"], ["rv", "River"], ["pk", "Park"]];
  extra.forEach((e: string[], j: number) => { const i = SY.length + j; const x = lx[i % 2], y = ly + Math.floor(i / 2) * 20;
    b += e[0] === "oh" ? `<line x1="${x}" y1="${y - 4}" x2="${x + 14}" y2="${y - 4}" stroke-width="2"/><line x1="${x + 4}" y1="${y - 7}" x2="${x + 4}" y2="${y - 1}" stroke-width="1"/><line x1="${x + 10}" y1="${y - 7}" x2="${x + 10}" y2="${y - 1}" stroke-width="1"/>`
      : e[0] === "ug" ? `<line x1="${x}" y1="${y - 4}" x2="${x + 14}" y2="${y - 4}" stroke-width="2" stroke-dasharray="2 3"/>` : e[0] === "rv" ? `<path d="M${x} ${y - 4} q4 -5 7 0 t7 0" stroke-width="1.5"/>` : `<rect x="${x}" y="${y - 10}" width="14" height="11" fill="url(#hatch)" stroke-width="0.8" opacity="0.6"/>`;
    b += F(e[1], 10.5, x + 18, y, "start", 400); });
  ly += Math.ceil((SY.length + extra.length) / 2) * 20;
  b += F("N ↑", 12, ox + nc * cw - 2, ly - 2, "end");
  const svg = P(360, ly + 6, b);
  const sec = (r: number, c: number): string => RL[r] + CN[c];
  const cnt = (f: (it: It) => boolean): number => items.filter(f).length;
  const nm = (k: string): string => SY.find((s) => s.k === k)!.name;
  const pre = `Use the map and legend. A section is a whole lettered row or numbered column; a sector is one block (for example ${sec(1, 2)}).`;
  const ex = { svg }; const qs: Q[] = []; const POLE = ["w", "s", "t"];
  { const r = R(0, 4), c = R(0, 3); const n = cnt((it) => it.r === r && it.c === c && POLE.includes(it.k));
    qs.push(n4("ID", `${pre} How many poles of any kind are in sector ${sec(r, c)}?`, n, [n + 1, n - 1, cnt((it) => it.r === r && it.c === c)], `Count every pole symbol (both ${co1} types and ${co2}) in ${sec(r, c)}: ${n}.`, "", ex)); }
  { const r = R(0, 4), k = pick(["w", "s"]); const n = cnt((it) => it.r === r && it.k === k);
    qs.push(n4("ID", `${pre} How many ${nm(k)} symbols are in section ${RL[r]}?`, n, [cnt((it) => it.r === r && (it.k === "w" || it.k === "s")), n + 1, n + 2], `Scan row ${RL[r]} across all four columns: ${n}.`, "", ex)); }
  { const c1 = R(0, 2); const n = cnt((it) => (it.c === c1 || it.c === c1 + 1) && it.k === "p");
    qs.push(n4("ID", `${pre} How many repeaters are planned (not yet installed) in sections ${CN[c1]} and ${CN[c1 + 1]} combined?`, n, [cnt((it) => (it.c === c1 || it.c === c1 + 1) && (it.k === "p" || it.k === "r")), n + 1, n + 2], `Count open triangles in columns ${CN[c1]} and ${CN[c1 + 1]}: ${n}.`, "", ex)); }
  { const east = pick([true, false]); const n = cnt((it) => it.k === "m" && (east ? it.c >= riverCol : it.c < riverCol));
    qs.push(n4("ID", `${pre} How many microwave towers are ${east ? "east" : "west"} of the river? (North is up.)`, n, [cnt((it) => it.k === "m"), n + 1, n - 1], `The river runs between sections ${CN[riverCol - 1]} and ${CN[riverCol]}. Towers ${east ? "east" : "west"} of it: ${n}.`, "", ex)); }
  { let n = 0, o = 0; for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) { if (hasOH(r, c) && hasUG(r, c)) n++; if (hasOH(r, c) || hasUG(r, c)) o++; }
    qs.push(n4("ID", `${pre} How many sectors contain BOTH an overhead line and an underground cable?`, n, [n + 1, n + 2, o], `Overhead lines run along the tops of sectors; underground cables along the left sides. Sectors with both: ${n}.`, "", ex)); }
  { const ps = [...park].map((p: string) => p.split(",").map(Number)); const inP = (it: It): boolean => ps.some((p: number[]) => p[0] === it.r && p[1] === it.c);
    const n = cnt((it) => (it.k === "r" || it.k === "p") && inP(it));
    qs.push(n4("ID", `${pre} How many repeaters (installed or planned) are in the sectors that contain a park?`, n, [n + 1, n + 2, cnt((it) => inP(it))], `Parks are in ${ps.map((p: number[]) => sec(p[0], p[1])).join(" and ")}; repeaters there: ${n}.`, "", ex)); }
  { const c = R(0, 3); const nt = cnt((it) => it.c === c && it.k === "t"), nw = cnt((it) => it.c === c && it.k === "w");
    qs.push(n4("ID", `${pre} How many ${co2} poles plus ${co1} wood poles are in section ${CN[c]}?`, nt + nw, [cnt((it) => it.c === c && POLE.includes(it.k)), nt + nw + 1, nt + nw - 1], `Column ${CN[c]}: ${nt} ${co2} + ${nw} wood = ${nt + nw}.`, "", ex)); }
  { const l = pick(oh); const len = l.c2 - l.c1 + 1; const ft = pick([250, 500]);
    qs.push(n4("ID", `${pre} Each sector is ${ft} ft wide. About how long is the overhead line in section ${RL[l.r]}?`, len * ft, [(len + 1) * ft, (len + 2) * ft, len * ft * 2, len === 1 ? 3 * ft : (len - 1) * ft], `It spans ${len} sector(s), ${sec(l.r, l.c1)} to ${sec(l.r, l.c2)}: ${len} × ${ft} = ${len * ft} ft.`, " ft", ex)); }
  { const k = pick(["x", "m", "r"]); const per = RL.map((_: string, r: number) => cnt((it) => it.r === r && it.k === k)); const mx = Math.max(...per);
    if (per.filter((v: number) => v === mx).length === 1) qs.push(q4("ID", `${pre} Which section (lettered row) has the most ${nm(k).toLowerCase()} symbols?`, RL[per.indexOf(mx)], shuffle(RL.filter((_: string, i: number) => i !== per.indexOf(mx))), `Row counts: ${RL.map((r: string, i: number) => r + " = " + per[i]).join(", ")}.`, ex)); }
  return shuffle(qs).slice(0, 8);
}

function rrNetSet(): Q[] {
  for (let tries = 0; tries < 300; tries++) {
    const N = 8; const layer = [0, 0, 1, 1, 1, 2, 2, 2]; const ids = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    const kind: Record<number, string> = {}; ids.forEach((id: number, i: number) => { kind[id] = layer[i] === 0 ? "sq" : pick(["sq", "ci"]); });
    const edges: number[][] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (layer[j] > layer[i] && Math.random() < (layer[j] - layer[i] === 1 ? 0.55 : 0)) edges.push([ids[i], ids[j]]);
    const ins = (n: number): number[] => edges.filter((e) => e[1] === n).map((e) => e[0]);
    const sim = (off: number[]): Set<number> => { const on = new Set<number>(); ids.forEach((n: number, i: number) => { if (off.includes(n)) return; if (layer[i] === 0) { on.add(n); return; } const k = ins(n).filter((m: number) => on.has(m)).length; if (kind[n] === "sq" ? k >= 1 : k >= 2) on.add(n); }); return on; };
    if (sim([]).size !== N) continue;
    if (!ids.some((n: number) => kind[n] === "ci")) continue;
    const pos: Record<number, number[]> = {}; const byL = [0, 1, 2].map((l: number) => ids.filter((_: number, i: number) => layer[i] === l));
    byL.forEach((g: number[], l: number) => g.forEach((n: number, k: number) => { pos[n] = [45 + l * 120, 40 + (k + (g.length === 2 ? 0.5 : 0)) * 90]; }));
    let b = ""; edges.forEach((e) => { const [x1, y1] = pos[e[0]], [x2, y2] = pos[e[1]]; const d = Math.hypot(x2 - x1, y2 - y1); const ux = (x2 - x1) / d, uy = (y2 - y1) / d;
      b += `<line x1="${(x1 + ux * 19).toFixed(1)}" y1="${(y1 + uy * 19).toFixed(1)}" x2="${(x2 - ux * 21).toFixed(1)}" y2="${(y2 - uy * 21).toFixed(1)}" stroke-width="1.5" marker-end="url(#ah)"/>`; });
    ids.forEach((n: number) => { const [x, y] = pos[n]; b += kind[n] === "sq" ? `<rect x="${x - 16}" y="${y - 16}" width="32" height="32" fill="white" stroke-width="2"/>` : `<circle cx="${x}" cy="${y}" r="17" fill="white" stroke-width="2"/>`; b += L(x, y + 5, String(n), 15); });
    const svg = P(300, 270, b);
    const rules = [`Units pass power along the arrows. All units start ON. Treat each question separately.`, `Rule 1: A unit that is shut down sends no power to any unit its arrows point to.`, `Rule 2: A SQUARE unit stays on if at least ONE unit pointing to it is on. Squares with no arrows coming in are power sources and stay on unless shut down.`, `Rule 3: A CIRCLE unit stays on only if at least TWO units pointing to it are on.`];
    const pre = "Use the network and the rules."; const ex = { svg, rules }; const qs: Q[] = [];
    const lost = (k: number): number[] => ids.filter((n: number) => n !== k && !sim([k]).has(n));
    { const k = pick(ids.filter((_: number, i: number) => layer[i] < 2)); const n = lost(k).length;
      qs.push(n4("RR", `${pre} If unit ${k} is shut down, how many OTHER units stop working?`, n, [n + 1, n + 2, n - 1, n + 3], `Shutting ${k} stops: ${lost(k).join(", ") || "none"} (${n}).`, "", ex)); }
    { const k = pick(ids.filter((_: number, i: number) => layer[i] === 2)); const cand = ids.filter((n: number) => n !== k); const affect = cand.filter((m: number) => lost(m).includes(k));
      if (affect.length >= 1 && cand.length - affect.length >= 3) { const a = pick(affect); const wr = shuffle(cand.filter((m: number) => !affect.includes(m))).slice(0, 3).map(String);
        qs.push(q4("RR", `${pre} Shutting down which unit, by itself, would cause unit ${k} to stop working?`, String(a), wr, `Shutting ${a} cascades to ${k}; shutting ${wr.join(", ")} does not.`, ex)); } }
    { const k = pick(ids.filter((_: number, i: number) => layer[i] < 2)); const ls = lost(k); const rest = ids.filter((n: number) => n !== k && !ls.includes(n));
      if (ls.length >= 1 && rest.length >= 3) { const a = pick(ls); qs.push(q4("RR", `${pre} If unit ${k} is shut down, which of these units will ALSO stop working?`, String(a), shuffle(rest).slice(0, 3).map(String), `Cascade from ${k}: ${ls.join(", ")}.`, ex)); } }
    { const k = pick(ids.filter((n: number) => kind[n] === "ci")); const ii = ins(k);
      qs.push(n4("RR", `${pre} How many units point power directly into circle unit ${k}?`, ii.length, [ii.length + 1, ii.length - 1, ii.length + 2], `Arrows into ${k} come from ${ii.join(", ")}.`, "", ex)); }
    { const k = pick(ids.filter((_: number, i: number) => layer[i] > 0)); const sing = ids.filter((m: number) => m !== k && lost(m).includes(k));
      qs.push({ sec: "RR", prompt: `${pre} Is there any SINGLE unit whose shutdown would stop unit ${k}?`, choices: ["Yes", "No", "Only if a circle unit is shut down", "Cannot be determined"], answer: sing.length ? 0 : 1, expl: sing.length ? `Yes: shutting ${sing.join(" or ")} stops ${k}.` : `No: unit ${k} has enough independent feeds.`, svg, rules }); }
    if (qs.length >= 4) return shuffle(qs).slice(0, 5);
  }
  return [troubleQ()];
}
function rrProcSet(): Q[] {
  const c1 = pick(["TX", "PV", "HX", "BL"]) + R(10, 99), c2 = pick(["QF", "MZ", "KR", "DS"]) + R(10, 99); const lv = R(3, 5); const mins = pick([5, 10, 15]);
  const A = pick(["north", "east"]), Bz = A === "north" ? "south" : "west";
  const rules = [
    `You monitor alarms in a plant control room.`,
    `1. Alarm ${c1} in the ${A} unit: radio the shift lead if it is type P; page the I&C tech if it is type V.`,
    `2. Alarm ${c1} in the ${Bz} unit: CALL the ${Bz}-unit foreman if it is level ${lv} or higher; TEXT the ${Bz}-unit foreman if it is below level ${lv}.`,
    `3. Alarm ${c2} (any unit): CALL the operations manager if it is level ${lv} or higher; TEXT the operations manager if below level ${lv}.`,
    `Only exception (all conditions must be met): for an ${c1} alarm in the ${Bz} unit at EXACTLY level ${lv}, write it in the alarm log BEFORE calling the foreman if fewer than ${mins} minutes have passed since it started. If ${mins} or more minutes have passed, or the start time is unknown, call first and log it afterward.`,
  ];
  const ex = { rules }; const pre = "Use the alarm rules.";
  const o = [`Call the ${Bz}-unit foreman.`, `Text the ${Bz}-unit foreman.`, `Write it in the alarm log.`, `Radio the shift lead.`, `Page the I&C tech.`, `Call the operations manager.`, `Text the operations manager.`];
  const L2 = R(lv + 1, 7), m1 = R(1, mins - 1), m2 = pick([mins, mins + R(1, 10), -1]), t = pick(["P", "V"]), L3 = R(1, lv - 1);
  return shuffle([
    q4("RR", `${pre} A level ${L2} ${c2} alarm comes in. You should:`, o[5], [o[6], o[0], o[3]], `Rule 3: ${c2} at level ${lv} or higher means call the operations manager.`, ex),
    q4("RR", `${pre} A level ${lv} ${c1} alarm in the ${Bz} unit started ${m1} minutes ago. Your FIRST step is to:`, o[2], [o[0], o[1], o[5]], `The exception applies (level exactly ${lv}, ${Bz} unit, under ${mins} min): log first, then call.`, ex),
    q4("RR", `${pre} A level ${lv} ${c1} alarm in the ${Bz} unit ${m2 < 0 ? "started at an unknown time" : `started ${m2} minutes ago`}. Your FIRST step is to:`, o[0], [o[2], o[1], o[3]], `Exception: ${m2 < 0 ? "unknown time" : mins + " or more minutes"} means call the foreman first, then log it.`, ex),
    q4("RR", `${pre} A type ${t} ${c1} alarm occurs in the ${A} unit. You should:`, t === "P" ? o[3] : o[4], [t === "P" ? o[4] : o[3], o[0], o[6]], `Rule 1: ${A} unit, type ${t}.`, ex),
    q4("RR", `${pre} A co-worker handled a ${c2} alarm by sending a text. What can you correctly conclude?`, `It was below level ${lv}.`, [`It was exactly level ${lv}.`, `It happened in the ${A} unit.`, `Fewer than ${mins} minutes had passed.`], `Only rule 3 covers ${c2}, and a text means below level ${lv}. Unit and time don't matter.`, ex),
    q4("RR", `${pre} A level ${L3} ${c1} alarm occurs in the ${Bz} unit. You should:`, o[1], [o[0], o[2], o[6]], `Rule 2: below level ${lv} means text the foreman. The exception covers only level exactly ${lv}.`, ex),
  ]).slice(0, 5);
}

const mcConcept: (() => Q)[] = [
  () => { const sw = Math.random() < 0.5; const box = (x: number, rough: boolean, n: string): string => `${rough ? `<rect x="${x - 60}" y="96" width="120" height="8" fill="url(#hatch)"/>` : `<line x1="${x - 60}" y1="100" x2="${x + 60}" y2="100" stroke-width="3"/>`}<rect x="${x - 25}" y="56" width="50" height="40" fill="currentColor" fill-opacity="0.15"/>${L(x, 125, n + ": " + (rough ? "carpet" : "smooth tile"), 12)}`;
    return pic("Two identical boxes rest on different floors. Which box is easier to slide?", P(300, 135, box(75, sw, "A") + box(225, !sw, "B")), ["Box A", "Box B", "Both equally"], sw ? 1 : 0, "The smoother floor has less friction, so less force is needed."); },
  () => { const ord = shuffle(["A", "B", "C"]); const pts = [[60, 98], [150, 35], [240, 98]];
    return pic("A ball is thrown and follows the dashed path. At which labeled point is it moving slowest?", P(300, 150, `<path d="M20 140 Q150 -70 280 140" stroke-dasharray="5 4"/>${ground(5, 295, 140)}${pts.map((p: number[], i: number) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="currentColor"/>${L(p[0] + (i === 1 ? 0 : i === 0 ? -16 : 16), p[1] - 10, ord[i], 14)}`).join("")}`), ["Point A", "Point B", "Point C"], ["A", "B", "C"].indexOf(ord[1]), "At the top of its arc the ball's upward speed is zero, so it moves slowest there."); },
  () => { const sw = Math.random() < 0.5; const tr = (x: number, high: boolean, n: string): string => `<rect x="${x - 50}" y="80" width="100" height="16" fill="currentColor" fill-opacity="0.15"/><circle cx="${x - 30}" cy="100" r="9" fill="white"/><circle cx="${x + 30}" cy="100" r="9" fill="white"/>${high ? `<rect x="${x - 22}" y="18" width="44" height="62" fill="currentColor" fill-opacity="0.3"/>` : `<rect x="${x - 45}" y="58" width="90" height="22" fill="currentColor" fill-opacity="0.3"/>`}${L(x, 130, n, 14)}`;
    return pic("Two trucks carry the same weight of cargo, loaded as shown. Which is LESS likely to tip over on a sharp curve?", P(300, 138, ground(5, 295, 109) + tr(75, sw, "A") + tr(225, !sw, "B")), ["Truck A", "Truck B", "Both the same"], sw ? 1 : 0, "A lower center of gravity makes a vehicle more stable."); },
  () => { const sa = Math.random() < 0.5; const t = (x: number, s: boolean, n: string): string => `<path d="M${x - 50} 30 V120 H${x + 50} V30"/><rect x="${x - 50}" y="50" width="100" height="70" fill="currentColor" fill-opacity="${s ? 0.3 : 0.1}" stroke="none"/>${L(x, 140, n + ": " + (s ? "salt water" : "fresh water"), 12)}<rect x="${x - 12}" y="${s ? 34 : 40}" width="24" height="18" fill="white"/>`;
    return pic("The same block is placed in each tank. Salt water is denser than fresh water. In which tank does the block float higher?", P(300, 150, t(75, sa, "A") + t(225, !sa, "B")), ["Tank A", "Tank B", "Same in both"], sa ? 0 : 1, "A denser liquid pushes up harder, so the block floats higher in salt water."); },
  () => { const wa = Math.random() < 0.5; const pan = (x: number, wide: boolean, n: string): string => wide ? `<path d="M${x - 60} 90 V115 H${x + 60} V90"/><rect x="${x - 60}" y="98" width="120" height="17" fill="currentColor" fill-opacity="0.2" stroke="none"/>${L(x, 138, n, 14)}` : `<path d="M${x - 20} 20 V115 H${x + 20} V20"/><rect x="${x - 20}" y="40" width="40" height="75" fill="currentColor" fill-opacity="0.2" stroke="none"/>${L(x, 138, n, 14)}`;
    return pic("Both containers hold the same amount of water at the same temperature. Which cools faster?", P(300, 148, pan(75, wa, "A") + pan(225, !wa, "B")), ["Container A", "Container B", "Both equally"], wa ? 0 : 1, "More surface area exposed to air loses heat faster; the wide, shallow pan cools first."); },
  () => { const sa = Math.random() < 0.5; const tk = (x: number, small: boolean, n: string): string => `<rect x="${x - (small ? 22 : 45)}" y="${small ? 50 : 20}" width="${small ? 44 : 90}" height="${small ? 70 : 100}" rx="${small ? 18 : 30}" fill="currentColor" fill-opacity="0.1"/>${L(x, 140, n, 14)}`;
    return pic("Two tanks hold the same amount of the same gas at the same temperature. In which tank is the pressure greater?", P(300, 150, tk(75, sa, "A") + tk(225, !sa, "B")), ["Tank A", "Tank B", "Both equally"], sa ? 0 : 1, "The same gas squeezed into a smaller volume has higher pressure."); },
  () => { const w1 = R(1, 5) * 5, w2 = R(6, 12) * 5;
    return pic(`A ${w1} lb ball (A) and a ${w2} lb ball (B) of the same size are dropped at the same moment from the same height. Ignoring air resistance, which lands first?`, P(300, 160, `${ground(5, 295, 150)}<circle cx="100" cy="42" r="16" fill="currentColor" fill-opacity="0.1"/><circle cx="200" cy="42" r="16" fill="currentColor" fill-opacity="0.4"/>${L(100, 18, "A: " + w1 + " lb", 12)}${L(200, 18, "B: " + w2 + " lb", 12)}<line x1="100" y1="64" x2="100" y2="130" stroke-dasharray="4 4" marker-end="url(#ah)"/><line x1="200" y1="64" x2="200" y2="130" stroke-dasharray="4 4" marker-end="url(#ah)"/>`), ["Ball A", "Ball B", "Same time"], 2, "Without air resistance, everything falls with the same acceleration."); },
  () => { const hA = R(2, 4), hB = R(5, 8); const sw = Math.random() < 0.5; const a = sw ? hB : hA, bb = sw ? hA : hB;
    const tw = (x: number, h: number, n: string): string => `<rect x="${x - 25}" y="${150 - h * 14 - 30}" width="50" height="30" fill="currentColor" fill-opacity="0.2"/><line x1="${x - 15}" y1="${150 - h * 14}" x2="${x - 15}" y2="150"/><line x1="${x + 15}" y1="${150 - h * 14}" x2="${x + 15}" y2="150"/><line x1="${x}" y1="${150 - h * 14}" x2="${x}" y2="146" stroke-width="3"/>${L(x, 170, n, 14)}`;
    return pic("Both towers have identical tanks holding the same amount of water. Which gives more water pressure at a hose at ground level?", P(300, 178, ground(5, 295, 150) + tw(75, a, "A") + tw(225, bb, "B")), ["Tower A", "Tower B", "Both equally"], a > bb ? 0 : 1, "Pressure depends on the height of the water above the outlet; the taller tower gives more."); },
  () => { const ord = shuffle(["A", "B", "C"]);
    return pic("Water is poured into connected tubes of different widths that are open at the top. When the water settles, which tube has the highest water level?", P(300, 150, `<path d="M40 30 V130 H260 V30 M70 30 V100 H130 V30 M160 30 V100 H230 V30"/><rect x="40" y="60" width="30" height="70" fill="currentColor" fill-opacity="0.2" stroke="none"/><rect x="130" y="60" width="30" height="70" fill="currentColor" fill-opacity="0.2" stroke="none"/><rect x="230" y="60" width="30" height="70" fill="currentColor" fill-opacity="0.2" stroke="none"/><rect x="70" y="100" width="160" height="30" fill="currentColor" fill-opacity="0.2" stroke="none"/>${[55, 145, 245].map((x: number, i: number) => L(x, 22, ord[i], 14)).join("")}`), ["Tube " + ord[0], "Tube " + ord[1], "Same level in all"], 2, "Connected open tubes fill to the same level, whatever their width."); },
];

export const GROUPS: Partial<Record<Sec, Grp[]>> = {
  GPS: [gpsDrawingSet, gpsGraphSet],
  ID: [idMapSet, idMapSet],
  RR: [rrProcSet, rrNetSet, () => [schedRule(), permitRule(), troubleQ(), shiftRule(), troubleQ()]],
};

mcGen.push(...mcConcept);


export const GENS: Record<Sec, (() => Q)[]> = { MC: mcGen, GPS: [() => pick(gpsDrawingSet()), () => pick(gpsGraphSet())], ID: [() => pick(idMapSet())], RR: [() => pick(rrProcSet()), () => pick(rrNetSet()), ...rrGen] };
export function makeSet(sec: Sec, n: number): Q[] {
  const gr = GROUPS[sec];
  if (gr) { const full = n >= 15; const order = full ? gr.slice() : shuffle(gr.slice()); let out: Q[] = [];
    for (const g of order) { const qs = g(); out = out.concat(full ? qs : qs.slice(0, Math.ceil(n / order.length))); }
    while (out.length < n) out = out.concat(order[0]());
    return out.slice(0, n).map(fix); }
  const g = GENS[sec]; const out: Q[] = []; let order = shuffle(g.map((_: () => Q, i: number) => i));
  for (let i = 0; i < n; i++) { if (!order.length) order = shuffle(g.map((_: () => Q, j: number) => j)); out.push(fix(g[order.pop() as number]())); }
  return out;
}
function fix(q: Q): Q { // 0.0001 placeholder means 0
  const lim = q.sec === "MC" ? 3 : 4;
  if (q.choices.length > lim) { const right = q.choices[q.answer]; const keep = shuffle(q.choices.filter((_: string, k: number) => k !== q.answer)).slice(0, lim - 1).concat([right]);
    const numeric = keep.every((c: string) => !isNaN(parseFloat(c))); const ord = numeric ? keep.sort((x: string, y: string) => parseFloat(x) - parseFloat(y)) : q.choices.filter((c: string) => keep.includes(c));
    q.choices = ord; q.answer = ord.indexOf(right); }
  q.choices = q.choices.map((c: string) => c.replace(/^0\.0001/, "0")); if (q.prompt) q.expl = q.expl; return q; }
export const BANK_SIZE = { MC: mcGen.length, GPS: 2, ID: 1, RR: rrGen.length + 2 };
