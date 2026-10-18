// The Oak Lake neighbourhood as a master plan (a garden suburb of the mail-order years, about 1910-1930): the lake as a
// public park ringed by Lake Drive, an entry avenue on the flat west plain with the streetcar stop and village green,
// a contour drive on the east slope, a school on the south-east plateau, a church on a west corner, and house lots
// packed along every street (16 x 20, the kit's plot). Writes plan.json and plan.png (a labelled plan over the ground).
//   node plan.mjs [outDir]
import { readSite } from "./site.mjs";
import { street, plotsAlong } from "./street.mjs";
import { parkPlan } from "./park.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? new URL("../plan", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const site = readSite(), { X, Z, H, water } = site;

// ---- streets (centre-line way points in the export's x, z) -----------------------------------------------------------
const LAKE_DRIVE = [[52, 46], [70, 40], [100, 38], [122, 50], [126, 80], [122, 108], [100, 120], [70, 120], [53, 108], [50, 76], [52, 46]];
// `points` lays a street along way points (smoothed into curves); `from`/`via`/`to` routes it by least cost instead
// ([x, z, heading], heading 0..7 = E, SE, S, SW, W, NW, N, NE). The crescents' way points follow the contours.
const SPEC = [
  // a boulevard: two 3-wide carriageways either side of a planted centre strip (7 wide in all)
  { name: "West Avenue", kind: "avenue", half: 3, points: [[24, 0], [24, 159]] },
  // the loop in two halves (a closed polyline collapses in the street simplifier: its ends coincide)
  { name: "Lake Drive", kind: "drive", points: LAKE_DRIVE.slice(0, 6) },
  { name: "Lake Drive ", kind: "drive", points: LAKE_DRIVE.slice(5) },
  { name: "Hillside Drive", kind: "drive", points: [[132, 0], [131, 30], [128, 56], [124, 64]] },
  { name: "Green Street", kind: "street", points: [[28, 45], [50, 46]] },
  { name: "Church Street", kind: "street", points: [[28, 108], [52, 108]] },
  // the north and south quarters each get a crescent off Lake Drive, bending with the ground
  { name: "North Crescent", kind: "street", points: [[62, 43], [60, 32], [70, 25], [96, 24], [108, 30], [112, 43]] },
  { name: "South Crescent", kind: "street", points: [[58, 119], [56, 128], [66, 135], [82, 135], [90, 129], [92, 121]] },
  // no lane south to the edge: the ground climbs 7 blocks in 8 onto the south plateau; the school fronts Lake Drive
];
// ---- zones: what is not house lots ------------------------------------------------------------------------------------
const ZONES = [
  { name: "Village green", kind: "green", rect: [29, 4, 47, 22] },
  { name: "Shops", kind: "shops", rect: [0, 2, 20, 38] },
  { name: "School grounds", kind: "school", rect: [96, 124, 156, 158] },
  { name: "Church", kind: "church", rect: [29, 112, 48, 134] },
  // the east slope climbs 8 -> 20 above the lake in 20 blocks: kept wooded with a trail, not terraced for lots
  { name: "Oak Woods", kind: "woods", rect: [129, 66, 159, 124] },
];
// buildings and places in the lake park (designed later, like the school and church)
const FEATURES = [{ name: "Crescent garden", at: [76, 33] }, { name: "Crescent garden", at: [66, 128] }, { name: "Boathouse", at: [57, 98] }, { name: "Bandstand", at: [88, 50] }];
const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
const park = (x, z) => inPoly(x + 0.5, z + 0.5, LAKE_DRIVE);
const zoneAt = (x, z) => ZONES.find((zn) => x >= zn.rect[0] && x <= zn.rect[2] && z >= zn.rect[1] && z <= zn.rect[3]);

const zoneRects = () => ZONES.map((zn) => zn.rect);
const streets = SPEC.map((s) => {
  const st = s.points ? street(site, { points: s.points, half: s.half ?? 2, maxGrade: 0.2, straightIn: 0 })
    : street(site, { from: s.from, via: s.via ?? [], to: s.to, half: s.half ?? 2, maxGrade: 0.2, straightIn: 0, keepOut: zoneRects() });
  if (!st) throw new Error(`no route for ${s.name}`);
  st.name = s.name; st.kind = s.kind; st.half = s.half ?? 2; return st; });
