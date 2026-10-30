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
const battery = (x: number, y1: number, y2: number, label: string): string => { const m = (y1 + y2) / 2; return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${m - 5}"/><line x1="${x - 14}" y1="${m - 5}" x2="${x + 14}" y2="${m - 5}" stroke-width="3"/><line x1="${x - 7}" y1="${m + 5}" x2="${x + 7}" y2="${m + 5}" stroke-width="3"/><line x1="${x}" y1="${m + 5}" x2="${x}" y2="${y2}"/>${F(label, 13, x - 18, m + 4, "end")}${F("+", 12, x + 20, m - 6, "start")}`; };
const lamp = (x: number, y: number, label: string, out = false): string => `<circle cx="${x}" cy="${y}" r="12" fill="none" fill-opacity="0"/><circle cx="${x}" cy="${y}" r="12"/><path d="M${x - 8} ${y - 8} L${x + 8} ${y + 8} M${x + 8} ${y - 8} L${x - 8} ${y + 8}" stroke-width="1.5"/>${out ? L(x, y + 30, "burned out", 11) : ""}${L(x, y - 18, label, 13)}`;
const pic = (prompt: string, svg: string, choices: string[], answer: number, expl: string): Q => ({ sec: "MC", prompt, svg, choices, answer, expl });

// ---------- MECHANICAL CONCEPTS (every item has a picture) ----------
const mcGen: (() => Q)[] = [
  // 1 gear speed, labeled
  () => { const t1 = pick([12, 16, 20, 24, 30, 36]); let t2 = pick([12, 16, 20, 24, 30, 36]); while (t2 === t1) t2 = pick([12, 18, 24, 32, 40]);
    const r1 = 16 + t1 * 1.2, r2 = 16 + t2 * 1.2; const x2 = 30 + r1 + r2 + 25 + 8;
    const svg = P(x2 + r2 + 30, 2 * Math.max(r1, r2) + 50, gear(30 + r1 + 8, Math.max(r1, r2) + 25, r1, t1) + gear(x2, Math.max(r1, r2) + 25, r2, t2) + L(30 + r1 + 8, Math.max(r1, r2) + 25 + r1 + 22, `A: ${t1} teeth`) + L(x2, Math.max(r1, r2) + 25 + r2 + 22, `B: ${t2} teeth`));
    return pic(`Gear A drives gear B as shown. Which gear turns faster?`, svg, ["A", "B", "Same speed"], t1 < t2 ? 0 : 1, `The gear with fewer teeth turns faster. A has ${t1}, B has ${t2}.`); },
  // 2 gear train direction
  () => { const n = R(3, 5); const r = 26; const names = "ABCDE"; let b = ""; for (let k = 0; k < n; k++) { b += gear(40 + k * 62, 70, r, 12) + L(40 + k * 62, 125, names[k], 15); } b += rot(40, 70, r + 14, true);
    const last = names[n - 1]; const cw = n % 2 === 1;
    return pic(`Gear A turns clockwise (arrow). Which way does gear ${last} turn?`, P(40 + (n - 1) * 62 + 50, 140, b), ["Clockwise", "Counterclockwise", "It cannot turn"], cw ? 0 : 1, `Each meshing gear reverses direction. Gear ${last} is gear #${n}, so it turns ${cw ? "clockwise" : "counterclockwise"}.`); },
  // 3 gear revolutions numeric
  () => { const t2 = pick([10, 12, 15, 20]), m = pick([2, 3, 4]); const t1 = t2 * m; const rev = R(2, 6);
    const r1 = 16 + t1 * 0.8, r2 = 16 + t2 * 0.8; const cy = r1 + 25, x2 = 28 + 2 * r1 + r2 + 10;
    const svg = P(x2 + r2 + 30, 2 * r1 + 70, gear(28 + r1, cy, r1, t1) + gear(x2, cy, r2, t2) + L(28 + r1, cy + r1 + 26, `A: ${t1} teeth`) + L(x2, cy + r2 + 26, `B: ${t2} teeth`));
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
    const top = [70, 130, 190].slice(0, Math.ceil(n / 2)); const bot = [100, 160].slice(0, Math.floor(n / 2) || 1);
    top.forEach((x: number) => { b += `<line x1="${x}" y1="18" x2="${x}" y2="38"/><circle cx="${x}" cy="50" r="12"/>`; });
    // strands: draw n vertical strands from top block to bottom block
    const xs: number[] = []; for (let k = 0; k < n; k++) xs.push(60 + k * (120 / Math.max(1, n - 1)));
    xs.forEach((x: number) => { b += `<line x1="${x}" y1="56" x2="${x}" y2="120"/>`; });
    b += `<rect x="50" y="120" width="140" height="16" rx="6" fill="currentColor" fill-opacity="0.15"/><line x1="120" y1="136" x2="120" y2="150"/>${weight(120, 182, 70, w + " lb")}`;
    b += `<line x1="200" y1="50" x2="240" y2="50"/><line x1="240" y1="50" x2="240" y2="140" marker-end="url(#ah)"/>${L(255, 150, "Pull")}`;
    void top; void bot;
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
    const svg = P(240, 200, `<path d="M90 10 V170 H150 V10"/><rect x="90" y="20" width="60" height="150" fill="currentColor" fill-opacity="0.18" stroke="none"/>${vdim(170, 20, 170, ft + " ft")}<line x1="120" y1="170" x2="120" y2="185"/><circle cx="120" cy="190" r="0" />${L(60, 185, "gauge ?", 13)}<circle cx="60" cy="160" r="14"/><line x1="74" y1="166" x2="90" y2="166"/>`);
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
    for (let k = 0; k < n; k++) b += vresistor(50 + k * 70, 30, 140, r + " Ω");
    return num("MC", `${n} equal resistors are in parallel. Total resistance between X and Y?`, r / n, [r * n, r, r / (n + 1)], `Equal parallel resistors: ${r} / ${n} = ${fmt(r / n)} Ω.`, " Ω", { svg: P(40 + (n - 1) * 70 + 70, 160, b) }); },
  // 18 lamps series/parallel burnout
  () => { const par = Math.random() < 0.5; const out = R(1, 3); let b: string;
    if (!par) b = `${battery(30, 40, 140, "")}<line x1="30" y1="40" x2="270" y2="40"/><line x1="270" y1="40" x2="270" y2="140"/><line x1="30" y1="140" x2="270" y2="140"/>${[1, 2, 3].map((k: number) => `<rect x="${40 + k * 55}" y="28" width="30" height="24" fill="currentColor" fill-opacity="0" stroke="none"/>` + lamp(55 + k * 55, 40, "L" + k, k === out)).join("")}`;
    else b = `${battery(30, 40, 160, "")}<line x1="30" y1="40" x2="250" y2="40"/><line x1="30" y1="160" x2="250" y2="160"/>${[1, 2, 3].map((k: number) => `<line x1="${30 + k * 70}" y1="40" x2="${30 + k * 70}" y2="88"/><line x1="${30 + k * 70}" y1="112" x2="${30 + k * 70}" y2="160"/>` + lamp(30 + k * 70, 100, "", k === out) + F("L" + k, 13, 30 + k * 70 + 18, 104, "start")).join("")}`;
    return pic(`Lamp L${out} burns out. How many of the other lamps stay lit?`, P(290, par ? 185 : 175, b), ["0", "1", "2"], par ? 2 : 0, par ? "Parallel: each lamp has its own path, so the other 2 stay lit." : "Series: one path; a burned-out lamp opens the circuit and all go dark."); },
  // 19 ramp force
  () => { const w = R(2, 10) * 50, h = R(2, 6), l = h * pick([2, 3, 4]);
    const W = 240, H = 240 * h / l * 0.9; const ang = Math.atan2(H, Math.sqrt(W * W)); void ang;
    const svg = P(300, H + 70, `${ground(10, 290, H + 30)}<path d="M30 ${H + 30} L${30 + W} ${H + 30} L${30 + W} 30 Z" fill="currentColor" fill-opacity="0.07"/><rect x="100" y="${H + 30 - (70 / W) * H - 30}" width="34" height="24" transform="rotate(${-(Math.atan2(H, W) * 180 / Math.PI).toFixed(1)} 117 ${H + 30 - (70 / W) * H - 18})" fill="currentColor" fill-opacity="0.2"/>${L(117, H + 30 - (70 / W) * H - 40, w + " lb", 13)}${vdim(30 + W + 6, 30, H + 30, h + " ft")}${L(120, (H + 30) / 2 + 5, l + " ft long", 13)}`);
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