const roadAt = new Map(); for (const st of streets) for (const c of st.cells) roadAt.set(`${c.x},${c.z}`, st);
const PARK = parkPlan(site, { park, roadAt }), trailAt = new Map();
for (const t of PARK.trails) for (const k of t.cells) if (!trailAt.has(k)) trailAt.set(k, t);
const median = new Set(); for (const st of streets) if (st.half === 3) for (const c of st.cells) if (c.d <= 0.5) median.add(`${c.x},${c.z}`);
// lots shoulder to shoulder along each side of each street (Lake Drive's lake-view lots first), one block apart
const taken = new Set();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (roadAt.has(`${x},${z}`) || park(x, z) || zoneAt(x, z) || PARK.inArea(x, z)) taken.add(`${x},${z}`);
const lots = [];
const ORDER = ["West Avenue", "North Crescent", "South Crescent"];
const byOrder = [...streets].sort((a, b) => ((ORDER.indexOf(a.name) + 1 || 99) - (ORDER.indexOf(b.name) + 1 || 99)));
for (const st of byOrder) for (const side of ["left", "right"]) {
  // the street's own cells are free to plotsAlong (it tests them itself); everything else stays taken
  const own = st.cells.map((c) => `${c.x},${c.z}`); own.forEach((k) => taken.delete(k));
  for (const p of plotsAlong(site, st, side, { wide: 16, deep: 20, setback: 0, maxCut: 6, maxFill: 5, pitch: 17, taken })) lots.push({ ...p, street: st.name.trim() });
  own.forEach((k) => taken.add(k));
}

// ---- the plan picture ---------------------------------------------------------------------------------------------------
const S = 5, img = Buffer.alloc(X * S * Z * S * 3);
const COL = { water: [70, 120, 190], park: [150, 196, 120], green: [170, 210, 130], shops: [214, 160, 120], school: [232, 190, 110], church: [190, 160, 210], woods: [96, 140, 84], field: [118, 178, 88], courts: [176, 104, 82], picnic: [196, 214, 120], beach: [236, 222, 170], play: [240, 176, 110], building: [210, 150, 90], trail: [150, 110, 70], road: [226, 208, 168], lot: [246, 240, 222], edge: [120, 96, 70] };
const lotAt = new Map(); lots.forEach((p, i) => { for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) lotAt.set(`${x},${z}`, i); });
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const k = `${x},${z}`, h = H[z][x], zn = zoneAt(x, z); let c;
  const ar = PARK.inArea(x, z);
  if (water[z][x]) c = COL.water; else if (median.has(k)) c = COL.park; else if (roadAt.has(k)) c = COL.road; else if (trailAt.has(k)) c = COL.trail; else if (ar) c = COL[ar.kind]; else if (lotAt.has(k)) c = COL.lot; else if (zn) c = COL[zn.kind]; else if (park(x, z)) c = COL.park;
  else { const t = Math.max(0, Math.min(1, h / 26)); c = [110 + 60 * t, 140 + 50 * t, 90 + 40 * t]; }
  // contour lines every 2 blocks of height
  const cont = !water[z][x] && x + 1 < X && z + 1 < Z && (Math.floor(h / 2) !== Math.floor(H[z][x + 1] / 2) || Math.floor(h / 2) !== Math.floor(H[z + 1][x] / 2));
  for (let dz = 0; dz < S; dz++) for (let dx = 0; dx < S; dx++) { let cc = c;
    const li = lotAt.get(k); if (li != null) { const p = lots[li]; if ((x === p.x0 && dx === 0) || (x === p.x1 && dx === S - 1) || (z === p.z0 && dz === 0) || (z === p.z1 && dz === S - 1)) cc = COL.edge; }
    if (cont && li == null && !roadAt.has(k) && !zn && (dx === S - 1 || dz === S - 1)) cc = cc.map((v) => v * 0.85);
    const o = ((z * S + dz) * X * S + x * S + dx) * 3; img[o] = cc[0]; img[o + 1] = cc[1]; img[o + 2] = cc[2]; } }
writeFileSync(`${OUT}/plan.ppm`, Buffer.concat([Buffer.from(`P6 ${X * S} ${Z * S} 255\n`), img]));
const labels = [
  ...PARK.areas.map((a) => [a.name, (a.rect[0] + a.rect[2]) / 2, (a.rect[1] + a.rect[3]) / 2]),
  ["Oak Woods trail", 146, 108], ["Shore path", 96, 62],
  ...streets.filter((s) => s.name.trim() === s.name).map((s) => { const p = s.pts[Math.floor(s.pts.length / 2)]; return [s.name, p[0], p[1]]; }),
  ...ZONES.filter((zn) => !PARK.areas.some((a) => a.rect[0] >= zn.rect[0] && a.rect[2] <= zn.rect[2] && a.rect[1] >= zn.rect[1] && a.rect[3] <= zn.rect[3])).map((zn) => [zn.name, (zn.rect[0] + zn.rect[2]) / 2, (zn.rect[1] + zn.rect[3]) / 2]),
  ["Lake park", 70, 76], ["Oak Lake", 88, 86], ...FEATURES.map((f) => ["• " + f.name, f.at[0] + f.name.length / 2, f.at[1]]),
  ...lots.map((p, i) => [String(i + 1), (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2]),
];
const args = [`${OUT}/plan.ppm`, "-font", "/System/Library/Fonts/Supplemental/Arial.ttf", "-gravity", "NorthWest"];
for (const [t, x, z] of labels) { const small = /^\d+$/.test(t); const lx = (xx) => Math.max(4, Math.min(X * S - t.length * 10, xx));
  args.push("-pointsize", small ? "16" : "20", "-fill", small ? "#5a4630" : "#1c2420", "-stroke", small ? "none" : "#ffffffcc", "-strokewidth", small ? "0" : "4", "-annotate", `+${Math.round(lx(x * S - t.length * (small ? 4 : 5)))}+${Math.round(z * S - 10)}`, t);
  if (!small) args.push("-stroke", "none", "-annotate", `+${Math.round(lx(x * S - t.length * 5))}+${Math.round(z * S - 10)}`, t); }
execFileSync("magick", [...args, `${OUT}/plan.png`]);

// ---- the road layout alone: streets coloured by kind over pale ground, with names and lengths ------------------------
{
  const KIND = { avenue: [150, 60, 40], drive: [40, 90, 150], street: [70, 70, 70] };
  const R = Buffer.alloc(X * S * Z * S * 3);
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const k = `${x},${z}`, st = roadAt.get(k), h = H[z][x];
    const t = Math.max(0, Math.min(1, h / 26));
    let c = water[z][x] ? [170, 200, 232] : median.has(k) ? [96, 150, 80] : st ? KIND[st.kind] : park(x, z) ? [214, 232, 200] : [238 - 30 * (1 - t), 236 - 24 * (1 - t), 226 - 20 * (1 - t)];
    const cont = !st && !water[z][x] && x + 1 < X && z + 1 < Z && (Math.floor(h / 2) !== Math.floor(H[z][x + 1] / 2) || Math.floor(h / 2) !== Math.floor(H[z + 1][x] / 2));
    for (let dz = 0; dz < S; dz++) for (let dx = 0; dx < S; dx++) { const cc = cont && (dx === S - 1 || dz === S - 1) ? c.map((v) => v * 0.88) : c;
      const o = ((z * S + dz) * X * S + x * S + dx) * 3; R[o] = cc[0]; R[o + 1] = cc[1]; R[o + 2] = cc[2]; } }
  writeFileSync(`${OUT}/roads.ppm`, Buffer.concat([Buffer.from(`P6 ${X * S} ${Z * S} 255\n`), R]));
  const a = [`${OUT}/roads.ppm`, "-font", "/System/Library/Fonts/Supplemental/Arial.ttf", "-gravity", "NorthWest", "-pointsize", "19"];
  const byName = {}; for (const st of streets) { const n = st.name.trim(); (byName[n] ??= []).push(st); }
  for (const [n, sts] of Object.entries(byName)) { const P = sts.at(-1).pts, p = P[Math.floor(P.length / 2)];
    const len = sts.reduce((t, q) => t + q.len, 0), g = Math.max(...sts.map((q) => q.maxGrade)), txt = `${n} · ${len} blocks${g > 0.01 ? ` · steepest 1 in ${Math.round(1 / g)}` : " · level"}`;
    const nudge = { "Lake Drive": [-10, 42] }[n] ?? [0, 0]; /* clear of a crossing street's label */
    const x = Math.max(4, Math.min(X * S - txt.length * 10, p[0] * S + 14 + nudge[0])), y = Math.max(4, Math.min(Z * S - 26, p[1] * S - 10 + nudge[1]));
    a.push("-fill", "#ffffffdd", "-draw", `rectangle ${x - 4},${y - 2} ${x + txt.length * 9.6},${y + 22}`, "-fill", "#1c2420", "-annotate", `+${x}+${y}`, txt); }
  a.push("-pointsize", "15", "-fill", "#ffffffdd", "-draw", "rectangle 6,6 380,70", "-fill", "#963c28", "-annotate", "+12+10", "avenue", "-fill", "#285a96", "-annotate", "+12+30", "drives", "-fill", "#464646", "-annotate", "+12+50", "streets", "-fill", "#1c2420", "-annotate", "+80+10", "avenue 7 wide (planted strip), others 5", "-annotate", "+80+30", "contours every 2 blocks", "-annotate", "+80+50", "160 x 160 blocks, north up");
  execFileSync("magick", [...a, `${OUT}/roads.png`]);
}
const summary = { park: PARK.areas.map((a) => ({ name: a.name, size: a.size.join(" x "), ...(a.level ? { pad: a.pad, cut: a.cut, fill: a.fill } : {}), water: a.water })), trails: PARK.trails.map((t) => ({ name: t.name, cells: t.cells.size })), streets: streets.map((s) => ({ name: s.name, len: s.len, maxGrade: s.maxGrade, cut: s.cut, fill: s.fill })), lots: lots.length, zones: ZONES.map((z) => z.name), lotEarth: lots.reduce((a, p) => a + p.cut + p.fill, 0), perStreet: Object.fromEntries([...new Set(lots.map((l) => l.street))].map((n) => [n, lots.filter((l) => l.street === n).length])) };
writeFileSync(`${OUT}/plan.json`, JSON.stringify({ spec: SPEC, zones: ZONES, features: FEATURES, park: { areas: PARK.areas, trails: PARK.trails.map((t) => ({ name: t.name, cells: [...t.cells] })) }, lakeDrive: LAKE_DRIVE, lots, summary }, null, 1) + "\n");
console.log(JSON.stringify(summary, null, 1));
